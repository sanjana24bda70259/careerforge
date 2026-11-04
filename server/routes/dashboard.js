import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { DSAProgress } from '../models/DSAProgress.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { DailyQuest } from '../models/DailyQuest.js';
import { AptitudeAttempt } from '../models/AptitudeAttempt.js';
import { RevisionItem } from '../models/RevisionItem.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { CsTopicProgress } from '../models/CsTopicProgress.js';
import { buildTodayPlanCandidates, generateDailyPlan, planSummary } from '../services/todayPlanService.js';
import { buildPersonalRoadmap, loadStudyProgress } from '../services/personalRoadmapService.js';
import { requestDate, studyDate } from '../services/studyDate.js';
import { LearningItem, LearningAttempt } from '../models/LearningItem.js';

const router = Router();
const validDateKey = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const toTask = candidate => ({ ...candidate, status: 'planned', completedAt: null, skippedAt: null, rescheduledFor: null });
const creating = new Map();
const createPlan = async (userId, profile, dateKey) => {
  const existing = await DailyPlan.findOne({ userId, dateKey });
  if (existing?.version >= 2) return existing;
  const generated = await generateDailyPlan(userId, profile, dateKey);
  if (existing) {
    const retained = existing.tasks.filter(task => task.status !== 'planned' || task.rescheduledFor);
    const retainedIds = new Set(retained.map(task => task.id));
    return DailyPlan.findOneAndUpdate({ _id: existing._id }, { $set: { ...generated, tasks: [...retained, ...generated.tasks.filter(task => !retainedIds.has(task.id)).map(toTask)] } }, { new: true });
  }
  return DailyPlan.findOneAndUpdate(
    { userId, dateKey },
    { $setOnInsert: { userId, dateKey, ...generated, tasks: generated.tasks.map(toTask) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
export const findOrCreatePlan = async (userId, profile, dateKey) => {
  const key = `${userId}:${dateKey}`;
  if (!creating.has(key)) creating.set(key, createPlan(userId, profile, dateKey).finally(() => creating.delete(key)));
  return creating.get(key);
};
async function syncCompleted(plan, userId, timezone = 'UTC') {
  const [practice, saved, problems, cs, aptitude] = await Promise.all([
    LearningAttempt.find({ userId, dateKey: plan.dateKey }).lean(),
    LearningItem.find({ userId }).lean(), ProblemProgress.find({ userId, status: { $ne: 'not_started' } }).lean(),
    CsTopicProgress.find({ userId, learnedAt: { $ne: null } }).lean(),
    AptitudeAttempt.find({ userId, submittedAt: { $gte: new Date(`${plan.dateKey}T00:00:00Z`).getTime() - 24 * 60 * 60 * 1000 } }).lean()
  ]);
  const attempted = new Set(practice.map(item => item.key));
  for (const attempt of aptitude) if (studyDate(timezone, attempt.submittedAt) === plan.dateKey) {
    for (const answer of attempt.answers) if (Number.isInteger(answer.answer)) attempted.add(`aptitude:${attempt.track || 'foundation'}:${answer.questionId}`);
  }
  const reviewed = new Set(saved.filter(item => item.lastReviewedDate === plan.dateKey).map(item => item.key));
  const selected = new Set(saved.filter(item => item.revisionSelected).map(item => item.key));
  const solved = new Set(problems.filter(item => item.status === 'solved' || (item.lastAttemptedAt && studyDate(timezone, item.lastAttemptedAt) === plan.dateKey)).map(item => item.problemId));
  const learned = new Set(cs.map(item => `cs:${item.subjectId}:${item.topicId}`));
  for (const task of plan.tasks) {
    if (task.status !== 'planned') continue;
    if (task.kind === 'revision' && !selected.has(task.sourceId)) {
      await DailyPlan.updateOne({ _id: plan._id }, { $pull: { tasks: { id: task.id, status: 'planned' } } });
    } else if (task.kind === 'revision' ? reviewed.has(task.sourceId) : attempted.has(task.sourceId) || solved.has(task.sourceId) || learned.has(task.sourceId)) {
      await DailyPlan.updateOne({ _id: plan._id, tasks: { $elemMatch: { id: task.id, status: 'planned' } } }, { $set: { 'tasks.$.status': 'completed', 'tasks.$.completedAt': new Date() } });
    }
  }
  return DailyPlan.findById(plan._id);
}
router.get('/roadmap', requireAuth, async (req, res, next) => {
  try { res.json({ success: true, data: { roadmap: buildPersonalRoadmap(req.user.profile, await loadStudyProgress(req.user.id)) } }); }
  catch (error) { next(error); }
});
router.get('/suggestions', requireAuth, async (req, res, next) => {
  try {
    const dateKey = requestDate(req);
    const plan = await findOrCreatePlan(req.user.id, req.user.profile, dateKey);
    const generated = await generateDailyPlan(req.user.id, req.user.profile, dateKey, plan.tasks.map(task => task.sourceId));
    res.json({ success: true, data: { tasks: generated.tasks.filter(task => task.kind !== 'revision').slice(0, 3), generatedBy: generated.generatedBy } });
  } catch (error) { next(error); }
});
router.get('/', requireAuth, async (req, res, next) => {
  try {
  const [solved, completedTopics, aptitudeAttempts, interviews, mocks, quests, dueSkillRevisions, csTopicsLearned, individualPractice] = await Promise.all([
    ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' }),
    DSAProgress.countDocuments({ userId: req.user.id, status: 'proficient' }),
    AptitudeAttempt.find({ userId: req.user.id }).lean(),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'interview' }),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'mock_attempt' }),
    DailyQuest.find({ userId: req.user.id }).lean(),
    LearningItem.countDocuments({ userId: req.user.id, revisionSelected: true, dueDate: { $lte: requestDate(req) } }),
    CsTopicProgress.countDocuments({ userId: req.user.id, learnedAt: { $ne: null } }),
    LearningAttempt.find({ userId: req.user.id, key: /^aptitude:/ }).lean()
  ]);
  const attemptTotals = attempts => {
    const totals = attempts.reduce((total, item) => ({ attempted: total.attempted + item.attempted, correct: total.correct + item.correct, testsCompleted: total.testsCompleted + 1 }), { attempted: 0, correct: 0, testsCompleted: 0 });
    return { ...totals, accuracy: totals.attempted ? Math.round((totals.correct / totals.attempted) * 100) : null };
  };
  // Foundation attempts created before the Advanced track have no `track`
  // field. Preserve them as Foundation rather than folding them into a demo
  // total or resetting historical progress.
  const aptitude = attemptTotals(aptitudeAttempts.filter(item => !item.track || item.track === 'foundation'));
  const advancedAptitude = attemptTotals(aptitudeAttempts.filter(item => item.track === 'advanced'));
  for (const [track, totals] of [['foundation', aptitude], ['advanced', advancedAptitude]]) {
    const attempts = individualPractice.filter(item => item.key.startsWith(`aptitude:${track}:`));
    totals.attempted += attempts.length; totals.correct += attempts.filter(item => item.correct).length;
    totals.accuracy = totals.attempted ? Math.round(totals.correct / totals.attempted * 100) : null;
  }
  const savedMocks = aptitudeAttempts.filter(item => item.track === 'advanced' && item.testType === 'mock').length;
  const dailyChallengesCompleted = quests.reduce((total, quest) => total + quest.tasks.filter(task => task.completed).length, 0);
  res.json({ success: true, data: {
    stats: { solved, streak: 0, mockTests: mocks + savedMocks, skillsCompleted: completedTopics, aptitude, advancedAptitude, interviews, dailyChallengesCompleted, dueSkillRevisions, csTopicsLearned },
    message: 'Progress is based on activity saved to your account.'
  }, message: 'Dashboard retrieved successfully.' });
  } catch (error) { next(error); }
});

router.get('/today-plan', requireAuth, async (req, res, next) => {
  try {
    const plan = await syncCompleted(await findOrCreatePlan(req.user.id, req.user.profile, requestDate(req)), req.user.id, req.get('X-Timezone') || 'UTC');
    res.json({ success: true, data: { plan: planSummary(plan) }, message: 'Today’s plan retrieved from your saved progress.' });
  } catch (error) { next(error); }
});

router.post('/today-plan/acknowledge', requireAuth, async (req, res, next) => {
  try {
    const plan = await findOrCreatePlan(req.user.id, req.user.profile, requestDate(req));
    await DailyPlan.updateOne({ _id: plan._id, acknowledgedAt: null }, { $set: { acknowledgedAt: new Date() } });
    res.json({ success: true, data: {} });
  } catch (error) { next(error); }
});
router.post('/today-plan/start', requireAuth, async (req, res, next) => {
  try {
    const plan = await findOrCreatePlan(req.user.id, req.user.profile, requestDate(req));
    if (!plan.startedAt) { plan.startedAt = new Date(); await plan.save(); }
    res.json({ success: true, data: { plan: planSummary(plan) }, message: 'Your day has started.' });
  } catch (error) { next(error); }
});

router.patch('/today-plan/tasks/:taskId', requireAuth, async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['planned', 'completed', 'skipped'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid task status', message: 'Choose planned, completed or skipped.' });
    const plan = await findOrCreatePlan(req.user.id, req.user.profile, requestDate(req));
    const task = plan.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This task is not part of today’s plan.' });
    if (task.kind === 'revision' && status === 'completed') return res.status(400).json({ success: false, message: 'Open the revision and record your recall to complete it.' });
    task.status = status;
    task.completedAt = status === 'completed' ? new Date() : null;
    task.skippedAt = status === 'skipped' ? new Date() : null;
    if (status !== 'skipped') task.rescheduledFor = null;
    await plan.save();
    res.json({ success: true, data: { plan: planSummary(plan) }, message: status === 'completed' ? 'Task completion recorded.' : status === 'skipped' ? 'Task skipped.' : 'Task restored to today’s plan.' });
  } catch (error) { next(error); }
});

router.post('/today-plan/tasks/:taskId/reschedule', requireAuth, async (req, res, next) => {
  try {
    const targetDate = String(req.body?.dateKey || '');
    if (!validDateKey(targetDate) || Number.isNaN(Date.parse(targetDate)) || new Date(targetDate).toISOString().slice(0, 10) !== targetDate || targetDate <= requestDate(req)) return res.status(400).json({ success: false, error: 'Invalid date', message: 'Choose a future date in YYYY-MM-DD format.' });
    const plan = await findOrCreatePlan(req.user.id, req.user.profile, requestDate(req));
    const task = plan.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This task is not part of today’s plan.' });
    if (task.kind === 'revision') return res.status(400).json({ success: false, message: 'Revision dates follow your recall schedule. You can skip this task today; it stays in your due queue.' });
    const targetPlan = await DailyPlan.findOneAndUpdate({ userId: req.user.id, dateKey: targetDate }, { $setOnInsert: { tasks: [], version: 1 } }, { upsert: true, new: true });
    if (!targetPlan.tasks.some(item => item.id === task.id)) targetPlan.tasks.push({ ...toTask({ ...task.toObject?.() || task }), rescheduledFor: targetDate });
    task.status = 'rescheduled'; task.rescheduledFor = targetDate; task.completedAt = null; task.skippedAt = null;
    await Promise.all([plan.save(), targetPlan.save()]);
    res.json({ success: true, data: { plan: planSummary(plan) }, message: `Task rescheduled for ${targetDate}.` });
  } catch (error) { next(error); }
});

router.post('/today-plan/tasks/:taskId/replace', requireAuth, async (req, res, next) => {
  try {
    const plan = await findOrCreatePlan(req.user.id, req.user.profile, requestDate(req));
    const task = plan.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This task is not part of today’s plan.' });
    const candidates = await buildTodayPlanCandidates(req.user.id, req.user.profile, requestDate(req));
    const replacement = candidates.find(item => item.kind !== 'revision' && item.estimatedMinutes <= task.estimatedMinutes && item.id !== task.id && !plan.tasks.some(existing => existing.sourceId && existing.sourceId === item.sourceId));
    if (!replacement) return res.status(409).json({ success: false, error: 'No replacement available', message: 'No new activity-based task is available to replace this task today.' });
    Object.assign(task, toTask(replacement));
    await plan.save();
    res.json({ success: true, data: { plan: planSummary(plan) }, message: 'Task replaced with another activity-based recommendation.' });
  } catch (error) { next(error); }
});
export default router;
