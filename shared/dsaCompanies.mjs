// Company evidence is a public, self-reported interview account or collection.
// The local exercise may only train the same pattern; match states this explicitly.
export const companySources = {
  amazon: { title:'Amazon SDE1 community question collection', url:'https://leetcode.com/discuss/post/488887/qgj1489223465553.html', type:'Community collection' },
  amazon2025: { title:'Amazon SDE-1 · Bangalore interview account', url:'https://leetcode.com/discuss/post/6425074/Amazon-or-SDE-1-or-Bangalore/', type:'Candidate report' },
  microsoft: { title:'Microsoft SDE · AI and Research interview account', url:'https://leetcode.com/discuss/post/128213/microsoft-sde/', type:'Candidate report' },
  meta: { title:'Meta E4 screening interview account', url:'https://leetcode.com/discuss/post/6106325/Meta-E4-Screening-Interview/', type:'Candidate report' },
  google: { title:'Google L4 · Bangalore interview account', url:'https://leetcode.com/discuss/post/6688364/', type:'Candidate report' },
  apple: { title:'Apple L4 / SDE2 · Hyderabad interview account', url:'https://leetcode.com/discuss/post/6461783/Apple-Interview-Experience-or-L4-or-SDE-2-or-Hyderabad/', type:'Candidate report' },
  adobe: { title:'Adobe MTS2 · Noida interview account', url:'https://leetcode.com/discuss/post/2904343/Adobe-or-Mts-2-or-Noida/', type:'Candidate report' },
  nvidia: { title:'NVIDIA OA and interview question collection', url:'https://leetcode.com/discuss/post/4837287/nvidia-oa-questions-by-anonymous_user-7s7n/', type:'Community collection' },
  uber: { title:'Uber L4 backend interview account', url:'https://leetcode.com/discuss/post/7706639/uber-l4-sde-2-interview-experience-offer-r0k1/', type:'Candidate report' },
  linkedin: { title:'LinkedIn SWE infrastructure interview account', url:'https://leetcode.com/discuss/post/7467807/linkedin-swe-infra-interview-experience-bq142/', type:'Candidate report' },
  goldman: { title:'Goldman Sachs DSA interview account', url:'https://leetcode.com/discuss/post/8130432/goldman-sachs-interview-experience-by-an-87jn/', type:'Candidate report' },
  jpmorgan: { title:'JPMorgan cohort interview account', url:'https://leetcode.com/discuss/post/6782891/', type:'Candidate report' },
  paypal: { title:'PayPal SDE-2 interview account', url:'https://leetcode.com/discuss/post/6752477/', type:'Candidate report' },
  salesforce: { title:'Salesforce MTS interview account', url:'https://leetcode.com/discuss/post/8508596/salesforce-mts-interview-experience-indi-dcdb/', type:'Candidate report' },
  atlassian: { title:'Atlassian P40 interview account', url:'https://leetcode.com/discuss/post/7495920/', type:'Candidate report' },
  flipkart: { title:'Flipkart SDE-1 interview account', url:'https://leetcode.com/discuss/post/1293510/flipkart-sde-1-offcampus-fresher-bangalore/', type:'Candidate report' },
  swiggy: { title:'Swiggy SDE-1 backend interview account', url:'https://leetcode.com/discuss/post/7424272/', type:'Candidate report' },
};
const entry = (title, ref, pattern, source, match = 'reported', note = '') => ({ title, ref, pattern, source, match, note });
export const dsaCompanies = [
  { id:'amazon', name:'Amazon', initials:'a', logo:'amazon', color:'#b37a2c', description:'Build from lookup and intervals into traversal and reusable states.', questions:[
    entry('Two Sum variant', 'arrays:two-sum', 'hashing', 'amazon2025', 'variant', 'The candidate describes a similar pair-sum problem; the exact statement is not supplied.'),
    entry('Merge Intervals', 'arrays:merge-intervals', 'intervals', 'amazon'),
    entry('Valid Parentheses', 'stack-queue:valid-parentheses', 'stack', 'amazon'),
    entry('Number of Islands', 'graphs:number-islands', 'graphs', 'amazon'),
    entry('Best Time to Buy and Sell Stock', 'arrays:best-time-stock', 'linear-scan', 'amazon'),
    entry('Longest Increasing Subsequence', 'dynamic-programming:longest-increasing-subsequence', 'dynamic-programming', 'amazon'),
    entry('Course Schedule II variant', 'graphs:topological-sort', 'graphs', 'amazon2025', 'related', 'Practise topological ordering here; the report describes a Course Schedule II-like task.'),
  ]},
  { id:'microsoft', name:'Microsoft', initials:'M', logo:'microsoft', color:'#5e8c78', description:'Connect ordered search with trees, dependencies and backtracking.', questions:[
    entry('Search in a rotated sorted array', 'binary-search:search-rotated-array', 'binary-search', 'microsoft'),
    entry('Construct a BST from preorder', 'bst:bst-preorder', 'trees', 'microsoft'),
    entry('Word search in a character grid', 'recursion:word-search', 'recursion', 'microsoft', 'variant', 'The report searches for words from a list. This exercise practises finding one word.'),
    entry('Print nodes in dependency order', 'graphs:topological-sort', 'graphs', 'microsoft'),
  ]},
  { id:'meta', name:'Meta', initials:'∞', logo:'meta', color:'#678eb4', description:'Practise pointer invariants, frequency counts and top-k tradeoffs.', questions:[
    entry('Valid Palindrome II', 'strings:valid-palindrome', 'two-pointers', 'meta', 'related', 'The reported problem allows one deletion. Start with this palindrome foundation, then reason about skipping either mismatched endpoint.'),
    entry('Top K Frequent Elements', 'hashing:top-k-frequent', 'heap', 'meta', 'reported', 'The report includes a follow-up asking for better than O(n log n); compare bucket counting with a heap.'),
  ]},
  { id:'google', name:'Google', initials:'G', logo:'google', color:'#8e78ac', description:'Use these reports to connect graph components, hashing and windows.', questions:[
    entry('Connected groups of 1s in a binary tree', 'graphs:number-islands', 'graphs', 'google', 'related', 'The report uses a binary tree, not a grid. This local exercise trains the connected-component idea.'),
    entry('Accounts Merge variant', 'graphs:disjoint-set-union', 'graphs', 'google', 'related', 'Use the union-find foundation, then model accounts sharing an email address. The report mentions a variation.'),
    entry('Unique phone numbers in the last K minutes', 'sliding-window:longest-substring-window', 'sliding-window', 'google', 'related', 'The report uses timestamped events. This local exercise is a frequency-window prerequisite, not the same question.'),
  ]},
  { id:'apple', name:'Apple', initials:'A', logo:'apple', color:'#7d8591', description:'A reported backend interview connects merging, frequency and string scans.', questions:[
    entry('Merge two sorted arrays', 'arrays:merge-sorted-array', 'two-pointers', 'apple', 'variant', 'The report names the task but does not specify its storage contract; check whether in-place merging is required.'),
    entry('Top K frequent elements', 'hashing:top-k-frequent', 'heap', 'apple'),
    entry('Longest Common Prefix', 'strings:longest-common-prefix', 'linear-scan', 'apple'),
  ]},
  { id:'adobe', name:'Adobe', initials:'Ad', logo:'adobe', color:'#b47870', description:'Work from sorted-list merging toward string dynamic programming.', questions:[
    entry('Merge sorted linked lists', 'linked-list:merge-two-lists', 'linked-list', 'adobe', 'variant', 'The report does not give the complete list-count or storage constraints.'),
    entry('Wildcard-matching-style problem', 'dynamic-programming:wildcard-matching', 'dynamic-programming', 'adobe', 'variant', 'The candidate describes a similar DP task; this is practice for that pattern.'),
  ]},
  { id:'nvidia', name:'NVIDIA', initials:'NV', logo:'nvidia', color:'#76b900', description:'Move between bit tricks, arrays, linked lists, grids and stack patterns.', questions:[
    entry('Reverse Linked List', 'linked-list:reverse-linked-list', 'linked-list', 'nvidia'),
    entry('Power of Two', 'bit-manipulation:power-of-two', 'bits', 'nvidia'),
    entry('Two Sum', 'arrays:two-sum', 'hashing', 'nvidia'),
    entry('Climbing Stairs', 'dynamic-programming:climbing-stairs', 'dynamic-programming', 'nvidia'),
    entry('Maximum Subarray', 'arrays:maximum-subarray', 'dynamic-programming', 'nvidia'),
    entry('Rotate Image', 'arrays:rotate-matrix', 'matrix', 'nvidia'),
    entry('Number of Islands', 'graphs:number-islands', 'graphs', 'nvidia'),
    entry('Search in Rotated Sorted Array', 'binary-search:search-rotated-array', 'binary-search', 'nvidia'),
    entry('Minimum Path Sum', 'dynamic-programming:minimum-path-sum', 'dynamic-programming', 'nvidia'),
    entry('Binary Tree Right Side View', 'trees:left-right-view', 'trees', 'nvidia', 'variant', 'The local exercise covers both left and right views; practise the right-view traversal requested by the collection.'),
    entry('Generate Parentheses', 'recursion:generate-parentheses', 'recursion', 'nvidia'),
    entry('Merge k Sorted Lists', 'heap:merge-k-lists', 'heap', 'nvidia'),
    entry('Daily Temperatures', 'stack-queue:daily-temperatures', 'stack', 'nvidia'),
  ]},
  { id:'uber', name:'Uber', initials:'U', logo:'uber', color:'#111111', description:'Practise connectivity, shortest paths and time-window selection.', questions:[
    entry('Number of Islands, then a 3D extension', 'graphs:number-islands', 'graphs', 'uber', 'variant', 'The report starts with the familiar 2D problem and then extends the model to three dimensions.'),
    entry('2D disjoint-set implementation', 'graphs:disjoint-set-union', 'graphs', 'uber', 'variant', 'The report applies DSU to a two-dimensional connectivity problem.'),
    entry('DFS evolving into Dijkstra', 'graphs:dijkstra', 'graphs', 'uber', 'related', 'Practise Dijkstra here; the report describes a staged DFS-to-shortest-path problem without the complete statement.'),
    entry('Top-k over a sliding window', 'sliding-window:sliding-window-maximum', 'sliding-window', 'uber', 'related', 'The system-design discussion combines top-k selection with a time window; this exercise builds the window invariant.'),
  ]},
  { id:'linkedin', name:'LinkedIn', initials:'in', logo:'linkedin', color:'#0a66c2', description:'Combine recursive generation with graph-distance reasoning.', questions:[
    entry('Letter Combinations of a Phone Number', 'recursion:letter-combinations', 'recursion', 'linkedin', 'variant', 'The report describes a problem similar to this standard backtracking exercise.'),
    entry('Minimum Knight Moves', 'graphs:shortest-path-unweighted', 'graphs', 'linkedin', 'related', 'Model board positions as graph nodes and practise unweighted shortest path before adding the knight-move transitions.'),
  ]},
  { id:'goldman-sachs', name:'Goldman Sachs', initials:'GS', logo:'goldmansachs', color:'#6b91c8', description:'A compact set spanning grids, two pointers, ordered search and DP.', questions:[
    entry('Number of Islands', 'graphs:number-islands', 'graphs', 'goldman'),
    entry('Trapping Rain Water', 'two-pointers:trapping-rain-water', 'two-pointers', 'goldman'),
    entry('Search in Rotated Sorted Array', 'binary-search:search-rotated-array', 'binary-search', 'goldman'),
    entry('2D DP similar to Frog Jump', 'dynamic-programming:frog-jump', 'dynamic-programming', 'goldman', 'related', 'The assessment used a two-dimensional DP problem described as similar to Frog Jump; this is a recurrence prerequisite.'),
  ]},
  { id:'jpmorgan', name:'JPMorgan', initials:'JPM', logo:'jpmorgan', color:'#775d50', description:'Start with stack invariants used in a reported balanced-brackets task.', questions:[
    entry('Balanced Brackets', 'stack-queue:valid-parentheses', 'stack', 'jpmorgan', 'variant', 'The report calls it a classic balanced-bracket problem and mentions a constant-space follow-up.'),
  ]},
  { id:'paypal', name:'PayPal', initials:'PP', logo:'paypal', color:'#0070ba', description:'Build a foundation in traversal and priority-queue decisions.', questions:[
    entry('Tree traversal with edge cases', 'trees:tree-traversal', 'trees', 'paypal', 'related', 'The report names tree traversal as the interview topic without specifying the exact traversal order.'),
    entry('Heap usage in real scenarios', 'heap:heap-basics', 'heap', 'paypal', 'related', 'Use this exercise to learn heap operations before applying them to a product scenario.'),
  ]},
  { id:'salesforce', name:'Salesforce', initials:'SF', logo:'salesforce', color:'#00a1e0', description:'Connect intervals, windows, dependencies and reusable DP states.', questions:[
    entry('Maximum requests within a window', 'sliding-window:minimum-size-subarray', 'sliding-window', 'salesforce', 'related', 'The report asks for a maximum count in a timestamp window; this exercise trains maintaining a variable window.'),
    entry('Merge Intervals', 'arrays:merge-intervals', 'intervals', 'salesforce'),
    entry('Weighted job scheduling', 'dynamic-programming:house-robber', 'dynamic-programming', 'salesforce', 'related', 'The reported task combines DP with binary search. House Robber is a smaller choose-or-skip recurrence to learn first.'),
    entry('Direct and indirect task dependencies', 'graphs:graph-dfs', 'graphs', 'salesforce', 'related', 'Practise graph traversal here, then precompute reachability for repeated dependency queries.'),
  ]},
  { id:'atlassian', name:'Atlassian', initials:'A', logo:'atlassian', color:'#1868db', description:'Practise sweep-line interval thinking and top-k heavy hitters.', questions:[
    entry('Merge Intervals with sweep-line follow-ups', 'greedy:merge-intervals-greedy', 'intervals', 'atlassian', 'variant', 'The report describes a differently worded interval problem with sweep-line follow-ups.'),
    entry('Top-k heavy hitters for Confluence pages', 'hashing:top-k-frequent', 'heap', 'atlassian', 'related', 'The reported system adds a user-view exclusion rule. This local exercise trains the core top-k frequency operation.'),
  ]},
  { id:'flipkart', name:'Flipkart', initials:'F', logo:'flipkart', color:'#2874f0', description:'A broad sequence from streaming heaps to tries, windows and stacks.', questions:[
    entry('Running median in a stream', 'heap:median-data-stream', 'heap', 'flipkart', 'variant', 'The report asks for a running median; the local exercise implements the standard two-heap structure.'),
    entry('Minimum mixed-case substring', 'strings:minimum-window', 'sliding-window', 'flipkart', 'related', 'The reported condition differs, but Minimum Window builds the same counted-window discipline.'),
    entry('Palindromic-pairs variation using a trie', 'tries:trie-insert-search-prefix', 'tries', 'flipkart', 'related', 'Start with trie insert/search/prefix operations before modelling reversed suffixes and palindrome checks.'),
    entry('Largest Rectangle in Histogram', 'stack-queue:largest-histogram', 'stack', 'flipkart'),
    entry('Count elements greater on the right', 'stack-queue:next-greater-element', 'stack', 'flipkart', 'related', 'The report expects an O(n log n) counting structure; this local exercise first trains the nearby next-greater relation.'),
  ]},
  { id:'swiggy', name:'Swiggy', initials:'S', logo:'swiggy', color:'#fc8019', description:'Practise windows, shortest paths, answer search and reusable DP.', questions:[
    entry('Sliding-window assessment problem', 'sliding-window:longest-substring-window', 'sliding-window', 'swiggy', 'related', 'The report names the pattern but does not disclose the complete assessment statement.'),
    entry('Shortest-path assessment problem', 'graphs:shortest-path-unweighted', 'graphs', 'swiggy', 'related', 'The report names a shortest-path graph problem without its full constraints.'),
    entry('Array problem using nth root', 'binary-search:nth-root', 'binary-search', 'swiggy', 'related', 'Practise binary search on the answer with the local nth-root exercise.'),
    entry('Count structurally unique binary trees', 'dynamic-programming:fibonacci-dp', 'dynamic-programming', 'swiggy', 'related', 'The reported task uses a Catalan recurrence. Fibonacci DP is a smaller introduction to memoised state transitions.'),
    entry('Unbounded Knapsack', 'dynamic-programming:unbounded-knapsack', 'dynamic-programming', 'swiggy'),
  ]},
];
export const dsaCompanyGroups = [
  { id:'big-tech', title:'Big Tech', description:'Hyperscalers and global product companies.', companyIds:['amazon','google','meta','apple','microsoft','nvidia'] },
  { id:'finance', title:'Finance & Banking', description:'Banking and financial technology teams.', companyIds:['goldman-sachs','jpmorgan'] },
  { id:'fintech', title:'Fintech', description:'Payments and financial platforms.', companyIds:['paypal'] },
  { id:'marketplace', title:'Marketplace & Mobility', description:'Mobility, delivery and local commerce.', companyIds:['uber','swiggy'] },
  { id:'enterprise-saas', title:'Enterprise SaaS', description:'Developer tools, productivity and data platforms.', companyIds:['linkedin','salesforce','adobe','atlassian'] },
  { id:'indian', title:'Indian product companies', description:'Product companies built from India.', companyIds:['flipkart'] },
];
export const companyEvidenceChecked = '2026-10-27';
