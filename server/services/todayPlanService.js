import { AptitudeAttempt } from '../models/AptitudeAttempt.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { CsTopicProgress } from '../models/CsTopicProgress.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { RevisionItem } from '../models/RevisionItem.js';
import { dsaTopics } from './dsaCatalog.js';
import { csFundamentals } from './csFundamentalsCatalog.js';

const titleCase = value => String(value || '').replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const task = ({ id, domain, title, detail, estimatedMinutes, href, sourceId = null }) => ({ id, domain, title, detail, estimatedMinutes, href, sourceId });

const aptitudeSignals = attempts => {
  const byTopic = new Map();
  for (const attempt of attempts) {
    const current = byTopic.get(attempt.topicId) || { topicId: attempt.topicId, attempted: 0, correct: 0 };
    current.attempted += attempt.attempted || 0;
    current.correct += attempt.correct || 0;
    byTopic.set(attempt.topicId, current);
  }
  return [...byTopic.values()].map(item => ({ ...item, accuracy: item.attempted ? Math.round(item.correct / item.attempted * 100) : null })).sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101));
};

export async function buildTodayPlanCandidates(userId, profile = {}) {
  const [problemProgress, aptitudeAttempts, dueRevisions, csProgress, resume] = await Promise.all([
    ProblemProgress.find({ userId, status: { $in: ['attempted', 'needs_revision'] } }).sort({ lastAttemptedAt: -1 }).lean(),
    AptitudeAttempt.find({ userId }).sort({ submittedAt: -1 }).lean(),
    RevisionItem.find({ userId, dueAt: { $lte: new Date() } }).sort({ dueAt: 1 }).lean(),
    CsTopicProgress.find({ userId }).lean(),
    CareerRecord.findOne({ userId, type: 'resume' }).lean()
  ]);

  const attemptedDsa = problemProgress.find(item => item.problemId?.startsWith('dsa:'));
  const [, attemptedTopicId] = attemptedDsa?.problemId?.split(':') || [];
  const dsaTopic = dsaTopics.find(item => item.id === attemptedTopicId) || dsaTopics[0];
  const nextDsaTopic = dsaTopics[(dsaTopics.findIndex(item => item.id === dsaTopic.id) + 1) % dsaTopics.length];
  const aptitude = aptitudeSignals(aptitudeAttempts)[0];
  const csDone = new Set(csProgress.filter(item => item.learnedAt).map(item => `${item.subjectId}:${item.topicId}`));
  const unfinishedCs = csFundamentals.flatMap(subject => subject.topics.map(topicItem => ({ subject, topic: topicItem }))).filter(item => !csDone.has(`${item.subject.id}:${item.topic.id}`));
  const firstCs = unfinishedCs[0];
  const nextCs = unfinishedCs[1];
  const due = dueRevisions[0];
  const role = profile.targetRole?.trim();

  const candidates = [
    task({ id: 'dsa-focus', domain: 'dsa', title: attemptedDsa ? `DSA — revisit ${dsaTopic.name}` : `DSA — start ${dsaTopic.name}`, detail: attemptedDsa ? 'You have a saved attempt here. Rework the approach before moving on.' : 'This is the first unfinished topic in your current DSA roadmap.', estimatedMinutes: 30, href: `/learning/dsa/${dsaTopic.id}`, sourceId: attemptedDsa?.problemId || dsaTopic.id }),
    task({ id: 'aptitude-focus', domain: 'aptitude', title: aptitude ? `Aptitude — practise ${titleCase(aptitude.topicId)}` : 'Aptitude — start Percentages', detail: aptitude?.accuracy !== null ? `${aptitude.correct} correct from ${aptitude.attempted} attempted; this is your lowest recorded accuracy.` : 'No scored aptitude set yet. Begin with a focused foundation topic.', estimatedMinutes: 15, href: `/learning/aptitude/${encodeURIComponent(aptitude?.topicId || 'percentages')}/practice`, sourceId: aptitude?.topicId || 'percentages' }),
    due && task({ id: `revision-${due._id}`, domain: 'revision', title: `Revision — ${due.label}`, detail: due.prompt || 'This review is due from your saved practice history.', estimatedMinutes: 15, href: due.domain === 'dsa' ? '/dsa' : due.domain === 'aptitude' ? '/aptitude' : '/cs', sourceId: String(due._id) }),
    firstCs && task({ id: `cs-${firstCs.subject.id}-${firstCs.topic.id}`, domain: 'cs', title: `${firstCs.subject.name} — ${firstCs.topic.title}`, detail: 'This core concept is not yet marked learned in your account.', estimatedMinutes: 15, href: `/learning/cs/${firstCs.subject.id}`, sourceId: `${firstCs.subject.id}:${firstCs.topic.id}` }),
    task({ id: resume ? 'career-project' : 'career-resume', domain: 'career', title: resume ? 'Career — document one project detail' : 'Career — create your resume draft', detail: resume ? `Your resume exists${role ? ` for your ${role} goal` : ''}; add one concrete project outcome.` : 'No saved resume was found. Capture your real profile details before applying.', estimatedMinutes: 10, href: resume ? '/projects' : '/resume', sourceId: resume ? String(resume._id) : null }),
    task({ id: 'dsa-next', domain: 'dsa', title: `DSA — preview ${nextDsaTopic.name}`, detail: 'Use this as an alternative unfinished roadmap topic when you need a fresh pattern.', estimatedMinutes: 20, href: `/learning/dsa/${nextDsaTopic.id}`, sourceId: nextDsaTopic.id }),
    nextCs && task({ id: `cs-${nextCs.subject.id}-${nextCs.topic.id}`, domain: 'cs', title: `${nextCs.subject.name} — ${nextCs.topic.title}`, detail: 'An alternative incomplete core concept from your learning catalog.', estimatedMinutes: 15, href: `/learning/cs/${nextCs.subject.id}`, sourceId: `${nextCs.subject.id}:${nextCs.topic.id}` })
  ].filter(Boolean);

  return candidates;
}

export const planSummary = plan => {
  const tasks = plan.tasks || [];
  const completed = tasks.filter(item => item.status === 'completed').length;
  const active = tasks.filter(item => item.status === 'planned');
  return { ...plan.toObject?.() || plan, completedCount: completed, totalCount: tasks.length, estimatedMinutes: active.reduce((sum, item) => sum + item.estimatedMinutes, 0) };
};
