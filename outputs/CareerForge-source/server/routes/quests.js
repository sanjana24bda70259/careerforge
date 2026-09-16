import { Router } from 'express';
import { DailyQuest } from '../models/DailyQuest.js';

const router = Router();
const todayKey = () => new Date().toISOString().slice(0, 10);
const starterTasks = [
  { id: 'dsa', type: 'DSA', title: 'Two Sum', detail: 'Arrays · Easy', xp: 50 },
  { id: 'aptitude', type: 'APTITUDE', title: 'Percentages', detail: '10 questions', xp: 20 },
  { id: 'revision', type: 'REVISION', title: 'Review Binary Search', detail: 'Review notes and one solution', xp: 20 },
  { id: 'career', type: 'CAREER', title: 'Improve one resume bullet', detail: 'Make a project outcome measurable', xp: 30 }
];
router.get('/today', async (req, res, next) => {
  try {
    const quest = await DailyQuest.findOneAndUpdate({ userId: req.user.id, dateKey: todayKey() }, { $setOnInsert: { tasks: starterTasks } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: { quest }, message: 'Daily quest retrieved successfully.' });
  } catch (error) { next(error); }
});
router.patch('/today/tasks/:taskId', async (req, res, next) => {
  try {
    const quest = await DailyQuest.findOne({ userId: req.user.id, dateKey: todayKey() });
    const task = quest?.tasks.find(item => item.id === req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found', message: 'This daily quest task does not exist.' });
    task.completed = Boolean(req.body.completed);
    await quest.save();
    res.json({ success: true, data: { quest }, message: 'Daily quest updated successfully.' });
  } catch (error) { next(error); }
});
export default router;
