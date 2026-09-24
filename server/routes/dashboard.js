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
import { buildTodayPlanCandidates, planSummary } from '../services/todayPlanService.js';

const router = Router();
const todayKey = () => new Date().toISOString().slice(0, 10);
const validDateKey = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const toTask = candidate => ({ ...candidate, status: 'planned', completedAt: null, skippedAt: null, rescheduledFor: null });
const findOrCreatePlan = async (userId, profile, dateKey = todayKey()) => {
  const existing = await DailyPlan.findOne({ userId, dateKey });
  if (existing) return existing;
  const candidates = await buildTodayPlanCandidates(userId, profile);
  return DailyPlan.findOneAndUpdate(
    { userId, dateKey },
    { $setOnInsert: { userId, dateKey, tasks: candidates.slice(0, 5).map(toTask) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
router.get('/', requireAuth, async (req, res, next) => {
  try {
  const [solved, completedTopics, aptitudeAttempts, interviews, mocks, quests, dueSkillRevisions, csTopicsLearned] = await Promise.all([
    ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' }),
    DSAProgress.countDocuments({ userId: req.user.id, status: 'proficient' }),
    AptitudeAttempt.find({ userId: req.user.id }).lean(),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'interview' }),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'mock_attempt' }),
    DailyQuest.find({ userId: req.user.id }).lean(),
    RevisionItem.countDocuments({ userId: req.user.id, dueAt: { $lte: new Date() } }),
    CsTopicProgress.countDocuments({ userId: req.user.id, learnedAt: { $ne: null } })
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
    const plan = await findOrCreatePlan(req.user.id, req.user.profile);
    res.json({ success: true, data: { plan: planSummary(plan) }, message: 'Today’s plan retrieved from your saved progress.' });
  } catch (error) { next(error); }
});

router.post('/today-plan/start', requireAuth, async (req, res, next) => {
  try {
    const plan = await findOrCreatePlan(req.user.id, req.user.profile);
    if (!plan.startedAt) { plan.startedAt = new Date(); await plan.save(); }
    res.json({ success: true, data: { plan: planSummary(plan) }, message: 'Your day has started.' });
  } catch (error) { next(error); }
});

router.patch('/today-plan/tasks/:taskId', requireAuth, async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['planned', 'completed', 'skipped'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid task status', message: 'Choose planned, completed or skipped.' });
    const plan = await findOrCreatePlan(req.user.id, req.user.profile);
    const task = plan.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This task is not part of today’s plan.' });
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
    if (!validDateKey(targetDate) || targetDate <= todayKey()) return res.status(400).json({ success: false, error: 'Invalid date', message: 'Choose a future date in YYYY-MM-DD format.' });
    const plan = await findOrCreatePlan(req.user.id, req.user.profile);
    const task = plan.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This task is not part of today’s plan.' });
    const targetPlan = await findOrCreatePlan(req.user.id, req.user.profile, targetDate);
    if (!targetPlan.tasks.some(item => item.id === task.id)) targetPlan.tasks.push(toTask({ ...task.toObject?.() || task }));
    task.status = 'rescheduled'; task.rescheduledFor = targetDate; task.completedAt = null; task.skippedAt = null;
    await Promise.all([plan.save(), targetPlan.save()]);
    res.json({ success: true, data: { plan: planSummary(plan) }, message: `Task rescheduled for ${targetDate}.` });
  } catch (error) { next(error); }
});

router.post('/today-plan/tasks/:taskId/replace', requireAuth, async (req, res, next) => {
  try {
    const plan = await findOrCreatePlan(req.user.id, req.user.profile);
    const task = plan.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This task is not part of today’s plan.' });
    const candidates = await buildTodayPlanCandidates(req.user.id, req.user.profile);
    const replacement = candidates.find(item => item.id !== task.id && !plan.tasks.some(existing => existing.id === item.id));
    if (!replacement) return res.status(409).json({ success: false, error: 'No replacement available', message: 'No new activity-based task is available to replace this task today.' });
    Object.assign(task, toTask(replacement));
    await plan.save();
    res.json({ success: true, data: { plan: planSummary(plan) }, message: 'Task replaced with another activity-based recommendation.' });
  } catch (error) { next(error); }
});
export default router;
