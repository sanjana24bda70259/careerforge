import { Router } from 'express';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { dsaProblems } from '../services/dsaCatalog.js';
import { scheduleFirstRevision } from '../services/revisionService.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const progress = await ProblemProgress.find({ userId: req.user.id }).lean();
    const progressByProblem = new Map(progress.map(item => [item.problemId, item]));
    const problems = dsaProblems.map(problem => ({ ...problem, progress: progressByProblem.get(problem.id) || { status: 'not_started', attempts: 0 } }));
    res.json({ success: true, data: { problems }, message: 'Problems retrieved successfully.' });
  } catch (error) { next(error); }
});
router.post('/:problemId/attempt', async (req, res, next) => {
  try {
    const problem = dsaProblems.find(item => item.id === req.params.problemId);
    const { status, usedHint = false, language, code } = req.body;
    if (!problem || !['attempted', 'solved', 'needs_revision'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid problem attempt', message: 'Provide a valid problem ID and attempt status.' });
    const update = { status, usedHint, lastAttemptedAt: new Date() };
    if (typeof language === 'string') update.language = language;
    if (typeof code === 'string') update.latestCode = code;
    if (status === 'solved') update.solvedAt = new Date();
    const progress = await ProblemProgress.findOneAndUpdate({ userId: req.user.id, problemId: problem.id }, { $set: update, $inc: { attempts: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (status === 'solved') await scheduleFirstRevision(req.user.id, problem.id);
    res.json({ success: true, data: { progress }, message: status === 'solved' ? 'Problem solved. Your first revision is due tomorrow.' : 'Attempt saved successfully.' });
  } catch (error) { next(error); }
});
export default router;
