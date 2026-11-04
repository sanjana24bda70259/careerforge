import { ProblemProgress } from '../models/ProblemProgress.js';
import { AptitudeAttempt } from '../models/AptitudeAttempt.js';
import { CsTopicProgress } from '../models/CsTopicProgress.js';
import { CareerRecord } from '../models/CareerRecord.js';
import { LearningItem, LearningAttempt } from '../models/LearningItem.js';
import { Mistake } from '../models/Mistake.js';
import { learningItem } from './learningItems.js';
import { PracticeResponse } from '../models/PracticeResponse.js';
import { aptitudePracticeKey } from './practiceCatalog.js';

export async function loadStudyProgress(userId) {
  const [problems, aptitude, cs, career, saved, practice, mistakes, library] = await Promise.all([
    ProblemProgress.find({ userId }).lean(), AptitudeAttempt.find({ userId }).sort({ submittedAt: -1 }).lean(),
    CsTopicProgress.find({ userId }).lean(), CareerRecord.find({ userId, type: { $in: ['resume', 'project', 'interview', 'mock_attempt'] } }).lean(),
    LearningItem.find({ userId }).lean(), LearningAttempt.find({ userId }).sort({ createdAt: -1 }).lean(),
    Mistake.find({ userId }).sort({ occurredAt: -1 }).lean(),
    PracticeResponse.find({ userId }).select('domain topicId questionId correct updatedAt').lean()
  ]);
  return { problems, aptitude, cs, career, saved, practice, mistakes, library };
}
export const studyBudget = profile => Math.max(8, Math.min(180, Math.round((profile.weeklyStudyHours || 7) * 60 / 7)));
export const roleSubjects = profile => /data|backend/i.test(profile.targetRole || '') ? ['dbms', 'operating-systems'] : /front|full stack/i.test(profile.targetRole || '') ? ['oop', 'computer-networks'] : ['dbms', 'oop'];

export function buildPersonalRoadmap(profile = {}, state) {
  const solved = state.problems.filter(item => item.status === 'solved');
  const practised = state.problems.filter(item => item.attempts > 0 || ['solved', 'attempted', 'needs_revision'].includes(item.status));
  const solvedIn = topics => practised.filter(item => topics.some(topic => item.problemId.startsWith(`dsa:${topic}:`))).length;
  const correctQuestions = new Set();
  for (const attempt of state.aptitude) for (const answer of attempt.answers || []) {
    const item = learningItem(`aptitude:${attempt.track || 'foundation'}:${answer.questionId}`);
    if (item && answer.answer === item.correctAnswer) correctQuestions.add(item.key);
  }
  for (const attempt of state.practice) if (attempt.correct && attempt.key.startsWith('aptitude:')) correctQuestions.add(attempt.key);
  for (const response of state.library || []) if(response.domain==='aptitude' && response.correct) correctQuestions.add(aptitudePracticeKey(response.questionId));
  const learned = state.cs.filter(item => item.learnedAt);
  const subjects = roleSubjects(profile);
  const countCareer = type => state.career.filter(item => item.type === type).length;
  const goal = (title, value, target, href) => ({ title, value, target, href, completed: value >= target });
  const stages = [
    { id: 'foundation', title: 'Build your foundations', detail: 'Get comfortable with problem solving and core concepts.', goals: [goal('Foundation DSA questions attempted', solvedIn(['basics', 'arrays', 'strings', 'sorting']), 3, '/dsa'), goal('Unique aptitude questions correct', correctQuestions.size, 5, '/aptitude'), goal('CS concepts learned', learned.length, 2, '/cs')] },
    { id: 'patterns', title: 'Connect the patterns', detail: 'Develop repeatable approaches and strengthen recall.', goals: [goal('Pattern questions attempted', solvedIn(['hashing', 'two-pointers', 'sliding-window', 'binary-search', 'linked-list', 'stack-queue']), 6, '/dsa'), goal('Selected revisions completed', state.saved.reduce((sum, item) => sum + (item.reviewCount || 0), 0), 3, '/revisions'), goal('CS topics with ≥70% quiz accuracy', state.cs.filter(item => item.quizTotal > 0 && item.quizCorrect / item.quizTotal >= .7).length, 3, '/cs')] },
    { id: 'role', title: `Prepare for ${profile.targetRole || 'Software Engineer'}`, detail: `Focus on ${subjects.join(' and ').replaceAll('-', ' ')} and demonstrate your work.`, goals: [goal('Role-focused CS concepts learned', learned.filter(item => subjects.includes(item.subjectId)).length, 3, '/cs'), goal('Project records saved', countCareer('project'), 1, '/projects'), goal('Unique aptitude questions correct', correctQuestions.size, 20, '/aptitude')] },
    { id: 'interview', title: 'Practise for opportunities', detail: 'Bring your preparation together with a resume and interview practice.', goals: [goal('Resume draft saved', countCareer('resume'), 1, '/resume'), goal('Interview sessions recorded', countCareer('interview'), 2, '/interviews'), goal('Mock tests submitted', countCareer('mock_attempt') + state.aptitude.filter(item => item.testType === 'mock').length, 1, '/mock-tests')] }
  ];
  let foundCurrent = false;
  for (const stage of stages) {
    stage.completed = stage.goals.every(item => item.completed);
    stage.progress = Math.round(stage.goals.reduce((sum, item) => sum + Math.min(1, item.value / item.target), 0) / stage.goals.length * 100);
    stage.status = stage.completed ? 'completed' : !foundCurrent ? 'current' : 'upcoming';
    if (!stage.completed) foundCurrent = true;
  }
  return { targetRole: profile.targetRole || 'Software Engineer', weeklyStudyHours: profile.weeklyStudyHours || 7, dailyMinutes: studyBudget(profile),
    knownSkills: profile.skills || [], studyGoal: profile.studyGoal || '', stages,
    currentStage: stages.find(item => item.status === 'current')?.id || null,
    progress: Math.round(stages.reduce((sum, item) => sum + item.progress, 0) / stages.length),
    achievements: { solved: solved.length, practised: practised.length, aptitudeCorrect: correctQuestions.size, conceptsLearned: learned.length, revisionsCompleted: state.saved.reduce((sum, item) => sum + (item.reviewCount || 0), 0) } };
}
