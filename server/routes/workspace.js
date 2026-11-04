import { Router } from 'express';
import mongoose from 'mongoose';
import { StudySchedule, WorkspaceEntry, FocusSession, NotificationReceipt, WorkspacePreference } from '../models/Workspace.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { findOrCreatePlan } from './dashboard.js';
import { requestDate, addStudyDays } from '../services/studyDate.js';
import { workspaceOverview, defaultPreferences, validDate, validTime, minuteOfDay, timeAt, overlaps } from '../services/workspaceService.js';

const router = Router();
router.use((req, res, next) => {
  if (['POST', 'PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ success: false, message: 'Provide a valid request body.' });
  next();
});
const domains = ['dsa', 'aptitude', 'cs', 'career', 'general'];
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const handle = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { if (error.status || error.name === 'ValidationError') return res.status(error.status || 400).json({ success: false, message: error.message }); next(error); } };
const respond = (res, data) => res.json({ success: true, data });
const owned = async (model, req) => { if (!mongoose.isValidObjectId(req.params.id)) throw fail('This item was not found.', 404); const item = await model.findOne({ _id: req.params.id, userId: req.user.id }); if (!item) throw fail('This item was not found.', 404); return item; };

router.get('/overview', handle(async (req, res) => respond(res, await workspaceOverview(req.user, requestDate(req), req.get('X-Timezone') || 'UTC'))));
router.patch('/preferences', handle(async (req, res) => {
  const update = {};
  for (const [key, values] of [['theme', ['light', 'dark', 'system']], ['planningMode', ['personalized', 'custom']]]) if (key in req.body) { if (!values.includes(req.body[key])) throw fail(`Choose a valid ${key}.`); update[key] = req.body[key]; }
  for (const key of ['dailyBriefing', 'revisionReminders', 'deadlineReminders']) if (key in req.body) { if (typeof req.body[key] !== 'boolean') throw fail('Choose on or off for this preference.'); update[key] = req.body[key]; }
  const preferences = await WorkspacePreference.findOneAndUpdate({ userId: req.user.id }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
  respond(res, { preferences });
}));

function scheduleFields(body, current = {}) {
  const data = { title: current.title, domain: current.domain || 'general', dateKey: current.dateKey, startTime: current.startTime, durationMinutes: current.durationMinutes, notes: current.notes || '' };
  if ('title' in body) data.title = text(body.title, 180);
  if ('domain' in body) { if (!domains.includes(body.domain)) throw fail('Choose a subject.'); data.domain = body.domain; }
  if ('notes' in body) data.notes = text(body.notes, 3000);
  if ('dateKey' in body) data.dateKey = body.dateKey;
  if ('startTime' in body) data.startTime = body.startTime;
  if ('durationMinutes' in body) data.durationMinutes = Number(body.durationMinutes);
  if (!data.title || !validDate(data.dateKey) || !validTime(data.startTime) || !Number.isInteger(data.durationMinutes) || data.durationMinutes < 5 || data.durationMinutes > 480) throw fail('Add a title, valid date/time and a duration between 5 and 480 minutes.');
  if (minuteOfDay(data.startTime) + data.durationMinutes > 1440) throw fail('This session crosses midnight. Split it into two sessions.');
  if ('status' in body) { if (!['planned', 'completed'].includes(body.status)) throw fail('Choose planned or completed.'); data.status = body.status; }
  if ('archived' in body) { if (typeof body.archived !== 'boolean') throw fail('Choose archive or restore.'); data.archivedAt = body.archived ? new Date() : null; }
  return data;
}
async function checkSchedule(userId, data, exceptId) {
  const rows = await StudySchedule.find({ userId, dateKey: data.dateKey, archivedAt: null, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }).lean();
  if (rows.some(item => overlaps(item, data))) throw fail('This time overlaps another study session. Choose a free time.', 409);
}
router.get('/schedule', handle(async (req, res) => {
  const from = req.query.from || requestDate(req); const to = req.query.to || addStudyDays(from, 31);
  if (!validDate(from) || !validDate(to) || from > to) throw fail('Choose a valid date range.');
  const schedule = await StudySchedule.find({ userId: req.user.id, dateKey: { $gte: from, $lte: to }, archivedAt: null }).sort({ dateKey: 1, startTime: 1 }).lean();
  respond(res, { schedule });
}));
router.post('/schedule', handle(async (req, res) => {
  const data = scheduleFields(req.body); await checkSchedule(req.user.id, data);
  respond(res, { item: await StudySchedule.create({ ...data, userId: req.user.id }) });
}));
router.patch('/schedule/:id', handle(async (req, res) => {
  const item = await owned(StudySchedule, req); const data = scheduleFields(req.body, item);
  if (item.sourceTaskId && data.dateKey !== item.dateKey) throw fail('Move a linked daily task from My day so its plan stays in sync.');
  if (!data.archivedAt) await checkSchedule(req.user.id, data, item._id);
  if (item.sourceTaskId && 'status' in data) {
    const plan = await DailyPlan.findOne({ userId: req.user.id, dateKey: item.dateKey });
    const task = plan?.tasks.find(task => task.id === item.sourceTaskId);
    if (task?.kind === 'revision') throw fail('Open the revision and record recall to update this session.');
    await DailyPlan.updateOne({ userId: req.user.id, dateKey: item.dateKey, 'tasks.id': item.sourceTaskId }, { $set: { 'tasks.$.status': data.status, 'tasks.$.completedAt': data.status === 'completed' ? new Date() : null } });
  }
  Object.assign(item, data); await item.save(); respond(res, { item });
}));
router.post('/schedule/import-plan', handle(async (req, res) => {
  const dateKey = requestDate(req); const startTime = req.body.startTime || '09:00';
  if (!validTime(startTime)) throw fail('Choose a valid starting time.');
  const plan = await findOrCreatePlan(req.user.id, req.user.profile, dateKey);
  const existing = await StudySchedule.find({ userId: req.user.id, dateKey, archivedAt: null }).lean();
  let minute = minuteOfDay(startTime); const proposed = [];
  for (const task of plan.tasks.filter(item => item.status === 'planned' && !existing.some(row => row.sourceTaskId === item.id))) {
    const item = { userId: req.user.id, dateKey, startTime: timeAt(minute), durationMinutes: Math.max(5, task.estimatedMinutes), title: task.title, domain: domains.includes(task.domain) ? task.domain : 'general', sourceTaskId: task.id, href: task.href };
    if (minute + item.durationMinutes > 1440) throw fail('The plan does not fit before midnight. Choose an earlier start.');
    if (existing.some(row => overlaps(row, item))) throw fail('The plan overlaps your calendar. Move an existing session or choose a different start time.', 409);
    proposed.push(item); minute += item.durationMinutes + 5;
  }
  if (proposed.length) await StudySchedule.bulkWrite(proposed.map(item => ({ updateOne: { filter: { userId: req.user.id, dateKey, sourceTaskId: item.sourceTaskId }, update: { $set: { ...item, archivedAt: null } }, upsert: true } })));
  respond(res, { added: proposed.length });
}));

function entryFields(body, current = {}) {
  const result = { type: current.type || body.type, title: current.title, content: current.content || '', domain: current.domain || 'general', dueDate: current.dueDate || null, progress: current.progress || 0, goalType: current.goalType || 'study' };
  if (!['note', 'list', 'goal'].includes(result.type)) throw fail('Choose notes, lists or goals.');
  if ('title' in body) result.title = text(body.title, 180);
  if (!result.title) throw fail('Give this item a title.');
  if ('content' in body) result.content = text(body.content, 20000);
  if ('domain' in body) { if (!domains.includes(body.domain)) throw fail('Choose a subject.'); result.domain = body.domain; }
  if ('dueDate' in body) { if (body.dueDate && !validDate(body.dueDate)) throw fail('Choose a valid due date.'); result.dueDate = body.dueDate || null; }
  if ('progress' in body) { if (!Number.isFinite(body.progress) || body.progress < 0 || body.progress > 100) throw fail('Progress must be between 0 and 100.'); result.progress = body.progress; }
  if ('goalType' in body) { if (!['exam', 'interview', 'project', 'study'].includes(body.goalType)) throw fail('Choose a valid goal type.'); result.goalType = body.goalType; }
  if ('pinned' in body) { if (typeof body.pinned !== 'boolean') throw fail('Choose pin or unpin.'); result.pinned = body.pinned; }
  if ('archived' in body) { if (typeof body.archived !== 'boolean') throw fail('Choose archive or restore.'); result.archivedAt = body.archived ? new Date() : null; }
  if ('items' in body) {
    if (!Array.isArray(body.items) || body.items.length > 100) throw fail('A list can contain up to 100 items.');
    result.items = body.items.map(item => ({ ...(mongoose.isValidObjectId(item?._id) ? { _id: item._id } : {}), text: text(item?.text, 300), completed: item?.completed === true })).filter(item => item.text);
  }
  return result;
}
router.get('/entries', handle(async (req, res) => {
  if (!['note', 'list', 'goal'].includes(req.query.type)) throw fail('Choose an entry type.');
  respond(res, { entries: await WorkspaceEntry.find({ userId: req.user.id, type: req.query.type, archivedAt: req.query.archived === 'true' ? { $ne: null } : null }).sort({ pinned: -1, updatedAt: -1 }).lean() });
}));
router.post('/entries', handle(async (req, res) => respond(res, { entry: await WorkspaceEntry.create({ ...entryFields(req.body), userId: req.user.id }) })));
router.patch('/entries/:id', handle(async (req, res) => {
  const entry = await owned(WorkspaceEntry, req); Object.assign(entry, entryFields(req.body, entry)); await entry.save(); respond(res, { entry });
}));

router.post('/focus/start', handle(async (req, res) => {
  const domain = req.body.domain || 'general'; if (!domains.includes(domain)) throw fail('Choose a subject.');
  let session = await FocusSession.findOne({ userId: req.user.id, endedAt: null });
  if (!session) { try { session = await FocusSession.create({ userId: req.user.id, domain }); } catch (error) { if (error.code !== 11000) throw error; session = await FocusSession.findOne({ userId: req.user.id, endedAt: null }); } }
  respond(res, { session });
}));
router.post('/focus/stop', handle(async (req, res) => {
  const session = await FocusSession.findOne({ userId: req.user.id, endedAt: null });
  if (!session) return respond(res, { session: null });
  const endedAt = new Date(); const durationSeconds = Math.max(0, Math.min(86400, Math.floor((endedAt - session.startedAt) / 1000)));
  const updated = await FocusSession.findOneAndUpdate({ _id: session._id, userId: req.user.id, endedAt: null }, { $set: { endedAt, durationSeconds } }, { new: true });
  respond(res, { session: updated });
}));
router.post('/notifications/read', handle(async (req, res) => {
  const keys = req.body.keys;
  if (!Array.isArray(keys) || keys.length > 100 || keys.some(key => typeof key !== 'string' || key.length > 200)) throw fail('Choose valid notifications.');
  if (keys.length) await NotificationReceipt.bulkWrite([...new Set(keys)].map(key => ({ updateOne: { filter: { userId: req.user.id, key }, update: { $set: { readAt: new Date() } }, upsert: true } })));
  respond(res, {});
}));
router.get('/health', handle(async (req, res) => respond(res, { api: 'ok', database: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable', ai: process.env.AI_PROVIDER === 'openai' && process.env.AI_API_KEY ? 'configured' : 'activity-based', serverTime: new Date().toISOString() })));
export default router;
