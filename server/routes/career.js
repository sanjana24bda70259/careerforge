import { Router } from 'express';
import { CareerRecord } from '../models/CareerRecord.js';

const router = Router();
const allowedTypes = new Set(['project', 'job', 'resume', 'interview', 'aptitude_attempt', 'mock_attempt', 'notification', 'weekly_review']);

router.get('/:type', async (req, res, next) => {
  try {
    if (!allowedTypes.has(req.params.type)) return res.status(404).json({ success: false, error: 'Unknown record type', message: 'This career record type is not supported.' });
    const records = await CareerRecord.find({ userId: req.user.id, type: req.params.type }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: { records }, message: `${req.params.type} records retrieved successfully.` });
  } catch (error) { next(error); }
});
router.post('/:type', async (req, res, next) => {
  try {
    if (!allowedTypes.has(req.params.type) || !req.body.data || typeof req.body.data !== 'object') return res.status(400).json({ success: false, error: 'Invalid record', message: 'Provide a supported record type and data object.' });
    const record = await CareerRecord.create({ userId: req.user.id, type: req.params.type, data: req.body.data });
    res.status(201).json({ success: true, data: { record }, message: 'Record created successfully.' });
  } catch (error) { next(error); }
});
router.patch('/:type/:id', async (req, res, next) => {
  try {
    const record = await CareerRecord.findOneAndUpdate({ _id: req.params.id, userId: req.user.id, type: req.params.type }, { data: req.body.data }, { new: true });
    if (!record) return res.status(404).json({ success: false, error: 'Record not found', message: 'This record does not exist.' });
    res.json({ success: true, data: { record }, message: 'Record updated successfully.' });
  } catch (error) { next(error); }
});
router.delete('/:type/:id', async (req, res, next) => {
  try {
    if (!allowedTypes.has(req.params.type)) return res.status(404).json({ success: false, error: 'Unknown record type', message: 'This career record type is not supported.' });
    const record = await CareerRecord.findOneAndDelete({ _id: req.params.id, userId: req.user.id, type: req.params.type });
    if (!record) return res.status(404).json({ success: false, error: 'Record not found', message: 'This record does not exist.' });
    res.json({ success: true, data: { id: String(record._id) }, message: 'Record deleted successfully.' });
  } catch (error) { next(error); }
});
export default router;
