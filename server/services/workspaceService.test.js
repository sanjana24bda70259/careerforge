import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validDate, validTime, overlaps, progressMetrics } from './workspaceService.js';

test('calendar dates and times reject rollover, malformed and injected input', () => {
  assert.equal(validDate('2026-02-29'), false); assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate({ $gte: '' }), false); assert.equal(validTime('24:00'), false); assert.equal(validTime('09:05'), true);
});
test('adjacent sessions are allowed while overlapping sessions are detected', () => {
  const a = { dateKey: '2026-09-30', startTime: '09:00', durationMinutes: 30 };
  assert.equal(overlaps(a, { ...a, startTime: '09:30' }), false);
  assert.equal(overlaps(a, { ...a, startTime: '09:29' }), true);
  assert.equal(overlaps(a, { ...a, dateKey: '2026-10-01' }), false);
});
test('study time uses stopped focus sessions rather than planned calendar minutes', () => {
  const state = { problems: [], aptitude: [], cs: [], practice: [] };
  const schedule = [{ dateKey: '2026-09-30', durationMinutes: 120, status: 'completed' }];
  const focus = [{ startedAt: new Date('2026-09-30T09:00Z'), endedAt: new Date('2026-09-30T09:25Z'), durationSeconds: 1500 }, { startedAt: new Date(), endedAt: null, durationSeconds: 0 }];
  const result = progressMetrics(state, focus, [], schedule, { weeklyStudyHours: 5 }, '2026-09-30', 'UTC');
  assert.equal(result.totalFocusSeconds, 1500); assert.equal(result.weeklyFocusSeconds, 1500);
  assert.equal(result.weeklyTargetSeconds, 18000); assert.equal(result.tasksCompleted, 1);
  assert.equal(result.streak, 1); assert.equal(result.aptitudeAccuracy, null); assert.equal(result.bestSubject, null);
  assert.ok(result.categories.every(category => category.completed === 0));
});
test('scheduled daily-plan tasks do not double-count completed work', () => {
  const state = { problems: [], aptitude: [], cs: [], practice: [] };
  const result = progressMetrics(state, [], [{ dateKey: '2026-09-30', tasks: [{ status: 'completed' }] }], [{ dateKey: '2026-09-30', sourceTaskId: 'task-1', status: 'completed' }], {}, '2026-09-30', 'UTC');
  assert.equal(result.tasksCompleted, 1); assert.equal(result.completionRate, 100);
});
