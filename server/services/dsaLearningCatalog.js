const sheet = (id, title, topicIds, patterns, complexities, template) => ({
  id,
  title,
  topicIds,
  coreConcepts: patterns.slice(0, 3),
  patterns,
  complexities,
  techniques: ['State the invariant first', 'Test an empty input and one-item input', 'Check boundary updates before optimizing'],
  template
});

export const dsaCheatsheets = [
  sheet('arrays', 'Arrays', ['arrays'], ['Two pointers', 'Sliding window', 'Prefix sum', 'Kadane’s algorithm', 'Hashing'], ['Traversal — O(n)', 'Binary search — O(log n)', 'Sorting — O(n log n)'], 'for (let i = 0; i < n; i += 1) {\n  // inspect arr[i]\n}'),
  sheet('strings', 'Strings', ['strings'], ['Frequency map', 'Two pointers', 'Expand around centre', 'Sliding window'], ['Traversal — O(n)', 'Frequency map — O(n)'], 'const count = new Map();\nfor (const ch of text) count.set(ch, (count.get(ch) || 0) + 1);'),
  sheet('linked-lists', 'Linked Lists', ['linked-list'], ['Dummy node', 'Fast and slow pointers', 'In-place reversal'], ['Traversal — O(n)', 'Lookup — O(n)'], 'let slow = head;\nlet fast = head;\nwhile (fast && fast.next) { slow = slow.next; fast = fast.next.next; }'),
  sheet('stack-queue', 'Stack & Queue', ['stack-queue'], ['Monotonic stack', 'Deque', 'Expression parsing'], ['Push/pop — O(1)', 'Monotonic scan — O(n)'], 'const stack = [];\nfor (const value of values) {\n  while (stack.length && stack.at(-1) < value) stack.pop();\n  stack.push(value);\n}'),
  sheet('binary-search', 'Binary Search', ['binary-search'], ['Search space', 'First/last occurrence', 'Binary search on answer'], ['Search — O(log n)', 'Sorted check — O(n)'], 'let lo = 0, hi = arr.length - 1;\nwhile (lo <= hi) {\n  const mid = lo + Math.floor((hi - lo) / 2);\n  // move lo or hi\n}'),
  sheet('trees', 'Trees', ['trees'], ['DFS', 'BFS', 'Recursive traversal'], ['Traversal — O(n)', 'Height — O(n)'], 'const dfs = node => {\n  if (!node) return;\n  dfs(node.left);\n  dfs(node.right);\n};'),
  sheet('bst', 'Binary Search Trees', ['bst'], ['Ordering invariant', 'Inorder traversal', 'Range validation'], ['Search/insert — O(h)', 'Balanced average — O(log n)'], 'const search = (node, value) => {\n  if (!node || node.val === value) return node;\n  return value < node.val ? search(node.left, value) : search(node.right, value);\n};'),
  sheet('graphs', 'Graphs', ['graphs'], ['DFS', 'BFS', 'Topological sort', 'Visited set'], ['BFS/DFS — O(V + E)', 'Dijkstra — O((V + E) log V)'], 'const queue = [start];\nconst seen = new Set([start]);\nfor (let i = 0; i < queue.length; i += 1) {\n  for (const next of graph[queue[i]]) if (!seen.has(next)) { seen.add(next); queue.push(next); }\n}'),
  sheet('dynamic-programming', 'Dynamic Programming', ['dynamic-programming'], ['State definition', 'Transition', 'Memoization', 'Tabulation'], ['Typical table fill — O(states × transitions)'], 'const dp = Array(n + 1).fill(0);\ndp[0] = 1;\nfor (let i = 1; i <= n; i += 1) {\n  // derive dp[i] from earlier states\n}'),
  sheet('greedy', 'Greedy', ['greedy'], ['Exchange argument', 'Sort by choice', 'Interval selection'], ['Sort then scan — O(n log n)'], 'items.sort((a, b) => a.end - b.end);\nlet chosen = [];\nfor (const item of items) {\n  if (canTake(item, chosen)) chosen.push(item);\n}'),
  sheet('recursion', 'Recursion & Backtracking', ['recursion'], ['Base case', 'Choose/explore/unchoose', 'Pruning'], ['Tree search — depends on branching factor'], 'const solve = (index, path) => {\n  if (index === items.length) return record(path);\n  path.push(items[index]); solve(index + 1, path);\n  path.pop(); solve(index + 1, path);\n};'),
  sheet('hashing', 'Hashing', ['hashing'], ['Frequency count', 'Membership set', 'Prefix-sum map'], ['Average lookup — O(1)', 'Space — O(n)'], 'const seen = new Map();\nfor (let i = 0; i < values.length; i += 1) {\n  // query before updating when needed\n  seen.set(values[i], i);\n}'),
  sheet('heaps', 'Heaps', ['heap'], ['Top K', 'Priority queue', 'Two heaps'], ['Push/pop — O(log n)', 'Peek — O(1)'], '// Use a priority queue abstraction; document min/max ordering explicitly.'),
  sheet('tries', 'Tries', ['tries'], ['Prefix traversal', 'Word marking', 'Backtracking on a trie'], ['Insert/search — O(word length)'], 'class TrieNode {\n  constructor() { this.children = new Map(); this.end = false; }\n}'),
  sheet('bit-manipulation', 'Bit Manipulation', ['bit-manipulation'], ['XOR pairs', 'Bit mask', 'Subset enumeration'], ['Bit operation — O(1)', 'Subset enumeration — O(2^n)'], 'const hasBit = (mask, bit) => (mask & (1 << bit)) !== 0;'),
  sheet('sorting', 'Sorting', ['sorting'], ['Comparison sort', 'Counting sort', 'Custom comparators'], ['Merge sort — O(n log n)', 'Counting sort — O(n + k)'], 'values.sort((a, b) => a - b);')
];

const striverA2zCourseUrl = 'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet';

export const dsaVideoResources = topicId => [{
  id: `${topicId}-lesson-1`,
  title: 'Striver’s A2Z DSA course videos',
  topicId,
  provider: 'takeUforward / Striver',
  url: striverA2zCourseUrl,
  verified: true,
  actionLabel: 'Open course videos',
  message: `Open the verified course, then choose ${topicId.replace(/-/g, ' ')} from its syllabus for the matching video lessons.`
}];

export const cheatsheetById = id => dsaCheatsheets.find(item => item.id === id);
