const typoMap = new Map([
  ['roadmao', 'roadmap'], ['roadmp', 'roadmap'], ['analst', 'analyst'], ['analyt', 'analyst'],
  ['aptitute', 'aptitude'], ['aptitide', 'aptitude'], ['interveiw', 'interview'], ['intervew', 'interview'],
  ['binnary', 'binary'], ['binarry', 'binary'], ['percantage', 'percentage'], ['percntage', 'percentage']
]);

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

export const normalizeCopilotText = value => clean(value).toLowerCase()
  .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
  .split(/\s+/)
  .filter(Boolean)
  .map(word => typoMap.get(word) || word)
  .join(' ');

const includesOne = (text, terms) => terms.some(term => text.includes(term));
const hasCode = value => /```|\b(public\s+static\s+void|class\s+\w+|def\s+\w+|console\.log|System\.out|SELECT\s+.+\s+FROM)\b/i.test(value);

export const supportedRoles = [
  'Software Engineer', 'Data Analyst', 'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'
];

const roleMatchers = [
  ['data analyst', 'Data Analyst'], ['data scientist', 'Data Scientist'],
  ['frontend developer', 'Frontend Developer'], ['front end developer', 'Frontend Developer'],
  ['backend developer', 'Backend Developer'], ['back end developer', 'Backend Developer'],
  ['full stack developer', 'Full Stack Developer'], ['fullstack developer', 'Full Stack Developer'],
  ['software engineer', 'Software Engineer'], ['sde', 'Software Engineer']
];

export function requestedRole(message, history = [], profile = {}) {
  const sources = [message, ...[...history].reverse().filter(item => item?.role === 'user').map(item => item.content)];
  for (const source of sources) {
    const text = normalizeCopilotText(source);
    const match = roleMatchers.find(([phrase]) => text.includes(phrase));
    if (match) return match[1];
  }
  return supportedRoles.includes(profile?.targetRole) ? profile.targetRole : clean(profile?.targetRole) || null;
}

const historyFocus = history => clean([...history].reverse().find(item => item?.role === 'assistant')?.intent).toUpperCase();

export function detectCopilotIntent({ message = '', history = [] }) {
  const text = normalizeCopilotText(message);
  const priorIntent = historyFocus(history);
  const asksForRoadmap = includesOne(text, ['roadmap', 'career path', 'learning path', 'study path', 'become a ', 'prepare for a ']);
  if (asksForRoadmap) return 'ROADMAP_REQUEST';
  if (includesOne(text, ['what should i study today', 'study today', 'today plan', 'plan for today', 'what do i do today', 'what should i do today'])) return 'TODAY_PLAN';
  if (includesOne(text, ['weak topic', 'weakness', 'where am i weak', 'what should i revise', 'revision due', 'revise next'])) return includesOne(text, ['revise', 'revision']) ? 'REVISION' : 'WEAK_TOPICS';
  if (includesOne(text, ['application', 'applied', 'rejected', 'job status'])) return 'APPLICATION_STATUS';
  if (includesOne(text, ['resume', 'cv', 'job description', 'jd', 'project description', 'resume bullet', 'summary'])) return 'RESUME_HELP';
  if (includesOne(text, ['interview', 'hr round', 'tell me about', 'interview tomorrow'])) return 'INTERVIEW_PREP';
  if (includesOne(text, ['project prep', 'portfolio project', 'project idea'])) return 'PROJECT_PREP';
  if (includesOne(text, ['sql', 'select ', 'join', 'group by', 'window function', 'cte'])) return 'SQL_HELP';
  if (includesOne(text, ['aptitude', 'percentage', 'profit', 'ratio', 'average', 'time and work', 'probability', 'correlation', 'permutation'])) {
    return includesOne(text, ['progress', 'accuracy', 'how am i', 'how many']) ? 'APTITUDE_PROGRESS' : 'APTITUDE_HELP';
  }
  if (includesOne(text, ['dbms', 'normalization', 'operating system', 'processes', 'computer network', 'http', 'dns', 'oop', 'git ', 'system design', 'acid'])) return 'CS_FUNDAMENTALS';
  if (includesOne(text, ['dsa progress', 'how many dsa', 'problems have i solved', 'dsa solved', 'dsa attempt'])) return 'DSA_PROGRESS';
  if (hasCode(message) || includesOne(text, ['kadane', 'binary search', 'array', 'leetcode', 'two pointer', 'sliding window', 'linked list', 'tree', 'graph', 'dynamic programming', 'hint', 'solution', 'complexity'])) {
    if (includesOne(text, ['recommend', 'another similar', 'give me 5', 'practice question'])) return 'DSA_RECOMMENDATION';
    return 'DSA_HELP';
  }
  if (priorIntent === 'DSA_HELP' && includesOne(text, ['hint', 'example', 'solution', 'explain it', 'another one'])) return 'DSA_HELP';
  if (priorIntent === 'ROADMAP_REQUEST' && includesOne(text, ['its ', 'that ', 'sql part', 'next part'])) return 'ROADMAP_REQUEST';
  if (includesOne(text, ['career', 'placement', 'job search', 'internship'])) return 'GENERAL_CAREER';
  return 'GENERAL_CHAT';
}
