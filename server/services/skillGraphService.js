import { SkillEvidence } from '../models/SkillEvidence.js';
import { RevisionItem } from '../models/RevisionItem.js';

const DAY = 24 * 60 * 60 * 1000;
const revisionIntervals = [1, 3, 7, 14, 30, 60];

const safeNumber = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
export const skillKey = value => String(value || '')
  .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const evidenceSummary = evidence => {
  const item = evidence?.toObject ? evidence.toObject() : evidence || {};
  const graded = safeNumber(item.correct) + safeNumber(item.incorrect);
  const total = graded + safeNumber(item.completed) + safeNumber(item.interviewResponses);
  const accuracy = graded ? Math.round(safeNumber(item.correct) / graded * 100) : null;
  let status = 'no_evidence';
  if (total) status = 'collecting_evidence';
  if (graded >= 3 && accuracy !== null && accuracy < 60) status = 'needs_revision';
  if (graded >= 8 && accuracy !== null && accuracy >= 75 && safeNumber(item.revisionPassed) > 0) status = 'supported';
  return {
    ...item,
    evidenceCount: total,
    graded,
    accuracy,
    status,
    confidence: graded >= 8 ? 'more evidence' : graded ? 'limited evidence' : total ? 'completion evidence only' : 'no evidence'
  };
};

export async function recordSkillEvidence({ userId, skillId, label, domain, attempted = 0, correct = 0, incorrect = 0, completed = 0, interviewResponses = 0, timeTakenSeconds = 0 }) {
  if (!userId || !skillId || !label || !domain) return null;
  return SkillEvidence.findOneAndUpdate(
    { userId, skillId },
    {
      $set: { label, domain, lastEvidenceAt: new Date() },
      $inc: {
        attempted: safeNumber(attempted), correct: safeNumber(correct), incorrect: safeNumber(incorrect),
        completed: safeNumber(completed), interviewResponses: safeNumber(interviewResponses), timeTakenSeconds: safeNumber(timeTakenSeconds)
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function scheduleRevision({ userId, skillId, label, domain, sourceType, sourceId, prompt = '', dueInDays = 1 }) {
  const dueAt = new Date(Date.now() + Math.max(0, dueInDays) * DAY);
  return RevisionItem.findOneAndUpdate(
    { userId, sourceType, sourceId },
    {
      $set: { skillId, label, domain, prompt: String(prompt).slice(0, 700), dueAt, completedAt: null },
      $setOnInsert: { userId, sourceType, sourceId, intervalIndex: 0, successfulReviews: 0, unsuccessfulReviews: 0 }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function completeSkillRevision(revision, recalled) {
  const success = recalled !== false;
  const nextIndex = success ? Math.min(revision.intervalIndex + 1, revisionIntervals.length - 1) : 0;
  revision.intervalIndex = nextIndex;
  revision.successfulReviews += success ? 1 : 0;
  revision.unsuccessfulReviews += success ? 0 : 1;
  revision.lastReviewedAt = new Date();
  revision.completedAt = revision.lastReviewedAt;
  revision.dueAt = new Date(Date.now() + revisionIntervals[nextIndex] * DAY);
  const saved = await revision.save();
  await SkillEvidence.findOneAndUpdate(
    { userId: revision.userId, skillId: revision.skillId },
    {
      $set: { lastEvidenceAt: new Date() },
      $inc: success ? { revisionPassed: 1 } : { revisionMissed: 1 }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return saved;
}

export const dueSkillRevisions = userId => RevisionItem.find({ userId, dueAt: { $lte: new Date() } }).sort({ dueAt: 1, updatedAt: 1 });

export function nextActions({ skills = [], due = [] }) {
  const actions = due.slice(0, 3).map(item => ({
    kind: 'revision', title: `Review ${item.label}`, detail: item.prompt || `Revisit the ${item.domain.toUpperCase()} evidence that needs a second pass.`, href: item.domain === 'aptitude' ? '/aptitude' : item.domain === 'dsa' ? '/dsa' : '/interviews', revisionId: String(item._id)
  }));
  const weak = skills.filter(item => item.status === 'needs_revision').slice(0, 2);
  for (const item of weak) actions.push({ kind: 'practice', title: `Rebuild ${item.label}`, detail: `${item.incorrect} graded mistakes are recorded. Try a shorter set, then return to this concept.`, href: item.domain === 'aptitude' ? '/aptitude' : '/dsa' });
  if (!actions.length) actions.push({ kind: 'start', title: 'Create your first evidence', detail: 'Complete a scored aptitude set or record a DSA problem to make the next recommendation personal.', href: '/aptitude' });
  return actions.slice(0, 4);
}
