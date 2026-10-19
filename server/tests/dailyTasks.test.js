import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import mongoose from 'mongoose';
import { DailyQuest } from '../models/DailyQuest.js';

process.env.APP_TIME_ZONE = 'Asia/Kolkata';
const { taskDateKey, validTaskDate } = await import('../services/dailyTaskService.js');
const { default: quests } = await import('../routes/quests.js');
const { default: product } = await import('../routes/product.js');
const databaseName = `careerforge_daily_tasks_test_${randomUUID().replaceAll('-', '')}`;
const userId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();
let server;
let base;
before(async () => {
  // A fresh local test database, never the application's database.
  await mongoose.connect(`mongodb://127.0.0.1:27017/${databaseName}`, { serverSelectionTimeoutMS: 5000 });
  await DailyQuest.init();
  const app = express();
  app.use(express.json());
  // Identity is injected only in this isolated router test harness.
  app.use((req, res, next) => { req.user = { id: req.headers['x-test-user'] || userId }; next(); });
  app.use('/quests', quests);
  app.use('/', product);
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    assert.equal(mongoose.connection.name, databaseName);
    assert.match(databaseName, /^careerforge_daily_tasks_test_[a-f0-9]{32}$/);
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
const request = async (path, method = 'GET', body, identity = userId) => {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-test-user': identity }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, ...(await response.json()) };
};

test('calendar changes at India midnight and rejects impossible dates', () => {
  assert.equal(taskDateKey(new Date('2026-09-16T18:29:59Z')), '2026-09-16');
  assert.equal(taskDateKey(new Date('2026-09-16T18:30:00Z')), '2026-09-17');
  assert.equal(validTaskDate('2026-02-30'), false);
  assert.equal(validTaskDate('2028-02-29'), true);
});

test('concurrent visits reuse one persistent list; add, complete and undo work', async () => {
  const visits = await Promise.all(Array.from({ length: 5 }, () => request('/quests/today')));
  assert.ok(visits.every(result => result.status === 200));
  assert.equal(new Set(visits.map(result => result.data.quest._id)).size, 1);
  assert.equal(await DailyQuest.countDocuments({ userId }), 1);
  const added = await request('/quests/today/tasks', 'POST', { title: '  Prepare interview notes  ' });
  assert.equal(added.status, 201);
  const task = added.data.quest.tasks.find(item => item.title === 'Prepare interview notes');
  assert.ok(task);
  const path = `/quests/${added.data.quest.dateKey}/tasks/${task.id}`;
  assert.equal((await request(path, 'PATCH', { completed: true })).status, 200);
  let saved = (await request('/quests/today')).data.quest.tasks.find(item => item.id === task.id);
  assert.equal(saved.completed, true);
  assert.ok(saved.completedAt);
  await request(path, 'PATCH', { completed: false });
  saved = (await request('/quests/today')).data.quest.tasks.find(item => item.id === task.id);
  assert.equal(saved.completed, false);
  assert.equal(saved.completedAt, null);
  const updates = await Promise.all(['dsa', 'aptitude'].map(id => request(`/quests/today/tasks/${id}`, 'PATCH', { completed: true })));
  assert.ok(updates.every(result => result.status === 200));
  assert.ok((await request('/quests/today')).data.quest.tasks.filter(item => ['dsa', 'aptitude'].includes(item.id)).every(item => item.completed));
});

test('earlier pending tasks become backlogs without copies; completing and undoing keeps original day', async () => {
  await DailyQuest.create({ userId, dateKey: '2020-01-01', tasks: [
    { id: 'old-pending', type: 'PERSONAL', title: 'Finish project', completed: false },
    { id: 'old-done', type: 'PERSONAL', title: 'Review notes', completed: true }
  ] });
  const count = await DailyQuest.countDocuments({ userId });
  for (let i = 0; i < 2; i++) {
    const result = await request('/backlogs');
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.backlogs.map(item => item.taskId), ['old-pending']);
    assert.deepEqual(result.data.completed.map(item => item.taskId), ['old-done']);
  }
  assert.equal(await DailyQuest.countDocuments({ userId }), count);
  const path = '/quests/2020-01-01/tasks/old-pending';
  await request(path, 'PATCH', { completed: true });
  const finished = (await request('/backlogs')).data;
  assert.equal(finished.backlogs.length, 0);
  assert.equal(finished.completed.length, 2);
  assert.equal(finished.completed.find(item => item.taskId === 'old-pending').dateKey, '2020-01-01');
  await request(path, 'PATCH', { completed: false });
  assert.equal((await request('/backlogs')).data.backlogs[0].taskId, 'old-pending');
});

test('invalid values are rejected and tasks remain isolated by user', async () => {
  for (const title of ['', '   ', 42, 'a'.repeat(161)]) assert.equal((await request('/quests/today/tasks', 'POST', { title })).status, 400);
  assert.equal((await request('/quests/today/tasks/dsa', 'PATCH', { completed: 'false' })).status, 400);
  assert.equal((await request('/quests/2026-02-30/tasks/dsa', 'PATCH', { completed: true })).status, 400);
  assert.equal((await request('/quests/2999-01-01/tasks/dsa', 'PATCH', { completed: true })).status, 400);
  assert.equal((await request('/quests/today/tasks/missing', 'PATCH', { completed: true })).status, 404);
  assert.equal((await request('/quests/2020-01-01/tasks/old-pending', 'PATCH', { completed: true }, otherUserId)).status, 404);
  assert.deepEqual((await request('/backlogs', 'GET', undefined, otherUserId)).data.backlogs, []);
  assert.equal((await DailyQuest.findOne({ userId, dateKey: '2020-01-01' })).tasks.find(item => item.id === 'old-pending').completed, false);
});
