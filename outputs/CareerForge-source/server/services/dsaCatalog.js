export const dsaTopics = [
  { id: 'arrays', name: 'Arrays', group: 'Foundations', difficulty: 'Easy', estimatedHours: 6, problems: 12, prerequisites: [] },
  { id: 'strings', name: 'Strings', group: 'Foundations', difficulty: 'Easy', estimatedHours: 5, problems: 10, prerequisites: [] },
  { id: 'hashing', name: 'Hashing', group: 'Foundations', difficulty: 'Easy', estimatedHours: 5, problems: 10, prerequisites: ['arrays'] },
  { id: 'two-pointers', name: 'Two Pointers', group: 'Foundations', difficulty: 'Medium', estimatedHours: 5, problems: 9, prerequisites: ['arrays', 'strings'] },
  { id: 'sliding-window', name: 'Sliding Window', group: 'Foundations', difficulty: 'Medium', estimatedHours: 6, problems: 10, prerequisites: ['two-pointers'] },
  { id: 'linked-list', name: 'Linked List', group: 'Linear Data Structures', difficulty: 'Medium', estimatedHours: 6, problems: 11, prerequisites: ['arrays'] },
  { id: 'stack-queue', name: 'Stack & Queue', group: 'Linear Data Structures', difficulty: 'Medium', estimatedHours: 6, problems: 10, prerequisites: ['arrays'] },
  { id: 'binary-search', name: 'Binary Search', group: 'Searching', difficulty: 'Easy', estimatedHours: 5, problems: 9, prerequisites: ['arrays'] },
  { id: 'binary-search-answer', name: 'Binary Search on Answer', group: 'Searching', difficulty: 'Medium', estimatedHours: 5, problems: 7, prerequisites: ['binary-search'] },
  { id: 'recursion', name: 'Recursion Basics', group: 'Recursion', difficulty: 'Medium', estimatedHours: 6, problems: 8, prerequisites: ['arrays'] },
  { id: 'backtracking', name: 'Backtracking', group: 'Recursion', difficulty: 'Hard', estimatedHours: 9, problems: 10, prerequisites: ['recursion'] },
  { id: 'trees', name: 'Binary Tree', group: 'Trees', difficulty: 'Medium', estimatedHours: 10, problems: 15, prerequisites: ['recursion'] },
  { id: 'bst', name: 'Binary Search Tree', group: 'Trees', difficulty: 'Medium', estimatedHours: 6, problems: 9, prerequisites: ['trees'] },
  { id: 'graphs', name: 'Graphs: BFS & DFS', group: 'Graphs', difficulty: 'Hard', estimatedHours: 12, problems: 16, prerequisites: ['trees'] },
  { id: 'dynamic-programming', name: 'Dynamic Programming', group: 'Dynamic Programming', difficulty: 'Hard', estimatedHours: 16, problems: 20, prerequisites: ['recursion'] }
];

export const dsaProblems = [
  { id: 'two-sum', title: 'Two Sum', topicId: 'arrays', difficulty: 'Easy', pattern: 'Hashing', companies: ['Amazon', 'Microsoft'], source: 'LeetCode', url: 'https://leetcode.com/problems/two-sum/' },
  { id: 'best-time-stock', title: 'Best Time to Buy and Sell Stock', topicId: 'arrays', difficulty: 'Easy', pattern: 'One pass', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { id: 'product-except-self', title: 'Product of Array Except Self', topicId: 'arrays', difficulty: 'Medium', pattern: 'Prefix / suffix', companies: ['Meta'], source: 'LeetCode', url: 'https://leetcode.com/problems/product-of-array-except-self/' },
  { id: 'valid-anagram', title: 'Valid Anagram', topicId: 'hashing', difficulty: 'Easy', pattern: 'Frequency map', companies: ['Meta'], source: 'LeetCode', url: 'https://leetcode.com/problems/valid-anagram/' },
  { id: 'group-anagrams', title: 'Group Anagrams', topicId: 'hashing', difficulty: 'Medium', pattern: 'Hash map', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/group-anagrams/' },
  { id: 'longest-substring', title: 'Longest Substring Without Repeating Characters', topicId: 'sliding-window', difficulty: 'Medium', pattern: 'Sliding window', companies: ['Amazon', 'Google'], source: 'LeetCode', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
  { id: 'minimum-window', title: 'Minimum Window Substring', topicId: 'sliding-window', difficulty: 'Hard', pattern: 'Sliding window', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/minimum-window-substring/' },
  { id: 'valid-parentheses', title: 'Valid Parentheses', topicId: 'stack-queue', difficulty: 'Easy', pattern: 'Stack', companies: ['Microsoft'], source: 'LeetCode', url: 'https://leetcode.com/problems/valid-parentheses/' },
  { id: 'daily-temperatures', title: 'Daily Temperatures', topicId: 'stack-queue', difficulty: 'Medium', pattern: 'Monotonic stack', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/daily-temperatures/' },
  { id: 'binary-search', title: 'Binary Search', topicId: 'binary-search', difficulty: 'Easy', pattern: 'Binary search', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/binary-search/' },
  { id: 'search-rotated-array', title: 'Search in Rotated Sorted Array', topicId: 'binary-search', difficulty: 'Medium', pattern: 'Binary search', companies: ['Google'], source: 'LeetCode', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
  { id: 'koko-bananas', title: 'Koko Eating Bananas', topicId: 'binary-search-answer', difficulty: 'Medium', pattern: 'Binary search on answer', companies: ['Google'], source: 'LeetCode', url: 'https://leetcode.com/problems/koko-eating-bananas/' },
  { id: 'reverse-linked-list', title: 'Reverse Linked List', topicId: 'linked-list', difficulty: 'Easy', pattern: 'Pointers', companies: ['Microsoft'], source: 'LeetCode', url: 'https://leetcode.com/problems/reverse-linked-list/' },
  { id: 'linked-list-cycle', title: 'Linked List Cycle', topicId: 'linked-list', difficulty: 'Easy', pattern: 'Fast and slow pointers', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/linked-list-cycle/' },
  { id: 'subsets', title: 'Subsets', topicId: 'backtracking', difficulty: 'Medium', pattern: 'Backtracking', companies: ['Meta'], source: 'LeetCode', url: 'https://leetcode.com/problems/subsets/' },
  { id: 'combination-sum', title: 'Combination Sum', topicId: 'backtracking', difficulty: 'Medium', pattern: 'Backtracking', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/combination-sum/' },
  { id: 'maximum-depth-tree', title: 'Maximum Depth of Binary Tree', topicId: 'trees', difficulty: 'Easy', pattern: 'DFS', companies: ['Google'], source: 'LeetCode', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
  { id: 'validate-bst', title: 'Validate Binary Search Tree', topicId: 'bst', difficulty: 'Medium', pattern: 'DFS', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
  { id: 'number-islands', title: 'Number of Islands', topicId: 'graphs', difficulty: 'Medium', pattern: 'BFS / DFS', companies: ['Amazon', 'Google'], source: 'LeetCode', url: 'https://leetcode.com/problems/number-of-islands/' },
  { id: 'course-schedule', title: 'Course Schedule', topicId: 'graphs', difficulty: 'Medium', pattern: 'Topological sort', companies: ['Meta'], source: 'LeetCode', url: 'https://leetcode.com/problems/course-schedule/' },
  { id: 'climbing-stairs', title: 'Climbing Stairs', topicId: 'dynamic-programming', difficulty: 'Easy', pattern: '1D DP', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/climbing-stairs/' },
  { id: 'coin-change', title: 'Coin Change', topicId: 'dynamic-programming', difficulty: 'Medium', pattern: '1D DP', companies: ['Amazon'], source: 'LeetCode', url: 'https://leetcode.com/problems/coin-change/' },
  { id: 'longest-common-subsequence', title: 'Longest Common Subsequence', topicId: 'dynamic-programming', difficulty: 'Medium', pattern: '2D DP', companies: ['Google'], source: 'LeetCode', url: 'https://leetcode.com/problems/longest-common-subsequence/' }
];

export const dsaDiagnosticQuestions = {
  arrays: [
    { id: 'a1', prompt: 'What is the time complexity of reading an item by index from a standard array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 0 },
    { id: 'a2', prompt: 'Which technique is often used to find a pair with a target sum in a sorted array?', options: ['Two pointers', 'DFS', 'Topological sort', 'Union find'], answer: 0 },
    { id: 'a3', prompt: 'What is the usual cost of inserting at the beginning of an array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2 }
  ],
  strings: [
    { id: 's1', prompt: 'Which structure is useful for counting character frequency?', options: ['Hash map', 'Heap only', 'Stack only', 'Queue only'], answer: 0 },
    { id: 's2', prompt: 'What is commonly used to test if a string is a palindrome?', options: ['Two pointers', 'Dijkstra', 'Binary lifting', 'MST'], answer: 0 },
    { id: 's3', prompt: 'Comparing two strings character by character takes what time in the worst case?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2 }
  ],
  'binary-search': [
    { id: 'b1', prompt: 'Binary search requires which property?', options: ['Sorted search space', 'A graph', 'A stack', 'Random values'], answer: 0 },
    { id: 'b2', prompt: 'What is binary search time complexity?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 1 },
    { id: 'b3', prompt: 'A safe midpoint expression avoids overflow by using:', options: ['low + (high - low) / 2', 'low * high', 'high - low', 'low / high'], answer: 0 }
  ]
};

export const topicForSkill = (skill = '') => {
  const normalized = skill.toLowerCase().replace(/\s|&/g, '');
  const aliases = { hashmap: 'hashing', dp: 'dynamicprogramming', trees: 'binarytree', graph: 'graphs' };
  if (aliases[normalized]) return dsaTopics.find(topic => topic.name.toLowerCase().replace(/\s|&/g, '').includes(aliases[normalized]));
  return dsaTopics.find(topic => topic.name.toLowerCase().replace(/\s|&/g, '').includes(normalized));
};
