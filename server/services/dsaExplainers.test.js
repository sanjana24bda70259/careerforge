import test from 'node:test';
import assert from 'node:assert/strict';
import { explainerLessons, explainerById, buildExplainerScenes } from '../../shared/dsaExplainers.mjs';
import { visualLessons } from '../../shared/dsaVisualLessons.mjs';
import { dsaPracticeCatalog } from './dsaPracticeCatalog.js';
import { learningItem } from './learningItems.js';
import { exampleDiagram } from '../../shared/dsaExampleDiagrams.mjs';

test('every catalog question has a unique reachable explanation and its original learning identity', () => {
  const all = Object.values(dsaPracticeCatalog).flat();
  assert.equal(all.length, 356);
  assert.equal(explainerLessons.length, 350);
  assert.equal(new Set(all.map(q => q.visualizationId)).size, all.length);
  for (const q of all) {
    const lesson = explainerById(q.visualizationId) || visualLessons.find(l => l.id === q.visualizationId);
    assert(lesson, `${q.topic}/${q.id} has no explanation`);
    assert.equal(lesson.questionId || lesson.id, q.id);
    assert.equal(lesson.topic, q.topic);
    assert.equal(learningItem(`dsa:${q.topic}:${q.id}`).title, q.title);
    assert.deepEqual(q.examples, lesson.examples);
  }
  assert.equal(explainerById('unknown--missing'), undefined);
  assert.notEqual(explainerById('heap--median-data-stream'), explainerById('advanced-problems--median-data-stream'));
});

test('authored scenes reveal the example, ordered reasoning, answer, and boundary condition', () => {
  for (const lesson of explainerLessons) {
    const scenes = buildExplainerScenes(lesson);
    assert(lesson.scenes.length >= 3, lesson.id);
    assert.equal(scenes[0].state, lesson.input);
    assert.deepEqual(scenes.slice(1, -2).map(scene => scene.state), lesson.scenes);
    assert.equal(scenes.at(-2).state, lesson.answer);
    assert.equal(scenes.at(-1).text, lesson.edgeCase);
    assert(scenes.every(scene => scene.title && scene.text && scene.state));
    const again = buildExplainerScenes(lesson);
    scenes[0].state = 'changed';
    assert.equal(again[0].state, lesson.input, 'replays must not mutate shared lessons');
  }
});

test('input diagrams preserve tree shape, duplicate node identities and list direction', () => {
  const tree = exampleDiagram('tree=-10(9,20(15,7))', 'trees');
  assert.deepEqual(tree.nodes.map(node => node.label), ['-10', '9', '20', '15', '7']);
  assert.deepEqual(tree.edges.map(edge => [tree.nodes[edge.from].label, tree.nodes[edge.to].label]).sort(), [['-10', '9'], ['-10', '20'], ['20', '15'], ['20', '7']].sort());
  const duplicates = exampleDiagram('tree=1(2,2)', 'trees');
  assert.equal(new Set(duplicates.nodes.map(node => node.id)).size, 3);
  assert(duplicates.nodes[1].x < duplicates.nodes[0].x && duplicates.nodes[2].x > duplicates.nodes[0].x);
  const chain = exampleDiagram('head: 4→7→2→null', 'linked-list');
  assert.equal(chain.directed, true);
  assert.deepEqual(chain.nodes.map(node => node.label), ['4', '7', '2', 'null']);
  assert.equal(chain.edges.length, 3);
  assert.equal(exampleDiagram('1→2→3→2 (back edge)', 'linked-list'), null);
  assert.equal(exampleDiagram('tree=1(2,)', 'trees'), null);
  for (const example of explainerLessons) {
    const diagram = exampleDiagram(example.input, example.topic);
    if (diagram) assert(diagram.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y)));
  }
});

const lesson = (topic, id) => explainerById(`${topic}--${id}`);
const firstArray = input => JSON.parse(input.match(/\[[^\[\]]*\]/)[0]);
const number = text => Number(text.match(/-?\d+/)[0]);
const checkNumber = (topic, id, compute) => {
  const example = lesson(topic, id);
  assert.equal(number(example.answer), compute(example.input), example.id);
};

test('sorting, array, window and search examples agree with independent computations', () => {
  for (const id of ['selection-sort', 'bubble-sort', 'insertion-sort', 'merge-sort', 'quick-sort', 'sort-colors-sorting', 'counting-sort']) {
    const example = lesson('sorting', id);
    assert.deepEqual(JSON.parse(example.answer), firstArray(example.input).sort((a, b) => a - b));
  }
  checkNumber('arrays', 'maximum-element', input => Math.max(...firstArray(input)));
  checkNumber('arrays', 'second-largest', input => [...new Set(firstArray(input))].sort((a, b) => b - a)[1]);
  checkNumber('arrays', 'single-number', input => firstArray(input).reduce((a, b) => a ^ b, 0));
  checkNumber('arrays', 'subarray-sum-k', input => {
    const a = firstArray(input), k = Number(input.match(/k=(\d+)/)[1]);
    let count = 0;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j <= a.length; j++) if (a.slice(i, j).reduce((sum, x) => sum + x, 0) === k) count++;
    return count;
  });
  checkNumber('two-pointers', 'container-water', input => {
    const a = firstArray(input); let best = 0;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) best = Math.max(best, (j - i) * Math.min(a[i], a[j]));
    return best;
  });
  checkNumber('two-pointers', 'trapping-rain-water', input => {
    const a = firstArray(input);
    return a.reduce((total, height, i) => total + Math.min(Math.max(...a.slice(0, i + 1)), Math.max(...a.slice(i))) - height, 0);
  });
  checkNumber('sliding-window', 'max-sum-size-k', input => {
    const a = firstArray(input), k = Number(input.match(/k=(\d+)/)[1]);
    return Math.max(...a.slice(k - 1).map((_, i) => a.slice(i, i + k).reduce((sum, x) => sum + x, 0)));
  });
  checkNumber('binary-search', 'lower-bound', input => firstArray(input).findIndex(n => n >= Number(input.match(/target=(\d+)/)[1])));
  checkNumber('binary-search', 'upper-bound', input => firstArray(input).findIndex(n => n > Number(input.match(/target=(\d+)/)[1])));
  checkNumber('binary-search', 'integer-square-root', input => Math.floor(Math.sqrt(number(input))));
});

test('math, strings, greedy, DP, graph, trie and bit examples match independently derived answers', () => {
  checkNumber('basics', 'count-digits', input => String(number(input)).length);
  checkNumber('basics', 'reverse-number', input => Number(String(number(input)).split('').reverse().join('')));
  checkNumber('basics', 'sum-divisors', input => { const n = number(input); return Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0).reduce((a, b) => a + b, 0); });
  const palindrome = lesson('strings', 'count-substrings').input.split('=')[1];
  let count = 0;
  for (let i = 0; i < palindrome.length; i++) for (let j = i + 1; j <= palindrome.length; j++) { const s = palindrome.slice(i, j); if (s === [...s].reverse().join('')) count++; }
  assert.equal(number(lesson('strings', 'count-substrings').answer), count);
  const pairs = lesson('recursion', 'generate-parentheses');
  const parentheses = [];
  const generate = (s, open, close) => { if (s.length === 2 * number(pairs.input)) parentheses.push(s); else { if (open < number(pairs.input)) generate(s + '(', open + 1, close); if (close < open) generate(s + ')', open, close + 1); } };
  generate('', 0, 0);
  assert.deepEqual(pairs.answer.slice(1, -1).split(','), parentheses);
  checkNumber('heap', 'connect-ropes', input => { const a = firstArray(input); let cost = 0; while (a.length > 1) { a.sort((a, b) => a - b); const sum = a.shift() + a.shift(); cost += sum; a.push(sum); } return cost; });
  checkNumber('dynamic-programming', 'house-robber', input => { const a = firstArray(input); const solve = i => i >= a.length ? 0 : Math.max(solve(i + 1), a[i] + solve(i + 2)); return solve(0); });
  checkNumber('dynamic-programming', 'burst-balloons', input => { const solve = a => a.length ? Math.max(...a.map((v, i) => (a[i - 1] ?? 1) * v * (a[i + 1] ?? 1) + solve(a.filter((_, j) => i !== j)))) : 0; return solve(firstArray(input)); });
  checkNumber('tries', 'distinct-substrings', input => { const s = input.split('=')[1], found = new Set(); for (let i = 0; i < s.length; i++) for (let j = i + 1; j <= s.length; j++) found.add(s.slice(i, j)); return found.size; });
  checkNumber('bit-manipulation', 'count-set-bits', input => [...number(input).toString(2)].filter(bit => bit === '1').length);
  checkNumber('bit-manipulation', 'xor-range', input => { const [a, b] = input.match(/\d+/g).map(Number); return Array.from({ length: b - a + 1 }, (_, i) => i + a).reduce((x, y) => x ^ y, 0); });
  const graph = lesson('graphs', 'dijkstra');
  const edges = [...graph.input.matchAll(/(\d+)→(\d+):(\d+)/g)].map(match => match.slice(1).map(Number));
  const distances = [0, Infinity, Infinity];
  for (let i = 0; i < 2; i++) for (const [u, v, weight] of edges) distances[v] = Math.min(distances[v], distances[u] + weight);
  assert.deepEqual(JSON.parse(graph.answer), distances);
});
