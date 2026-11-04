import '../config/env.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import workspace from './workspace.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { StudySchedule, WorkspaceEntry, FocusSession, WorkspacePreference, NotificationReceipt } from '../models/Workspace.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { studyDate } from '../services/studyDate.js';

const databaseName = `careerforge_test_workspace_${process.pid}_${Date.now()}`;
let server, origin, user, token, otherToken;
const dateKey = studyDate('Asia/Kolkata');
async function request(path, method = 'GET', body, auth = token) {
  const response = await fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json', 'X-Timezone': 'Asia/Kolkata' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, ...(await response.json()) };
}
before(async () => {
  process.env.JWT_SECRET = 'workspace-test-only'; process.env.AI_PROVIDER = ''; process.env.AI_API_KEY = '';
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  await Promise.all([User, StudySchedule, WorkspaceEntry, FocusSession, WorkspacePreference, NotificationReceipt, DailyPlan].map(model => model.init()));
  user = await User.create({ email: 'workspace@example.test', passwordHash: 'test-only', profile: { name: 'Test learner', weeklyStudyHours: 5 } });
  const other = await User.create({ email: 'other@example.test', passwordHash: 'test-only' });
  token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET); otherToken = jwt.sign({ sub: other.id }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use(requireAuth); app.use(workspace);
  app.use((error, req, res, next) => res.status(500).json({ success: false, message: error.message }));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName && databaseName.startsWith('careerforge_test_workspace_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
test('preferences, calendar, notes, lists, goals, focus and notifications persist and stay private', async () => {
  assert.equal((await request('/preferences', 'PATCH', { theme: 'dark', planningMode: 'custom', dailyBriefing: false })).status, 200);
  assert.equal((await request('/preferences', 'PATCH', { theme: 'injected' })).status, 400);
  let overview = await request('/overview'); assert.equal(overview.status, 200, overview.message);
  assert.equal(overview.data.preferences.theme, 'dark'); assert.equal(overview.data.preferences.dailyBriefing, false);
  assert.equal((await request('/overview', 'GET', undefined, otherToken)).data.preferences.theme, 'light');
  assert.equal((await request('/schedule', 'POST', { title: 'Bad date', dateKey: '2026-02-30', startTime: '09:00', durationMinutes: 30 })).status, 400);
  const created = await request('/schedule', 'POST', { title: 'Arrays practice', domain: 'dsa', dateKey, startTime: '09:00', durationMinutes: 30 });
  assert.equal(created.status, 200, created.message); const session = created.data.item;
  assert.equal((await request('/schedule', 'POST', { title: 'Overlap', dateKey, startTime: '09:15', durationMinutes: 30 })).status, 409);
  assert.equal((await request(`/schedule/${session._id}`, 'PATCH', { status: 'completed' }, otherToken)).status, 404);
  assert.equal((await request(`/schedule/${session._id}`, 'PATCH', { status: 'completed' })).status, 200);
  assert.equal((await request(`/schedule?from=${dateKey}&to=${dateKey}`)).data.schedule.length, 1);
  await request(`/schedule/${session._id}`, 'PATCH', { archived: true });
  assert.equal((await request(`/schedule?from=${dateKey}&to=${dateKey}`)).data.schedule.length, 0);
  await request(`/schedule/${session._id}`, 'PATCH', { archived: false });

  const note = await request('/entries', 'POST', { type: 'note', title: 'Binary search', content: 'Keep the invariant.', domain: 'dsa' });
  assert.equal(note.status, 200); const noteId = note.data.entry._id;
  assert.equal((await request('/entries?type=note', 'GET', undefined, otherToken)).data.entries.length, 0);
  assert.equal((await request(`/entries/${noteId}`, 'PATCH', { title: 'Not yours' }, otherToken)).status, 404);
  await request(`/entries/${noteId}`, 'PATCH', { archived: true });
  assert.equal((await request('/entries?type=note')).data.entries.length, 0);
  assert.equal((await request('/entries?type=note&archived=true')).data.entries.length, 1);
  await request(`/entries/${noteId}`, 'PATCH', { archived: false, pinned: true });
  const list = (await request('/entries', 'POST', { type: 'list', title: 'Interview checklist', items: [{ text: 'Explain my project', completed: false }] })).data.entry;
  await request(`/entries/${list._id}`, 'PATCH', { items: [{ ...list.items[0], completed: true }] });
  assert.equal((await request('/entries?type=list')).data.entries[0].items[0].completed, true);
  const goal = (await request('/entries', 'POST', { type: 'goal', title: 'Technical interview', dueDate: dateKey, progress: 25, goalType: 'interview' })).data.entry;
  assert.equal((await request(`/entries/${goal._id}`, 'PATCH', { progress: 101 })).status, 400);

  const starts = await Promise.all([request('/focus/start', 'POST', { domain: 'dsa' }), request('/focus/start', 'POST', { domain: 'dsa' })]);
  assert.equal(starts[0].data.session._id, starts[1].data.session._id);
  await FocusSession.updateOne({ _id: starts[0].data.session._id }, { $set: { startedAt: new Date(Date.now() - 120000) } });
  const stopped = await request('/focus/stop', 'POST', {}); assert.ok(stopped.data.session.durationSeconds >= 120);
  assert.equal((await request('/focus/stop', 'POST', {})).data.session, null);
  overview = await request('/overview'); assert.ok(overview.data.metrics.totalFocusSeconds >= 120);
  assert.equal(overview.data.metrics.tasksCompleted, 1); assert.equal(overview.data.metrics.categories[0].completed, 0);
  assert.ok(overview.data.notifications.some(item => item.kind === 'goal'));
  await request('/notifications/read', 'POST', { keys: overview.data.notifications.map(item => item.key) });
  assert.equal((await request('/overview')).data.unreadCount, 0);
  assert.equal((await request('/overview', 'GET', undefined, otherToken)).data.metrics.totalFocusSeconds, 0);

  await request('/preferences', 'PATCH', { planningMode: 'personalized', dailyBriefing: true });
  const imported = await request('/schedule/import-plan', 'POST', { startTime: '13:00' });
  assert.equal(imported.status, 200, imported.message); assert.ok(imported.data.added > 0);
  assert.equal((await request('/schedule/import-plan', 'POST', { startTime: '13:00' })).data.added, 0);
  const health = await request('/health'); assert.equal(health.status, 200); assert.equal(health.data.ai, 'activity-based');
});
