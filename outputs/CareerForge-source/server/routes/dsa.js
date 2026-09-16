import { Router } from 'express';
import { DSAProgress } from '../models/DSAProgress.js';
import { dsaDiagnosticQuestions, dsaTopics, topicForSkill } from '../services/dsaCatalog.js';

const router = Router();
router.get('/roadmap', async (req, res, next) => {
  try {
    const progress = await DSAProgress.find({ userId: req.user.id }).lean();
    const progressByTopic = new Map(progress.map(item => [item.topicId, item]));
    const claimedSkills = new Set((req.user.profile.skills || []).map(skill => topicForSkill(skill)?.id).filter(Boolean));
    const topics = dsaTopics.map(topic => {
      const saved = progressByTopic.get(topic.id);
      return { ...topic, progress: saved || { status: claimedSkills.has(topic.id) ? 'needs_practice' : 'not_started', mastery: 0, problemsSolved: 0 }, requiresDiagnostic: claimedSkills.has(topic.id) && !saved?.diagnosticScore };
    });
    res.json({ success: true, data: { topics }, message: 'DSA roadmap retrieved successfully.' });
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
