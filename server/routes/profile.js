import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const allowed = ['name', 'college', 'degree', 'branch', 'graduationYear', 'targetRole', 'preferredLanguage', 'studyGoal', 'weeklyStudyHours', 'skills'];
router.put('/', requireAuth, async (req, res, next) => {
  try {
    for (const field of allowed) if (field in req.body) req.user.profile[field] = req.body[field];
    await req.user.save();
    res.json({ success: true, data: { user: { id: req.user.id, email: req.user.email, role: req.user.role, profile: req.user.profile } }, message: 'Profile updated successfully.' });
  } catch (error) { next(error); }
});
export default router;
