import { dsaPracticeCatalog } from './dsaPracticeCatalog.js';
import { aptitudeQuestions, formulaCatalog } from './aptitudeCatalog.js';
import { allAdvancedQuestions } from './advancedAptitudeCatalog.js';
import { csFundamentals } from './csFundamentalsCatalog.js';
import { dsaCheatsheets } from './dsaLearningCatalog.js';

const catalog = new Map();
const add = item => catalog.set(item.key, item);
for (const [topic, questions] of Object.entries(dsaPracticeCatalog)) for (const question of questions) add({
  key: `dsa:${topic}:${question.id}`, domain: 'dsa', topic, kind: 'question', title: question.title,
  prompt: question.description, explanation: question.hint, difficulty: question.difficulty,
  href: `/learning/dsa/${topic}/problems/${question.id}`
});
for (const question of [...Object.values(aptitudeQuestions).flat(), ...allAdvancedQuestions]) {
  const track = question.id.startsWith('advanced-') ? 'advanced' : 'foundation';
  add({ key: `aptitude:${track}:${question.id}`, domain: 'aptitude', topic: question.topic, kind: 'question', title: question.question,
    prompt: question.question, options: question.options, correctAnswer: question.correctAnswer, explanation: question.explanation,
    setContext: question.setContext, difficulty: question.difficulty || `Level ${question.level}`,
    href: `/learning/aptitude/${track === 'advanced' ? 'advanced/' : ''}${question.topic}${track === 'foundation' ? '/practice' : ''}?question=${question.id}` });
}
for (const subject of csFundamentals) for (const topic of subject.topics) {
  const base = { domain: 'cs', topic: `${subject.id}:${topic.id}`, href: `/learning/cs/${subject.id}?topic=${topic.id}` };
  add({ ...base, key: `cs:${subject.id}:${topic.id}`, kind: 'concept', title: topic.title, prompt: topic.overview, explanation: topic.notes.join('\n') });
  for (const question of topic.quiz) add({ ...base, key: `cs:${subject.id}:${topic.id}:${question.id}`, kind: 'question', title: question.prompt, prompt: question.prompt, options: question.options, correctAnswer: question.correctAnswer, explanation: question.explanation });
  topic.interviewQuestions.forEach((prompt, index) => add({ ...base, key: `cs:${subject.id}:${topic.id}:interview-${index}`, kind: 'question', title: prompt, prompt, explanation: topic.notes.join('\n') }));
}
for (const sheet of dsaCheatsheets) add({ key: `sheet:${sheet.id}`, domain: 'dsa', topic: sheet.topicIds[0], kind: 'reference', title: sheet.title, prompt: sheet.coreConcepts.join('\n'), explanation: sheet.template, href: `/cheatsheets?sheet=${sheet.id}` });
for (const formula of formulaCatalog) add({ key: `formula:${formula.id}`, domain: 'aptitude', topic: formula.topic, kind: 'reference', title: formula.title, prompt: formula.description, explanation: `${formula.formula}\n${formula.example}`, href: `/learning/aptitude/formulas?formula=${formula.id}` });

export const learningCatalog = [...catalog.values()];
export const learningItem = key => catalog.get(key);
export const mistakeLearningItem = mistake => ({
  key: `mistake:${mistake._id}`, domain: ['cs', 'sql'].includes(mistake.source) ? 'cs' : mistake.source === 'dsa' ? 'dsa' : 'aptitude',
  topic: mistake.topic, kind: 'reflection', title: mistake.question, prompt: mistake.question,
  explanation: [mistake.correctAnswer, mistake.note].filter(Boolean).join('\n'), href: `/mistakes#mistake-${mistake._id}`
});
export function publicItem(item) {
  if (!item) return null;
  const { correctAnswer, explanation, ...safe } = item;
  return safe;
}
