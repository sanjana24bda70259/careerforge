import { LeetCodeProblem } from '../models/LeetCodeProblem.js';

const arrayTerms = ['array', 'matrix', 'sum', 'interval', 'rotate', 'merge', 'duplicate', 'subarray'];
const stringTerms = ['string', 'substring', 'palindrome', 'anagram', 'character', 'word', 'parentheses'];
const sectionFor = (title) => {
  const value = title.toLowerCase();
  if (stringTerms.some(term => value.includes(term))) return 'Strings';
  if (arrayTerms.some(term => value.includes(term))) return 'Arrays';
  return 'Other';
};
export async function syncLeetCodeCatalog() {
  const response = await fetch('https://leetcode.com/api/problems/all/', { headers: { 'User-Agent': 'CareerForge catalog importer' } });
  if (!response.ok) throw new Error(`LeetCode catalog request failed with status ${response.status}`);
  const payload = await response.json();
  const problems = payload.stat_status_pairs.filter(item => !item.paid_only && item.stat?.question__title_slug).map(item => ({
    leetCodeId: item.stat.frontend_question_id ? Number(item.stat.frontend_question_id) : item.stat.question_id,
    title: item.stat.question__title,
    slug: item.stat.question__title_slug,
    difficulty: ['Easy', 'Medium', 'Hard'][item.difficulty.level - 1],
    section: sectionFor(item.stat.question__title),
    url: `https://leetcode.com/problems/${item.stat.question__title_slug}/`
  })).filter(item => Number.isFinite(item.leetCodeId) && item.difficulty);
  const operations = problems.map(problem => ({ updateOne: { filter: { leetCodeId: problem.leetCodeId }, update: { $set: problem }, upsert: true } }));
  if (operations.length) await LeetCodeProblem.bulkWrite(operations, { ordered: false });
  return { imported: problems.length };
}
