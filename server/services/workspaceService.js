import { StudySchedule, WorkspaceEntry, FocusSession, NotificationReceipt, WorkspacePreference } from '../models/Workspace.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { learningCatalog } from './learningItems.js';
import { loadStudyProgress } from './personalRoadmapService.js';
import { addStudyDays, studyDate } from './studyDate.js';
import { csFundamentals } from './csFundamentalsCatalog.js';
import { practiceTopics, aptitudePracticeKey } from './practiceCatalog.js';

export const defaultPreferences = { theme: 'light', planningMode: 'personalized', dailyBriefing: true, revisionReminders: true, deadlineReminders: true };
export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const minuteOfDay = time => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
export const timeAt = minute => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
export const overlaps = (first, second) => first.dateKey === second.dateKey && minuteOfDay(first.startTime) < minuteOfDay(second.startTime) + second.durationMinutes && minuteOfDay(second.startTime) < minuteOfDay(first.startTime) + first.durationMinutes;

export function progressMetrics(state, focus, plans, schedule, profile, dateKey, timezone) {
  const dsaCatalog = learningCatalog.filter(item => item.domain === 'dsa' && item.kind === 'question');
  const solved = new Set(state.problems.filter(item => item.status === 'solved').map(item => item.problemId));
  const attempts = new Set(); let correct = 0; let total = 0;
  const activity = new Set();
  const addDate = date => { if (date) activity.add(studyDate(timezone, new Date(date))); };
  for (const item of state.problems) addDate(item.lastAttemptedAt);
  for (const attempt of state.aptitude) {
    correct += attempt.correct; total += attempt.attempted; addDate(attempt.submittedAt);
    for (const answer of attempt.answers || []) if (Number.isInteger(answer.answer)) attempts.add(`aptitude:${attempt.track || 'foundation'}:${answer.questionId}`);
  }
  for (const attempt of state.practice) { if (attempt.key.startsWith('aptitude:')) { attempts.add(attempt.key); correct += Number(attempt.correct); total++; } addDate(attempt.createdAt); }
  for (const response of state.library || []) {
    addDate(response.updatedAt);
    if(response.domain==='aptitude') {attempts.add(aptitudePracticeKey(response.questionId));correct+=Number(response.correct===true);total++;}
  }
  for (const item of state.cs) { addDate(item.learnedAt); addDate(item.lastQuizAt); }
  const closed = focus.filter(item => item.endedAt);
  for (const item of closed) addDate(item.startedAt);
  const weekStart = addStudyDays(dateKey, -6);
  const totalFocusSeconds = closed.reduce((sum, item) => sum + item.durationSeconds, 0);
  const weeklyFocusSeconds = closed.filter(item => studyDate(timezone, item.startedAt) >= weekStart && studyDate(timezone, item.startedAt) <= dateKey).reduce((sum, item) => sum + item.durationSeconds, 0);
  let streak = 0; let cursor = activity.has(dateKey) ? dateKey : addStudyDays(dateKey, -1);
  while (activity.has(cursor)) { streak++; cursor = addStudyDays(cursor, -1); }
  const finished = plans.reduce((sum, plan) => sum + plan.tasks.filter(item => item.status === 'completed').length, 0) + schedule.filter(item => !item.sourceTaskId && item.status === 'completed').length;
  const recentTasks = [...plans.filter(plan => plan.dateKey >= weekStart && plan.dateKey <= dateKey).flatMap(plan => plan.tasks.filter(item => item.status !== 'rescheduled')), ...schedule.filter(item => !item.sourceTaskId && item.dateKey >= weekStart && item.dateKey <= dateKey)];
  const best = state.cs.filter(item => item.quizTotal >= 2).sort((a, b) => b.quizCorrect / b.quizTotal - a.quizCorrect / a.quizTotal)[0];
  const category = (name, completed, available, href, color) => ({ name, completed, total: available, percent: available ? Math.round(completed / available * 100) : 0, href, color });
  const csLearned = state.cs.filter(item => item.learnedAt);
  const core = csFundamentals.filter(item => item.id !== 'system-design-basics');
  return {
    totalFocusSeconds, weeklyFocusSeconds, weeklyTargetSeconds: (profile.weeklyStudyHours || 7) * 3600, streak, tasksCompleted: finished,
    completionRate: recentTasks.length ? Math.round(recentTasks.filter(item => item.status === 'completed').length / recentTasks.length * 100) : null,
    aptitudeAccuracy: total ? Math.round(correct / total * 100) : null, questionsAttempted: total,
    bestSubject: best ? csFundamentals.find(item => item.id === best.subjectId)?.name || best.subjectId : null,
    difficulty: ['Easy', 'Medium', 'Hard'].map(level => ({ level, solved: dsaCatalog.filter(item => item.difficulty === level && solved.has(item.key)).length, total: dsaCatalog.filter(item => item.difficulty === level).length })),
    categories: [category('DSA', dsaCatalog.filter(item => solved.has(item.key)).length, dsaCatalog.length, '/dsa', '#72835c'),
      category('Aptitude', attempts.size, new Set([...learningCatalog.filter(item => item.domain === 'aptitude' && item.kind === 'question').map(item=>item.key),...practiceTopics.filter(t=>t.domain==='aptitude').flatMap(t=>t.questions.map(q=>aptitudePracticeKey(q.id)))]).size, '/aptitude', '#b28a5f'),
      category('Core subjects', csLearned.filter(item => item.subjectId !== 'system-design-basics').length, core.reduce((sum, item) => sum + item.topics.length, 0), '/cs', '#8a81ac'),
      category('System design', csLearned.filter(item => item.subjectId === 'system-design-basics').length, csFundamentals.find(item => item.id === 'system-design-basics')?.topics.length || 0, '/learning/cs/system-design-basics', '#649b9b')],
    activity: Array.from({ length: 7 }, (_, index) => { const day = addStudyDays(weekStart, index); return { dateKey: day, active: activity.has(day), minutes: Math.round(closed.filter(item => studyDate(timezone, item.startedAt) === day).reduce((sum, item) => sum + item.durationSeconds, 0) / 60) }; })
  };
}

export async function workspaceOverview(user, dateKey, timezone) {
  const [state, focus, plans, schedule, entries, preference, receipts] = await Promise.all([
    loadStudyProgress(user.id), FocusSession.find({ userId: user.id }).lean(), DailyPlan.find({ userId: user.id }).lean(),
    StudySchedule.find({ userId: user.id, archivedAt: null }).sort({ dateKey: 1, startTime: 1 }).lean(),
    WorkspaceEntry.find({ userId: user.id, archivedAt: null }).sort({ dueDate: 1 }).lean(),
    WorkspacePreference.findOne({ userId: user.id }).lean(), NotificationReceipt.find({ userId: user.id }).lean()
  ]);
  const preferences = { ...defaultPreferences, ...preference };
  const todayPlan = plans.find(plan => plan.dateKey === dateKey);
  const due = state.saved.filter(item => item.revisionSelected && item.dueDate && item.dueDate <= dateKey);
  const goals = entries.filter(item => item.type === 'goal');
  const notifications = [];
  if (preferences.dailyBriefing && todayPlan) notifications.push({ key: `plan:${dateKey}`, title: 'Your daily plan is ready', detail: `${todayPlan.tasks.filter(item => item.status === 'planned').length} tasks waiting for you.`, href: '/dashboard#today-plan', kind: 'plan', dateKey });
  if (preferences.revisionReminders && due.length) notifications.push({ key: `revision:${dateKey}`, title: `${due.length} selected revisions are due`, detail: 'Revisit the questions and concepts you chose to practise again.', href: '/revisions', kind: 'revision', dateKey });
  if (preferences.deadlineReminders) for (const goal of goals.filter(item => item.dueDate && item.dueDate <= addStudyDays(dateKey, 7) && item.progress < 100)) notifications.push({ key: `goal:${goal._id}:${goal.dueDate}`, title: goal.title, detail: `${goal.dueDate < dateKey ? 'Overdue' : 'Coming up'} · ${goal.dueDate} · ${goal.progress}% of your goal recorded`, href: '/goals', kind: 'goal', dateKey: goal.dueDate });
  for (const item of schedule.filter(item => item.dateKey === dateKey && item.status === 'planned')) notifications.push({ key: `schedule:${item._id}`, title: item.title, detail: `Today at ${item.startTime} · ${item.durationMinutes} minutes`, href: `/calendar?date=${dateKey}`, kind: 'schedule', dateKey });
  const feed = notifications.map(item => ({ ...item, ...receipts.find(receipt => receipt.key === item.key) })).filter(item => !item.dismissedAt);
  return { dateKey, preferences, metrics: progressMetrics(state, focus, plans, schedule, user.profile || {}, dateKey, timezone),
    activeFocus: focus.find(item => !item.endedAt) || null, todaySchedule: schedule.filter(item => item.dateKey === dateKey),
    goals, notifications: feed, unreadCount: feed.filter(item => !item.readAt).length,
    counts: { notes: entries.filter(item => item.type === 'note').length, lists: entries.filter(item => item.type === 'list').length, dueRevisions: due.length },
    aiConfigured: process.env.AI_PROVIDER === 'openai' && Boolean(process.env.AI_API_KEY) };
}
