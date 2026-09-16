import { Router } from 'express';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { buildCoachReply } from '../services/coachService.js';

const router = Router();
router.post('/coach', async (req, res, next) => {
  try {
    const solved = await ProblemProgress.countDocuments({ userId: req.user.id, status: 'solved' });
    const reply = buildCoachReply({ message: req.body.message, profile: req.user.profile, stats: { solved } });
    res.json({ success: true, data: reply, message: 'Career coach response generated successfully.' });
  } catch (error) { next(error); }
});
router.post('/resume-analysis', (req, res) => res.json({ success: true, data: { score: 0, suggestions: ['Add a resume to receive an analysis.'] }, message: 'Resume analysis is ready.' }));
router.post('/job-match', (req, res) => res.json({ success: true, data: { match: 0, missingSkills: [], recommendation: 'Add a job description to receive a match.' }, message: 'Job match is ready.' }));
router.post('/interview', (req, res) => res.json({ success: true, data: { question: 'Tell me about a project you are proud of.', feedback: null }, message: 'Interview session started successfully.' }));
export default router;
