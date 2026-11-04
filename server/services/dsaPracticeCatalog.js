import { visualLessons } from '../../shared/dsaVisualLessons.mjs';
import { curriculumCatalog } from '../../shared/dsaCurriculum.mjs';
import { explainerById } from '../../shared/dsaExplainers.mjs';
import { dsaResources } from '../../shared/dsaResources.mjs';

// Keep stable question IDs for existing attempts, notes and bookmarks.
export const dsaPracticeCatalog = Object.fromEntries(Object.entries(curriculumCatalog).map(([topic, questions]) => [topic, questions.map(question => {
  const lesson = explainerById(`${topic}--${question.id}`);
  return { ...question, resources: dsaResources[`${topic}:${question.id}`], description: lesson.description, hint: lesson.edgeCase,
    examples: lesson.examples, constraints: lesson.constraints, visualizationId: lesson.id, subcategory: lesson.pattern,
    source: 'CareerForge explanation' };
})]));

// Original lessons have independent IDs: older attempts and bookmarks remain intact.
for (const lesson of visualLessons) {
  dsaPracticeCatalog[lesson.topic].unshift({
    id: lesson.id, topic: lesson.topic, title: lesson.title, difficulty: lesson.difficulty,
    description: lesson.description, hint: lesson.hint, examples: lesson.examples,
    constraints: lesson.constraints, tags: [lesson.category, lesson.pattern],
    source: 'CareerForge', visualizationId: lesson.id, subcategory: lesson.pattern,
    resources: dsaResources[`${lesson.topic}:${lesson.id}`]
  });
}
export const questionsForTopic = topicId => dsaPracticeCatalog[topicId] || [];
export const dsaPracticeProgressId = (topicId, questionId) => `dsa:${topicId}:${questionId}`;
export const totalDsaQuestions = Object.values(dsaPracticeCatalog).reduce((total, questions) => total + questions.length, 0);
