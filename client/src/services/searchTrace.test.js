import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchTrace } from '../../../shared/searchTrace.mjs';
import { linearSearchTheory } from '../../../shared/linearSearchTheory.mjs';

test('linear search returns the first match, including duplicate and empty inputs', () => {
  for (const values of [[], [0], [3, 1, 3], [-5, 0, 2, 2], [9, 3, 7, 1]]) {
    for (let target = -6; target <= 10; target++) {
      const trace = buildSearchTrace(values, target);
      const result = trace.at(-1);
      assert.equal(result.index, values.indexOf(target));
      assert.equal(result.done, true);
      assert.deepEqual(trace.filter(frame => frame.index >= 0).map(frame => frame.index), Array.from({ length: result.found ? result.index + 1 : values.length }, (_, i) => i));
    }
  }
});

test('binary search agrees with membership and stays within its candidate interval', () => {
  for (let size = 0; size <= 64; size++) {
    const values = Array.from({ length: size }, (_, i) => Math.floor(i / 2) - 12);
    const original = [...values];
    for (let target = -14; target <= 24; target++) {
      const trace = buildSearchTrace(values, target, 'binary');
      const result = trace.at(-1);
      assert.equal(Boolean(result.found), values.includes(target));
      if (result.found) assert.equal(values[result.index], target);
      const comparisons = trace.filter(frame => frame.index >= 0);
      assert(comparisons.length <= Math.ceil(Math.log2(size + 1)));
      for (const frame of comparisons) assert(frame.index >= frame.low && frame.index <= frame.high);
    }
    assert.deepEqual(values, original);
  }
});

test('invalid input is rejected instead of visualizing a misleading trace', () => {
  assert.throws(() => buildSearchTrace([4, 2], 2, 'binary'), /sorted/);
  assert.throws(() => buildSearchTrace([NaN], 2), /finite/);
  assert.throws(() => buildSearchTrace([1], Infinity), /finite/);
  assert.throws(() => buildSearchTrace([1], 1, 'unknown'), /Choose/);
});

test('the published JavaScript reference returns the same first index as the visualizer', () => {
  const reference = new Function(`${linearSearchTheory.code.JavaScript}; return linearSearch;`)();
  for (const values of [[], [1], [8, 3, 8], [-1, -5, 0, 9]]) {
    for (let target = -6; target < 10; target++) assert.equal(reference(values, target), buildSearchTrace(values, target).at(-1).index);
  }
});
