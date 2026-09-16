import { Router } from 'express';
import { Revision } from '../models/Revision.js';
import { dsaProblems } from '../services/dsaCatalog.js';
import { completeRevision } from '../services/revisionService.js';

const router = Router();
router.get('/due', async (req, res, next) => {
  try {
    const revisions = await Revision.find({ userId: req.user.id, dueAt: { $lte: new Date() } }).sort({ dueAt: 1 });
    const due = revisions.map(revision => ({ ...revision.toObject(), problem: dsaProblems.find(problem => problem.id === revision.problemId) }));
    res.json({ success: true, data: { revisions: due }, message: 'Due revisions retrieved successfully.' });
  } catch (error) { next(error); }
});
router.post('/:revisionId/complete', async (req, res, next) => {
  try {
    const revision = await Revision.findOne({ _id: req.params.revisionId, userId: req.user.id });
    if (!revision) return res.status(404).json({ success: false, error: 'Revision not found', message: 'This revision does not exist.' });
    const updated = await completeRevision(revision);
    res.json({ success: true, data: { revision: updated }, message: 'Revision completed and next review scheduled.' });
  } catch (error) { next(error); }
});
export default router;
