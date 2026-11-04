import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from './Workspace.jsx';
import { api } from '../services/api.js';
import { visualLessons, buildVisualTrace } from '../../../shared/dsaVisualLessons.mjs';
import '../dsaVisualStudio.css';

const lessonHref = lesson => `/dsa/visuals/${lesson.id}`;
const show = value => Array.isArray(value) ? `[${value.join(', ')}]` : String(value);
export function Level({ value }) { return <span className={`dv-level ${value.toLowerCase()}`}>{value}</span>; }

export function AlgorithmPlayer({ lesson, compact = false }) {
  const [input, setInput] = useState(lesson.values.join(', '));
  const [parameter, setParameter] = useState(String(lesson.parameter ?? ''));
  const [steps, setSteps] = useState(() => buildVisualTrace(lesson));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const frame = steps[index];
  useEffect(() => {
    if (!playing) return undefined;
    if (index >= steps.length - 1) { setPlaying(false); return undefined; }
    const timer = setTimeout(() => setIndex(current => Math.min(current + 1, steps.length - 1)), 1200 / speed);
    return () => clearTimeout(timer);
  }, [playing, index, steps.length, speed]);
  const jump = next => { setPlaying(false); setIndex(Math.max(0, Math.min(steps.length - 1, next))); };
  const apply = event => {
    event.preventDefault(); setPlaying(false);
    try {
      const trimmed = input.trim();
      const raw = trimmed.startsWith('[') ? JSON.parse(trimmed) : trimmed === '' ? [] : trimmed.split(',').map(value => value.trim() === '' ? NaN : Number(value));
      const trace = buildVisualTrace(lesson, raw, parameter.trim() === '' ? NaN : Number(parameter));
      setSteps(trace); setIndex(0); setError('');
    } catch (err) { setError(err instanceof SyntaxError ? 'Enter comma-separated numbers or a valid JSON array.' : err.message); }
  };
  return <section className={`dv-player ${compact ? 'dv-player-compact' : ''}`} aria-label={`${lesson.title} visualization`}>
    <header className="dv-player-head"><span><i /> {compact ? 'LIVE ALGORITHM PREVIEW' : 'INTERACTIVE WALKTHROUGH'}</span><span>{lesson.pattern}</span></header>
    {!compact && <form className="dv-input-form" onSubmit={apply}><label>Input array<input aria-label="Visualization input array" value={input} onChange={event => setInput(event.target.value)} spellCheck="false" /></label>{lesson.parameterLabel && <label>{lesson.parameterLabel}<input aria-label={lesson.parameterLabel} type="number" value={parameter} onChange={event => setParameter(event.target.value)} /></label>}<button type="submit">Apply input </button><small>Visual canvas: up to 18 integers, 0–99. An empty array is allowed except for a study window.</small>{error && <p role="alert">{error}</p>}</form>}
    <div className="dv-player-body"><div className="dv-stage">
      <div className="dv-stage-label"><span>{lesson.title}</span><span>{index === steps.length - 1 ? 'COMPLETE' : 'STEP BY STEP'}</span></div>
      <div className="dv-bars" style={{ '--cells': Math.max(1, frame.array.length) }} aria-label="Array state">
        {frame.array.length ? frame.array.map((value, i) => {
          const active = frame.active.includes(i);
          const inRange = frame.range && i >= frame.range[0] && i <= frame.range[1];
          const labels = Object.entries(frame.pointers).filter(([, position]) => position === i).map(([name]) => name);
          return <div key={i} className={`dv-cell ${active ? 'is-active' : ''} ${inRange ? 'in-range' : ''}`}><span className="dv-pointer">{labels.join(' / ')}</span><div className="dv-bar" ><b>{value}</b></div><small>{i}</small></div>;
        }) : <p className="dv-empty-array">[ ] Empty input</p>}
      </div>
      <div className="dv-variables">{Object.entries(frame.vars).map(([key, value]) => <span key={key}>{key}<b>{String(value)}</b></span>)}{frame.output !== null && <span className="dv-result">result <b>{show(frame.output)}</b></span>}</div>
      <div className="dv-step-note" aria-live={playing ? 'off' : 'polite'}><span>{String(index + 1).padStart(2, '0')}</span><p>{frame.note}</p></div>
    </div>{!compact && <aside className="dv-code"><div><span>REFERENCE SOLUTION</span><b>JavaScript</b></div><ol>{lesson.code.map((line, i) => <li className={frame.line === i + 1 ? 'current' : ''} aria-current={frame.line === i + 1 ? 'step' : undefined} key={i}><code>{line || ' '}</code></li>)}</ol><p>{lesson.complexity}</p></aside>}</div>
    <div className="dv-controls"><button aria-label="Restart animation" title="Restart" onClick={() => jump(0)}>↺</button><button aria-label="Previous step" disabled={index === 0} onClick={() => jump(index - 1)}>‹</button><button className="dv-play" aria-label={playing ? 'Pause animation' : 'Play animation'} onClick={() => { if (index === steps.length - 1) setIndex(0); setPlaying(value => !value); }}>{playing ? 'Ⅱ Pause' : '▶ Play'}</button><button aria-label="Next step" disabled={index === steps.length - 1} onClick={() => jump(index + 1)}>›</button><input aria-label="Animation timeline" type="range" min="0" max={steps.length - 1} value={index} onChange={event => jump(Number(event.target.value))} /><span>{index + 1} / {steps.length}</span><select aria-label="Playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></div>
  </section>;
}

export function DsaVisualLibrary({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState('all');
  const [open, setOpen] = useState({ arrays: true, sorting: true, 'binary-search': true, 'two-pointers': true, 'sliding-window': true, 'stack-queue': true });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setError('');
    api.roadmap().then(result => { if (active) setData(result); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [reload]);
  const topics = data?.topics || [];
  const visible = useMemo(() => topics.filter(topic => category === 'All' || topic.id === category).map(topic => ({ ...topic, questions: (topic.questions || []).filter(question =>
    (mode === 'all' || question.original) && (difficulty === 'All' || question.difficulty === difficulty) &&
    (status === 'All' || question.status === status) && `${topic.name} ${question.subcategory} ${question.title}`.toLowerCase().includes(query.toLowerCase().trim())
  ) })).filter(topic => topic.questions.length), [topics, category, query, difficulty, status, mode]);
  const visibleCount = visible.reduce((sum, topic) => sum + topic.questions.length, 0);
  const clear = () => { setQuery(''); setDifficulty('All'); setStatus('All'); setCategory('All'); };
  return <WorkspaceLayout user={user}><div className="dsa-studio">
    <nav className="dv-topnav" aria-label="DSA navigation"><span className="dv-brand"><i>▥</i> DSA <b>Studio</b></span><div><a href="#visual-library" className="active">Explore lessons</a><Link to={lessonHref(visualLessons[0])}>Playground </Link><Link to="/cheatsheets">Pattern notes</Link></div><span className="dv-original-tag">MADE FOR CAREERFORGE</span></nav>
    <section className="dv-hero"><div className="dv-hero-copy"><span className="dv-eyebrow"><i /> LEARN BY SEEING</span><h1>Make the<br />algorithm <em>click.</em></h1><p>Follow the pointers. See the pattern. Turn an abstract idea into something you can step through, understand, and build yourself.</p><div className="dv-hero-actions"><Link className="dv-primary" to={lessonHref(visualLessons[0])}>Open the playground <span></span></Link><a className="dv-secondary" href="#visual-library">Explore questions </a></div><div className="dv-hero-facts"><span><b>{data?.summary?.totalProblems ?? 'All'}</b> explained questions</span><span><b>∞</b> replays, at your pace</span></div></div><AlgorithmPlayer compact lesson={visualLessons[0]} /></section>
    <div className="dv-pattern-strip"><span>THINK IN PATTERNS</span>{visualLessons.map(lesson => <Link key={lesson.id} to={lessonHref(lesson)}>{lesson.pattern}<span></span></Link>)}</div>
    <section className="dv-featured"><div className="dv-heading"><div><span className="dv-eyebrow">PRESS PLAY. CONNECT THE DOTS.</span><h2>Small lessons. Real understanding.</h2></div><span>{visualLessons.length} interactive walkthroughs</span></div><div className="dv-lesson-cards">{visualLessons.slice(0, 3).map((lesson, index) => <Link to={lessonHref(lesson)} key={lesson.id} className={`dv-lesson-card accent-${index}`}><div><span className="dv-lesson-icon">{lesson.icon}</span><Level value={lesson.difficulty} /></div><span className="dv-card-pattern">{lesson.category} / {lesson.pattern}</span><h3>{lesson.title}</h3><p>{lesson.hint}</p><span className="dv-card-link">▶ Watch the walkthrough <b></b></span></Link>)}</div></section>
    <section className="dv-library" id="visual-library"><div className="dv-heading"><div><span className="dv-eyebrow">YOUR LEARNING PATH</span><h2>One category. One pattern. One step.</h2></div><span>{data ? `${data.summary?.solved || 0} accepted in your full catalog` : 'Loading your progress…'}</span></div>
      <div className="dv-library-tabs"><button aria-pressed={mode === 'originals'} onClick={() => setMode('originals')}>CareerForge originals <span>{visualLessons.length}</span></button><button aria-pressed={mode === 'all'} onClick={() => setMode('all')}>Full practice catalog <span>{data?.summary?.totalProblems ?? '—'}</span></button><Link to="/bookmarks">☆ Your bookmarks</Link></div>
      <div className="dv-filters"><label><span aria-hidden="true">⌕</span><input aria-label="Search DSA questions" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a question, category, or pattern…" /></label><select aria-label="Filter category" value={category} onChange={event => setCategory(event.target.value)}><option value="All">All categories</option>{topics.map(topic => <option value={topic.id} key={topic.id}>{topic.name}</option>)}</select><select aria-label="Filter difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="All">All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select><select aria-label="Filter progress" value={status} onChange={event => setStatus(event.target.value)}><option value="All">All progress</option><option value="not_started">Not started</option><option value="attempted">Attempted</option><option value="solved">Solved</option><option value="needs_revision">Needs revision</option></select></div>
      <div className="dv-list-meta"><span>{visibleCount} matching questions · grouped by category and pattern</span><button onClick={clear}>Reset filters</button></div>
      {error ? <div className="dv-empty" role="alert"><p>{error}</p><button onClick={() => setReload(value => value + 1)}>Retry loading</button></div> : !data ? <div className="dv-empty">Loading your question library…</div> : !visible.length ? <div className="dv-empty"><h3>No questions match these filters.</h3><p>{mode === 'originals' ? 'The first original set covers six patterns. Explore the full catalog for other topics.' : 'Try a different topic or clear your search.'}</p><button onClick={clear}>Clear filters</button></div> : visible.map(topic => {
        const groups = Object.groupBy ? Object.groupBy(topic.questions, question => question.subcategory) : topic.questions.reduce((all, question) => ({ ...all, [question.subcategory]: [...(all[question.subcategory] || []), question] }), {});
        const expanded = Boolean(open[topic.id]);
        return <section className="dv-category" key={topic.id}><h3><button aria-expanded={expanded} aria-controls={`dv-category-${topic.id}`} onClick={() => setOpen(previous => ({ ...previous, [topic.id]: !expanded }))}><span className="dv-category-icon">{visualLessons.find(lesson => lesson.topic === topic.id)?.icon || '◇'}</span><span>{topic.name}<small>{Object.keys(groups).join(' · ')}</small></span><span className="dv-category-count">{topic.questions.length} questions <b>{expanded ? '−' : '+'}</b></span></button></h3>{expanded && <div id={`dv-category-${topic.id}`} className="dv-subcategories">{Object.entries(groups).map(([name, questions]) => <details className="dv-subcategory" open key={name}><summary>{name}<span>{questions.length}</span></summary>{questions.map(question => <div className="dv-question-row" key={question.id}><span className={`dv-status-dot ${question.status}`} title={question.status.replaceAll('_', ' ')} aria-label={question.status.replaceAll('_', ' ')} /><Link className="dv-question-title" to={question.visualizationId ? `/dsa/visuals/${question.visualizationId}` : `/learning/dsa/${topic.id}/problems/${question.id}`}>{question.title}{question.original && <small>ORIGINAL</small>}</Link><Level value={question.difficulty} />{question.visualizationId ? <Link className="dv-viz-link" to={`/dsa/visuals/${question.visualizationId}`}>▶ Watch</Link> : <Link className="dv-practice-link" to={`/learning/dsa/${topic.id}/problems/${question.id}`}>Practice </Link>}</div>)}</details>)}</div>}</section>;
      })}
      <p className="dv-library-note">Walkthroughs help you understand a pattern. Accepted code submissions are tracked separately from watching a lesson.</p>
    </section>
  </div></WorkspaceLayout>;
}

const LessonContent = lazy(() => import('./DsaLessonContent.jsx'));
export function DsaVisualLesson({ user }) {
  return <Suspense fallback={<WorkspaceLayout user={user}><p role="status">Loading your explanation…</p></WorkspaceLayout>}><LessonContent user={user} /></Suspense>;
}
