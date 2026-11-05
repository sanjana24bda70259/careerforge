import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const allowed = ['name', 'college', 'degree', 'branch', 'graduationYear', 'targetRole', 'preferredLanguage', 'studyGoal', 'experienceLevel', 'targetCompanies', 'weeklyStudyHours', 'skills'];
router.put('/', requireAuth, async (req, res, next) => {
  try {
    if ('name' in req.body && (typeof req.body.name !== 'string' || req.body.name.trim().length < 2 || req.body.name.trim().length > 80)) return res.status(400).json({ success: false, message: 'Enter a full name using 2 to 80 characters.' });
    for (const field of allowed) if (field in req.body) req.user.profile[field] = req.body[field];
    if (req.body.onboardingCompleted === true) req.user.onboardingCompleted = true;
    await req.user.save();
    res.json({ success: true, data: { user: { id: req.user.id, email: req.user.email, role: req.user.role, profile: req.user.profile, onboardingCompleted: req.user.onboardingCompleted !== false } }, message: 'Profile updated successfully.' });
  } catch (error) { next(error); }
});
export default router;
