export const linearSearchTheory = {
  concept: 'Linear search checks elements in their original order until it finds the target. It works on sorted or unsorted arrays and returns the first matching zero-based index. If nothing matches, it returns -1.',
  baseline: 'Compare the target with values[0], then values[1], and so on. There is no sorting or extra data structure to build. For a single search on arbitrary unsorted data, this direct scan is already worst-case optimal.',
  optimal: 'Keep an index i. Before checking position i, every earlier position has been checked and does not contain the target. Return i on a match; otherwise advance i. If i reaches the array length, return -1.',
  steps: ['Start at index 0.', 'Compare the current element with the target.', 'If equal, return the current index immediately.', 'Otherwise advance to the next index and repeat.', 'If every element has been checked, return -1.'],
  cases: [
    { name: 'Best', time: 'O(1)', explanation: 'The first element matches. Only one comparison is needed for a nonempty array.' },
    { name: 'Average', time: 'O(n)', explanation: 'If a successful target is equally likely at any position, the expected number of comparisons is (n + 1) / 2, which grows linearly.' },
    { name: 'Worst', time: 'O(n)', explanation: 'The target is last or absent, so all n elements must be inspected.' }
  ],
  complexity: 'O(n) worst-case time and O(1) auxiliary space. Only an index is stored; the input array is not copied or modified.',
  code: {
    Java: 'int linearSearch(int[] values, int target) {\n    for (int i = 0; i < values.length; i++) {\n        if (values[i] == target) return i;\n    }\n    return -1;\n}',
    Python: 'def linear_search(values, target):\n    for i, value in enumerate(values):\n        if value == target:\n            return i\n    return -1',
    'C++': '#include <vector>\n\nint linearSearch(const std::vector<int>& values, int target) {\n    for (int i = 0; i < static_cast<int>(values.size()); ++i) {\n        if (values[i] == target) return i;\n    }\n    return -1;\n}',
    JavaScript: 'function linearSearch(values, target) {\n  for (let i = 0; i < values.length; i++) {\n    if (values[i] === target) return i;\n  }\n  return -1;\n}'
  }
};
