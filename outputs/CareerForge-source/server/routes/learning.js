import { Router } from 'express';
import { CareerRecord } from '../models/CareerRecord.js';
import { aptitudeCategories, aptitudeQuestions, companies, csTopics } from '../services/learningCatalog.js';

const router = Router();
router.get('/aptitude', async (req, res, next) => {
  try {
    const attempts = await CareerRecord.find({ userId: req.user.id, type: 'aptitude_attempt' }).lean();
    const byTopic = new Map(attempts.map(item => [item.data.topic, item.data]));
    const categories = aptitudeCategories.map(category => ({ ...category, topics: category.topics.map(topic => ({ name: topic, questionCount: aptitudeQuestions[topic]?.length || 0, progress: byTopic.get(topic) || { attempted: 0, accuracy: null } })) }));
    res.json({ success: true, data: { categories }, message: 'Aptitude topics retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/aptitude/:topic/questions', (req, res) => {
  const questions = aptitudeQuestions[req.params.topic];
  if (!questions) return res.status(404).json({ success: false, error: 'Questions unavailable', message: 'Practice questions for this topic are not available yet.' });
  res.json({ success: true, data: { questions: questions.map(({ answer, ...question }) => question) }, message: 'Practice questions retrieved successfully.' });
});
router.post('/aptitude/attempt', async (req, res, next) => {
  try {
    const { topic, answers } = req.body;
    const questions = aptitudeQuestions[topic];
    if (!questions || !Array.isArray(answers)) return res.status(400).json({ success: false, error: 'Invalid attempt', message: 'Submit answers for an available aptitude topic.' });
    const attemptedNow = answers.filter(answer => Number.isInteger(answer.answer)).length;
    const correctNow = answers.filter(answer => questions.find(question => question.id === answer.questionId)?.answer === answer.answer).length;
    const existing = await CareerRecord.findOne({ userId: req.user.id, type: 'aptitude_attempt', 'data.topic': topic });
    const attempted = (existing?.data?.attempted || 0) + attemptedNow;
    const correct = (existing?.data?.correct || 0) + correctNow;
    const record = await CareerRecord.findOneAndUpdate({ userId: req.user.id, type: 'aptitude_attempt', 'data.topic': topic }, { data: { topic, attempted, correct, incorrect: attempted - correct, accuracy: attempted ? Math.round((correct / attempted) * 100) : null, testsCompleted: (existing?.data?.testsCompleted || 0) + 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: { record }, message: 'Aptitude attempt saved successfully.' });
  } catch (error) { next(error); }
});
router.get('/cs', (_, res) => res.json({ success: true, data: { topics: csTopics }, message: 'CS fundamentals retrieved successfully.' }));
router.get('/companies', (_, res) => res.json({ success: true, data: { companies }, message: 'Companies retrieved successfully.' }));
router.get('/resources', (_, res) => res.json({ success: true, data: { resources: [] }, message: 'Resources retrieved successfully. Add verified resources through the admin workflow.' }));
export default router;
