import { Link, useParams } from 'react-router-dom';
import { WorkspaceLayout } from './Workspace.jsx';
import { LearningActions } from './LearningActions.jsx';
import { AlgorithmPlayer, Level } from './DsaVisualStudio.jsx';
import { DsaStoryPlayer } from './DsaStoryPlayer.jsx';
import { visualLessons, visualLessonById } from '../../../shared/dsaVisualLessons.mjs';
import { explainerById, explainerLessons } from '../../../shared/dsaExplainers.mjs';

const lessonHref = lesson => `/dsa/visuals/${lesson.id}`;
const practiceHref = lesson => `/learning/dsa/${lesson.topic}/problems/${lesson.questionId || lesson.id}`;

export default function DsaLessonContent({ user }) {
  const { lessonId } = useParams();
  const lesson = visualLessonById(lessonId) || explainerById(lessonId);
  const related = lesson?.kind === 'explainer' ? explainerLessons.filter(item => item.topic === lesson.topic).slice(0, 8) : visualLessons;
  return <WorkspaceLayout user={user}><div className="dsa-studio dv-lesson-page"><Link className="dv-back" to="/dsa"> Explore the DSA library</Link>{!lesson ? <section className="dv-empty"><h1>Lesson not found</h1><p>Choose an available walkthrough from the library.</p></section> : <>
    <header className="dv-lesson-header"><div><span className="dv-eyebrow">{lesson.kind === 'explainer' ? 'CAREERFORGE EXPLAINS' : 'CAREERFORGE ORIGINAL'} / {lesson.category}</span><h1>{lesson.title}</h1><p>{lesson.pattern} <span>·</span> {lesson.complexity || 'Animated worked example'}</p></div><Level value={lesson.difficulty} /></header>
    <nav className="dv-lesson-switcher" aria-label="Choose a visualization">{related.map(item => <Link className={item.id === lesson.id ? 'active' : ''} to={lessonHref(item)} key={item.id}>{item.icon} {item.kind === 'explainer' ? item.title : item.pattern}</Link>)}</nav>
    {lesson.kind === 'explainer' ? <DsaStoryPlayer key={lesson.id} lesson={lesson} /> : <AlgorithmPlayer key={lesson.id} lesson={lesson} />}
    <section className="dv-lesson-bottom"><article><span className="dv-eyebrow">THE CHALLENGE</span><h2>Now make it your own.</h2><p>{lesson.description}</p><div className="dv-sample"><span>EXAMPLE</span><code>{lesson.examples[0].input}</code><code>Output: {lesson.examples[0].output}</code></div>{lesson.constraints ? <details><summary>Problem constraints</summary><ul>{lesson.constraints.map(item => <li key={item}>{item}</li>)}</ul></details> : <p><strong>Edge case to try:</strong> {lesson.edgeCase}</p>}</article><aside><span className="dv-eyebrow">FROM WATCHING TO UNDERSTANDING</span><h3>Try it without the walkthrough.</h3><p>Explain the invariant. Test an edge case. Then write your own solution in the coding workspace.</p><Link className="dv-primary" to={practiceHref(lesson)}>Write my solution <span></span></Link><LearningActions itemKey={`dsa:${lesson.topic}:${lesson.questionId || lesson.id}`} /><small>Watching an explanation does not mark a problem solved. Try the example yourself in the coding workspace.</small></aside></section>
  </>}</div></WorkspaceLayout>;
}
