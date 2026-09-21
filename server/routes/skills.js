import { Router } from 'express';
import { SkillEvidence } from '../models/SkillEvidence.js';
import { RevisionItem } from '../models/RevisionItem.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { evidenceSummary, nextActions, dueSkillRevisions, skillKey } from '../services/skillGraphService.js';

const router = Router();
const splitSkills = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 30);

const claimDomain = label => {
  const value = skillKey(label);
  if (['arrays', 'strings', 'hashmap', 'linked-list', 'binary-search', 'recursion', 'trees', 'graphs', 'dynamic-programming'].includes(value)) return 'dsa';
  if (['java', 'sql', 'dbms', 'operating-systems', 'computer-networks'].includes(value)) return 'cs';
  return 'project';
};
const claimedSkill = (label, source) => ({
  skillId: `claim:${skillKey(label)}`, label, domain: claimDomain(label),
  status: source === 'project' ? 'demonstrated_in_project' : 'self_declared',
  confidence: source === 'project' ? 'project evidence' : 'self-declared', evidenceCount: 0, graded: 0, accuracy: null,
  attempted: 0, correct: 0, incorrect: 0, completed: 0, revisionPassed: 0, revisionMissed: 0, interviewResponses: 0, timeTakenSeconds: 0, source
});

router.get('/overview', async (req, res, next) => {
  try {
    const [evidence, projects, resumes, due] = await Promise.all([
      SkillEvidence.find({ userId: req.user.id }).sort({ lastEvidenceAt: -1 }).lean(),
      CareerRecord.find({ userId: req.user.id, type: 'project' }).lean(),
      CareerRecord.find({ userId: req.user.id, type: 'resume' }).sort({ updatedAt: -1 }).limit(1).lean(),
      dueSkillRevisions(req.user.id).lean()
    ]);
    const actual = evidence.map(evidenceSummary);
    const actualKeys = new Set(actual.map(item => skillKey(item.label)));
    const claims = [];
    for (const label of req.user.profile?.skills || []) if (!actualKeys.has(skillKey(label))) claims.push(claimedSkill(label, 'profile'));
    for (const label of splitSkills(resumes[0]?.data?.skills)) if (!actualKeys.has(skillKey(label)) && !claims.some(item => skillKey(item.label) === skillKey(label))) claims.push(claimedSkill(label, 'resume'));
    for (const project of projects) for (const label of splitSkills(project.data?.stack)) if (!actualKeys.has(skillKey(label)) && !claims.some(item => skillKey(item.label) === skillKey(label))) claims.push(claimedSkill(label, 'project'));
    const skills = [...actual, ...claims].sort((a, b) => (a.status === 'needs_revision' ? -1 : 0) - (b.status === 'needs_revision' ? -1 : 0) || a.label.localeCompare(b.label));
    const domains = ['dsa', 'aptitude', 'cs', 'interview', 'project'].map(domain => ({
      domain, evidenceCount: skills.filter(item => item.domain === domain && item.evidenceCount > 0).reduce((sum, item) => sum + item.evidenceCount, 0),
      assessedSkills: skills.filter(item => item.domain === domain && item.graded > 0).length
    }));
    res.json({ success: true, data: { skills, dueRevisionCount: due.length, domains, nextActions: nextActions({ skills, due }) }, message: 'Skill graph retrieved from saved evidence.' });
  } catch (error) { next(error); }
});

router.get('/next-actions', async (req, res, next) => {
  try {
    const [evidence, due] = await Promise.all([SkillEvidence.find({ userId: req.user.id }).lean(), dueSkillRevisions(req.user.id).lean()]);
    const skills = evidence.map(evidenceSummary);
    res.json({ success: true, data: { actions: nextActions({ skills, due }) }, message: 'Evidence-based next actions retrieved.' });
  } catch (error) { next(error); }
});

router.get('/revisions/due', async (req, res, next) => {
  try {
    const revisions = await dueSkillRevisions(req.user.id).lean();
    res.json({ success: true, data: { revisions: revisions.map(item => ({ ...item, revisionKind: 'skill' })) }, message: 'Due skill revisions retrieved.' });
  } catch (error) { next(error); }
});

export default router;
