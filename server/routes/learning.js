import { Router } from 'express';
import mongoose from 'mongoose';
import { AptitudeAttempt } from '../models/AptitudeAttempt.js';
import { AptitudeQuestionBookmark } from '../models/AptitudeQuestionBookmark.js';
import { FormulaBookmark } from '../models/FormulaBookmark.js';
import { aptitudeCategories, aptitudeQuestions, aptitudeTopics, formulaCatalog } from '../services/aptitudeCatalog.js';
import { advancedCategories, advancedMocks, advancedQuestionById, advancedTopics, questionsForAdvancedTopic, questionsForDailyChallenge, questionsForMock } from '../services/advancedAptitudeCatalog.js';
import { companies } from '../services/learningCatalog.js';
import { recordSkillEvidence, scheduleRevision } from '../services/skillGraphService.js';
import { CsTopicProgress } from '../models/CsTopicProgress.js';
import { CsQuizAttempt } from '../models/CsQuizAttempt.js';
import { csFundamentals, csSubjectById, csTopicById, withoutQuizAnswers } from '../services/csFundamentalsCatalog.js';

const router = Router();
const foundationTopic = id => aptitudeTopics.find(topic => topic.id === id);
const advancedTopic = id => advancedTopics.find(topic => topic.id === id);
const withoutAnswer = ({ correctAnswer, ...question }) => question;
const foundationFilter = userId => ({ userId, track: { $in: ['foundation', null] } });
const advancedFilter = userId => ({ userId, track: 'advanced' });
const progressFor = attempts => attempts.reduce((all, attempt) => {
  const current = all.get(attempt.topicId) || { attempted: 0, correct: 0, testsCompleted: 0 };
  current.attempted += attempt.attempted; current.correct += attempt.correct; current.testsCompleted += 1;
  all.set(attempt.topicId, current); return all;
}, new Map());
const totalsFor = attempts => attempts.reduce((total, attempt) => ({ attempted: total.attempted + attempt.attempted, correct: total.correct + attempt.correct, testsCompleted: total.testsCompleted + 1 }), { attempted: 0, correct: 0, testsCompleted: 0 });
const finaliseTotals = totals => ({ ...totals, accuracy: totals.attempted ? Math.round((totals.correct / totals.attempted) * 100) : null });
const questionSetForAttempt = ({ track, topicId, testType, assessmentId }) => {
  if (track !== 'advanced') return foundationTopic(topicId) ? aptitudeQuestions[topicId] : null;
  if (testType === 'mock') return questionsForMock(topicId);
  if (testType === 'daily_challenge') {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(assessmentId || '') ? new Date(`${assessmentId}T00:00:00.000Z`) : new Date();
    return questionsForDailyChallenge(date);
  }
  return questionsForAdvancedTopic(topicId);
};
const safeDuration = value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 86400 ? Math.round(Number(value)) : null;
const csProgressView = progress => ({
  learned: Boolean(progress?.learnedAt), learnedAt: progress?.learnedAt || null,
  revisedAt: progress?.revisedAt || null, revisionCount: progress?.revisionCount || 0,
  quizAttempts: progress?.quizAttempts || 0,
  quizAccuracy: progress?.quizTotal ? Math.round(progress.quizCorrect / progress.quizTotal * 100) : null,
  lastQuizAt: progress?.lastQuizAt || null
});
const scoreAttempt = (questions, rawAnswers) => {
  const answersByQuestion = new Map((Array.isArray(rawAnswers) ? rawAnswers : []).filter(answer => typeof answer?.questionId === 'string').map(answer => [answer.questionId, Number.isInteger(answer.answer) && answer.answer >= 0 && answer.answer < 4 ? answer.answer : null]));
  const submitted = new Map((Array.isArray(rawAnswers) ? rawAnswers : []).filter(answer => typeof answer?.questionId === 'string').map(answer => [answer.questionId, safeDuration(answer.timeTakenSeconds)]));
  const answers = questions.map(question => ({ questionId: question.id, answer: answersByQuestion.get(question.id) ?? null, timeTakenSeconds: submitted.get(question.id) ?? null }));
  const attempted = answers.filter(answer => Number.isInteger(answer.answer)).length;
  const correct = answers.filter(answer => questions.find(question => question.id === answer.questionId)?.correctAnswer === answer.answer).length;
  return { answers, attempted, correct, incorrect: attempted - correct, unanswered: questions.length - attempted, accuracy: attempted ? Math.round((correct / attempted) * 100) : null, score: correct };
};
const questionSetForStoredAttempt = attempt => {
  const track = attempt.track || 'foundation';
  if (track !== 'advanced') return aptitudeQuestions[attempt.topicId] || null;
  if (attempt.testType === 'mock') return questionsForMock(attempt.topicId);
  if (attempt.testType === 'daily_challenge') return (attempt.questionIds || []).map(advancedQuestionById).filter(Boolean);
  return questionsForAdvancedTopic(attempt.topicId);
};
const attemptResponse = (attempt, topic, questions) => {
  const sections = attempt.testType === 'mock' ? questions.reduce((all, question) => {
    const section = question.section || 'Other'; const answer = attempt.answers.find(item => item.questionId === question.id)?.answer;
    const current = all[section] || { total: 0, correct: 0 };
    current.total += 1; if (answer === question.correctAnswer) current.correct += 1; all[section] = current; return all;
  }, {}) : null;
  return {
  id: String(attempt._id || attempt.id), topic, track: attempt.track || 'foundation', testType: attempt.testType || 'topic', category: attempt.category || null,
  attempted: attempt.attempted, correct: attempt.correct, incorrect: attempt.incorrect, unanswered: attempt.unanswered,
  accuracy: attempt.accuracy, score: attempt.score, total: questions.length, mode: attempt.mode || 'practice', timeTakenSeconds: attempt.timeTakenSeconds ?? null, submittedAt: attempt.submittedAt || attempt.createdAt,
  sections
};
};

router.get('/aptitude', async (req, res, next) => {
  try {
    const attempts = await AptitudeAttempt.find(foundationFilter(req.user.id)).lean(); const progressByTopic = progressFor(attempts);
    const categories = aptitudeCategories.map(category => ({ ...category, topics: category.topics.map(topic => {
      const progress = progressByTopic.get(topic.id) || { attempted: 0, correct: 0, testsCompleted: 0 };
      return { ...topic, questionCount: aptitudeQuestions[topic.id].length, progress: { ...progress, incorrect: progress.attempted - progress.correct, accuracy: progress.attempted ? Math.round(progress.correct / progress.attempted * 100) : null } };
    }) }));
    res.json({ success: true, data: { categories, totals: finaliseTotals(totalsFor(attempts)), topicsPracticed: progressByTopic.size }, message: 'Foundation aptitude topics retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/aptitude/progress', async (req, res, next) => {
  try { res.json({ success: true, data: finaliseTotals(totalsFor(await AptitudeAttempt.find(foundationFilter(req.user.id)).lean())), message: 'Foundation aptitude progress retrieved successfully.' }); } catch (error) { next(error); }
});

router.get('/aptitude/advanced', async (req, res, next) => {
  try {
    const attempts = await AptitudeAttempt.find(advancedFilter(req.user.id)).lean(); const byTopic = progressFor(attempts); const totals = finaliseTotals(totalsFor(attempts));
    const categories = advancedCategories.map(category => ({ ...category, topics: category.topics.map(topic => {
      const progress = byTopic.get(topic.id) || { attempted: 0, correct: 0, testsCompleted: 0 };
      return { ...topic, questionCount: questionsForAdvancedTopic(topic.id)?.length || 0, progress: { ...progress, accuracy: progress.attempted ? Math.round(progress.correct / progress.attempted * 100) : null } };
    }) }));
    const topicInsights = [...byTopic.entries()].map(([topicId, progress]) => ({ topic: advancedTopic(topicId)?.name || topicId, topicId, attempted: progress.attempted, accuracy: progress.attempted ? Math.round(progress.correct / progress.attempted * 100) : null })).filter(item => item.attempted >= 10 && item.accuracy !== null);
    const insights = topicInsights.length >= 2 ? { strong: topicInsights.filter(item => item.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy), needsPractice: topicInsights.filter(item => item.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy) } : null;
    res.json({ success: true, data: { categories, totals, mockTestsCompleted: attempts.filter(attempt => attempt.testType === 'mock').length, insights, daily: { id: new Date().toISOString().slice(0, 10), questionCount: 3, estimatedMinutes: 8 } }, message: 'Advanced aptitude retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/aptitude/advanced/daily', (req, res) => {
  const date = new Date(); const questions = questionsForDailyChallenge(date);
  res.json({ success: true, data: { id: date.toISOString().slice(0, 10), title: "Today's Placement Challenge", topic: { id: 'daily-challenge', name: "Today's Placement Challenge" }, mode: 'timed', durationSeconds: 480, questions: questions.map(withoutAnswer) }, message: 'Today’s challenge retrieved successfully.' });
});
router.get('/aptitude/advanced/mocks', (req, res) => res.json({ success: true, data: { mocks: advancedMocks.map(mock => ({ ...mock, questionCount: 30, sections: { quantitative: 10, logicalReasoning: 10, verbal: 10 } })) }, message: 'Placement mocks retrieved successfully.' }));
router.get('/aptitude/advanced/mocks/:mockId', (req, res) => {
  const mock = advancedMocks.find(item => item.id === req.params.mockId); const questions = questionsForMock(req.params.mockId);
  if (!mock || !questions) return res.status(404).json({ success: false, error: 'Mock not found', message: 'The requested mock test does not exist.' });
  res.json({ success: true, data: { mock, topic: { id: mock.id, name: mock.name }, mode: 'timed', durationSeconds: mock.durationMinutes * 60, questions: questions.map(withoutAnswer) }, message: 'Placement mock retrieved successfully.' });
});
router.get('/aptitude/advanced/saved-questions', async (req, res, next) => {
  try { const bookmarks = await AptitudeQuestionBookmark.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(); const questions = bookmarks.map(bookmark => advancedQuestionById(bookmark.questionId)).filter(Boolean).map(question => ({ ...withoutAnswer(question), saved: true })); res.json({ success: true, data: { questions }, message: 'Saved advanced questions retrieved successfully.' }); } catch (error) { next(error); }
});
router.post('/aptitude/advanced/questions/:questionId/bookmark', async (req, res, next) => {
  try { if (!advancedQuestionById(req.params.questionId)) return res.status(404).json({ success: false, error: 'Question not found', message: 'The requested advanced question does not exist.' }); const bookmark = await AptitudeQuestionBookmark.findOneAndUpdate({ userId: req.user.id, questionId: req.params.questionId }, { $setOnInsert: { userId: req.user.id, questionId: req.params.questionId, track: 'advanced' } }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ success: true, data: { bookmark: { id: bookmark.id, questionId: bookmark.questionId } }, message: 'Question saved successfully.' }); } catch (error) { next(error); }
});
router.delete('/aptitude/advanced/questions/:questionId/bookmark', async (req, res, next) => {
  try { await AptitudeQuestionBookmark.deleteOne({ userId: req.user.id, questionId: req.params.questionId }); res.json({ success: true, data: {}, message: 'Question bookmark removed.' }); } catch (error) { next(error); }
});
router.get('/aptitude/advanced/mistakes', async (req, res, next) => {
  try {
    const attempts = await AptitudeAttempt.find({ ...advancedFilter(req.user.id), incorrect: { $gt: 0 } }).sort({ submittedAt: -1, createdAt: -1 }).lean(); const seen = new Set(); const mistakes = [];
    for (const attempt of attempts) {
      const source = questionSetForStoredAttempt(attempt) || []; const answers = new Map(attempt.answers.map(answer => [answer.questionId, answer.answer]));
      for (const question of source) if (answers.get(question.id) !== null && answers.get(question.id) !== undefined && answers.get(question.id) !== question.correctAnswer && !seen.has(question.id)) { seen.add(question.id); mistakes.push({ ...question, selectedAnswer: answers.get(question.id), attemptId: String(attempt._id), submittedAt: attempt.submittedAt || attempt.createdAt }); }
    }
    res.json({ success: true, data: { mistakes }, message: 'Mistake book retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/aptitude/advanced/:topic/questions', (req, res) => {
  const topic = advancedTopic(req.params.topic); const questions = questionsForAdvancedTopic(req.params.topic);
  if (!topic || !questions) return res.status(404).json({ success: false, error: 'Topic not found', message: 'Invalid advanced aptitude topic.' });
  const mode = req.query.mode === 'timed' ? 'timed' : 'practice'; const durationSeconds = mode === 'timed' ? questions.reduce((sum, question) => sum + question.estimatedTimeSeconds, 0) : null;
  res.json({ success: true, data: { topic, mode, durationSeconds, questions: questions.map(withoutAnswer) }, message: 'Advanced practice questions retrieved successfully.' });
});

router.get('/aptitude/formulas', async (req, res, next) => {
  try { const saved = await FormulaBookmark.find({ userId: req.user.id }).lean(); const ids = new Set(saved.map(item => item.formulaId)); res.json({ success: true, data: { formulas: formulaCatalog.map(formula => ({ ...formula, saved: ids.has(formula.id) })) }, message: 'Formula hub retrieved successfully.' }); } catch (error) { next(error); }
});
router.get('/aptitude/formulas/bookmarks', async (req, res, next) => {
  try { const bookmarks = await FormulaBookmark.find({ userId: req.user.id }).lean(); const ids = new Set(bookmarks.map(item => item.formulaId)); res.json({ success: true, data: { formulas: formulaCatalog.filter(formula => ids.has(formula.id)) }, message: 'Saved formulas retrieved successfully.' }); } catch (error) { next(error); }
});
router.post('/aptitude/formulas/:formulaId/bookmark', async (req, res, next) => {
  try { if (!formulaCatalog.some(formula => formula.id === req.params.formulaId)) return res.status(404).json({ success: false, error: 'Formula not found', message: 'The requested formula does not exist.' }); const bookmark = await FormulaBookmark.findOneAndUpdate({ userId: req.user.id, formulaId: req.params.formulaId }, { $setOnInsert: { userId: req.user.id, formulaId: req.params.formulaId } }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ success: true, data: { bookmark }, message: 'Formula saved successfully.' }); } catch (error) { next(error); }
});
router.delete('/aptitude/formulas/:formulaId/bookmark', async (req, res, next) => {
  try { await FormulaBookmark.deleteOne({ userId: req.user.id, formulaId: req.params.formulaId }); res.json({ success: true, data: {}, message: 'Formula bookmark removed.' }); } catch (error) { next(error); }
});
router.get('/aptitude/:topic/questions', (req, res) => {
  const topic = foundationTopic(req.params.topic);
  if (!topic) return res.status(404).json({ success: false, error: 'Topic not found', message: 'Invalid aptitude topic.' });
  res.json({ success: true, data: { topic, questions: aptitudeQuestions[topic.id].map(withoutAnswer) }, message: 'Foundation practice questions retrieved successfully.' });
});
router.post('/aptitude/attempt', async (req, res, next) => {
  try {
    const track = req.body.track === 'advanced' ? 'advanced' : 'foundation'; const testType = track === 'advanced' && ['daily_challenge', 'mock'].includes(req.body.testType) ? req.body.testType : 'topic'; const topicId = String(req.body.topic || '');
    const topic = track === 'advanced' ? (testType === 'mock' ? advancedMocks.find(mock => mock.id === topicId) : testType === 'daily_challenge' ? { id: 'daily-challenge', name: "Today's Placement Challenge" } : advancedTopic(topicId)) : foundationTopic(topicId); const questions = questionSetForAttempt({ track, topicId, testType, assessmentId: req.body.assessmentId });
    if (!topic || !questions || !Array.isArray(req.body.answers)) return res.status(400).json({ success: false, error: 'Invalid attempt', message: 'Submit answers for an available aptitude assessment.' });
    const scoring = scoreAttempt(questions, req.body.answers); const submittedAt = new Date();
    const attempt = await AptitudeAttempt.create({ userId: req.user.id, track, testType, topicId, category: track === 'advanced' && testType === 'topic' ? topic.group : null, mode: req.body.mode === 'timed' ? 'timed' : 'practice', questionIds: questions.map(question => question.id), ...scoring, startedAt: req.body.startedAt && !Number.isNaN(Date.parse(req.body.startedAt)) ? new Date(req.body.startedAt) : null, submittedAt, timeTakenSeconds: safeDuration(req.body.timeTakenSeconds) });
    const answersByQuestion = new Map(scoring.answers.map(answer => [answer.questionId, answer]));
    const topicLabel = topic.name || topicId;
    await recordSkillEvidence({
      userId: req.user.id, skillId: `aptitude:${topicId}`, label: topicLabel, domain: 'aptitude',
      attempted: scoring.attempted, correct: scoring.correct, incorrect: scoring.incorrect, timeTakenSeconds: attempt.timeTakenSeconds || 0
    });
    const evidenceTasks = [];
    for (const question of questions) {
      const submitted = answersByQuestion.get(question.id);
      if (!Number.isInteger(submitted?.answer)) continue;
      const correct = submitted.answer === question.correctAnswer;
      const focusId = question.formulaIds?.[0] || question.formulaId || topicId;
      const focusLabel = question.tags?.[0] || question.formulaIds?.[0] || question.formulaId || topicLabel;
      evidenceTasks.push(recordSkillEvidence({
        userId: req.user.id, skillId: `aptitude:${focusId}`, label: focusLabel, domain: 'aptitude',
        attempted: 1, correct: correct ? 1 : 0, incorrect: correct ? 0 : 1, timeTakenSeconds: submitted.timeTakenSeconds || 0
      }));
      if (!correct) evidenceTasks.push(scheduleRevision({
        userId: req.user.id, skillId: `aptitude:${focusId}`, label: focusLabel, domain: 'aptitude', sourceType: 'aptitude_question', sourceId: question.id,
        prompt: question.question || question.text || `Review ${focusLabel} before retrying this aptitude question.`, dueInDays: 1
      }));
    }
    await Promise.all(evidenceTasks);
    res.status(201).json({ success: true, data: { attempt: attemptResponse(attempt, topic, questions) }, message: 'Aptitude attempt submitted and scored successfully.' });
  } catch (error) { next(error); }
});
router.get('/aptitude/attempts/:attemptId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.attemptId)) return res.status(404).json({ success: false, error: 'Attempt not found', message: 'The requested attempt does not exist.' });
    const attempt = await AptitudeAttempt.findOne({ _id: req.params.attemptId, userId: req.user.id }).lean(); const questions = attempt && questionSetForStoredAttempt(attempt); const track = attempt?.track || 'foundation';
    const topic = attempt && (track === 'advanced' ? (attempt.testType === 'mock' ? advancedMocks.find(mock => mock.id === attempt.topicId) : attempt.testType === 'daily_challenge' ? { id: 'daily-challenge', name: "Today's Placement Challenge" } : advancedTopic(attempt.topicId)) : foundationTopic(attempt.topicId));
    if (!attempt || !topic || !questions) return res.status(404).json({ success: false, error: 'Attempt not found', message: 'The requested attempt does not exist.' });
    const answers = new Map(attempt.answers.map(answer => [answer.questionId, answer])); const review = questions.map(question => ({ ...withoutAnswer(question), selectedAnswer: answers.get(question.id)?.answer ?? null, timeTakenSeconds: answers.get(question.id)?.timeTakenSeconds ?? null, correctAnswer: question.correctAnswer }));
    res.json({ success: true, data: { attempt: attemptResponse(attempt, topic, questions), review }, message: 'Attempt review retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/cs', async (req, res, next) => {
  try {
    const progress = await CsTopicProgress.find({ userId: req.user.id }).lean();
    const byKey = new Map(progress.map(item => [`${item.subjectId}:${item.topicId}`, item]));
    const subjects = csFundamentals.map(subject => ({
      id: subject.id, name: subject.name, description: subject.description, topicCount: subject.topics.length,
      learnedCount: subject.topics.filter(item => byKey.get(`${subject.id}:${item.id}`)?.learnedAt).length,
      quizAttempts: subject.topics.reduce((sum, item) => sum + (byKey.get(`${subject.id}:${item.id}`)?.quizAttempts || 0), 0),
      topics: subject.topics.map(item => ({ id: item.id, title: item.title, progress: csProgressView(byKey.get(`${subject.id}:${item.id}`)) }))
    }));
    res.json({ success: true, data: { subjects }, message: 'CS Fundamentals retrieved successfully.' });
  } catch (error) { next(error); }
});

router.get('/cs/:subjectId', async (req, res, next) => {
  try {
    const subject = csSubjectById(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found', message: 'The requested CS Fundamentals subject does not exist.' });
    const progress = await CsTopicProgress.find({ userId: req.user.id, subjectId: subject.id }).lean();
    const byTopic = new Map(progress.map(item => [item.topicId, item]));
    const safeSubject = withoutQuizAnswers(subject);
    res.json({ success: true, data: { subject: { ...safeSubject, topics: safeSubject.topics.map(item => ({ ...item, progress: csProgressView(byTopic.get(item.id)) })) } }, message: `${subject.name} learning content retrieved successfully.` });
  } catch (error) { next(error); }
});

router.post('/cs/:subjectId/topics/:topicId/learn', async (req, res, next) => {
  try {
    const subject = csSubjectById(req.params.subjectId); const topicItem = csTopicById(req.params.subjectId, req.params.topicId);
    if (!subject || !topicItem) return res.status(404).json({ success: false, error: 'Topic not found', message: 'The requested CS Fundamentals topic does not exist.' });
    let progress = await CsTopicProgress.findOne({ userId: req.user.id, subjectId: subject.id, topicId: topicItem.id });
    const firstLearning = !progress?.learnedAt;
    if (!progress) progress = new CsTopicProgress({ userId: req.user.id, subjectId: subject.id, topicId: topicItem.id });
    progress.learnedAt = progress.learnedAt || new Date();
    await progress.save();
    if (firstLearning) await recordSkillEvidence({ userId: req.user.id, skillId: `cs:${subject.id}:${topicItem.id}`, label: `${subject.name}: ${topicItem.title}`, domain: 'cs', completed: 1 });
    res.json({ success: true, data: { progress: csProgressView(progress) }, message: firstLearning ? 'Learning progress recorded.' : 'This topic is already marked learned.' });
  } catch (error) { next(error); }
});

router.post('/cs/:subjectId/topics/:topicId/revised', async (req, res, next) => {
  try {
    const subject = csSubjectById(req.params.subjectId); const topicItem = csTopicById(req.params.subjectId, req.params.topicId);
    if (!subject || !topicItem) return res.status(404).json({ success: false, error: 'Topic not found', message: 'The requested CS Fundamentals topic does not exist.' });
    const progress = await CsTopicProgress.findOneAndUpdate(
      { userId: req.user.id, subjectId: subject.id, topicId: topicItem.id },
      { $set: { revisedAt: new Date() }, $inc: { revisionCount: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await scheduleRevision({ userId: req.user.id, skillId: `cs:${subject.id}:${topicItem.id}`, label: `${subject.name}: ${topicItem.title}`, domain: 'cs', sourceType: 'cs_revision', sourceId: `${subject.id}:${topicItem.id}`, prompt: `Review ${topicItem.title} and explain its key tradeoffs.`, dueInDays: 7 });
    res.json({ success: true, data: { progress: csProgressView(progress) }, message: 'Revision recorded. It does not change your quiz results.' });
  } catch (error) { next(error); }
});

router.post('/cs/:subjectId/topics/:topicId/quiz', async (req, res, next) => {
  try {
    const subject = csSubjectById(req.params.subjectId); const topicItem = csTopicById(req.params.subjectId, req.params.topicId);
    if (!subject || !topicItem || !Array.isArray(req.body?.answers)) return res.status(400).json({ success: false, error: 'Invalid quiz submission', message: 'Submit answers for an available CS Fundamentals topic.' });
    const answersByQuestion = new Map(req.body.answers.filter(answer => typeof answer?.questionId === 'string').map(answer => [answer.questionId, Number.isInteger(answer.answer) ? answer.answer : null]));
    const answers = topicItem.quiz.map(question => ({ questionId: question.id, answer: answersByQuestion.get(question.id) ?? null }));
    const attempted = answers.filter(answer => Number.isInteger(answer.answer)).length;
    const correct = answers.filter(answer => topicItem.quiz.find(question => question.id === answer.questionId)?.correctAnswer === answer.answer).length;
    const incorrect = attempted - correct;
    const quizAttempt = await CsQuizAttempt.create({ userId: req.user.id, subjectId: subject.id, topicId: topicItem.id, answers, attempted, correct, incorrect });
    const progress = await CsTopicProgress.findOneAndUpdate(
      { userId: req.user.id, subjectId: subject.id, topicId: topicItem.id },
      { $set: { lastQuizAt: new Date() }, $inc: { quizAttempts: 1, quizCorrect: correct, quizTotal: attempted } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await recordSkillEvidence({ userId: req.user.id, skillId: `cs:${subject.id}:${topicItem.id}`, label: `${subject.name}: ${topicItem.title}`, domain: 'cs', attempted, correct, incorrect });
    if (incorrect) await scheduleRevision({ userId: req.user.id, skillId: `cs:${subject.id}:${topicItem.id}`, label: `${subject.name}: ${topicItem.title}`, domain: 'cs', sourceType: 'cs_quiz', sourceId: `${subject.id}:${topicItem.id}`, prompt: `Review the missed ${topicItem.title} quiz concepts before another attempt.`, dueInDays: 1 });
    const review = topicItem.quiz.map(question => ({ id: question.id, prompt: question.prompt, options: question.options, selectedAnswer: answersByQuestion.get(question.id) ?? null, correctAnswer: question.correctAnswer, explanation: question.explanation }));
    res.status(201).json({ success: true, data: { attempt: { id: String(quizAttempt._id), attempted, correct, incorrect, total: topicItem.quiz.length }, progress: csProgressView(progress), review }, message: 'CS quiz submitted and scored successfully.' });
  } catch (error) { next(error); }
});
router.get('/companies', (_, res) => res.json({ success: true, data: { companies }, message: 'Companies retrieved successfully.' }));
router.get('/resources', (_, res) => res.json({ success: true, data: { resources: [] }, message: 'Resources retrieved successfully. Add verified resources through the admin workflow.' }));
export default router;
