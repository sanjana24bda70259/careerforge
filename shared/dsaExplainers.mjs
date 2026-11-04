import { curriculumCatalog } from './dsaCurriculum.mjs';
import { storyRows } from './dsaStories.mjs';
import { advancedStoryRows } from './dsaStoriesAdvanced.mjs';
import { extraProblems } from './dsaExtraProblems.mjs';

// The same exercise can appear in multiple categories; keep progress IDs distinct.
const aliases = {
  'sort-colors-sorting': 'sort-colors', 'merge-overlapping-intervals-sort': 'merge-intervals',
  'two-sum-hash': 'two-sum', 'valid-anagram-hash': 'valid-anagram-string',
  'subarray-sum-hash': 'subarray-sum-k', 'longest-consecutive-hash': 'longest-consecutive',
  'reverse-string-pointers': 'reverse-string', 'palindrome-validation': 'valid-palindrome',
  'remove-duplicates-pointers': 'remove-duplicates', 'move-zeroes-pointers': 'move-zeroes',
  'merge-sorted-pointers': 'merge-sorted-array', 'sort-colors-pointers': 'sort-colors',
  'longest-substring-window': 'longest-substring', 'minimum-window-window': 'minimum-window',
  'window-maximum-queue': 'sliding-window-maximum', 'top-k-frequent-heap': 'top-k-frequent',
  'frequency-sort-heap': 'frequency-sort', 'merge-intervals-greedy': 'merge-intervals',
  'max-non-adjacent': 'house-robber', 'single-number-bits': 'single-number',
  'lru-cache-advanced': 'lru-cache', 'word-ladder-advanced': 'word-ladder'
};
const stories = new Map();
for (const row of [...storyRows, ...advancedStoryRows]) {
  const fields = row.split('|').map(field => field.trim());
  if (fields.length !== 6 || fields.some(field => !field)) throw new Error('Incomplete DSA worked example');
  const [id, input, scenes, answer, approach, edgeCase] = fields;
  if (stories.has(id)) throw new Error(`Duplicate DSA example: ${id}`);
  stories.set(id, { input, scenes: scenes.split(';').map(scene => scene.trim()), answer, approach, edgeCase });
}

for (const question of extraProblems) stories.set(question.id,question.story);
export const explainerLessons = Object.values(curriculumCatalog).flat().map(question => {
  const story = stories.get(aliases[question.id] || question.id);
  if (!story) throw new Error(`Missing DSA example: ${question.topic}/${question.id}`);
  return {
    ...question, ...story, questionId: question.id, id: `${question.topic}--${question.id}`,
    kind: 'explainer', category: question.topic.replaceAll('-', ' '),
    pattern: question.tags.slice(1).join(' · ') || 'Fundamentals',
    description: question.id==='smallest-divisor' ? 'Given positive integer values and a threshold, find the smallest positive divisor for which the sum of all rounded-up quotients is at most the threshold. The threshold is at least the array length, so an answer exists.' : story.approach, hint: story.edgeCase,
    ...(question.id==='smallest-divisor'?{constraints:['1 ≤ values.length ≤ 50,000','1 ≤ values[i] ≤ 1,000,000','values.length ≤ threshold ≤ 1,000,000']} : {}),
    examples: [{ input: story.input, output: story.answer }]
  };
});
const byId = new Map(explainerLessons.map(lesson => [lesson.id, lesson]));
export const explainerById = id => byId.get(id);

export function buildExplainerScenes(lesson) {
  return [
    { phase: 'Understand', title: 'Start with the question', text: lesson.approach, state: lesson.input },
    ...lesson.scenes.map((text, index) => ({ phase: 'Work it out', title: `Reasoning ${index + 1}`, text, state: text })),
    { phase: 'Result', title: 'Connect the steps', text: 'This is the result for our example. Replay the steps to see how we reached it.', state: lesson.answer },
    { phase: 'Try an edge case', title: 'One more thing to check', text: lesson.edgeCase, state: lesson.edgeCase }
  ];
}
