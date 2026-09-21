import { Router } from 'express';
import { Revision } from '../models/Revision.js';
import { dsaProblems } from '../services/dsaCatalog.js';
import { completeRevision } from '../services/revisionService.js';
import { RevisionItem } from '../models/RevisionItem.js';
import { completeSkillRevision, dueSkillRevisions } from '../services/skillGraphService.js';

const router = Router();
router.get('/due', async (req, res, next) => {
  try {
    const [legacy, skill] = await Promise.all([
      Revision.find({ userId: req.user.id, dueAt: { $lte: new Date() } }).sort({ dueAt: 1 }),
      dueSkillRevisions(req.user.id)
    ]);
    const due = [
      ...skill.map(revision => ({ ...revision.toObject(), revisionKind: 'skill' })),
      ...legacy.map(revision => ({ ...revision.toObject(), revisionKind: 'legacy', problem: dsaProblems.find(problem => problem.id === revision.problemId) }))
    ].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    res.json({ success: true, data: { revisions: due }, message: 'Due revisions retrieved successfully.' });
  } catch (error) { next(error); }
});
router.post('/:revisionId/complete', async (req, res, next) => {
  try {
    const skillRevision = await RevisionItem.findOne({ _id: req.params.revisionId, userId: req.user.id });
    if (skillRevision) {
      const recalled = req.body?.recalled !== false;
      const updated = await completeSkillRevision(skillRevision, recalled);
      return res.json({ success: true, data: { revision: updated, revisionKind: 'skill' }, message: recalled ? 'Revision recorded; the next interval is scheduled.' : 'Revision recorded; this concept will return sooner.' });
    }
    const revision = await Revision.findOne({ _id: req.params.revisionId, userId: req.user.id });
    if (!revision) return res.status(404).json({ success: false, error: 'Revision not found', message: 'This revision does not exist.' });
    const updated = await completeRevision(revision);
    res.json({ success: true, data: { revision: updated, revisionKind: 'legacy' }, message: 'Revision completed and next review scheduled.' });
  } catch (error) { next(error); }
});
export default router;
