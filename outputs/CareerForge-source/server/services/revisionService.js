import { Revision } from '../models/Revision.js';

const intervals = [1, 3, 7, 14, 30];
export async function scheduleFirstRevision(userId, problemId) {
  const dueAt = new Date(Date.now() + intervals[0] * 24 * 60 * 60 * 1000);
  return Revision.findOneAndUpdate({ userId, problemId }, { dueAt, intervalIndex: 0, completedAt: null }, { upsert: true, new: true, setDefaultsOnInsert: true });
}
export async function completeRevision(revision) {
  const nextIndex = Math.min(revision.intervalIndex + 1, intervals.length - 1);
  revision.intervalIndex = nextIndex;
  revision.completedAt = new Date();
  revision.dueAt = new Date(Date.now() + intervals[nextIndex] * 24 * 60 * 60 * 1000);
  return revision.save();
}
