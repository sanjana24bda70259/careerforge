import { Router } from 'express';
import { AptitudeAttempt } from '../models/AptitudeAttempt.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { PlacementSimulation } from '../models/PlacementSimulation.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { SkillEvidence } from '../models/SkillEvidence.js';
import { evidenceSummary } from '../services/skillGraphService.js';

const roundDefinitions = [
  { id: 'aptitude', title: 'Round 1 — Aptitude', href: '/learning/aptitude/advanced/mocks', empty: 'Complete a timed aptitude mock to record assessment evidence.' },
  { id: 'coding', title: 'Round 2 — Coding OA', href: '/dsa', empty: 'Solve CareerForge DSA problems to build practice evidence. A scored OA is not inferred from completions.' },
  { id: 'cs', title: 'Round 3 — CS Fundamentals', href: '/cs', empty: 'A scored CS assessment has not been recorded yet.' },
  { id: 'technical', title: 'Round 4 — Technical Interview', href: '/interviews', empty: 'Submit a technical interview answer to record this round.' },
  { id: 'hr', title: 'Round 5 — HR Interview', href: '/interviews', empty: 'Submit an HR interview answer to record this round.' }
];

const accuracy = attempts => {
  const total = attempts.reduce((sum, item) => sum + item.attempted, 0);
  const correct = attempts.reduce((sum, item) => sum + item.correct, 0);
  return total ? Math.round(correct / total * 100) : null;
};

const roundsForEvidence = ({ mockAttempts, solved, csEvidence, technical, hr }) => roundDefinitions.map(round => {
  if (round.id === 'aptitude' && mockAttempts.length) return { ...round, status: 'assessment_recorded', evidence: `${mockAttempts.length} timed mock${mockAttempts.length === 1 ? '' : 's'} · ${accuracy(mockAttempts)}% scored accuracy` };
  if (round.id === 'coding' && solved) return { ...round, status: 'practice_evidence', evidence: `${solved} solved problem${solved === 1 ? '' : 's'} recorded. This is practice evidence, not an OA score.` };
  if (round.id === 'cs' && csEvidence) return { ...round, status: 'assessment_recorded', evidence: `${csEvidence} scored CS evidence item${csEvidence === 1 ? '' : 's'} recorded.` };
  if (round.id === 'technical' && technical) return { ...round, status: 'assessment_recorded', evidence: `${technical} saved technical response${technical === 1 ? '' : 's'}.` };
  if (round.id === 'hr' && hr) return { ...round, status: 'assessment_recorded', evidence: `${hr} saved HR response${hr === 1 ? '' : 's'}.` };
  return { ...round, status: 'not_started', evidence: round.empty };
});

const latestProfile = async userId => {
  const [attempts, solved, interviews, evidence] = await Promise.all([
    AptitudeAttempt.find({ userId, track: 'advanced', testType: 'mock' }).lean(),
    ProblemProgress.countDocuments({ userId, status: 'solved' }),
    CareerRecord.find({ userId, type: 'interview' }).lean(),
    SkillEvidence.find({ userId }).lean()
  ]);
  const technical = interviews.filter(item => item.data?.type === 'Technical').length;
  const hr = interviews.filter(item => item.data?.type === 'HR').length;
  const skills = evidence.map(evidenceSummary);
  return {
    rounds: roundsForEvidence({ mockAttempts: attempts, solved, csEvidence: skills.filter(item => item.domain === 'cs' && item.graded > 0).length, technical, hr }),
    report: {
      profile: {
        dsaSolved: solved,
        aptitudeMocks: attempts.length,
        aptitudeAccuracy: accuracy(attempts),
        csAssessedSkills: skills.filter(item => item.domain === 'cs' && item.graded > 0).length,
        technicalInterviews: technical,
        hrInterviews: hr
      },
      supported: skills.filter(item => item.status === 'supported').map(item => item.label),
      needsRevision: skills.filter(item => item.status === 'needs_revision').map(item => item.label)
    }
  };
};

const router = Router();
router.get('/overview', async (req, res, next) => {
  try {
    const [simulation, profile] = await Promise.all([
      PlacementSimulation.findOne({ userId: req.user.id, status: 'active' }).sort({ updatedAt: -1 }).lean(),
      latestProfile(req.user.id)
    ]);
    res.json({ success: true, data: { simulation, ...profile }, message: 'Placement evidence profile retrieved.' });
  } catch (error) { next(error); }
});

router.post('/start', async (req, res, next) => {
  try {
    const existing = await PlacementSimulation.findOne({ userId: req.user.id, status: 'active' }).sort({ updatedAt: -1 });
    const simulation = existing || await PlacementSimulation.create({
      userId: req.user.id,
      targetRole: req.user.profile?.targetRole || '',
      rounds: roundDefinitions.map(round => ({ id: round.id, title: round.title }))
    });
    const profile = await latestProfile(req.user.id);
    res.status(existing ? 200 : 201).json({ success: true, data: { simulation, ...profile }, message: existing ? 'Your placement simulation is already active.' : 'Placement simulation started. Rounds update only from recorded evidence.' });
  } catch (error) { next(error); }
});

export default router;
