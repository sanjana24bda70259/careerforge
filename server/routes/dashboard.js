import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { DSAProgress } from '../models/DSAProgress.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { DailyQuest } from '../models/DailyQuest.js';
import { AptitudeAttempt } from '../models/AptitudeAttempt.js';

const router = Router();
router.get('/', requireAuth, async (req, res, next) => {
  try {
  const [solved, completedTopics, aptitudeAttempts, interviews, mocks, quests] = await Promise.all([
    ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' }),
    DSAProgress.countDocuments({ userId: req.user.id, status: 'proficient' }),
    AptitudeAttempt.find({ userId: req.user.id }).lean(),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'interview' }),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'mock_attempt' }),
    DailyQuest.find({ userId: req.user.id }).lean()
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
    readiness: Math.min(100, Math.round(Math.min(solved, 100) * .3 + Math.min(aptitude.accuracy || 0, 100) * .15 + completedTopics * 2 + interviews * 3)),
    stats: { solved, streak: 0, mockTests: mocks + savedMocks, skillsCompleted: completedTopics, aptitude, advancedAptitude, interviews, dailyChallengesCompleted },
    message: 'Complete onboarding to generate your first personalized roadmap.'
  }, message: 'Dashboard retrieved successfully.' });
  } catch (error) { next(error); }
});
export default router;
