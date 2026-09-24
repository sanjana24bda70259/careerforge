import mongoose from 'mongoose';
import { Router } from 'express';
import { Mistake } from '../models/Mistake.js';

const router = Router();
const sources = new Set(['dsa', 'aptitude', 'sql', 'cs', 'mock']);
const reasons = new Set(['Concept Gap', 'Calculation Error', 'Forgot Formula', 'Coding Bug', 'Misread Question', 'Time Pressure', 'Other']);
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

router.get('/', async (req, res, next) => {
  try {
    const source = sources.has(req.query.source) ? req.query.source : null;
    const mistakes = await Mistake.find({ userId: req.user.id, ...(source ? { source } : {}) }).sort({ occurredAt: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: { mistakes }, message: 'Mistake Notebook retrieved successfully.' });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const source = req.body?.source;
    const question = text(req.body?.question, 3000);
    const topic = text(req.body?.topic, 140);
    if (!sources.has(source) || !question || !topic) return res.status(400).json({ success: false, error: 'Invalid mistake', message: 'Choose a source, then provide the question and topic.' });
    const occurredAt = req.body?.occurredAt && !Number.isNaN(Date.parse(req.body.occurredAt)) ? new Date(req.body.occurredAt) : new Date();
    const mistake = await Mistake.create({
      userId: req.user.id, source, questionId: text(req.body.questionId, 180) || null, question, topic,
      category: text(req.body.category, 140) || null, userAnswer: text(req.body.userAnswer, 3000), correctAnswer: text(req.body.correctAnswer, 3000),
      reason: reasons.has(req.body.reason) ? req.body.reason : 'Other', note: text(req.body.note, 3000), occurredAt
    });
    res.status(201).json({ success: true, data: { mistake }, message: 'Mistake saved to your notebook.' });
  } catch (error) { next(error); }
});

router.patch('/:mistakeId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.mistakeId)) return res.status(404).json({ success: false, error: 'Mistake not found', message: 'This saved mistake does not exist.' });
    const update = {};
    if (typeof req.body?.reason === 'string' && reasons.has(req.body.reason)) update.reason = req.body.reason;
    if (typeof req.body?.note === 'string') update.note = text(req.body.note, 3000);
    if (typeof req.body?.category === 'string') update.category = text(req.body.category, 140) || null;
    const mistake = await Mistake.findOneAndUpdate({ _id: req.params.mistakeId, userId: req.user.id }, { $set: update }, { new: true });
    if (!mistake) return res.status(404).json({ success: false, error: 'Mistake not found', message: 'This saved mistake does not exist.' });
    res.json({ success: true, data: { mistake }, message: 'Mistake note updated.' });
  } catch (error) { next(error); }
});

router.delete('/:mistakeId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.mistakeId)) return res.status(404).json({ success: false, error: 'Mistake not found', message: 'This saved mistake does not exist.' });
    const mistake = await Mistake.findOneAndDelete({ _id: req.params.mistakeId, userId: req.user.id });
    if (!mistake) return res.status(404).json({ success: false, error: 'Mistake not found', message: 'This saved mistake does not exist.' });
    res.json({ success: true, data: {}, message: 'Mistake removed from your notebook.' });
  } catch (error) { next(error); }
});

export default router;
