import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { DSAProgress } from '../models/DSAProgress.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { DailyQuest } from '../models/DailyQuest.js';

const router = Router();
router.get('/', requireAuth, async (req, res, next) => {
  try {
  const [solved, completedTopics, aptitudeAttempts, interviews, mocks, quests] = await Promise.all([
    ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' }),
    DSAProgress.countDocuments({ userId: req.user.id, status: 'proficient' }),
    CareerRecord.find({ userId: req.user.id, type: 'aptitude_attempt' }).lean(),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'interview' }),
    CareerRecord.countDocuments({ userId: req.user.id, type: 'mock_attempt' }),
    DailyQuest.find({ userId: req.user.id }).lean()
  ]);
  const aptitude = aptitudeAttempts.reduce((total, item) => ({ attempted: total.attempted + (item.data.attempted || 0), correct: total.correct + (item.data.correct || 0), testsCompleted: total.testsCompleted + (item.data.testsCompleted || 0) }), { attempted: 0, correct: 0, testsCompleted: 0 });
  aptitude.accuracy = aptitude.attempted ? Math.round((aptitude.correct / aptitude.attempted) * 100) : null;
  const dailyChallengesCompleted = quests.reduce((total, quest) => total + quest.tasks.filter(task => task.completed).length, 0);
  res.json({ success: true, data: {
    readiness: Math.min(100, Math.round(Math.min(solved, 100) * .3 + Math.min(aptitude.accuracy || 0, 100) * .15 + completedTopics * 2 + interviews * 3)),
    stats: { solved, streak: 0, mockTests: mocks, skillsCompleted: completedTopics, aptitude, interviews, dailyChallengesCompleted },
    message: 'Complete onboarding to generate your first personalized roadmap.'
  }, message: 'Dashboard retrieved successfully.' });
  } catch (error) { next(error); }
});
export default router;
