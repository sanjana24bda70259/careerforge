import '../config/env.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import dashboard from './dashboard.js';
import learningItems from './learningItems.js';
import mistakes from './mistakes.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { LearningItem, LearningAttempt } from '../models/LearningItem.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { Mistake } from '../models/Mistake.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { FormulaBookmark } from '../models/FormulaBookmark.js';
import { learningCatalog } from '../services/learningItems.js';
import { studyDate, addStudyDays } from '../services/studyDate.js';

const databaseName = `careerforge_test_personal_study_${process.pid}_${Date.now()}`;
let server, origin, user, token, otherToken;
const key = learningCatalog.find(item => item.domain === 'aptitude' && item.options).key;
const route = `/items/${encodeURIComponent(key)}`;
const today = studyDate('Asia/Kolkata');
async function request(path, method = 'GET', body, authorization = token) {
  const response = await fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${authorization}`, 'Content-Type': 'application/json', 'X-Timezone': 'Asia/Kolkata' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, ...(await response.json()) };
}
before(async () => {
  process.env.JWT_SECRET = 'isolated-test-secret'; process.env.AI_PROVIDER = ''; process.env.AI_API_KEY = '';
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  await Promise.all([User.init(), LearningItem.init(), DailyPlan.init(), Mistake.init(), FormulaBookmark.init()]);
  user = await User.create({ email: 'learner@example.test', passwordHash: 'test-only', profile: { targetRole: 'Backend Developer', weeklyStudyHours: 7 } });
  const other = await User.create({ email: 'other@example.test', passwordHash: 'test-only' });
  token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET); otherToken = jwt.sign({ sub: other.id }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use('/dashboard', dashboard); app.use('/items', requireAuth, learningItems); app.use('/mistakes', requireAuth, mistakes);
  app.use((error, req, res, next) => res.status(500).json({ success: false, message: error.message }));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName && databaseName.startsWith('careerforge_test_personal_study_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
test('DSA practice checkmarks persist per account without creating accepted submissions', async () => {
  const itemKey = 'dsa:arrays:array-traversal';
  const path = `/items/${encodeURIComponent(itemKey)}`;
  assert.equal((await request(path, 'PUT', { practised:true })).data.item.practised,true);
  assert.equal((await request(path)).data.item.practised,true);
  assert.notEqual((await request(path,'GET',undefined,otherToken)).data.item.practised,true);
  assert.equal(await ProblemProgress.countDocuments({userId:user.id,problemId:itemKey}),0);
  assert.equal((await request(path, 'PUT', {bookmarked:true})).data.item.practised,true);
  assert.equal((await request(path, 'PUT', {practised:false})).data.item.practised,false);
  assert.equal((await request(path, 'PUT', {practised:'yes'})).status,400);
  assert.equal((await request(route, 'PUT', {practised:true})).status,400);
  await request(path, 'PUT', {bookmarked:false});
});
test('complete personalized learning workflow uses persistent account-owned state', async () => {
  assert.equal((await request(route, 'PUT', { revisionSelected: true, bookmarked: true })).status, 200);
  let saved = await LearningItem.findOne({ userId: user.id, key });
  assert.equal(saved.dueDate, addStudyDays(today, 1));
  assert.equal((await request(`${route}/review`, 'POST', { recalled: true })).status, 409);
  assert.equal((await request('/items?collection=bookmarks', 'GET', undefined, otherToken)).data.items.length, 0);
  assert.equal((await request('/items/not-real', 'PUT', { bookmarked: true })).status, 404);
  assert.equal((await request('/items?collection=revision')).data.items.length, 1);

  // Simulate the next due day in this isolated test database.
  await LearningItem.updateOne({ _id: saved._id }, { $set: { dueDate: today } });
  const responses = await Promise.all(Array.from({ length: 4 }, () => request('/dashboard/today-plan')));
  for (const response of responses) assert.equal(response.status, 200, response.message);
  assert.equal(new Set(responses.map(response => response.data.plan._id)).size, 1);
  assert.equal(await DailyPlan.countDocuments({ userId: user.id, dateKey: today }), 1);
  let plan = responses[0].data.plan;
  assert.ok(plan.tasks.some(task => task.kind === 'revision' && task.sourceId === key));
  assert.ok(plan.estimatedMinutes <= plan.budgetMinutes);
  const ids = plan.tasks.map(task => task.id);
  assert.deepEqual((await request('/dashboard/today-plan')).data.plan.tasks.map(task => task.id), ids);
  assert.equal((await request('/dashboard/today-plan/acknowledge', 'POST')).status, 200);
  assert.ok((await request('/dashboard/today-plan')).data.plan.acknowledgedAt);

  const revisionTask = plan.tasks.find(task => task.kind === 'revision');
  assert.equal((await request(`/dashboard/today-plan/tasks/${encodeURIComponent(revisionTask.id)}`, 'PATCH', { status: 'completed' })).status, 400);
  assert.equal((await request(`${route}/review`, 'POST', { recalled: false })).status, 200);
  saved = await LearningItem.findOne({ userId: user.id, key });
  assert.equal(saved.dueDate, addStudyDays(today, 1)); assert.equal(saved.reviewCount, 1);
  assert.equal((await request(`${route}/review`, 'POST', { recalled: true })).status, 409);
  plan = (await request('/dashboard/today-plan')).data.plan;
  assert.equal(plan.tasks.find(task => task.id === revisionTask.id).status, 'completed');

  const answer = learningCatalog.find(item => item.key === key).correctAnswer;
  assert.equal((await request(`${route}/answer`, 'POST', { answer })).data.correct, true);
  assert.equal(await LearningAttempt.countDocuments({ userId: user.id, key }), 1);
  assert.equal((await request('/dashboard/roadmap')).data.roadmap.achievements.aptitudeCorrect, 1);
  const firstMistake = await request(`${route}/mistake`, 'POST', { note: 'Recheck the denominator', reason: 'Calculation Error' });
  assert.equal(firstMistake.status, 200, firstMistake.message);
  const updatedMistake = await request(`${route}/mistake`, 'POST', { note: 'Use the original base', reason: 'Calculation Error' });
  assert.equal(firstMistake.data.mistake._id, updatedMistake.data.mistake._id);
  assert.equal((await request('/mistakes', 'GET', undefined, otherToken)).data.mistakes.length, 0);
  assert.equal((await request(`/mistakes/${firstMistake.data.mistake._id}`, 'PATCH', { resolved: true }, otherToken)).status, 404);
  assert.ok((await request(`/mistakes/${firstMistake.data.mistake._id}`, 'PATCH', { resolved: true })).data.mistake.resolvedAt);
  assert.equal((await request(`/mistakes/${firstMistake.data.mistake._id}`, 'DELETE')).status, 200);
  assert.equal((await LearningItem.findOne({ userId: user.id, key })).mistakeId, null);

  assert.equal((await request(route, 'PUT', { revisionSelected: false, bookmarked: false })).status, 200);
  assert.equal((await request('/items?collection=revision')).data.items.length, 0);
  const formula = learningCatalog.find(item => item.key.startsWith('formula:'));
  await FormulaBookmark.create({ userId: user.id, formulaId: formula.key.slice(8) });
  assert.ok((await request('/items?collection=bookmarks')).data.items.some(item => item.key === formula.key));
  await request(`/items/${encodeURIComponent(formula.key)}`, 'PUT', { bookmarked: false });
  assert.equal((await request('/items?collection=bookmarks')).data.items.length, 0);
  assert.equal((await request('/dashboard/suggestions')).status, 200);
});
