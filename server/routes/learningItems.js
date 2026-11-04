import { Router } from 'express';
import mongoose from 'mongoose';
import { LearningItem, LearningAttempt } from '../models/LearningItem.js';
import { Mistake } from '../models/Mistake.js';
import { DsaResourceProgress } from '../models/DsaResourceProgress.js';
import { FormulaBookmark } from '../models/FormulaBookmark.js';
import { AptitudeQuestionBookmark } from '../models/AptitudeQuestionBookmark.js';
import { CsTopicProgress } from '../models/CsTopicProgress.js';
import { recordSkillEvidence } from '../services/skillGraphService.js';
import { learningItem, publicItem, mistakeLearningItem } from '../services/learningItems.js';
import { requestDate, addStudyDays, nextReview } from '../services/studyDate.js';

const router = Router();
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const resolveItem = async (key, userId) => {
  if (!key.startsWith('mistake:')) return learningItem(key);
  const id = key.slice(8);
  if (!mongoose.isValidObjectId(id)) return null;
  const mistake = await Mistake.findOne({ _id: id, userId }).lean();
  return mistake ? mistakeLearningItem(mistake) : null;
};
router.get('/', async (req, res, next) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.collection === 'revision') filter.revisionSelected = true;
    const records = await LearningItem.find(filter).sort({ dueDate: 1, updatedAt: -1 }).lean();
    const merged = new Map();
    if (req.query.collection !== 'revision') {
      const [sheets, formulas, questions] = await Promise.all([
        DsaResourceProgress.find({ userId: req.user.id, bookmarked: true }).lean(),
        FormulaBookmark.find({ userId: req.user.id }).lean(), AptitudeQuestionBookmark.find({ userId: req.user.id }).lean()
      ]);
      for (const key of [...sheets.map(item => `sheet:${item.resourceId}`), ...formulas.map(item => `formula:${item.formulaId}`), ...questions.map(item => `aptitude:advanced:${item.questionId}`)]) merged.set(key, { key, bookmarked: true });
    }
    for (const record of records) merged.set(record.key, record);
    const items = (await Promise.all([...merged.values()].filter(record => req.query.collection !== 'bookmarks' || record.bookmarked).map(async record => { const content = publicItem(await resolveItem(record.key, req.user.id)); return content ? { ...content, ...record } : null; }))).filter(Boolean);
    res.json({ success: true, data: { items, dateKey: requestDate(req) } });
  } catch (error) { next(error); }
});
router.get('/:key', async (req, res, next) => {
  try {
    const content = await resolveItem(req.params.key, req.user.id);
    if (!content) return fail(res, 'This learning item was not found.', 404);
    const saved = await LearningItem.findOne({ userId: req.user.id, key: content.key }).lean();
    res.json({ success: true, data: { item: { ...publicItem(content), ...saved } } });
  } catch (error) { next(error); }
});
router.put('/:key', async (req, res, next) => {
  try {
    const content = await resolveItem(req.params.key, req.user.id);
    if (!content) return fail(res, 'This learning item was not found.', 404);
    const update = {};
    if ('practised' in req.body) {
      if (!content.key.startsWith('dsa:') || typeof req.body.practised !== 'boolean') return fail(res, 'Practice checkmarks require a DSA question and a boolean value.');
      update.practised = req.body.practised;
    }
    if (typeof req.body.bookmarked === 'boolean') update.bookmarked = req.body.bookmarked;
    if (typeof req.body.revisionSelected === 'boolean') {
      update.revisionSelected = req.body.revisionSelected;
      if (update.revisionSelected) {
        const existing = await LearningItem.findOne({ userId: req.user.id, key: content.key }).lean();
        if (!existing?.revisionSelected) { update.dueDate = addStudyDays(requestDate(req), 1); update.reviewStage = 0; }
      } else update.dueDate = null;
    }
    if (!Object.keys(update).length) return fail(res, 'Choose bookmark, future revision or a DSA practice checkmark.');
    const item = await LearningItem.findOneAndUpdate({ userId: req.user.id, key: content.key }, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true });
    if ('bookmarked' in update) {
      if (content.key.startsWith('sheet:')) await DsaResourceProgress.findOneAndUpdate({ userId: req.user.id, resourceId: content.key.slice(6), resourceType: 'cheatsheet' }, { $set: { bookmarked: update.bookmarked } }, { upsert: true });
      for (const [prefix, model, field] of [['formula:', FormulaBookmark, 'formulaId'], ['aptitude:advanced:', AptitudeQuestionBookmark, 'questionId']]) {
        if (!content.key.startsWith(prefix)) continue;
        const filter = { userId: req.user.id, [field]: content.key.slice(prefix.length) };
        if (update.bookmarked) await model.findOneAndUpdate(filter, { $setOnInsert: filter }, { upsert: true });
        else await model.deleteOne(filter);
      }
    }
    res.json({ success: true, data: { item: { ...publicItem(content), ...item.toObject() } } });
  } catch (error) { if (error.code === 11000) return fail(res, 'This item changed. Please try again.', 409); next(error); }
});
router.post('/:key/mistake', async (req, res, next) => {
  try {
    const content = await resolveItem(req.params.key, req.user.id);
    if (!content) return fail(res, 'This learning item was not found.', 404);
    if (content.key.startsWith('mistake:')) return fail(res, 'This item is already in your Mistake Notebook. Edit its note there.');
    const reasons = ['Concept Gap', 'Calculation Error', 'Forgot Formula', 'Coding Bug', 'Misread Question', 'Time Pressure', 'Other'];
    const mistake = await Mistake.findOneAndUpdate({ userId: req.user.id, learningKey: content.key }, { $set: {
      source: content.domain, questionId: content.key.slice(0, 180), question: content.prompt.slice(0, 3000), topic: content.topic,
      reason: reasons.includes(req.body.reason) ? req.body.reason : 'Concept Gap', note: String(req.body.note || '').slice(0, 3000),
      userAnswer: String(req.body.userAnswer || '').slice(0, 3000),
      correctAnswer: (content.options?.[content.correctAnswer] || content.explanation || '').slice(0, 3000), resolvedAt: null
    } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await LearningItem.findOneAndUpdate({ userId: req.user.id, key: content.key }, { $set: { mistakeId: mistake._id } }, { upsert: true });
    res.json({ success: true, data: { mistake } });
  } catch (error) { next(error); }
});
router.post('/:key/answer', async (req, res, next) => {
  try {
    const item = learningItem(req.params.key);
    if (!item?.options || !Number.isInteger(req.body.answer) || req.body.answer < 0 || req.body.answer >= item.options.length) return fail(res, 'Choose an answer for this question.');
    const correct = req.body.answer === item.correctAnswer;
    await LearningAttempt.create({ userId: req.user.id, key: item.key, dateKey: requestDate(req), answer: req.body.answer, correct });
    await recordSkillEvidence({ userId: req.user.id, skillId: `${item.domain}:${item.topic}`, label: item.topic.replaceAll('-', ' '), domain: item.domain, attempted: 1, correct: Number(correct), incorrect: Number(!correct) });
    if (item.domain === 'cs') {
      const [subjectId, topicId] = item.topic.split(':');
      await CsTopicProgress.findOneAndUpdate({ userId: req.user.id, subjectId, topicId }, { $inc: { quizAttempts: 1, quizCorrect: Number(correct), quizTotal: 1 }, $set: { lastQuizAt: new Date() } }, { upsert: true });
    }
    res.json({ success: true, data: { correct, correctAnswer: item.correctAnswer, explanation: item.explanation } });
  } catch (error) { next(error); }
});
router.post('/:key/reveal', async (req, res) => {
  try {
    const item = await resolveItem(req.params.key, req.user.id);
    if (!item) return fail(res, 'This learning item was not found.', 404);
    res.json({ success: true, data: { correctAnswer: item.correctAnswer, explanation: item.explanation } });
  } catch { return fail(res, 'Unable to load recall notes. Please retry.', 500); }
});
router.post('/:key/review', async (req, res, next) => {
  try {
    if (typeof req.body.recalled !== 'boolean') return fail(res, 'Record whether you recalled this item.');
    const dateKey = requestDate(req);
    const item = await LearningItem.findOne({ userId: req.user.id, key: req.params.key, revisionSelected: true });
    if (!item) return fail(res, 'Select this item for future revision first.', 404);
    if (item.dueDate > dateKey) return fail(res, 'This revision is already scheduled for a future day.', 409);
    const updated = await LearningItem.findOneAndUpdate({ _id: item._id, userId: req.user.id, revisionSelected: true, dueDate: item.dueDate, reviewCount: item.reviewCount }, {
      $set: { ...nextReview(dateKey, item.reviewStage, req.body.recalled), lastReviewedDate: dateKey }, $inc: { reviewCount: 1 }
    }, { new: true });
    if (!updated) return fail(res, 'This revision was already updated. Refresh the list.', 409);
    res.json({ success: true, data: { item: updated } });
  } catch (error) { next(error); }
});
export default router;
