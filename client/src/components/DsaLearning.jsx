import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { LearningActions } from './LearningActions.jsx';
import { WorkspaceLayout } from './Workspace.jsx';
import '../dsaLearning.css';
import { DsaStructuredLibrary } from './DsaStructuredLibrary.jsx';
import { DsaProblemLearning } from './DsaProblemLearning.jsx';

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

export function DsaDashboard({ user }) { return <DsaStructuredLibrary key={user.id} user={user} />; }

export function DsaTopic({ user }) {
  const { topic } = useParams();
  return <DsaStructuredLibrary key={user.id + ':' + topic} user={user} initialTopic={topic} />;
}

const starterCode = { Java: 'class Solution {\n  // Write your solution here\n}', Python: 'class Solution:\n    def solve(self):\n        pass', 'C++': 'class Solution {\npublic:\n  // Write your solution here\n};', JavaScript: 'function solve(input) {\n  // Write your solution here\n}' };
export function DsaProblemSolver({ user }) {
  const { topic, problemId } = useParams();
  return <DsaProblemWorkspace key={`${user?.id||user?._id||user?.email}:${topic}:${problemId}`} user={user} />;
}
function DsaProblemWorkspace({ user }) {
  const { topic: topicId, problemId } = useParams(); const [data, setData] = useState(null); const [language, setLanguage] = useState('Java'); const [code, setCode] = useState(starterCode.Java); const [panel, setPanel] = useState('tests'); const [selectedCase, setSelectedCase] = useState(0); const [customInput, setCustomInput] = useState(''); const [result, setResult] = useState(null); const [error, setError] = useState(''); const [working, setWorking] = useState(''); const startedAt = useRef(Date.now());
  const draftKey = `careerforge:code:${user?.id||user?._id||user?.email}:${topicId}:${problemId}`;
  const [draftNotice, setDraftNotice] = useState('');
  const [drafts, setDrafts] = useState({});
  const load = async () => { try { setError(''); const response = await api.dsaProblem(topicId, problemId); let stored={}; try { stored=JSON.parse(localStorage.getItem(draftKey)||'{}')||{}; } catch {} const savedLanguage = Object.hasOwn(starterCode,stored.language)?stored.language:response.problem.progress?.language || 'Java'; const savedDrafts=stored.drafts&&typeof stored.drafts==='object'?stored.drafts:{}; setDrafts(savedDrafts); setLanguage(savedLanguage); setCode(typeof savedDrafts[savedLanguage]==='string'?savedDrafts[savedLanguage]:response.problem.progress?.latestCode || starterCode[savedLanguage]); setData(response); startedAt.current = Date.now(); } catch (err) { setError(err.message); } };
  useEffect(() => { void load(); }, [topicId, problemId]);
  useEffect(() => { if(!data)return; try {localStorage.setItem(draftKey,JSON.stringify({language,drafts:{...drafts,[language]:code}}));setDraftNotice('Draft saved on this device.');}catch{setDraftNotice('Draft could not be saved on this device. Copy your code before leaving.');} },[data,code,language,drafts,draftKey]);
  const changeLanguage = next => { setDrafts(current=>({...current,[language]:code}));setLanguage(next);setCode(drafts[next]??starterCode[next]); };
  const execute = async mode => { if (!code.trim() || working) return; setWorking(mode); setError(''); setResult(null); const body = { code, language, customInput, timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000) }; try { const response = mode === 'run' ? await api.runDsaCode(topicId, problemId, body) : await api.submitDsaCode(topicId, problemId, body); setResult(response); if (response.progress) setData(current => ({ ...current, problem: { ...current.problem, progress: response.progress } })); } catch (err) { setResult({ status: 'execution_unavailable', message: err.message }); } finally { setWorking(''); } };
  if (error && !data) return <Shell user={user}><Failure error={error} retry={load} back={`/learning/dsa/${topicId}`} /></Shell>;
  if (!data) return <Shell user={user}><PageIntro eyebrow="LEARNING · DSA" title="Loading problem…">Preparing the CareerForge coding workspace.</PageIntro></Shell>;
  const { problem, topic } = data;
  const examples = problem.examples || [];
  const activeExample = examples[selectedCase] || examples[0];
  const lineCount = Math.max(1, code.split('\n').length);
  const extension = { Java: 'java', Python: 'py', 'C++': 'cpp', JavaScript: 'js' }[language];
  const executionDisabled = Boolean(working) || !problem.executionReady;
  return <Shell user={user}>
    <div className="cf-solver-nav"><Link to={`/learning/dsa/${topicId}`}><span aria-hidden="true">‹</span>{topic.name} problems</Link><div><span className={`cf-status-pill ${problem.progress?.status || 'not_started'}`}>{statusLabel(problem.progress?.status)}</span>{problem.visualizationId && <Link to={`/dsa/visuals/${problem.visualizationId}`}>Watch walkthrough</Link>}</div></div>
    <div className="cf-solver">
      <section className="cf-problem"><DsaProblemLearning problem={problem} topicId={topicId}><div className="cf-problem-title"><div><span className="overline">CAREERFORGE PROBLEM</span><h1>{problem.title}</h1></div><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div><LearningActions itemKey={`dsa:${topicId}:${problemId}`} /><p className="cf-statement">{problem.statement}</p><div className="question-tags">{problem.tags?.map(tag => <span key={tag}>{tag}</span>)}</div><section><h2>Examples</h2>{examples.length ? examples.map((example, index) => <article className="cf-example" key={index}><b>Example {index + 1}</b><div><span>Input</span><code>{example.input}</code></div><div><span>Output</span><code>{example.output}</code></div>{example.explanation && <p>{example.explanation}</p>}</article>) : <p className="cf-muted">No sample case has been authored for this learning prompt yet.</p>}</section><section><h2>Constraints</h2><ul>{problem.constraints.map(item => <li key={item}>{item}</li>)}</ul></section><details><summary>Hint</summary><p>{problem.hint}</p></details><details><summary>How to think about it</summary><p>Start by identifying the invariant behind the pattern: {problem.tags?.join(', ') || topic.name}. Verify edge cases before choosing an implementation.</p></details></DsaProblemLearning></section>
      <section className="cf-editor">
        <header className="cf-editor-tabbar"><div className="cf-file-tab"><span aria-hidden="true">{'</>'}</span><b>Main.{extension}</b><small>×</small></div><button type="button" aria-label="New editor tab">+</button><span className="cf-editor-menu" aria-hidden="true">•••</span></header>
        <div className="cf-editor-top"><select aria-label="Programming language" value={language} onChange={event => changeLanguage(event.target.value)}><option>Java</option><option>Python</option><option>C++</option><option>JavaScript</option></select><div className="cf-editor-actions"><button className="cf-run" title={!problem.executionReady ? 'Secure code execution is not connected yet' : 'Run sample tests'} disabled={executionDisabled} onClick={() => void execute('run')}><span aria-hidden="true">▶</span>{working === 'run' ? 'Running…' : 'Run'}</button><button className="cf-submit" title={!problem.executionReady ? 'Secure code execution is not connected yet' : 'Submit solution'} disabled={executionDisabled} onClick={() => void execute('submit')}><span aria-hidden="true">↗</span>{working === 'submit' ? 'Submitting…' : 'Submit'}</button></div></div>
        <div className="cf-code-wrap"><pre className="cf-line-numbers" aria-hidden="true">{Array.from({length:lineCount},(_,index)=>index+1).join('\n')}</pre><textarea value={code} onChange={event => setCode(event.target.value)} className="cf-code" spellCheck="false" aria-label="Code editor" /></div>
        <div className="cf-draft-row"><p className="cf-draft-note" role="status"><span aria-hidden="true">●</span>{draftNotice}</p><span>{language} · UTF-8</span></div>
        <section className="cf-test-dock"><nav className="cf-console-tabs" aria-label="Code result panels"><button className={panel === 'tests' ? 'active' : ''} onClick={() => setPanel('tests')}>Test cases</button><button className={panel === 'input' ? 'active' : ''} onClick={() => setPanel('input')}>Custom input</button><button className={panel === 'output' ? 'active' : ''} onClick={() => setPanel('output')}>Result</button><button className={panel === 'console' ? 'active' : ''} onClick={() => setPanel('console')}>Console</button></nav>
          <div className="cf-console">{panel === 'tests' && <>{examples.length ? <><div className="cf-case-tabs">{examples.map((_, index) => <button key={index} className={selectedCase === index ? 'active' : ''} onClick={() => setSelectedCase(index)}>Case {index + 1}</button>)}</div><div className="cf-case-grid"><label>Input<pre>{activeExample?.input}</pre></label><label>Expected output<pre>{activeExample?.output}</pre></label></div></> : <p>No sample cases are available for this problem.</p>}<small className="cf-execution-note">Run and Submit activate only when the secure execution provider is connected. Your code draft is still saved automatically.</small></>}{panel === 'input' && <label className="cf-custom-input">Custom input<textarea value={customInput} onChange={event => setCustomInput(event.target.value)} placeholder="Enter input for the execution provider" /></label>}{panel === 'output' && <p>{result?.status === 'accepted' ? `Accepted · Passed tests: ${result.passedTests} / ${result.totalTests}` : result?.message || 'Run your code to see the result.'}</p>}{panel === 'console' && <p>{result?.status === 'execution_unavailable' ? 'Execution provider unavailable. Your submit was recorded as an attempt, never as solved.' : result?.message || 'No console output yet.'}</p>}</div>
        </section>
        {result && <div className={`cf-result ${result.status === 'accepted' ? 'accepted' : 'unavailable'}`}><b>{result.status === 'accepted' ? 'Accepted' : 'Execution provider unavailable'}</b><span>{result.message || 'No result available.'}</span></div>}
      </section>
    </div>
  </Shell>;
}

export function Cheatsheets({ user, bookmarksOnly = false }) {
  const [sheets, setSheets] = useState([]); const [error, setError] = useState(''); const [selectedId, setSelectedId] = useState(null); const [saving, setSaving] = useState('');
  const load = async () => { try { setError(''); const data = bookmarksOnly ? await api.dsaBookmarks() : await api.dsaCheatsheets(); const next = bookmarksOnly ? data.bookmarks : data.cheatsheets; setSheets(next); setSelectedId(current => current || new URLSearchParams(window.location.search).get('sheet') || next[0]?.id || null); } catch (err) { setError(err.message); } };
  useEffect(() => { void load(); }, [bookmarksOnly]);
  const selected = sheets.find(sheet => sheet.id === selectedId);
  const toggleBookmark = async sheet => { setSaving(`bookmark:${sheet.id}`); try { if (sheet.progress?.bookmarked) await api.removeDsaCheatsheetBookmark(sheet.id); else await api.bookmarkDsaCheatsheet(sheet.id); await load(); } catch (err) { setError(err.message); } finally { setSaving(''); } };
  const revise = async sheet => { setSaving(`revise:${sheet.id}`); try { await api.reviseDsaCheatsheet(sheet.id); await load(); } catch (err) { setError(err.message); } finally { setSaving(''); } };
  return <Shell user={user}><PageIntro eyebrow="LEARNING · CHEATSHEETS" title={bookmarksOnly ? 'My bookmarks' : 'DSA cheatsheets'}>{bookmarksOnly ? 'Your saved DSA reference material.' : 'Short, practical references for patterns, complexity and implementation choices.'} {!bookmarksOnly && <Link to="/bookmarks">View my bookmarks </Link>}</PageIntro>{error ? <Failure title="We couldn’t load cheatsheets." error={error} retry={load} /> : !sheets.length ? <section className="dsa-empty compact"><h2>No bookmarked cheatsheets yet.</h2><p>Save a cheatsheet from Learning  Cheatsheets to find it here.</p><Link className="button" to="/cheatsheets">Browse cheatsheets</Link></section> : <section className="dsa-cheatsheet-layout"><aside>{sheets.map(sheet => <button className={selectedId === sheet.id ? 'active' : ''} onClick={() => setSelectedId(sheet.id)} key={sheet.id}><b>{sheet.title}</b><small>{sheet.progress?.bookmarked ? 'Saved' : 'Reference'}</small></button>)}</aside>{selected && <article className="dsa-sheet"><div className="dsa-sheet-top"><div><span className="overline">{selected.title.toUpperCase()} CHEATSHEET</span><h2>{selected.title}</h2></div><div><PrimaryButton disabled={Boolean(saving)} onClick={() => void revise(selected)}>{saving === `revise:${selected.id}` ? 'Saving…' : 'Mark as revised'}</PrimaryButton></div></div><LearningActions itemKey={`sheet:${selected.id}`} /><section><h3>Core concepts</h3><p>{selected.coreConcepts.join(' · ')}</p></section><section><h3>Important patterns</h3><ul>{selected.patterns.map(pattern => <li key={pattern}>{pattern}</li>)}</ul></section><section><h3>Complexity guide</h3><ul>{selected.complexities.map(item => <li key={item}>{item}</li>)}</ul></section><section><h3>Interview techniques</h3><ul>{selected.techniques.map(item => <li key={item}>{item}</li>)}</ul></section><section><h3>Short template</h3><pre>{selected.template}</pre></section><p className="cf-muted">Revision count: {selected.progress?.revisionCount || 0}. PDF export is intentionally unavailable until a real export feature is added.</p></article>}</section>}</Shell>;
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
  return <Shell user={user}><PageIntro eyebrow="PRACTICE · ASSESSMENTS" title="Mock tests, not a problem library.">Use Learning for topic-by-topic DSA and aptitude. Use Practice for timed assessments and result reviews.</PageIntro><section className="practice-hub-grid">{cards.map(card => <article className={selected === card.id ? 'selected' : ''} key={card.id}><span className="overline">{card.id === 'dsa' ? 'CODING ASSESSMENT' : 'TIMED ASSESSMENT'}</span><h2>{card.title}</h2><p>{card.detail}</p><small>{card.meta}</small>{card.href ? <Link className="button" to={card.href}>{card.action} </Link> : <button className="button secondary" disabled>{card.action}</button>}</article>)}</section><section className="dsa-empty compact"><h2>Why coding tests are unavailable right now</h2><p>CareerForge needs an isolated code-execution provider before it can honestly score a DSA mock. Normal DSA topics and the internal editor stay under Learning  DSA.</p><Link className="button secondary" to="/dsa">Open DSA learning</Link></section></Shell>;
}
