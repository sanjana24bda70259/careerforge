import { Router } from 'express';
import { DSAProgress } from '../models/DSAProgress.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { DsaResourceProgress } from '../models/DsaResourceProgress.js';
import { dsaDiagnosticQuestions, dsaTopics, topicForSkill } from '../services/dsaCatalog.js';
import { dsaPracticeCatalog, dsaPracticeProgressId, questionsForTopic } from '../services/dsaPracticeCatalog.js';
import { recordSkillEvidence, scheduleRevision } from '../services/skillGraphService.js';
import { cheatsheetById, dsaCheatsheets, dsaVideoResources } from '../services/dsaLearningCatalog.js';
import { runCode, submitCode } from '../services/codeExecutionService.js';

const router = Router();
const supportedLanguages = new Set(['Java', 'Python', 'C++', 'JavaScript']);
const isoDay = value => new Date(value).toISOString().slice(0, 10);
const streaksFor = solved => {
  const days = [...new Set(solved.filter(item => item.solvedAt).map(item => isoDay(item.solvedAt)))].sort();
  const dayMs = 24 * 60 * 60 * 1000;
  let longest = 0; let currentRun = 0; let previous = null;
  for (const day of days) {
    const date = new Date(`${day}T00:00:00.000Z`);
    currentRun = previous && date - previous === dayMs ? currentRun + 1 : 1;
    longest = Math.max(longest, currentRun); previous = date;
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeDays = new Set(days);
  let current = 0; let cursor = today;
  while (activeDays.has(isoDay(cursor))) { current += 1; cursor = new Date(cursor.getTime() - dayMs); }
  return { current, longest };
};
const allPracticeQuestions = () => Object.entries(dsaPracticeCatalog).flatMap(([topicId, questions]) => questions.map(question => ({ ...question, topicId, progressId: dsaPracticeProgressId(topicId, question.id) })));
const saveExecutionAttempt = async ({ userId, topic, question, code, language, timeSpentSeconds = 0, status = 'execution_unavailable' }) => ProblemProgress.findOneAndUpdate(
  { userId, problemId: dsaPracticeProgressId(topic.id, question.id) },
  {
    $set: {
      status: 'attempted', language, latestCode: code, lastAttemptedAt: new Date(),
      lastSubmission: { status, language, submittedAt: new Date(), executionTimeMs: null }
    },
    $inc: { attempts: 1, timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0) }
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
const sendPracticeQuestions = async (req, res, next, topicId) => {
  try {
    const topic = dsaTopics.find(item => item.id === topicId);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found', message: 'Topic not found' });
    const questions = questionsForTopic(topic.id);
    const progressIds = questions.map(question => dsaPracticeProgressId(topic.id, question.id));
    const progress = await ProblemProgress.find({ userId: req.user.id, problemId: { $in: progressIds } }).lean();
    const progressById = new Map(progress.map(item => [item.problemId, item]));
    res.json({ success: true, data: {
      topic: { id: topic.id, name: topic.name, description: topic.description || `Build practical ${topic.name.toLowerCase()} patterns.`, solvedCount: progress.filter(item => item.status === 'solved').length, questionCount: questions.length },
      questions: questions.map(({ externalUrl, ...question }) => {
        const saved = progressById.get(dsaPracticeProgressId(topic.id, question.id));
        return { ...question, status: saved?.status || 'not_started', solved: saved?.status === 'solved', attempts: saved?.attempts || 0 };
      })
    }, message: 'DSA practice questions retrieved successfully.' });
  } catch (error) { next(error); }
};
router.get('/roadmap', async (req, res, next) => {
  try {
    const practiceQuestions = allPracticeQuestions();
    const practiceIds = practiceQuestions.map(question => question.progressId);
    const [progress, allProblemProgress] = await Promise.all([
      DSAProgress.find({ userId: req.user.id }).lean(),
      ProblemProgress.find({ userId: req.user.id, problemId: { $in: practiceIds } }).lean()
    ]);
    const solvedQuestions = allProblemProgress.filter(item => item.status === 'solved');
    const progressByTopic = new Map(progress.map(item => [item.topicId, item]));
    const solvedByTopic = new Map();
    for (const solved of solvedQuestions) {
      const [, topicId] = solved.problemId.split(':');
      solvedByTopic.set(topicId, (solvedByTopic.get(topicId) || 0) + 1);
    }
    const claimedSkills = new Set((req.user.profile.skills || []).map(skill => topicForSkill(skill)?.id).filter(Boolean));
    const topics = dsaTopics.map(topic => {
      const saved = progressByTopic.get(topic.id);
      const questionCount = questionsForTopic(topic.id).length;
      const problemsSolved = solvedByTopic.get(topic.id) || 0;
      const progressPercent = questionCount ? Math.round((problemsSolved / questionCount) * 100) : 0;
      return {
        ...topic,
        questionCount,
        progress: {
          ...(saved || { status: claimedSkills.has(topic.id) ? 'needs_practice' : 'not_started', mastery: 0 }),
          status: problemsSolved > 0 ? 'in_progress' : (saved?.status || (claimedSkills.has(topic.id) ? 'needs_practice' : 'not_started')),
          problemsSolved,
          progressPercent
        },
        requiresDiagnostic: claimedSkills.has(topic.id) && !saved?.diagnosticScore
      };
    });
    const streaks = streaksFor(solvedQuestions);
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const difficultyTotals = ['Easy', 'Medium', 'Hard'].reduce((totals, difficulty) => {
      const ids = new Set(practiceQuestions.filter(question => question.difficulty === difficulty).map(question => question.progressId));
      return { ...totals, [difficulty.toLowerCase()]: solvedQuestions.filter(item => ids.has(item.problemId)).length };
    }, {});
    const byId = new Map(practiceQuestions.map(question => [question.progressId, question]));
    const summary = {
      totalProblems: practiceQuestions.length,
      solved: solvedQuestions.length,
      attempted: allProblemProgress.filter(item => item.status === 'attempted').length,
      easySolved: difficultyTotals.easy || 0,
      mediumSolved: difficultyTotals.medium || 0,
      hardSolved: difficultyTotals.hard || 0,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      solvedThisWeek: solvedQuestions.filter(item => item.solvedAt && new Date(item.solvedAt).getTime() >= weekAgo).length,
      studyTimeSeconds: allProblemProgress.reduce((total, item) => total + (item.timeSpentSeconds || 0), 0),
      recentlySolved: solvedQuestions.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt)).slice(0, 5).map(item => ({ id: item.problemId, title: byId.get(item.problemId)?.title || 'Solved problem', solvedAt: item.solvedAt }))
    };
    res.json({ success: true, data: { topics, summary }, message: 'DSA roadmap retrieved successfully.' });
  } catch (error) { next(error); }
});

router.get('/questions', (req, res, next) => sendPracticeQuestions(req, res, next, req.query.topic));
router.get('/topics/:topicId/questions', (req, res, next) => sendPracticeQuestions(req, res, next, req.params.topicId));

const findTopicQuestion = (topicId, questionId) => {
  const topic = dsaTopics.find(item => item.id === topicId);
  const question = topic && questionsForTopic(topic.id).find(item => item.id === questionId);
  return { topic, question };
};

router.get('/topics/:topicId/resources', (req, res) => {
  const topic = dsaTopics.find(item => item.id === req.params.topicId);
  if (!topic) return res.status(404).json({ success: false, error: 'Topic not found', message: 'The requested DSA topic does not exist.' });
  res.json({ success: true, data: {
    videos: dsaVideoResources(topic.id),
    cheatsheets: dsaCheatsheets.filter(sheet => sheet.topicIds.includes(topic.id)).map(({ template, ...sheet }) => sheet)
  }, message: 'DSA learning resources retrieved successfully.' });
});

router.get('/topics/:topicId/questions/:questionId', async (req, res, next) => {
  try {
    const { topic, question } = findTopicQuestion(req.params.topicId, req.params.questionId);
    if (!question) return res.status(404).json({ success: false, error: 'Problem not found', message: 'The requested CareerForge problem does not exist.' });
    const progress = await ProblemProgress.findOne({ userId: req.user.id, problemId: dsaPracticeProgressId(topic.id, question.id) }).lean();
    const { externalUrl, ...problem } = question;
    res.json({ success: true, data: {
      topic: { id: topic.id, name: topic.name },
      problem: {
        ...problem,
        statement: question.description,
        examples: question.examples || [],
        constraints: question.constraints || ['Read the full prompt before choosing a data structure.', 'Account for empty and boundary inputs.'],
        executionReady: false,
        progress: progress || { status: 'not_started', attempts: 0 }
      }
    }, message: 'CareerForge problem retrieved successfully.' });
  } catch (error) { next(error); }
});

const validateCodePayload = (req, res) => {
  const { code, language } = req.body || {};
  if (!supportedLanguages.has(language) || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ success: false, error: 'Invalid submission', message: 'Choose a supported language and enter code before running or submitting.' });
    return null;
  }
  return { code, language, timeSpentSeconds: req.body.timeSpentSeconds };
};

router.post('/topics/:topicId/questions/:questionId/run', async (req, res, next) => {
  try {
    const { topic, question } = findTopicQuestion(req.params.topicId, req.params.questionId);
    if (!question) return res.status(404).json({ success: false, error: 'Problem not found', message: 'The requested CareerForge problem does not exist.' });
    const payload = validateCodePayload(req, res);
    if (!payload) return;
    const execution = await runCode({ ...payload, problem: question, mode: 'sample' });
    if (!execution.available) return res.status(503).json({ success: false, error: 'Code execution unavailable', message: execution.message });
    return res.json({ success: true, data: execution, message: 'Sample tests completed.' });
  } catch (error) { next(error); }
});

router.post('/topics/:topicId/questions/:questionId/submit', async (req, res, next) => {
  try {
    const { topic, question } = findTopicQuestion(req.params.topicId, req.params.questionId);
    if (!question) return res.status(404).json({ success: false, error: 'Problem not found', message: 'The requested CareerForge problem does not exist.' });
    const payload = validateCodePayload(req, res);
    if (!payload) return;
    const execution = await submitCode({ ...payload, problem: question, mode: 'submission' });
    if (!execution.available) {
      await saveExecutionAttempt({ userId: req.user.id, topic, question, ...payload });
      return res.status(503).json({ success: false, error: 'Code execution unavailable', message: execution.message });
    }
    const accepted = execution.status === 'accepted';
    const progress = await ProblemProgress.findOneAndUpdate(
      { userId: req.user.id, problemId: dsaPracticeProgressId(topic.id, question.id) },
      { $set: { status: accepted ? 'solved' : 'attempted', language: payload.language, latestCode: payload.code, lastAttemptedAt: new Date(), lastSubmission: { status: execution.status, language: payload.language, submittedAt: new Date(), executionTimeMs: execution.executionTimeMs || null }, ...(accepted ? { solvedAt: new Date() } : {}) }, $inc: { attempts: 1, timeSpentSeconds: Math.max(0, Number(payload.timeSpentSeconds) || 0) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (accepted) {
      await recordSkillEvidence({ userId: req.user.id, skillId: `dsa:${topic.id}`, label: topic.name, domain: 'dsa', completed: 1 });
      await scheduleRevision({ userId: req.user.id, skillId: `dsa:${topic.id}`, label: topic.name, domain: 'dsa', sourceType: 'dsa_problem', sourceId: progress.problemId, prompt: `Revisit ${question.title} and explain the ${question.tags?.join(', ') || topic.name} approach.`, dueInDays: 1 });
    }
    return res.json({ success: true, data: { ...execution, progress }, message: accepted ? 'Accepted. Your DSA progress has been updated.' : 'Submission recorded. Review the failed tests and try again.' });
  } catch (error) { next(error); }
});

router.get('/cheatsheets', async (req, res, next) => {
  try {
    const progress = await DsaResourceProgress.find({ userId: req.user.id, resourceType: 'cheatsheet' }).lean();
    const byId = new Map(progress.map(item => [item.resourceId, item]));
    res.json({ success: true, data: { cheatsheets: dsaCheatsheets.map(sheet => ({ ...sheet, progress: byId.get(sheet.id) || { bookmarked: false, revisionCount: 0, revisedAt: null } })) }, message: 'DSA cheatsheets retrieved successfully.' });
  } catch (error) { next(error); }
});

router.get('/bookmarks', async (req, res, next) => {
  try {
    const progress = await DsaResourceProgress.find({ userId: req.user.id, resourceType: 'cheatsheet', bookmarked: true }).lean();
    const ids = new Set(progress.map(item => item.resourceId));
    res.json({ success: true, data: { bookmarks: dsaCheatsheets.filter(sheet => ids.has(sheet.id)).map(sheet => ({ ...sheet, progress: progress.find(item => item.resourceId === sheet.id) })) }, message: 'DSA bookmarks retrieved successfully.' });
  } catch (error) { next(error); }
});

router.post('/cheatsheets/:cheatsheetId/bookmark', async (req, res, next) => {
  try {
    const sheet = cheatsheetById(req.params.cheatsheetId);
    if (!sheet) return res.status(404).json({ success: false, error: 'Cheatsheet not found', message: 'The requested cheatsheet does not exist.' });
    const progress = await DsaResourceProgress.findOneAndUpdate({ userId: req.user.id, resourceId: sheet.id, resourceType: 'cheatsheet' }, { $set: { bookmarked: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: { progress }, message: 'Cheatsheet saved to bookmarks.' });
  } catch (error) { next(error); }
});

router.delete('/cheatsheets/:cheatsheetId/bookmark', async (req, res, next) => {
  try {
    await DsaResourceProgress.findOneAndUpdate({ userId: req.user.id, resourceId: req.params.cheatsheetId, resourceType: 'cheatsheet' }, { $set: { bookmarked: false } }, { new: true });
    res.json({ success: true, data: {}, message: 'Cheatsheet removed from bookmarks.' });
  } catch (error) { next(error); }
});

router.post('/cheatsheets/:cheatsheetId/revised', async (req, res, next) => {
  try {
    const sheet = cheatsheetById(req.params.cheatsheetId);
    if (!sheet) return res.status(404).json({ success: false, error: 'Cheatsheet not found', message: 'The requested cheatsheet does not exist.' });
    const progress = await DsaResourceProgress.findOneAndUpdate({ userId: req.user.id, resourceId: sheet.id, resourceType: 'cheatsheet' }, { $set: { revisedAt: new Date() }, $inc: { revisionCount: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: { progress }, message: 'Revision recorded.' });
  } catch (error) { next(error); }
});

router.post('/topics/:topicId/questions/:questionId/solve', (_, res) => res.status(409).json({
  success: false,
  error: 'Manual solve disabled',
  message: 'CareerForge marks a problem solved only after an accepted submission from the secure execution provider.'
}));

router.get('/topics/:topicId/diagnostic', (req, res) => {
  const questions = dsaDiagnosticQuestions[req.params.topicId];
  if (!questions) return res.status(404).json({ success: false, error: 'Questions unavailable', message: 'A diagnostic for this topic is not available yet.' });
  res.json({ success: true, data: { questions: questions.map(({ answer, ...question }) => question) }, message: 'Diagnostic questions retrieved successfully.' });
});
router.post('/topics/:topicId/diagnostic', async (req, res, next) => {
  try {
    const topic = dsaTopics.find(item => item.id === req.params.topicId);
    const questions = dsaDiagnosticQuestions[req.params.topicId];
    const answers = req.body.answers;
    if (!topic || !questions || !Array.isArray(answers)) return res.status(400).json({ success: false, error: 'Invalid diagnostic result', message: 'Submit answers for an available diagnostic.' });
    const score = Math.round((answers.filter(answer => questions.find(question => question.id === answer.questionId)?.answer === answer.answer).length / questions.length) * 100);
    const status = score >= 80 ? 'proficient' : score >= 60 ? 'needs_practice' : 'not_started';
    const progress = await DSAProgress.findOneAndUpdate({ userId: req.user.id, topicId: topic.id }, { status, mastery: score, diagnosticScore: score, lastPracticedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const correct = answers.filter(answer => questions.find(question => question.id === answer.questionId)?.answer === answer.answer).length;
    const attempted = answers.filter(answer => questions.some(question => question.id === answer.questionId && Number.isInteger(answer.answer))).length;
    await recordSkillEvidence({ userId: req.user.id, skillId: `dsa:${topic.id}`, label: topic.name, domain: 'dsa', attempted, correct, incorrect: Math.max(0, attempted - correct) });
    res.json({ success: true, data: { progress }, message: 'Diagnostic result saved successfully.' });
  } catch (error) { next(error); }
});
export default router;
