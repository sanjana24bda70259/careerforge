import { Router } from 'express';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { LeetCodeProblem } from '../models/LeetCodeProblem.js';
import { dsaProblems } from '../services/dsaCatalog.js';
import { scheduleFirstRevision } from '../services/revisionService.js';
import { recordSkillEvidence, scheduleRevision } from '../services/skillGraphService.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const requestedSection = ['Arrays', 'Strings', 'Other'].includes(req.query.section) ? req.query.section : null;
    const requestedDifficulty = ['Easy', 'Medium', 'Hard'].includes(req.query.difficulty) ? req.query.difficulty : null;
    const query = String(req.query.q || '').trim();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const progress = await ProblemProgress.find({ userId: req.user.id }).lean();
    const progressByProblem = new Map(progress.map(item => [item.problemId, item]));
    const filter = {
      ...(requestedSection ? { section: requestedSection } : {}),
      ...(requestedDifficulty ? { difficulty: requestedDifficulty } : {}),
      ...(query ? { title: { $regex: query, $options: 'i' } } : {})
    };
    const [catalogCount, catalogProblems] = await Promise.all([
      LeetCodeProblem.countDocuments(filter),
      LeetCodeProblem.find(filter).sort({ leetCodeId: 1 }).skip((page - 1) * limit).limit(limit).lean()
    ]);
    if (catalogCount > 0) {
      const problems = catalogProblems.map(problem => {
        const id = `leetcode-${problem.leetCodeId}`;
        return { id, title: problem.title, pattern: problem.section, section: problem.section, difficulty: problem.difficulty, companies: [], source: problem.source, url: problem.url, progress: progressByProblem.get(id) || { status: 'not_started', attempts: 0 } };
      });
      return res.json({ success: true, data: { problems, pagination: { page, limit, total: catalogCount, hasMore: page * limit < catalogCount }, catalog: 'leetcode' }, message: 'Problems retrieved successfully.' });
    }
    const problems = dsaProblems
      .map(problem => ({ ...problem, section: problem.topicId === 'arrays' ? 'Arrays' : problem.topicId === 'strings' ? 'Strings' : 'Other', progress: progressByProblem.get(problem.id) || { status: 'not_started', attempts: 0 } }))
      .filter(problem => (!requestedSection || problem.section === requestedSection) && (!requestedDifficulty || problem.difficulty === requestedDifficulty) && (!query || problem.title.toLowerCase().includes(query.toLowerCase())));
    res.json({ success: true, data: { problems, pagination: { page: 1, limit: problems.length, total: problems.length, hasMore: false }, catalog: 'curated' }, message: 'Problems retrieved successfully.' });
  } catch (error) { next(error); }
});
router.post('/:problemId/attempt', async (req, res, next) => {
  try {
    let problem = dsaProblems.find(item => item.id === req.params.problemId);
    if (!problem && /^leetcode-\d+$/.test(req.params.problemId)) {
      const leetCodeId = Number(req.params.problemId.replace('leetcode-', ''));
      const imported = await LeetCodeProblem.findOne({ leetCodeId }).lean();
      if (imported) problem = { id: req.params.problemId };
    }
    const { status, usedHint = false, language, code } = req.body;
    if (!problem || !['attempted', 'solved', 'needs_revision'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid problem attempt', message: 'Provide a valid problem ID and attempt status.' });
    const update = { status, usedHint, lastAttemptedAt: new Date() };
    if (typeof language === 'string') update.language = language;
    if (typeof code === 'string') update.latestCode = code;
    if (status === 'solved') update.solvedAt = new Date();
    const progress = await ProblemProgress.findOneAndUpdate({ userId: req.user.id, problemId: problem.id }, { $set: update, $inc: { attempts: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (status === 'solved') {
      await scheduleFirstRevision(req.user.id, problem.id);
      const topicId = problem.topicId || problem.section || 'general';
      const label = String(topicId).replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
      await recordSkillEvidence({ userId: req.user.id, skillId: `dsa:${topicId}`, label, domain: 'dsa', completed: 1 });
      await scheduleRevision({ userId: req.user.id, skillId: `dsa:${topicId}`, label, domain: 'dsa', sourceType: 'dsa_problem', sourceId: problem.id, prompt: `Revisit ${problem.title || 'this DSA problem'} and explain your chosen approach.`, dueInDays: 1 });
    }
    res.json({ success: true, data: { progress }, message: status === 'solved' ? 'Problem solved. Your first revision is due tomorrow.' : 'Attempt saved successfully.' });
  } catch (error) { next(error); }
});
export default router;
