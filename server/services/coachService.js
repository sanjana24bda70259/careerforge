const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const has = (text, terms) => terms.some(term => text.includes(term));

const replyFor = (message, stats) => {
  const lower = message.toLowerCase();
  if (has(lower, ['resume', 'cv', 'bullet'])) return {
    answer: 'Make every strong resume bullet show the problem, what you did, and the result. Lead with an action verb, name the technology only when it adds clarity, and quantify the outcome where you honestly can.',
    actions: ['Rewrite one project bullet as action → method → impact', 'Add a working project link only after checking it', 'Match the top skills in the role description to your real experience'],
    focus: 'Resume review'
  };
  if (has(lower, ['interview', 'hr round', 'tell me about'])) return {
    answer: 'Use a compact STAR answer: set the situation, state your responsibility, explain your decision and action, then close with an outcome. Be precise about what you personally did rather than what the team did.',
    actions: ['Write a 60–90 second STAR answer', 'Add one technical trade-off you can defend', 'Practice one follow-up question: “What would you improve?”'],
    focus: 'Interview practice'
  };
  if (has(lower, ['aptitude', 'percentage', 'profit', 'ratio', 'average', 'time and work', 'probability'])) return {
    answer: 'For aptitude, first identify the base quantity and the relationship being tested. Convert percentage changes to multipliers, ratios to total parts, and work/speed questions to rates before calculating.',
    actions: ['Name the base quantity before doing arithmetic', 'Write one equation or rate relationship', 'Check whether the requested answer is a value, ratio, percentage, or time'],
    focus: 'Aptitude reasoning'
  };
  if (has(lower, ['dsa', 'array', 'string', 'linked list', 'binary search', 'tree', 'graph', 'dynamic programming', 'leetcode', 'complexity'])) return {
    answer: 'Start by stating the input constraint, then choose a pattern before writing code. Explain why that pattern avoids repeated work and finish by stating time and space complexity.',
    actions: ['Write the brute-force idea in one sentence', 'Choose one fitting pattern: hash map, two pointers, window, stack, BFS/DFS, or DP', 'Test the approach on an empty input and one edge case'],
    focus: 'DSA problem solving'
  };
  if (has(lower, ['job', 'application', 'linkedin', 'placement'])) return {
    answer: 'Treat each application as a small research task: understand the role, tailor the most relevant proof from your projects, and decide a concrete follow-up date.',
    actions: ['Compare your resume against three role requirements', 'Prepare a two-line “why this role” answer', 'Log the next action and date in Jobs'],
    focus: 'Job search'
  };
  const solved = stats.solved || 0;
  return {
    answer: `Build momentum with one focused loop: learn a concept, practise it, then record what was difficult. You currently have ${solved} DSA problem${solved === 1 ? '' : 's'} solved in CareerForge, so the best next step is consistency rather than trying to cover everything at once.`,
    actions: ['Choose one DSA or aptitude topic', 'Complete a short practice set', 'Write one takeaway in Weekly Review'],
    focus: 'Preparation plan'
  };
};

export function buildCoachReply({ message = '', profile = {}, stats = {}, attachments = [] }) {
  const prompt = clean(message);
  const usableAttachments = attachments.filter(item => item?.text).map(item => ({ name: clean(item.name).slice(0, 120), text: clean(item.text).slice(0, 8000) }));
  const attachmentSignal = usableAttachments.map(item => item.text).join(' ').toLowerCase();
  const base = replyFor(`${prompt} ${attachmentSignal}`, stats);
  const context = usableAttachments.length ? `I considered text from ${usableAttachments.map(item => item.name).join(', ')}.` : null;
  const profileNote = profile?.targetRole ? ` Keep your examples relevant to your ${profile.targetRole} target.` : '';
  return {
    ...base,
    answer: `${base.answer}${profileNote}`,
    context,
    attachmentSummary: usableAttachments.map(item => ({ name: item.name, charactersUsed: item.text.length }))
  };
}
