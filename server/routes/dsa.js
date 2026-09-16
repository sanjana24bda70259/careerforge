import { Router } from 'express';
import { DSAProgress } from '../models/DSAProgress.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { dsaDiagnosticQuestions, dsaTopics, topicForSkill } from '../services/dsaCatalog.js';
import { dsaPracticeCatalog, dsaPracticeProgressId, questionsForTopic } from '../services/dsaPracticeCatalog.js';

const router = Router();
const sendPracticeQuestions = async (req, res, next, topicId) => {
  try {
    const topic = dsaTopics.find(item => item.id === topicId);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found', message: 'Topic not found' });
    const questions = questionsForTopic(topic.id);
    const progressIds = questions.map(question => dsaPracticeProgressId(topic.id, question.id));
    const solved = await ProblemProgress.find({ userId: req.user.id, status: 'solved', problemId: { $in: progressIds } }).lean();
    const solvedIds = new Set(solved.map(item => item.problemId));
    res.json({ success: true, data: {
      topic: { id: topic.id, name: topic.name, solvedCount: solved.length, questionCount: questions.length },
      questions: questions.map(question => ({ ...question, solved: solvedIds.has(dsaPracticeProgressId(topic.id, question.id)) }))
    }, message: 'DSA practice questions retrieved successfully.' });
  } catch (error) { next(error); }
};
router.get('/roadmap', async (req, res, next) => {
  try {
    const practiceIds = Object.entries(dsaPracticeCatalog).flatMap(([topicId, questions]) => questions.map(question => dsaPracticeProgressId(topicId, question.id)));
    const [progress, solvedQuestions] = await Promise.all([
      DSAProgress.find({ userId: req.user.id }).lean(),
      ProblemProgress.find({ userId: req.user.id, status: 'solved', problemId: { $in: practiceIds } }).lean()
    ]);
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
    res.json({ success: true, data: { topics }, message: 'DSA roadmap retrieved successfully.' });
  } catch (error) { next(error); }
});

router.get('/questions', (req, res, next) => sendPracticeQuestions(req, res, next, req.query.topic));
router.get('/topics/:topicId/questions', (req, res, next) => sendPracticeQuestions(req, res, next, req.params.topicId));

router.post('/topics/:topicId/questions/:questionId/solve', async (req, res, next) => {
  try {
    const topic = dsaTopics.find(item => item.id === req.params.topicId);
    const question = topic && questionsForTopic(topic.id).find(item => item.id === req.params.questionId);
    if (!question) return res.status(404).json({ success: false, error: 'Question not found', message: 'The requested practice question does not exist.' });
    const problemId = dsaPracticeProgressId(topic.id, question.id);
    const existing = await ProblemProgress.findOne({ userId: req.user.id, problemId });
    const alreadySolved = existing?.status === 'solved';
    const progress = alreadySolved ? existing : await ProblemProgress.findOneAndUpdate(
      { userId: req.user.id, problemId },
      { $set: { status: 'solved', solvedAt: new Date(), lastAttemptedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const [solvedCount, questionCount] = await Promise.all([
      ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved', problemId: { $in: questionsForTopic(topic.id).map(item => dsaPracticeProgressId(topic.id, item.id)) } }),
      Promise.resolve(questionsForTopic(topic.id).length)
    ]);
    res.json({ success: true, data: { progress, alreadySolved, solvedCount, questionCount }, message: alreadySolved ? 'This question was already marked as solved.' : 'Question marked as solved.' });
  } catch (error) { next(error); }
});

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
    res.json({ success: true, data: { progress }, message: 'Diagnostic result saved successfully.' });
  } catch (error) { next(error); }
});
export default router;
