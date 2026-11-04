import '../config/env.js';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import dsa from './dsa.js';
import learningItems from './learningItems.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { LearningItem } from '../models/LearningItem.js';
import { visualLessons } from '../../shared/dsaVisualLessons.mjs';
import { explainerById } from '../../shared/dsaExplainers.mjs';

const databaseName = `careerforge_test_dsa_visual_${process.pid}_${Date.now()}`;
let server, origin, user, token, otherToken;
const secret = 'isolated-visual-lesson-test-secret';
async function request(path, method = 'GET', body, authorization = token) {
  const response = await fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${authorization}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, ...await response.json() };
}
before(async () => {
  process.env.JWT_SECRET = secret;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  await Promise.all([User.init(), ProblemProgress.init(), LearningItem.init()]);
  user = await User.create({ email: 'visual-learner@example.test', passwordHash: 'test-only' });
  const other = await User.create({ email: 'visual-other@example.test', passwordHash: 'test-only' });
  token = jwt.sign({ sub: user.id }, secret); otherToken = jwt.sign({ sub: other.id }, secret);
  const app = express(); app.use(express.json()); app.use('/dsa', requireAuth, dsa); app.use('/items', requireAuth, learningItems);
  app.use((error, req, res, next) => res.status(500).json({ success: false, message: error.message }));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName && databaseName.startsWith('careerforge_test_dsa_visual_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
test('roadmap, original problem details, and bookmark persistence share stable IDs', async () => {
  let roadmap = await request('/dsa/roadmap');
  assert.equal(roadmap.status, 200, roadmap.message);
  assert.equal(roadmap.data.topics.flatMap(topic => topic.questions).filter(question => question.original).length, visualLessons.length);
  assert.equal(roadmap.data.summary.totalProblems, roadmap.data.topics.reduce((sum, topic) => sum + topic.questions.length, 0));
  assert.equal(roadmap.data.summary.totalProblems, 356);
  for (const topic of roadmap.data.topics) {
    for (const question of topic.questions.filter(question => !question.original)) {
      const explanation = explainerById(question.visualizationId);
      assert.equal(explanation?.questionId, question.id);
      assert.equal(explanation?.topic, topic.id);
    }
    const question = topic.questions.find(question => !question.original);
    const detail = await request(`/dsa/topics/${topic.id}/questions/${question.id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.problem.visualizationId, question.visualizationId);
    assert.deepEqual(detail.data.problem.examples, explainerById(question.visualizationId).examples);
  }
  for (const lesson of visualLessons) {
    const detail = await request(`/dsa/topics/${lesson.topic}/questions/${lesson.id}`);
    assert.equal(detail.status, 200, detail.message);
    assert.equal(detail.data.problem.statement, lesson.description);
    assert.equal(detail.data.problem.visualizationId, lesson.id);
    assert.deepEqual(detail.data.problem.examples, lesson.examples);
  }
  const lesson = visualLessons[0], key = `dsa:${lesson.topic}:${lesson.id}`;
  const saved = await request(`/items/${encodeURIComponent(key)}`, 'PUT', { bookmarked: true, revisionSelected: true });
  assert.equal(saved.status, 200, saved.message);
  const bookmarks = await request('/items?collection=bookmarks');
  assert.equal(bookmarks.data.items[0].key, key);
  assert.equal((await request('/items?collection=bookmarks', 'GET', undefined, otherToken)).data.items.length, 0);
  assert.equal((await request('/dsa/roadmap')).data.summary.solved, 0, 'saving learning state cannot mark code accepted');
  await ProblemProgress.create({ userId: user.id, problemId: key, status: 'solved', solvedAt: new Date() });
  roadmap = await request('/dsa/roadmap');
  assert.equal(roadmap.data.topics.find(topic => topic.id === lesson.topic).questions.find(question => question.id === lesson.id).status, 'solved');
  assert.equal(roadmap.data.summary.solved, 1);
  assert.equal((await request('/dsa/roadmap', 'GET', undefined, otherToken)).data.summary.solved, 0);
  assert.equal((await request('/dsa/topics/arrays/questions/cf-missing')).status, 404);
});
