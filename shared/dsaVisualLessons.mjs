// Authored CareerForge lessons, shared by the catalog and the visual player.
export const visualLessons = [
  { id: 'cf-first-shelf', topic: 'binary-search', category: 'Binary Search', pattern: 'Lower bound', title: 'First Shelf That Fits', difficulty: 'Easy', complexity: 'O(log n) time · O(1) space', icon: '⌕',
    description: 'A warehouse lists shelf capacities in nondecreasing order. Given a parcel size, return the zero-based index of the first shelf with enough capacity. Return -1 when no shelf fits.',
    hint: 'Keep a fitting shelf as a candidate, then search its left half for an earlier fit.',
    constraints: ['0 ≤ capacities.length ≤ 100,000', '0 ≤ capacity, size ≤ 1,000,000,000', 'Capacities are sorted in nondecreasing order.'],
    examples: [{ input: 'capacities = [2, 5, 5, 9, 12], size = 5', output: '1' }],
    values: [2, 5, 5, 9, 12, 16, 21, 28], parameter: 9, parameterLabel: 'Parcel size',
    code: ['function firstShelf(a, size) {', '  let low = 0, high = a.length - 1, answer = -1;', '  while (low <= high) {', '    const mid = Math.floor((low + high) / 2);', '    if (a[mid] >= size) {', '      answer = mid; high = mid - 1;', '    } else low = mid + 1;', '  }', '  return answer;', '}'] },
  { id: 'cf-parcel-order', topic: 'sorting', category: 'Sorting', pattern: 'Insertion sort', title: 'Parcel Order', difficulty: 'Easy', complexity: 'O(n²) time · O(1) extra space', icon: '▥',
    description: 'Arrange parcel weights in nondecreasing order using insertion sort. Reuse the input array and return it. Equal weights must retain their original relative order.',
    hint: 'Build a sorted prefix. Save the next weight before shifting larger weights to the right.',
    constraints: ['0 ≤ weights.length ≤ 1,000', '0 ≤ weight ≤ 1,000,000', 'Do not use a built-in sorting method.'],
    examples: [{ input: 'weights = [7, 2, 7, 4]', output: '[2, 4, 7, 7]' }],
    values: [7, 3, 9, 2, 6, 4],
    code: ['function orderParcels(a) {', '  for (let i = 1; i < a.length; i++) {', '    const key = a[i]; let j = i - 1;', '    while (j >= 0 && a[j] > key) {', '      a[j + 1] = a[j]; j--;', '    }', '    a[j + 1] = key;', '  }', '  return a;', '}'] },
  { id: 'cf-study-stretch', topic: 'sliding-window', category: 'Sliding Window', pattern: 'Fixed-size window', title: 'Busiest Study Stretch', difficulty: 'Easy', complexity: 'O(n) time · O(1) space', icon: '▱',
    description: 'You recorded your study minutes for each day. Return the largest total for any k consecutive days. k is positive and does not exceed the number of days.',
    hint: 'When a window moves, remove the day leaving it and add the new day.',
    constraints: ['1 ≤ k ≤ minutes.length ≤ 100,000', '0 ≤ minutes[i] ≤ 1,440'],
    examples: [{ input: 'minutes = [20, 10, 50, 30], k = 2', output: '80' }],
    values: [20, 10, 50, 30, 15, 40, 25], parameter: 3, parameterLabel: 'Window size k',
    code: ['function busiestStretch(a, k) {', '  let sum = 0, best = -Infinity;', '  for (let right = 0; right < a.length; right++) {', '    sum += a[right];', '    if (right >= k) sum -= a[right - k];', '    if (right >= k - 1) best = Math.max(best, sum);', '  }', '  return best;', '}'] },
  { id: 'cf-cargo-pair', topic: 'two-pointers', category: 'Two Pointers', pattern: 'Opposite ends', title: 'Cargo Pair Match', difficulty: 'Easy', complexity: 'O(n) time · O(1) space', icon: '↔',
    description: 'A sorted list contains cargo weights. Find any two different positions whose weights add to the requested load. Return their zero-based indices in increasing order, or [] if no pair exists.',
    hint: 'Compare the sum of the two end values with the load. Which pointer can move without skipping a possible pair?',
    constraints: ['0 ≤ weights.length ≤ 100,000', '0 ≤ weight, load ≤ 1,000,000,000', 'Weights are sorted in nondecreasing order.'],
    examples: [{ input: 'weights = [2, 5, 8, 12], load = 13', output: '[1, 2]' }],
    values: [2, 5, 8, 12, 16, 20], parameter: 24, parameterLabel: 'Requested load',
    code: ['function cargoPair(a, load) {', '  let left = 0, right = a.length - 1;', '  while (left < right) {', '    const sum = a[left] + a[right];', '    if (sum === load) return [left, right];', '    if (sum < load) left++;', '    else right--;', '  }', '  return [];', '}'] },
  { id: 'cf-ledger-totals', topic: 'arrays', category: 'Arrays', pattern: 'Prefix sums', title: 'Daily Ledger Totals', difficulty: 'Easy', complexity: 'O(n) time · O(n) output space', icon: '∑',
    description: 'Given daily deposits, return an array where position i contains the sum of deposits from day 0 through day i. Do not change the input. Empty input gives an empty result.',
    hint: 'Carry the previous total forward and add the next deposit.',
    constraints: ['0 ≤ deposits.length ≤ 100,000', '0 ≤ deposit ≤ 1,000,000', 'Use a number type that can hold the total.'],
    examples: [{ input: 'deposits = [3, 7, 2, 4]', output: '[3, 10, 12, 16]' }],
    values: [3, 7, 2, 4, 8, 1],
    code: ['function ledgerTotals(a) {', '  const result = []; let total = 0;', '  for (let i = 0; i < a.length; i++) {', '    total += a[i];', '    result.push(total);', '  }', '  return result;', '}'] },
  { id: 'cf-signal-wait', topic: 'stack-queue', category: 'Stacks & Queues', pattern: 'Monotonic stack', title: 'Next Stronger Signal', difficulty: 'Medium', complexity: 'O(n) time · O(n) space', icon: '▤',
    description: 'For each signal reading, return the distance to the next strictly greater reading on its right. Return 0 for a reading with no greater value after it. Equal readings are not stronger.',
    hint: 'Keep a stack of indices still waiting for a stronger reading. Resolve them when a new reading is greater.',
    constraints: ['0 ≤ readings.length ≤ 100,000', '0 ≤ reading ≤ 1,000,000,000'],
    examples: [{ input: 'readings = [5, 3, 6, 6, 8]', output: '[2, 1, 2, 1, 0]' }],
    values: [5, 3, 6, 6, 8, 4, 9],
    code: ['function signalWait(a) {', '  const stack = [], result = Array(a.length).fill(0);', '  for (let i = 0; i < a.length; i++) {', '    while (stack.length && a[i] > a[stack.at(-1)]) {', '      const j = stack.pop(); result[j] = i - j;', '    }', '    stack.push(i);', '  }', '  return result;', '}'] }
];
export const visualLessonById = id => visualLessons.find(lesson => lesson.id === id);

export function validateVisualInput(lesson, values, parameter) {
  if (!Array.isArray(values) || values.length > 18 || values.some(value => !Number.isInteger(value) || value < 0 || value > 99)) throw new Error('Use up to 18 whole numbers between 0 and 99.');
  if (lesson.parameterLabel && (!Number.isInteger(parameter) || parameter < 0 || parameter > 1000)) throw new Error('Enter a whole-number target between 0 and 1000.');
  if (['cf-first-shelf', 'cf-cargo-pair'].includes(lesson.id) && values.some((value, i) => i > 0 && value < values[i - 1])) throw new Error('This algorithm needs numbers sorted from smallest to largest.');
  if (lesson.id === 'cf-study-stretch' && (parameter < 1 || parameter > values.length)) throw new Error('Window size must be between 1 and the number of days.');
}

export function buildVisualTrace(lesson, values = lesson.values, parameter = lesson.parameter) {
  validateVisualInput(lesson, values, parameter);
  const a = [...values], steps = [];
  const add = (line, note, state = {}) => steps.push({ line, note, array: [...a], active: [], pointers: {}, vars: {}, output: null, ...structuredClone(state) });
  if (lesson.id === 'cf-first-shelf') {
    let low = 0, high = a.length - 1, answer = -1;
    add(2, 'Begin with the entire sorted array. No fitting shelf has been found.', { vars: { low, high, answer } });
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      add(4, `Inspect shelf ${mid}, with capacity ${a[mid]}.`, { active: [mid], range: [low, high], pointers: { low, mid, high }, vars: { low, mid, high, answer } });
      if (a[mid] >= parameter) { answer = mid; high = mid - 1; add(6, `Capacity ${a[mid]} fits ${parameter}. Remember shelf ${mid} and look for an earlier fit.`, { active: [mid], range: [low, high], vars: { low, high, answer } }); }
      else { low = mid + 1; add(7, `Capacity ${a[mid]} is too small. All shelves through index ${mid} can be skipped.`, { range: [low, high], vars: { low, high, answer } }); }
    }
    add(9, answer < 0 ? 'No shelf has enough capacity. Return -1.' : `The earliest fitting shelf is index ${answer}.`, { active: answer < 0 ? [] : [answer], output: answer, vars: { answer } });
  } else if (lesson.id === 'cf-parcel-order') {
    add(1, 'Grow a sorted prefix by inserting one parcel at a time.');
    for (let i = 1; i < a.length; i++) {
      const key = a[i]; let j = i - 1;
      add(3, `Hold parcel ${key} aside. Find its position in the sorted prefix.`, { active: [i], range: [0, i - 1], vars: { i, j, key }, pointers: { i, j } });
      while (j >= 0 && a[j] > key) { const moved = a[j]; a[j + 1] = a[j]; j--; add(5, `Shift ${moved} right. The held value ${key} is still safe in key.`, { active: [j + 2], vars: { i, j, key }, pointers: { gap: j + 1 } }); }
      a[j + 1] = key;
      add(7, `Insert ${key} at index ${j + 1}. The prefix through ${i} is sorted.`, { active: [j + 1], range: [0, i], vars: { i, key } });
    }
    add(9, 'Every parcel is in nondecreasing order.', { output: [...a], range: [0, a.length - 1] });
  } else if (lesson.id === 'cf-study-stretch') {
    let sum = 0, best = -Infinity;
    add(2, `Build a window of ${parameter} consecutive days.`, { vars: { sum, best: '—', k: parameter } });
    for (let right = 0; right < a.length; right++) {
      sum += a[right];
      add(4, `Add day ${right}: ${a[right]} minutes.`, { active: [right], range: [Math.max(0, right - parameter), right], vars: { sum, best: Number.isFinite(best) ? best : '—' } });
      if (right >= parameter) { sum -= a[right - parameter]; add(5, `Remove day ${right - parameter}: the window stays ${parameter} days wide.`, { active: [right - parameter], range: [right - parameter + 1, right], vars: { sum, best: Number.isFinite(best) ? best : '—' } }); }
      if (right >= parameter - 1) { best = Math.max(best, sum); add(6, `This complete window totals ${sum}. Best so far: ${best}.`, { range: [right - parameter + 1, right], vars: { sum, best }, pointers: { left: right - parameter + 1, right } }); }
    }
    add(8, `The busiest ${parameter}-day stretch totals ${best} minutes.`, { output: best, vars: { best } });
  } else if (lesson.id === 'cf-cargo-pair') {
    let left = 0, right = a.length - 1, output = [];
    add(2, 'Start at opposite ends of the sorted weights.', { pointers: { left, right }, vars: { load: parameter } });
    while (left < right) {
      const sum = a[left] + a[right];
      add(4, `${a[left]} + ${a[right]} = ${sum}. Compare with the requested load ${parameter}.`, { active: [left, right], pointers: { left, right }, vars: { sum, load: parameter } });
      if (sum === parameter) { output = [left, right]; break; }
      if (sum < parameter) { left++; add(6, 'The sum is too small. Move the left pointer to a larger weight.', { pointers: { left, right } }); }
      else { right--; add(7, 'The sum is too large. Move the right pointer to a smaller weight.', { pointers: { left, right } }); }
    }
    add(output.length ? 5 : 9, output.length ? `Indices ${left} and ${right} form the requested load.` : 'No two different positions form this load.', { output, active: output });
  } else if (lesson.id === 'cf-ledger-totals') {
    const result = []; let total = 0;
    add(2, 'Start with an empty ledger and a total of zero.', { output: [], vars: { total } });
    for (let i = 0; i < a.length; i++) {
      total += a[i]; add(4, `Add deposit ${a[i]}. The running total is ${total}.`, { active: [i], pointers: { i }, output: [...result], vars: { total } });
      result.push(total); add(5, `Record ${total} as the cumulative deposit through day ${i}.`, { active: [i], output: [...result], vars: { total } });
    }
    add(7, 'The cumulative ledger is complete. The input has not changed.', { output: result, vars: { total } });
  } else if (lesson.id === 'cf-signal-wait') {
    const stack = [], result = Array(a.length).fill(0);
    add(2, 'Every reading initially has distance 0. The stack holds unresolved indices.', { output: [...result], vars: { stack: '[]' } });
    for (let i = 0; i < a.length; i++) {
      add(4, `Reading ${i} is ${a[i]}. Compare it with the top unresolved reading.`, { active: [i, ...stack.slice(-1)], pointers: { i }, output: [...result], vars: { stack: `[${stack.join(', ')}]` } });
      while (stack.length && a[i] > a[stack.at(-1)]) { const j = stack.pop(); result[j] = i - j; add(5, `${a[i]} is stronger than ${a[j]}. Index ${j} waited ${i - j} positions.`, { active: [j, i], output: [...result], vars: { stack: `[${stack.join(', ')}]`, j, distance: i - j } }); }
      stack.push(i); add(7, `Index ${i} now waits on the stack. Equal readings stay unresolved.`, { active: [i], output: [...result], vars: { stack: `[${stack.join(', ')}]` } });
    }
    add(9, 'Unresolved indices keep distance 0. All other distances are final.', { output: result, vars: { stack: `[${stack.join(', ')}]` } });
  } else throw new Error('This lesson does not have a visualization.');
  return steps;
}
