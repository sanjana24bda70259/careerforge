import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { visualLessons, buildVisualTrace } from '../../shared/dsaVisualLessons.mjs';
import { questionsForTopic } from './dsaPracticeCatalog.js';
import { learningItem } from './learningItems.js';

const result = (id, input, parameter) => buildVisualTrace(visualLessons.find(lesson => lesson.id === id), input, parameter).at(-1).output;
test('original visual lessons resolve through practice and bookmark catalogs', () => {
  assert.equal(new Set(visualLessons.map(lesson => lesson.id)).size, visualLessons.length);
  for (const lesson of visualLessons) {
    const question = questionsForTopic(lesson.topic).find(item => item.id === lesson.id);
    assert.equal(question.description, lesson.description);
    assert.equal(question.visualizationId, lesson.id);
    assert.equal(learningItem(`dsa:${lesson.topic}:${lesson.id}`).title, lesson.title);
  }
});

test('trace outputs and displayed reference code match independent answers', () => {
  const arrays = [[], [0], [7], [2, 2, 2], [5, 3, 6, 6, 8], [9, 0, 8, 1, 7], Array.from({ length: 18 }, (_, i) => 17 - i)];
  for (const lesson of visualLessons) for (const raw of arrays) {
    if (lesson.id === 'cf-study-stretch' && !raw.length) continue;
    const a = ['cf-first-shelf', 'cf-cargo-pair'].includes(lesson.id) ? [...raw].sort((a, b) => a - b) : raw;
    const parameters = lesson.id === 'cf-study-stretch' ? [1, a.length] : lesson.parameterLabel ? [0, 5, 12, 999] : [undefined];
    for (const parameter of parameters) {
      const before = [...a];
      const steps = buildVisualTrace(lesson, a, parameter);
      const actual = steps.at(-1).output;
      assert.deepEqual(a, before, 'tracing must never mutate caller input');
      assert(steps.every(step => step.line > 0 && step.line <= lesson.code.length && step.note && step.array.length === a.length));
      const context = { a: [...a], parameter };
      // Only execute our checked-in reference solution, never user code.
      const name = lesson.code[0].match(/function (\w+)/)[1];
      const returned = vm.runInNewContext(`${lesson.code.join('\n')}\n${name}(a, parameter)`, context, { timeout: 1000 });
      assert.deepEqual(JSON.parse(JSON.stringify(returned)), actual, `${lesson.id}: highlighted reference and trace disagree`);
      if (lesson.id === 'cf-first-shelf') assert.equal(actual, a.findIndex(value => value >= parameter));
      if (lesson.id === 'cf-parcel-order') assert.deepEqual(actual, [...a].sort((a, b) => a - b));
      if (lesson.id === 'cf-ledger-totals') assert.deepEqual(actual, a.map((_, i) => a.slice(0, i + 1).reduce((sum, value) => sum + value, 0)));
      if (lesson.id === 'cf-study-stretch') assert.equal(actual, Math.max(...a.slice(parameter - 1).map((_, i) => a.slice(i, i + parameter).reduce((sum, value) => sum + value, 0))));
      if (lesson.id === 'cf-signal-wait') assert.deepEqual(actual, a.map((value, i) => { const next = a.findIndex((other, j) => j > i && other > value); return next < 0 ? 0 : next - i; }));
      if (lesson.id === 'cf-cargo-pair') {
        const exists = a.some((value, i) => a.some((other, j) => j > i && value + other === parameter));
        assert.equal(actual.length > 0, exists);
        if (exists) { assert(actual[0] < actual[1]); assert.equal(a[actual[0]] + a[actual[1]], parameter); }
      }
    }
  }
});

test('custom input rejects malformed, excessive, and incompatible inputs', () => {
  for (const lesson of visualLessons) for (const bad of [null, '1,2', [NaN], [1.2], [-1], [100], Array(19).fill(1)]) assert.throws(() => buildVisualTrace(lesson, bad, 1));
  assert.throws(() => result('cf-first-shelf', [9, 1], 2), /sorted/);
  assert.throws(() => result('cf-cargo-pair', [2, 1], 3), /sorted/);
  assert.throws(() => result('cf-study-stretch', [], 1), /Window/);
  assert.throws(() => result('cf-study-stretch', [2], 0), /Window/);
  assert.throws(() => result('cf-first-shelf', [2], NaN), /whole-number/);
});

test('each captured frame is independent for rewind and timeline scrubbing', () => {
  const lesson = visualLessons.find(item => item.id === 'cf-parcel-order');
  const frames = buildVisualTrace(lesson, [3, 1, 2]);
  assert.deepEqual(frames[0].array, [3, 1, 2]);
  assert.deepEqual(frames.at(-1).array, [1, 2, 3]);
  frames.at(-1).array[0] = 99;
  assert.deepEqual(frames[0].array, [3, 1, 2]);
});
