import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { DailyQuest } from '../models/DailyQuest.js';
import { ensureDailyQuest, taskDateKey, taskTimeZone, validTaskDate } from '../services/dailyTaskService.js';

const router = Router();
router.get('/today', async (req, res, next) => {
  try {
    const quest = await ensureDailyQuest(req.user.id);
    res.json({ success: true, data: { quest, timeZone: taskTimeZone }, message: 'Daily tasks retrieved successfully.' });
  } catch (error) { next(error); }
});
router.post('/today/tasks', async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title || title.length > 160) return res.status(400).json({ success: false, message: 'Enter a task between 1 and 160 characters.' });
    const dateKey = taskDateKey();
    await ensureDailyQuest(req.user.id, dateKey);
    const task = { id: randomUUID(), type: 'PERSONAL', title, detail: 'Your daily goal', xp: 0, completed: false, completedAt: null };
    const quest = await DailyQuest.findOneAndUpdate({ userId: req.user.id, dateKey, 'tasks.99': { $exists: false } }, { $push: { tasks: task } }, { new: true, runValidators: true });
    if (!quest) return res.status(400).json({ success: false, message: 'You can add up to 100 tasks per day.' });
    res.status(201).json({ success: true, data: { quest, timeZone: taskTimeZone }, message: 'Task added to today’s list.' });
  } catch (error) { next(error); }
});

// Date-specific updates preserve the original day, including after midnight.
// The existing /today/tasks endpoint remains compatible with older clients.
router.patch('/:dateKey/tasks/:taskId', async (req, res, next) => {
  try {
    const dateKey = req.params.dateKey === 'today' ? taskDateKey() : req.params.dateKey;
    if (!validTaskDate(dateKey) || dateKey > taskDateKey()) return res.status(400).json({ success: false, message: 'Choose today or an earlier task date.' });
    if (typeof req.body?.completed !== 'boolean') return res.status(400).json({ success: false, message: 'Task completion must be true or false.' });
    const completed = req.body.completed;
    const quest = await DailyQuest.findOneAndUpdate(
      { userId: req.user.id, dateKey, 'tasks.id': req.params.taskId },
      { $set: { 'tasks.$.completed': completed, 'tasks.$.completedAt': completed ? new Date() : null } },
      { new: true, runValidators: true }
    );
    if (!quest) return res.status(404).json({ success: false, message: 'This daily task does not exist.' });
    res.json({ success: true, data: { quest, timeZone: taskTimeZone }, message: completed ? 'Task completed.' : 'Task moved back to pending.' });
  } catch (error) { next(error); }
});
export default router;
