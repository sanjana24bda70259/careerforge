import { Router } from 'express';
import { User } from '../models/User.js';
import { CareerRecord } from '../models/CareerRecord.js';

const router = Router();
router.use((req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ success: false, error: 'Forbidden', message: 'Admin access is required.' }));
router.get('/analytics', async (_, res, next) => {
  try {
    const [users, projects, jobs, interviews] = await Promise.all([User.countDocuments(), CareerRecord.countDocuments({ type: 'project' }), CareerRecord.countDocuments({ type: 'job' }), CareerRecord.countDocuments({ type: 'interview' })]);
    res.json({ success: true, data: { users, projects, jobs, interviews }, message: 'Admin analytics retrieved successfully.' });
  } catch (error) { next(error); }
});
export default router;
