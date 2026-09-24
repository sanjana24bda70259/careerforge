import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { WorkspaceLayout } from './Workspace.jsx';
import '../dsaLearning.css';

const topicCopy = {
  arrays: 'Master traversal, prefix sums, subarrays and common interview patterns.',
  strings: 'Build reliable character, substring and parsing techniques.',
  hashing: 'Use maps and sets to make lookup-driven solutions clear.',
  'two-pointers': 'Move two indices with a clear invariant and fewer nested loops.',
  'sliding-window': 'Recognise fixed and variable windows over sequences.',
  'binary-search': 'Search sorted spaces and monotonic answers with confidence.',
  'linked-list': 'Work with nodes, pointers and fast-slow techniques.',
  'stack-queue': 'Use LIFO, FIFO, monotonic stacks and deques intentionally.',
  recursion: 'Turn smaller subproblems into readable recursive choices.',
  trees: 'Traverse and reason about binary-tree structure.',
  bst: 'Apply the ordering invariant to search and validate trees.',
  heap: 'Prioritise the next best item with heaps and queues.',
  greedy: 'Choose locally optimal moves only when the proof supports it.',
  graphs: 'Model relationships, traverse components and find valid orderings.',
  'dynamic-programming': 'Define states and transitions before writing a table.',
  tries: 'Store prefixes efficiently for word and dictionary problems.',
  'bit-manipulation': 'Represent compact state with masks and XOR.'
};

const formatDuration = seconds => {
  const value = Number(seconds) || 0;
  if (!value) return '0 min';
  if (value < 60) return `${value}s`;
  return `${Math.floor(value / 60)} min`;
};
const statusLabel = status => ({ solved: 'Solved', attempted: 'Attempted', needs_revision: 'Needs revision', not_started: 'Not started' }[status] || 'Not started');

function Shell({ user, children }) { return <WorkspaceLayout user={user}>{children}</WorkspaceLayout>; }
function PrimaryButton({ children, secondary = false, ...props }) { return <button className={secondary ? 'button secondary' : 'button'} {...props}>{children}</button>; }
function PageIntro({ eyebrow, title, children, actions }) { return <section className="dsa-page-intro"><div><span className="overline">{eyebrow}</span><h1>{title}</h1>{children && <p>{children}</p>}</div>{actions && <div className="dsa-intro-actions">{actions}</div>}</section>; }
function Failure({ title = 'We couldn’t load this DSA page.', error, retry, back = '/dsa' }) {
  const needsSignIn = /authentication|required|invalid or expired session/i.test(error || '');
  return <section className="dsa-empty"><h2>{title}</h2><p>{error || 'Try again in a moment.'}</p><div><PrimaryButton onClick={() => void retry()}>Try again</PrimaryButton><Link className="button secondary" to={needsSignIn ? '/login' : back}>{needsSignIn ? 'Sign in again' : 'Back to DSA'}</Link></div></section>;
}

export function DsaDashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = async () => { try { setError(''); setData(await api.roadmap()); } catch (err) { setError(err.message); } };
  useEffect(() => { void load(); }, []);
  const summary = data?.summary;
  return <Shell user={user}>
    <PageIntro eyebrow="LEARNING · DSA" title="Your DSA workspace">Learn a pattern, write the solution here, then let an accepted submission update your record.</PageIntro>
    {error ? <Failure error={error} retry={load} /> : <>
      <section className="dsa-summary" aria-label="DSA progress">
        <article className="dsa-summary-main"><span>DSA PROGRESS</span><strong>{summary ? `${summary.solved} / ${summary.totalProblems}` : '—'}</strong><small>Solved problems</small><div className="dsa-progress"><i style={{ width: `${summary?.totalProblems ? Math.round((summary.solved / summary.totalProblems) * 100) : 0}%` }} /></div></article>
        <article><span>EASY</span><strong>{summary?.easySolved ?? '—'}</strong><small>accepted</small></article><article><span>MEDIUM</span><strong>{summary?.mediumSolved ?? '—'}</strong><small>accepted</small></article><article><span>HARD</span><strong>{summary?.hardSolved ?? '—'}</strong><small>accepted</small></article>
        <article><span>CURRENT STREAK</span><strong>{summary?.currentStreak ?? '—'}</strong><small>days</small></article><article><span>LONGEST STREAK</span><strong>{summary?.longestStreak ?? '—'}</strong><small>days</small></article><article><span>THIS WEEK</span><strong>{summary?.solvedThisWeek ?? '—'}</strong><small>solved</small></article><article><span>STUDY TIME</span><strong>{summary ? formatDuration(summary.studyTimeSeconds) : '—'}</strong><small>submitted work</small></article>
      </section>
      <section className="dsa-section-head"><div><span className="overline">DSA ROADMAP</span><h2>Choose one pattern and stay with it.</h2></div><Link to="/cheatsheets">Open cheatsheets →</Link></section>
      {!data ? <p className="dsa-loading">Loading your roadmap…</p> : <section className="dsa-roadmap-grid">{data.topics.map(topic => {
        const solved = topic.progress?.problemsSolved || 0; const total = topic.questionCount || 0; const percent = topic.progress?.progressPercent || 0;
        return <article className="dsa-topic-card" key={topic.id}><div className="dsa-topic-card-top"><span>{topic.group}</span><b>{topic.name}</b></div><p>{topicCopy[topic.id] || 'Practice core interview patterns in this topic.'}</p><div className="dsa-topic-count"><b>{solved} / {total}</b><span>Problems</span></div><div className="dsa-progress"><i style={{ width: `${percent}%` }} /></div><Link to={`/learning/dsa/${topic.id}`}>{solved ? 'Continue learning' : 'Start learning'} <span>→</span></Link></article>;
      })}</section>}
      {summary?.recentlySolved?.length ? <section className="dsa-recent"><div><span className="overline">RECENTLY SOLVED</span><h2>Accepted submissions</h2></div>{summary.recentlySolved.map(problem => <p key={problem.id}><b>{problem.title}</b><span>{new Date(problem.solvedAt).toLocaleDateString()}</span></p>)}</section> : <section className="dsa-empty compact"><h2>Your accepted work will appear here.</h2><p>Start a topic, write a solution in CareerForge, and submit it once a secure execution provider is connected.</p></section>}
    </>}
  </Shell>;
}

export function DsaTopic({ user }) {
  const { topic: topicId } = useParams();
  const [practice, setPractice] = useState(null); const [resources, setResources] = useState(null); const [active, setActive] = useState('overview'); const [query, setQuery] = useState(''); const [difficulty, setDifficulty] = useState('All'); const [status, setStatus] = useState('All'); const [error, setError] = useState('');
  const load = async () => { try { setError(''); const [questions, learning] = await Promise.all([api.dsaPractice(topicId), api.dsaTopicResources(topicId)]); setPractice(questions); setResources(learning); } catch (err) { setError(err.message); } };
  useEffect(() => { void load(); }, [topicId]);
  const questions = useMemo(() => (practice?.questions || []).filter(question => (difficulty === 'All' || question.difficulty === difficulty) && (status === 'All' || statusLabel(question.status) === status) && `${question.title} ${(question.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [practice, query, difficulty, status]);
  if (error) return <Shell user={user}><Failure error={error} retry={load} /></Shell>;
  if (!practice) return <Shell user={user}><PageIntro eyebrow="LEARNING · DSA" title="Loading topic…">Preparing your topic workspace.</PageIntro><p className="dsa-loading">Loading problems and learning resources…</p></Shell>;
  const topic = practice.topic;
  return <Shell user={user}>
    <Link className="back-link" to="/dsa">← DSA dashboard</Link>
    <PageIntro eyebrow="LEARNING · DSA TOPIC" title={topic.name}>{topic.description || topicCopy[topicId]} <b>{topic.solvedCount} / {topic.questionCount} accepted.</b></PageIntro>
    <nav className="dsa-topic-tabs" aria-label="DSA topic sections"><button className={active === 'overview' ? 'active' : ''} onClick={() => setActive('overview')}>Overview</button><button className={active === 'learn' ? 'active' : ''} onClick={() => setActive('learn')}>Video lessons</button><button className={active === 'problems' ? 'active' : ''} onClick={() => setActive('problems')}>Problems</button><button className={active === 'cheatsheet' ? 'active' : ''} onClick={() => setActive('cheatsheet')}>Cheatsheet</button></nav>
    {active === 'overview' && <section className="dsa-topic-overview"><article><span className="overline">YOUR TOPIC PROGRESS</span><strong>{topic.solvedCount} / {topic.questionCount}</strong><p>Only accepted code submissions are counted as solved.</p><PrimaryButton onClick={() => setActive('problems')}>Browse problems</PrimaryButton></article><article><span className="overline">HOW TO USE THIS TOPIC</span><ol><li>Study the pattern and its invariant.</li><li>Open a CareerForge problem and write your own solution.</li><li>Run and submit only when an isolated executor is configured.</li></ol></article></section>}
    {active === 'learn' && <section className="dsa-resource-list"><div><span className="overline">VIDEO LESSONS</span><h2>Official learning resources</h2><p>CareerForge lists only verified learning links. Open the course, then select this topic in its syllabus.</p></div>{resources?.videos?.map(video => <article key={video.id}><div className="dsa-video-placeholder">▶</div><div><b>{video.title}</b><small>{video.provider} · {topic.name}</small><p>{video.message}</p></div>{video.verified && video.url ? <a className="button" target="_blank" rel="noreferrer" href={video.url}>{video.actionLabel || 'Open resource'}</a> : <span className="dsa-unavailable">Verified URL pending</span>}</article>)}</section>}
    {active === 'problems' && <section className="dsa-problems"><div className="dsa-problem-toolbar"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search problems or patterns" /><select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select><select value={status} onChange={event => setStatus(event.target.value)}><option>All</option><option>Not started</option><option>Attempted</option><option>Solved</option></select></div>{questions.length ? <div className="dsa-problem-table"><div className="dsa-problem-row dsa-problem-heading"><span>Problem</span><span>Difficulty</span><span>Status</span><span>Pattern</span><span>Action</span></div>{questions.map(question => <div className="dsa-problem-row" key={question.id}><b>{question.title}<small>{question.attempts ? `${question.attempts} submission${question.attempts === 1 ? '' : 's'}` : 'No submission yet'}</small></b><span className={`difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><span className={`dsa-status ${question.status}`}>{statusLabel(question.status)}</span><span>{question.tags?.join(' · ')}</span><Link className="button secondary" to={`/learning/dsa/${topicId}/problems/${question.id}`}>{question.solved ? 'Review' : 'Solve'} →</Link></div>)}</div> : <section className="dsa-empty compact"><h2>No matching problems</h2><p>Change the search or filters to see this topic’s catalog.</p></section>}</section>}
    {active === 'cheatsheet' && <section className="dsa-topic-cheatsheets"><div><span className="overline">TOPIC CHEATSHEET</span><h2>Patterns worth reviewing</h2></div>{resources?.cheatsheets?.length ? resources.cheatsheets.map(sheet => <article key={sheet.id}><b>{sheet.title}</b><p>{sheet.patterns.join(' · ')}</p><Link to={`/cheatsheets?sheet=${sheet.id}`}>View cheatsheet →</Link></article>) : <p>No cheatsheet has been cataloged for this topic yet.</p>}</section>}
  </Shell>;
}

const starterCode = { Java: 'class Solution {\n  // Write your solution here\n}', Python: 'class Solution:\n    def solve(self):\n        pass', 'C++': 'class Solution {\npublic:\n  // Write your solution here\n};', JavaScript: 'function solve(input) {\n  // Write your solution here\n}' };
export function DsaProblemSolver({ user }) {
  const { topic: topicId, problemId } = useParams(); const [data, setData] = useState(null); const [language, setLanguage] = useState('Java'); const [code, setCode] = useState(starterCode.Java); const [panel, setPanel] = useState('tests'); const [customInput, setCustomInput] = useState(''); const [result, setResult] = useState(null); const [error, setError] = useState(''); const [working, setWorking] = useState(''); const startedAt = useRef(Date.now());
  const load = async () => { try { setError(''); const response = await api.dsaProblem(topicId, problemId); setData(response); const saved = response.problem.progress?.latestCode; const savedLanguage = response.problem.progress?.language || 'Java'; setLanguage(savedLanguage); setCode(saved || starterCode[savedLanguage]); startedAt.current = Date.now(); } catch (err) { setError(err.message); } };
  useEffect(() => { void load(); }, [topicId, problemId]);
  const execute = async mode => { if (!code.trim() || working) return; setWorking(mode); setError(''); setResult(null); const body = { code, language, customInput, timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000) }; try { const response = mode === 'run' ? await api.runDsaCode(topicId, problemId, body) : await api.submitDsaCode(topicId, problemId, body); setResult(response); if (response.progress) setData(current => ({ ...current, problem: { ...current.problem, progress: response.progress } })); } catch (err) { setResult({ status: 'execution_unavailable', message: err.message }); } finally { setWorking(''); } };
  if (error && !data) return <Shell user={user}><Failure error={error} retry={load} back={`/learning/dsa/${topicId}`} /></Shell>;
  if (!data) return <Shell user={user}><PageIntro eyebrow="LEARNING · DSA" title="Loading problem…">Preparing the CareerForge coding workspace.</PageIntro></Shell>;
  const { problem, topic } = data;
  return <Shell user={user}>
    <Link className="back-link" to={`/learning/dsa/${topicId}`}>← {topic.name} problems</Link>
    <div className="cf-solver"><section className="cf-problem"><div className="cf-problem-title"><div><span className="overline">CAREERFORGE PROBLEM</span><h1>{problem.title}</h1></div><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div><p className="cf-statement">{problem.statement}</p><div className="question-tags">{problem.tags?.map(tag => <span key={tag}>{tag}</span>)}</div><section><h2>Examples</h2>{problem.examples?.length ? problem.examples.map((example, index) => <pre key={index}>Input: {example.input}{'\n'}Output: {example.output}</pre>) : <p className="cf-muted">No executable sample case has been authored for this learning prompt yet. The Run Code architecture remains unavailable until a secure execution provider is connected.</p>}</section><section><h2>Constraints</h2><ul>{problem.constraints.map(item => <li key={item}>{item}</li>)}</ul></section><details><summary>Hint</summary><p>{problem.hint}</p></details><details><summary>Explanation</summary><p>Start by identifying the invariant behind the pattern: {problem.tags?.join(', ') || topic.name}. Verify edge cases before choosing an implementation.</p></details></section>
      <section className="cf-editor"><div className="cf-editor-top"><div><b>Solution</b><small>{statusLabel(problem.progress?.status)}</small></div><select value={language} onChange={event => { const next = event.target.value; setLanguage(next); if (!code.trim() || code === starterCode[language]) setCode(starterCode[next]); }}><option>Java</option><option>Python</option><option>C++</option><option>JavaScript</option></select></div><textarea value={code} onChange={event => setCode(event.target.value)} className="cf-code" spellCheck="false" aria-label="Code editor" /><div className="cf-editor-actions"><PrimaryButton secondary disabled={Boolean(working)} onClick={() => void execute('run')}>{working === 'run' ? 'Running…' : 'Run Code'}</PrimaryButton><PrimaryButton disabled={Boolean(working)} onClick={() => void execute('submit')}>{working === 'submit' ? 'Submitting…' : 'Submit'}</PrimaryButton></div><div className="cf-console-tabs"><button className={panel === 'tests' ? 'active' : ''} onClick={() => setPanel('tests')}>Test cases</button><button className={panel === 'input' ? 'active' : ''} onClick={() => setPanel('input')}>Custom input</button><button className={panel === 'output' ? 'active' : ''} onClick={() => setPanel('output')}>Output</button><button className={panel === 'console' ? 'active' : ''} onClick={() => setPanel('console')}>Console</button></div><div className="cf-console">{panel === 'tests' && <p>No test result is fabricated. Connect a secure execution provider to run authored sample and hidden cases.</p>}{panel === 'input' && <textarea value={customInput} onChange={event => setCustomInput(event.target.value)} placeholder="Custom input for the execution provider" />}{panel === 'output' && <p>{result?.status === 'accepted' ? `Accepted · Passed tests: ${result.passedTests} / ${result.totalTests}` : result?.message || 'Run code to see provider output.'}</p>}{panel === 'console' && <p>{result?.status === 'execution_unavailable' ? 'Execution provider unavailable. Your submit was recorded as an attempt, never as solved.' : result?.message || 'No console output yet.'}</p>}</div>{result && <div className={`cf-result ${result.status === 'accepted' ? 'accepted' : 'unavailable'}`}> <b>{result.status === 'accepted' ? 'Accepted' : 'Execution provider unavailable'}</b><span>{result.message || 'No result available.'}</span></div>}</section>
    </div>
  </Shell>;
}

export function Cheatsheets({ user, bookmarksOnly = false }) {
  const [sheets, setSheets] = useState([]); const [error, setError] = useState(''); const [selectedId, setSelectedId] = useState(null); const [saving, setSaving] = useState('');
  const load = async () => { try { setError(''); const data = bookmarksOnly ? await api.dsaBookmarks() : await api.dsaCheatsheets(); const next = bookmarksOnly ? data.bookmarks : data.cheatsheets; setSheets(next); setSelectedId(current => current || next[0]?.id || null); } catch (err) { setError(err.message); } };
  useEffect(() => { void load(); }, [bookmarksOnly]);
  const selected = sheets.find(sheet => sheet.id === selectedId);
  const toggleBookmark = async sheet => { setSaving(`bookmark:${sheet.id}`); try { if (sheet.progress?.bookmarked) await api.removeDsaCheatsheetBookmark(sheet.id); else await api.bookmarkDsaCheatsheet(sheet.id); await load(); } catch (err) { setError(err.message); } finally { setSaving(''); } };
  const revise = async sheet => { setSaving(`revise:${sheet.id}`); try { await api.reviseDsaCheatsheet(sheet.id); await load(); } catch (err) { setError(err.message); } finally { setSaving(''); } };
  return <Shell user={user}><PageIntro eyebrow="LEARNING · CHEATSHEETS" title={bookmarksOnly ? 'My bookmarks' : 'DSA cheatsheets'}>{bookmarksOnly ? 'Your saved DSA reference material.' : 'Short, practical references for patterns, complexity and implementation choices.'} {!bookmarksOnly && <Link to="/bookmarks">View my bookmarks →</Link>}</PageIntro>{error ? <Failure title="We couldn’t load cheatsheets." error={error} retry={load} /> : !sheets.length ? <section className="dsa-empty compact"><h2>No bookmarked cheatsheets yet.</h2><p>Save a cheatsheet from Learning → Cheatsheets to find it here.</p><Link className="button" to="/cheatsheets">Browse cheatsheets</Link></section> : <section className="dsa-cheatsheet-layout"><aside>{sheets.map(sheet => <button className={selectedId === sheet.id ? 'active' : ''} onClick={() => setSelectedId(sheet.id)} key={sheet.id}><b>{sheet.title}</b><small>{sheet.progress?.bookmarked ? 'Saved' : 'Reference'}</small></button>)}</aside>{selected && <article className="dsa-sheet"><div className="dsa-sheet-top"><div><span className="overline">{selected.title.toUpperCase()} CHEATSHEET</span><h2>{selected.title}</h2></div><div><PrimaryButton secondary disabled={Boolean(saving)} onClick={() => void toggleBookmark(selected)}>{saving === `bookmark:${selected.id}` ? 'Saving…' : selected.progress?.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}</PrimaryButton><PrimaryButton disabled={Boolean(saving)} onClick={() => void revise(selected)}>{saving === `revise:${selected.id}` ? 'Saving…' : 'Mark as revised'}</PrimaryButton></div></div><section><h3>Core concepts</h3><p>{selected.coreConcepts.join(' · ')}</p></section><section><h3>Important patterns</h3><ul>{selected.patterns.map(pattern => <li key={pattern}>{pattern}</li>)}</ul></section><section><h3>Complexity guide</h3><ul>{selected.complexities.map(item => <li key={item}>{item}</li>)}</ul></section><section><h3>Interview techniques</h3><ul>{selected.techniques.map(item => <li key={item}>{item}</li>)}</ul></section><section><h3>Short template</h3><pre>{selected.template}</pre></section><p className="cf-muted">Revision count: {selected.progress?.revisionCount || 0}. PDF export is intentionally unavailable until a real export feature is added.</p></article>}</section>}</Shell>;
}

export function PracticeHub({ user }) {
  const location = useLocation();
  const selected = new URLSearchParams(location.search).get('type') || 'aptitude';
  const cards = [
    { id: 'aptitude', title: 'Aptitude Mock Tests', detail: 'Original quantitative, logical and verbal timed tests.', meta: '30 questions · 30 minutes', href: '/learning/aptitude/advanced/mocks', action: 'View aptitude mocks' },
    { id: 'dsa', title: 'DSA Mock Tests', detail: 'Timed coding assessments belong here—not inside the normal DSA learning library.', meta: 'Secure executor required', href: null, action: 'Execution provider pending' },
    { id: 'placement', title: 'Placement Mock Tests', detail: 'Mixed assessment practice that records score, accuracy and time after submission.', meta: 'Timed assessment', href: '/learning/aptitude/advanced/mocks', action: 'Open available tests' },
    { id: 'company', title: 'Company-style Assessments', detail: 'Original assessment formats. CareerForge does not claim an unverified company paper.', meta: 'Original question sets', href: '/learning/aptitude/advanced/mocks', action: 'Browse available formats' }
  ];
  return <Shell user={user}><PageIntro eyebrow="PRACTICE · ASSESSMENTS" title="Mock tests, not a problem library.">Use Learning for topic-by-topic DSA and aptitude. Use Practice for timed assessments and result reviews.</PageIntro><section className="practice-hub-grid">{cards.map(card => <article className={selected === card.id ? 'selected' : ''} key={card.id}><span className="overline">{card.id === 'dsa' ? 'CODING ASSESSMENT' : 'TIMED ASSESSMENT'}</span><h2>{card.title}</h2><p>{card.detail}</p><small>{card.meta}</small>{card.href ? <Link className="button" to={card.href}>{card.action} →</Link> : <button className="button secondary" disabled>{card.action}</button>}</article>)}</section><section className="dsa-empty compact"><h2>Why coding tests are unavailable right now</h2><p>CareerForge needs an isolated code-execution provider before it can honestly score a DSA mock. Normal DSA topics and the internal editor stay under Learning → DSA.</p><Link className="button secondary" to="/dsa">Open DSA learning</Link></section></Shell>;
}
