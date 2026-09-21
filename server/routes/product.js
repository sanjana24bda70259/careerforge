import { Router } from 'express';
import { CareerRecord } from '../models/CareerRecord.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { Revision } from '../models/Revision.js';
import { dsaTopics } from '../services/dsaCatalog.js';
import { companies } from '../services/learningCatalog.js';
import { buildCoachReply } from '../services/coachService.js';

const router = Router();
const mapping = {
  projects: 'project', jobs: 'job', resume: 'resume', interviews: 'interview',
  'mock-tests': 'mock_attempt', notifications: 'notification'
};
const recordType = (resource) => mapping[resource];

for (const resource of Object.keys(mapping)) {
  router.get(`/${resource}`, async (req, res, next) => {
    try {
      const records = await CareerRecord.find({ userId: req.user.id, type: recordType(resource) }).sort({ updatedAt: -1 }).lean();
      res.json({ success: true, data: { records }, message: `${resource} retrieved successfully.` });
    } catch (error) { next(error); }
  });
  router.post(`/${resource}`, async (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== 'object') return res.status(400).json({ success: false, error: 'Invalid request', message: 'A JSON record body is required.' });
      const record = await CareerRecord.create({ userId: req.user.id, type: recordType(resource), data: req.body });
      res.status(201).json({ success: true, data: { record }, message: `${resource.slice(0, -1)} created successfully.` });
    } catch (error) { next(error); }
  });
  router.patch(`/${resource}/:id`, async (req, res, next) => {
    try {
      const record = await CareerRecord.findOneAndUpdate({ _id: req.params.id, userId: req.user.id, type: recordType(resource) }, { data: req.body }, { new: true });
      if (!record) return res.status(404).json({ success: false, error: 'Record not found', message: 'The requested record does not exist.' });
      res.json({ success: true, data: { record }, message: `${resource.slice(0, -1)} updated successfully.` });
    } catch (error) { next(error); }
  });
  router.delete(`/${resource}/:id`, async (req, res, next) => {
    try {
      const record = await CareerRecord.findOneAndDelete({ _id: req.params.id, userId: req.user.id, type: recordType(resource) });
      if (!record) return res.status(404).json({ success: false, error: 'Record not found', message: 'The requested record does not exist.' });
      res.json({ success: true, data: {}, message: `${resource.slice(0, -1)} deleted successfully.` });
    } catch (error) { next(error); }
  });
}

router.get('/backlogs', async (req, res, next) => {
  try {
    const overdueRevisions = await Revision.find({ userId: req.user.id, dueAt: { $lte: new Date() } }).lean();
    const backlogs = overdueRevisions.map(item => ({ id: item.id, type: 'revision', priority: 'high', title: 'DSA revision due', dueAt: item.dueAt }));
    res.json({ success: true, data: { backlogs }, message: 'Backlogs retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/analytics', async (req, res, next) => {
  try {
    const [solved, attempted, jobRecords, interviews, mocks] = await Promise.all([
      ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' }),
      ProblemProgress.countDocuments({ userId: req.user.id, status: { $in: ['solved', 'attempted', 'needs_revision'] } }),
      CareerRecord.countDocuments({ userId: req.user.id, type: 'job' }),
      CareerRecord.countDocuments({ userId: req.user.id, type: 'interview' }),
      CareerRecord.countDocuments({ userId: req.user.id, type: 'mock_attempt' })
    ]);
    res.json({ success: true, data: { dsa: { solved, attempted, accuracy: null, accuracyNote: 'DSA completion is not treated as a scored accuracy value.' }, jobs: jobRecords, interviews, mockTests: mocks }, message: 'Analytics retrieved successfully.' });
  } catch (error) { next(error); }
});
router.get('/companies', (_, res) => res.json({ success: true, data: { companies }, message: 'Companies retrieved successfully.' }));
router.get('/resources', (_, res) => res.json({ success: true, data: { resources: [] }, message: 'No verified resources have been added yet.' }));
router.post('/ai/roadmap', async (req, res, next) => {
  try {
    const solved = await ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' });
    const nextTopics = dsaTopics.slice(Math.min(Math.floor(solved / 5), dsaTopics.length - 3), Math.min(Math.floor(solved / 5) + 3, dsaTopics.length)).map(topic => topic.name);
    const reply = buildCoachReply({ message: req.body.message || 'What should I do next?', profile: req.user.profile, stats: { solved } });
    res.json({ success: true, data: { ...reply, nextTopics, estimatedWeeks: Math.max(4, Math.ceil((dsaTopics.length * 6 - solved) / Math.max((req.user.profile.weeklyStudyHours || 8), 1))) }, message: 'Personalized roadmap generated successfully.' });
  } catch (error) { next(error); }
});
export default router;
