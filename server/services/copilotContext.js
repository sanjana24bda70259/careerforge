import { AptitudeAttempt } from '../models/AptitudeAttempt.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { CsTopicProgress } from '../models/CsTopicProgress.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { DSAProgress } from '../models/DSAProgress.js';
import { Mistake } from '../models/Mistake.js';
import { ProblemProgress } from '../models/ProblemProgress.js';
import { Revision } from '../models/Revision.js';
import { RevisionItem } from '../models/RevisionItem.js';
import { dsaTopics } from './dsaCatalog.js';
import { csFundamentals } from './csFundamentalsCatalog.js';
import { buildTodayPlanCandidates } from './todayPlanService.js';

const titleCase = value => String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const asString = value => String(value || '').replace(/\s+/g, ' ').trim();
const topicById = id => dsaTopics.find(topic => topic.id === id);
const dsaTopicFromProblem = id => {
  const match = String(id || '').match(/^dsa:([^:]+)/);
  return match ? topicById(match[1])?.name || titleCase(match[1]) : null;
};
const accuracy = (correct, attempted) => attempted ? Math.round(correct / attempted * 100) : null;
const toApplication = record => ({
  id: String(record._id),
  company: asString(record.data?.company || record.data?.companyName || record.data?.title || 'Untitled application').slice(0, 120),
  role: asString(record.data?.role || record.data?.position || '').slice(0, 100),
  status: asString(record.data?.status || 'Status not recorded').slice(0, 60),
  updatedAt: record.updatedAt
});
const toInterview = record => ({
  id: String(record._id),
  type: asString(record.data?.type || 'Interview practice').slice(0, 100),
  date: record.data?.scheduledAt || record.data?.interviewDate || record.data?.date || null,
  company: asString(record.data?.company || record.data?.companyName || '').slice(0, 120)
});

const needsDsa = intent => ['TODAY_PLAN', 'DSA_HELP', 'DSA_PROGRESS', 'DSA_RECOMMENDATION', 'WEAK_TOPICS', 'REVISION'].includes(intent);
const needsAptitude = intent => ['TODAY_PLAN', 'APTITUDE_HELP', 'APTITUDE_PROGRESS', 'WEAK_TOPICS', 'REVISION'].includes(intent);
const needsCs = intent => ['TODAY_PLAN', 'CS_FUNDAMENTALS', 'WEAK_TOPICS', 'REVISION', 'INTERVIEW_PREP'].includes(intent);

export async function getCopilotContext({ userId, profile = {}, intent }) {
  const context = {
    profile: {
      targetRole: asString(profile.targetRole).slice(0, 100) || null,
      preferredLanguage: asString(profile.preferredLanguage).slice(0, 50) || null,
      weeklyStudyHours: Number.isFinite(profile.weeklyStudyHours) ? profile.weeklyStudyHours : null,
      studyGoal: asString(profile.studyGoal).slice(0, 240) || null
    }
  };
  const jobsNeeded = intent === 'APPLICATION_STATUS' || intent === 'INTERVIEW_PREP' || intent === 'GENERAL_CAREER';
  const resumeNeeded = intent === 'RESUME_HELP' || intent === 'INTERVIEW_PREP' || intent === 'PROJECT_PREP';
  const todayNeeded = intent === 'TODAY_PLAN';
  const mistakesNeeded = ['WEAK_TOPICS', 'DSA_HELP', 'APTITUDE_HELP', 'REVISION'].includes(intent);

  const [dsaRecords, dsaProgress, aptitudeAttempts, csProgress, dueSkillRevisions, dueLegacyRevisions, jobs, interviews, resume, projects, mistakes, savedPlan] = await Promise.all([
    needsDsa ? ProblemProgress.find({ userId, status: { $in: ['attempted', 'solved', 'needs_revision'] } }).sort({ lastAttemptedAt: -1, updatedAt: -1 }).limit(60).lean() : [],
    needsDsa ? DSAProgress.find({ userId }).lean() : [],
    needsAptitude ? AptitudeAttempt.find({ userId }).sort({ submittedAt: -1 }).limit(80).select('topicId attempted correct submittedAt track').lean() : [],
    needsCs ? CsTopicProgress.find({ userId }).lean() : [],
    (todayNeeded || intent === 'REVISION') ? RevisionItem.find({ userId, dueAt: { $lte: new Date() } }).sort({ dueAt: 1 }).limit(8).lean() : [],
    (todayNeeded || intent === 'REVISION') ? Revision.find({ userId, dueAt: { $lte: new Date() } }).sort({ dueAt: 1 }).limit(8).lean() : [],
    jobsNeeded ? CareerRecord.find({ userId, type: 'job' }).sort({ updatedAt: -1 }).limit(12).lean() : [],
    jobsNeeded ? CareerRecord.find({ userId, type: 'interview' }).sort({ updatedAt: -1 }).limit(12).lean() : [],
    resumeNeeded ? CareerRecord.findOne({ userId, type: 'resume' }).sort({ updatedAt: -1 }).lean() : null,
    (resumeNeeded || intent === 'PROJECT_PREP') ? CareerRecord.find({ userId, type: 'project' }).sort({ updatedAt: -1 }).limit(5).lean() : [],
    mistakesNeeded ? Mistake.find({ userId }).sort({ occurredAt: -1 }).limit(8).select('source topic reason question occurredAt').lean() : [],
    todayNeeded ? DailyPlan.findOne({ userId, dateKey: new Date().toISOString().slice(0, 10) }).lean() : null
  ]);

  if (needsDsa) {
    const byTopic = new Map();
    for (const item of dsaRecords) {
      const label = dsaTopicFromProblem(item.problemId);
      if (!label) continue;
      const current = byTopic.get(label) || { topic: label, attempted: 0, solved: 0, needsRevision: 0 };
      current.attempted += 1;
      current.solved += item.status === 'solved' ? 1 : 0;
      current.needsRevision += item.status === 'needs_revision' ? 1 : 0;
      byTopic.set(label, current);
    }
    const weak = [...byTopic.values()].filter(item => item.needsRevision || (item.attempted >= 2 && item.solved / item.attempted < 0.6)).sort((a, b) => b.needsRevision - a.needsRevision || (a.solved / Math.max(a.attempted, 1)) - (b.solved / Math.max(b.attempted, 1))).slice(0, 3);
    const diagnosticWeak = dsaProgress.filter(item => item.status === 'needs_practice' || (Number.isFinite(item.mastery) && item.mastery < 60)).map(item => ({ topic: topicById(item.topicId)?.name || titleCase(item.topicId), mastery: item.mastery ?? null })).slice(0, 3);
    context.dsa = {
      solved: dsaRecords.filter(item => item.status === 'solved').length,
      attempted: dsaRecords.length,
      weakTopics: [...weak, ...diagnosticWeak.filter(item => !weak.some(existing => existing.topic === item.topic))].slice(0, 3),
      recentProblems: dsaRecords.slice(0, 4).map(item => ({ topic: dsaTopicFromProblem(item.problemId), status: item.status, attemptedAt: item.lastAttemptedAt || item.updatedAt }))
    };
  }
  if (needsAptitude) {
    const byTopic = new Map();
    let attempted = 0; let correct = 0;
    for (const item of aptitudeAttempts) {
      attempted += item.attempted || 0; correct += item.correct || 0;
      const current = byTopic.get(item.topicId) || { topic: titleCase(item.topicId), attempted: 0, correct: 0 };
      current.attempted += item.attempted || 0; current.correct += item.correct || 0; byTopic.set(item.topicId, current);
    }
    context.aptitude = {
      attempted, accuracy: accuracy(correct, attempted),
      weakTopics: [...byTopic.values()].map(item => ({ ...item, accuracy: accuracy(item.correct, item.attempted) })).filter(item => item.attempted > 0 && item.accuracy !== null && item.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)
    };
  }
  if (needsCs) {
    const completed = csProgress.filter(item => item.learnedAt).length;
    const total = csFundamentals.reduce((sum, subject) => sum + subject.topics.length, 0);
    const weakTopics = csProgress.filter(item => item.quizTotal > 0 && item.quizCorrect / item.quizTotal < 0.6).map(item => ({ subject: csFundamentals.find(subject => subject.id === item.subjectId)?.name || titleCase(item.subjectId), topic: csFundamentals.find(subject => subject.id === item.subjectId)?.topics.find(topic => topic.id === item.topicId)?.title || titleCase(item.topicId), accuracy: accuracy(item.quizCorrect, item.quizTotal) })).slice(0, 3);
    context.cs = { learned: completed, total, weakTopics };
  }
  if (todayNeeded || intent === 'REVISION') {
    context.revision = { dueItems: dueSkillRevisions.map(item => ({ label: item.label, domain: item.domain, prompt: asString(item.prompt).slice(0, 240) })), legacyDueCount: dueLegacyRevisions.length };
  }
  if (todayNeeded) {
    const candidates = savedPlan?.tasks?.length ? savedPlan.tasks : await buildTodayPlanCandidates(userId, profile);
    context.todayPlan = { saved: Boolean(savedPlan), tasks: candidates.slice(0, 5).map(item => ({ title: item.title, detail: item.detail, estimatedMinutes: item.estimatedMinutes, href: item.href, status: item.status || 'planned' })) };
  }
  if (jobsNeeded) {
    const applications = jobs.map(toApplication);
    context.applications = { total: applications.length, active: applications.filter(item => !/reject|withdraw|closed/i.test(item.status)).slice(0, 6), all: applications.slice(0, 6) };
    context.interviews = { total: interviews.length, upcoming: interviews.map(toInterview).filter(item => item.date && new Date(item.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4) };
  }
  if (resumeNeeded) {
    const data = resume?.data || {};
    context.resume = { available: Boolean(resume), fields: resume ? Object.keys(data).filter(key => !/password|token|secret/i.test(key)).slice(0, 12) : [], skills: Array.isArray(data.skills) ? data.skills.slice(0, 12) : [] };
    context.projects = projects.map(item => ({ title: asString(item.data?.title || item.data?.name || 'Untitled project').slice(0, 120), stack: asString(item.data?.stack || item.data?.techStack || '').slice(0, 180) }));
  }
  if (mistakesNeeded) context.mistakes = mistakes.map(item => ({ source: item.source, topic: item.topic, reason: item.reason, question: asString(item.question).slice(0, 180) }));
  return context;
}

export const contextForPrompt = context => JSON.stringify(context).slice(0, 12000);
