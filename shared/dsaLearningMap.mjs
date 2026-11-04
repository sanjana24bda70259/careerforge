const branch = (id, title, cue, ids) => ({ id, title, cue, refs: ids.split(' ').filter(Boolean).map(value => value.includes(':') ? value : `arrays:${value}`) });
export const arrayPhases = [
  { id: 'foundations', title: 'Fundamentals & in-place operations', color: 'green', outcome: 'Read an array with confidence', branches: [
    branch('traversal', 'Traversal & linear search', 'Visit each index once. Trace the loop before optimising.', 'array-traversal linear-search check-sorted leaders-in-array'),
    branch('tracking', 'Min / max tracking', 'Keep only the best values seen so far.', 'maximum-element second-largest best-time-stock'),
    branch('reversal', 'Reversal & rotation', 'Practise swapping without losing values.', 'two-pointers:reverse-array rotate-array') ] },
  { id: 'linear-patterns', title: 'Two pointers, windows & prefix sums', color: 'blue', outcome: 'Replace repeated scans with reusable state', branches: [
    branch('pointers', 'Two-pointer patterns', 'Sorted input or in-place changes? Define what each pointer means.', 'remove-duplicates move-zeroes union-sorted-arrays merge-sorted-array rearrange-by-sign two-pointers:two-sum-sorted'),
    branch('windows', 'Contiguous windows', 'Track what enters and leaves a contiguous interval.', 'maximum-consecutive-ones sliding-window:max-sum-size-k'),
    branch('prefix', 'Prefix sums & range queries', 'Precompute totals when repeated range sums are the bottleneck.', 'cf-running-ledger cf-peak-altitude cf-balance-index cf-ledger-totals') ] },
  { id: 'search-sort', title: 'Searching & sorting', color: 'purple', outcome: 'Use order to reduce the search space', branches: [
    branch('ordered-search', 'Binary search', 'Sorted input? Keep the answer inside a shrinking interval.', 'binary-search:binary-search binary-search:lower-bound'),
    branch('reordering', 'Partitioning & ordering', 'Sort or partition when order makes the next decision simpler.', 'sort-colors next-permutation merge-intervals two-pointers:three-sum') ] },
  { id: 'hash-count', title: 'Hashing & counting', color: 'orange', outcome: 'Trade extra storage for faster lookup', branches: [
    branch('frequency', 'Lookup, frequency & cancellation', 'Use a set, map or a proven counting invariant.', 'two-sum longest-consecutive majority-element missing-number single-number'),
    branch('prefix-map', 'Prefix sum + hash map', 'For signed values, match earlier prefix totals instead of assuming a sliding window works.', 'subarray-sum-k hashing:longest-zero-sum') ] },
  { id: 'advanced', title: 'Matrices & dynamic patterns', color: 'rose', outcome: 'Connect multiple array techniques', branches: [
    branch('matrix', 'Matrix navigation', 'Track row/column boundaries and preserve overwritten information.', 'set-matrix-zeroes rotate-matrix spiral-matrix'),
    branch('dynamic', 'Contribution & dynamic programming', 'Define what one position contributes or which smaller state you can reuse.', 'maximum-subarray cf-odd-segments') ] }
];

export const questionKey = (topic, id) => `dsa:${topic}:${id}`;
export const isPractised = (question, items = {}) => question.status === 'solved' || items[questionKey(question.topic, question.id)]?.practised === true;

export function buildTopicMap(topic, topics, items = {}) {
  const byRef = new Map(topics.flatMap(t => (t.questions || []).map(q => [`${t.id}:${q.id}`, { ...q, topic: t.id, topicName: t.name }])));
  let definitions;
  if (topic.id === 'arrays') {
    definitions = arrayPhases;
  } else {
    // Difficulty is an explicit fallback sequence; Array has the curated prerequisite map above.
    definitions = ['Easy', 'Medium', 'Hard'].map((difficulty, i) => {
      const groups = new Map();
      for (const q of topic.questions || []) if (q.difficulty === difficulty) {
        const name = q.subcategory || 'Fundamentals';
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(`${topic.id}:${q.id}`);
      }
      return { id: difficulty.toLowerCase(), title: ['Build the foundations', 'Connect the patterns', 'Stretch your thinking'][i], color: ['green', 'blue', 'purple'][i], outcome: `${difficulty} problems, grouped by pattern`, branches: [...groups].map(([title, refs], index) => ({ id: `pattern-${index}`, title, cue: 'Explain the invariant, work through an example, then practise independently.', refs })) };
    });
  }
  const phases = definitions.map(phase => ({ ...phase, branches: phase.branches.map(b => ({ ...b, questions: b.refs.map(ref => byRef.get(ref)).filter(Boolean) })).filter(b => b.questions.length) })).filter(p => p.branches.length);
  const assigned = new Set(phases.flatMap(p => p.branches.flatMap(b => b.questions.map(q => `${q.topic}:${q.id}`))));
  const remaining = (topic.questions || []).filter(q => !assigned.has(`${topic.id}:${q.id}`));
  if (remaining.length) phases.push({ id: 'more-patterns', title: 'More patterns', color: 'blue', outcome: 'Explore the remaining topic exercises', branches: [{ id: 'additional', title: 'Additional practice', cue: 'Apply the foundations to these related problems.', questions: remaining.map(q => ({ ...q, topic: topic.id, topicName: topic.name })) }] });
  for (const phase of phases) {
    for (const b of phase.branches) { b.done = b.questions.filter(q => isPractised(q, items)).length; b.total = b.questions.length; }
    phase.done = phase.branches.reduce((n, b) => n + b.done, 0);
    phase.total = phase.branches.reduce((n, b) => n + b.total, 0);
    phase.complete = phase.done === phase.total;
  }
  const phase = phases.find(p => !p.complete);
  const nextBranch = phase?.branches.find(b => b.done < b.total);
  const question = nextBranch?.questions.find(q => !isPractised(q, items));
  return { phases, recommendation: question ? { phaseId: phase.id, branchId: nextBranch.id, branch: nextBranch.title, question, reason: nextBranch.cue } : null,
    done: phases.reduce((n, p) => n + p.done, 0), total: phases.reduce((n, p) => n + p.total, 0) };
}
