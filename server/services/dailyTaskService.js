import { DailyQuest } from '../models/DailyQuest.js';

// Keep creation, completion and rollover on the same calendar day.
export const taskTimeZone = process.env.APP_TIME_ZONE || 'Asia/Kolkata';
export const taskDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: taskTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
};
export const validTaskDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const starterTasks = [
  { id: 'dsa', type: 'DSA', title: 'Solve one coding problem', detail: 'Choose a problem from your roadmap', xp: 50 },
  { id: 'aptitude', type: 'APTITUDE', title: 'Practise aptitude', detail: 'Complete one practice set', xp: 20 },
  { id: 'revision', type: 'REVISION', title: 'Review one topic', detail: 'Revisit your notes or a previous solution', xp: 20 },
  { id: 'career', type: 'CAREER', title: 'Improve one resume bullet', detail: 'Make a project outcome measurable', xp: 30 }
];
export async function ensureDailyQuest(userId, dateKey = taskDateKey()) {
  try {
    return await DailyQuest.findOneAndUpdate({ userId, dateKey }, { $setOnInsert: { tasks: starterTasks } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  } catch (error) {
    // Concurrent visits must reuse the unique user/day record.
    if (error.code === 11000) return DailyQuest.findOne({ userId, dateKey });
    throw error;
  }
}
export async function dailyTaskBacklogs(userId, today = taskDateKey()) {
  const quests = await DailyQuest.find({ userId, dateKey: { $lt: today } }).sort({ dateKey: 1 }).lean();
  const pending = [];
  const completed = [];
  for (const quest of quests) {
    for (const task of quest.tasks) {
      const item = { id: `${quest._id}:${task.id}`, type: 'daily-task', taskId: task.id, dateKey: quest.dateKey, category: task.type, title: task.title, detail: task.detail, priority: 'normal', completed: task.completed === true, completedAt: task.completedAt || null };
      (item.completed ? completed : pending).push(item);
    }
  }
  completed.sort((a, b) => (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0) || b.dateKey.localeCompare(a.dateKey));
  return { pending, completed };
}
