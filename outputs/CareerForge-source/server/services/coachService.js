export function buildCoachReply({ message = '', profile = {}, stats = {} }) {
  const lower = message.toLowerCase();
  if (lower.includes('resume')) return { answer: 'Prioritize measurable project outcomes, role-relevant keywords, and concise action verbs. Start by improving one project bullet today.', actions: ['Add one quantified project result', 'Review skills for target role', 'Check your project links'] };
  if (lower.includes('interview')) return { answer: 'Practice one structured answer using Situation, Action, and Result. Then revisit the technical decisions behind your strongest project.', actions: ['Practice one project answer', 'Review OOP and SQL', 'Schedule a mock interview'] };
  const solved = stats.solved || profile.problemsSolved || 0;
  return { answer: `Based on ${solved} solved problems and your current profile, focus on one DSA pattern, a short aptitude set, and one career task today.`, actions: ['Solve 2 DSA problems', 'Practice 10 aptitude questions', 'Improve one resume bullet'] };
}
