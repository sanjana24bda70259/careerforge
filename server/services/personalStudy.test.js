import assert from 'node:assert/strict';
import { test } from 'node:test';
import { studyDate, addStudyDays, nextReview } from './studyDate.js';
import { learningCatalog, publicItem } from './learningItems.js';
import { buildPersonalRoadmap, studyBudget } from './personalRoadmapService.js';
import { candidatesFromProgress, fitStudyBudget } from './todayPlanService.js';

const empty = () => ({ problems: [], aptitude: [], cs: [], career: [], saved: [], practice: [], mistakes: [] });
test('study days use the learner timezone, including midnight and invalid timezone fallback', () => {
  const now = new Date('2026-09-28T20:00:00Z');
  assert.equal(studyDate('Asia/Kolkata', now), '2026-09-29');
  assert.equal(studyDate('America/Los_Angeles', now), '2026-09-28');
  assert.equal(studyDate('invalid', now), '2026-09-28');
  assert.equal(addStudyDays('2026-12-31', 1), '2027-01-01');
});
test('recall expands review intervals; difficulty resets to tomorrow', () => {
  assert.deepEqual(nextReview('2026-09-29', 0, true), { reviewStage: 1, dueDate: '2026-10-02' });
  assert.deepEqual(nextReview('2026-09-29', 4, false), { reviewStage: 0, dueDate: '2026-09-30' });
  assert.equal(nextReview('2026-09-29', 4, true).dueDate, '2026-10-29');
});
test('catalog keys are unique and public questions do not include answers', () => {
  assert.equal(new Set(learningCatalog.map(item => item.key)).size, learningCatalog.length);
  for (const item of learningCatalog) {
    assert.ok(item.title && item.topic && item.href.startsWith('/'));
    assert.equal(publicItem(item).correctAnswer, undefined);
    assert.equal(publicItem(item).explanation, undefined);
    if (item.options) assert.ok(Number.isInteger(item.correctAnswer) && item.correctAnswer < item.options.length);
  }
});
test('new users receive usable tasks without aptitude history', () => {
  const candidates = candidatesFromProgress(empty(), { targetRole: 'Backend Developer' });
  assert.ok(candidates.some(item => item.domain === 'aptitude'));
  assert.ok(candidates.some(item => item.domain === 'dsa'));
  assert.ok(candidates.some(item => item.domain === 'cs'));
  assert.ok(candidates.every(item => item.title && item.href));
});
test('only explicitly selected and due items enter revision tasks', () => {
  const state = empty();
  state.saved = [
    { key: 'dsa:arrays:two-sum', revisionSelected: true, dueDate: '2026-09-29', reviewCount: 0 },
    { key: 'cs:dbms:normalization', bookmarked: true, revisionSelected: false, dueDate: '2026-09-28' },
    { key: 'cs:dbms:transactions', revisionSelected: true, dueDate: '2026-10-01' }
  ];
  const revision = candidatesFromProgress(state, {}, '2026-09-29').filter(item => item.kind === 'revision');
  assert.deepEqual(revision.map(item => item.sourceId), ['dsa:arrays:two-sum']);
});
test('daily plans honor small and large time budgets and do not duplicate questions', () => {
  const candidates = candidatesFromProgress(empty());
  for (const hours of [1, 3, 7, 12, 80]) {
    const budget = studyBudget({ weeklyStudyHours: hours }); const tasks = fitStudyBudget(candidates, budget);
    assert.ok(tasks.length > 0); assert.ok(tasks.reduce((sum, item) => sum + item.estimatedMinutes, 0) <= budget);
    assert.equal(new Set(tasks.map(item => item.sourceId || item.id)).size, tasks.length);
  }
});
test('profile claims do not fabricate checkpoint completion', () => {
  const roadmap = buildPersonalRoadmap({ skills: ['Arrays', 'SQL'], problemsSolved: 500, targetRole: 'Data Analyst' }, empty());
  assert.equal(roadmap.progress, 0); assert.equal(roadmap.currentStage, 'foundation');
  assert.equal(roadmap.achievements.solved, 0);
  assert.match(roadmap.stages[2].title, /Data Analyst/);
});
test('repeated correct attempts count as one unique aptitude question', () => {
  const state = empty(); const key = learningCatalog.find(item => item.domain === 'aptitude' && item.options).key;
  state.practice = [{ key, correct: true }, { key, correct: true }];
  assert.equal(buildPersonalRoadmap({}, state).achievements.aptitudeCorrect, 1);
});
