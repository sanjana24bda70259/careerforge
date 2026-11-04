import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { siApple, siAtlassian, siGoldmansachs, siGoogle, siMeta, siNvidia, siPaypal, siSwiggy, siUber } from 'simple-icons';
import { WorkspaceLayout } from './Workspace.jsx';
import { DsaExploreNav } from './DsaExploreNav.jsx';
import { api } from '../services/api.js';
import { handbook, handbookById, handbookReferences, patternForQuestion, problemHref } from '../../../shared/dsaHandbook.mjs';
import { isPractised } from '../../../shared/dsaLearningMap.mjs';
import { dsaCompanies, dsaCompanyGroups, companySources, companyEvidenceChecked } from '../../../shared/dsaCompanies.mjs';

function usePracticeIndex() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setError('');
    Promise.all([api.roadmap(), api.learningItems()]).then(([roadmap, saved]) => {
      if (!current) return;
      setData({ questions: Object.fromEntries(roadmap.topics.flatMap(t => t.questions.map(q => [`${t.id}:${q.id}`, { ...q, topic:t.id }]))), items:Object.fromEntries(saved.items.map(item => [item.key,item])) });
    }).catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [retry]);
  return { data, error, retry:() => setRetry(n => n+1) };
}
function LoadNote({ state }) {
  return state.error ? <div className="dh-notice" role="alert">{state.error}<button onClick={state.retry}>Retry progress</button></div> : !state.data ? <p role="status" className="dh-muted">Loading your practice progress…</p> : null;
}
function Header({ eyebrow, title, children }) {
  return <header className="dh-header"><span className="dh-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{children}</p></header>;
}
const sections = [['recognise','When to use it'],['algorithm','Algorithm & proof'],['example','Worked example'],['cost','Time & space'],['pitfalls','Pitfalls & variants'],['practice','Practice ladder'],['check','Quick check'],['references','References']];
const signals = [
  ['linear-scan','One lookup in unsorted data'], ['binary-search','Sorted data or a monotonic decision'],
  ['prefix-sums','Many static range sums'], ['sliding-window','A contiguous interval with maintainable state'],
  ['hashing','Membership, frequency or a complement'], ['graphs','Connections, dependencies or paths'],
];

export function DsaHandbookPage({ user }) {
  const { patternId } = useParams();
  const state = usePracticeIndex();
  const chapter = handbookById(patternId);
  const [search, setSearch] = useState(''), [signal, setSignal] = useState('linear-scan');
  const groups = [...new Set(handbook.map(item => item.group))];
  const filtered = handbook.filter(item => `${item.title} ${item.when} ${item.topics.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  useEffect(() => {
    if (patternId) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [patternId]);
  if (patternId && !chapter) return <WorkspaceLayout user={user}><DsaExploreNav /><div className="dh-empty"><h1>Chapter not found</h1><Link to="/dsa/learn">Browse the pattern library</Link></div></WorkspaceLayout>;
  return <WorkspaceLayout user={user}><div className="dh-workspace"><DsaExploreNav />
    {!chapter ? <>
      <Header eyebrow="THE CAREERFORGE HANDBOOK" title="Learn the pattern. Understand the why.">A chapter for the idea, a trace for the intuition, and a practice ladder to make it stick.</Header>
      <div className="dh-library-summary"><span><b>{handbook.length}</b> original chapters</span><span><b>{groups.length}</b> learning tracks</span><span><b>Learn → trace → practise</b> at your pace</span></div>
      <section className="dh-finder"><div><span className="dh-eyebrow">START WITH THE CLUE</span><h2>Which pattern should I try?</h2><p>Choose the input property. Then read the assumptions before using the technique.</p></div><label>What does the problem give you?<select value={signal} onChange={e => setSignal(e.target.value)}>{signals.map(([id,label]) => <option value={id} key={id}>{label}</option>)}</select></label><Link className="dh-primary" to={`/dsa/learn/${signal}`}>Explore {handbookById(signal).title} →</Link></section>
      <label className="dh-search">Find a chapter<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Try binary search, array, prefix…" /></label>
      <LoadNote state={state} />
      {groups.map(group => { const chapters = filtered.filter(c => c.group === group); return chapters.length ? <section key={group} className="dh-library-group"><h2>{group}</h2><div className="dh-card-grid">{chapters.map(item => {
        const done = state.data ? item.ladder.filter(ref => state.data.questions[ref] && isPractised(state.data.questions[ref], state.data.items)).length : null;
        return <Link className="dh-chapter-card" to={`/dsa/learn/${item.id}`} key={item.id}><span className="dh-eyebrow">{item.topics.join(' / ').replaceAll('-', ' ')}</span><h3>{item.title}</h3><p>{item.when}</p><footer><span>{item.ladder.length} ladder questions</span><span>{done === null ? 'Progress loading' : `${done}/${item.ladder.length} practised`}</span></footer></Link>;
      })}</div></section> : null; })}
      {!filtered.length && <div className="dh-empty"><h2>No matching chapter</h2><button onClick={() => setSearch('')}>Show all chapters</button></div>}
    </> : <div className="dh-reading-layout">
      <aside className="dh-chapter-nav" aria-label="Handbook chapters"><Link to="/dsa/learn">← Pattern library</Link>{groups.map(group => <section key={group}><h2>{group}</h2>{handbook.filter(c => c.group === group).map(c => <Link key={c.id} className={c.id === chapter.id ? 'active' : ''} aria-current={c.id === chapter.id ? 'page' : undefined} to={`/dsa/learn/${c.id}`}>{c.title}</Link>)}</section>)}</aside>
      <Chapter key={chapter.id} chapter={chapter} state={state} />
      <nav className="dh-on-page" aria-label="On this page"><span className="dh-eyebrow">ON THIS PAGE</span>{sections.map(([id,label]) => <a key={id} href={`#chapter-${id}`}>{label}</a>)}<a href="#chapter-top">↑ Back to top</a></nav>
    </div>}
  </div></WorkspaceLayout>;
}

function Chapter({ chapter:c, state }) {
  const [step, setStep] = useState(0), [answer, setAnswer] = useState(null), [checked, setChecked] = useState(false), [copy, setCopy] = useState('');
  const index = handbook.findIndex(item => item.id === c.id);
  const relevant = dsaCompanies.filter(company => company.questions.some(q => q.pattern === c.id));
  return <article className="dh-chapter" id="chapter-top">
    <Header eyebrow={`${c.group} / CHAPTER ${String(index+1).padStart(2,'0')}`} title={c.title}>{c.when}</Header>
    <div className="dh-chapter-meta"><span>Original CareerForge guide</span><span>{c.ladder.length} practice questions</span></div>
    {c.prerequisites.length > 0 && <div className="dh-prerequisites"><b>Before this chapter</b>{c.prerequisites.map(id => <Link key={id} to={`/dsa/learn/${id}`}>{handbookById(id).title} ↗</Link>)}</div>}
    <section id="chapter-recognise"><span className="dh-eyebrow">01 / RECOGNISE</span><h2>When this pattern is the right tool</h2><p>{c.idea}</p><div className="dh-callout"><b>The clue to look for</b><p>{c.when}</p></div></section>
    <section id="chapter-algorithm"><span className="dh-eyebrow">02 / REASON</span><h2>The algorithm</h2><ol className="dh-steps">{c.steps.map(s => <li key={s}>{s}</li>)}</ol><div className="dh-code"><header><span>PYTHON · {c.id === 'complexity' ? 'LOOP FRAGMENT' : 'PATTERN TEMPLATE'}</span><button onClick={async () => { try { await navigator.clipboard.writeText(c.code); setCopy('Copied'); } catch { setCopy('Select the code to copy it manually.'); } }}>Copy</button></header><pre><code>{c.code}</code></pre><small role="status">{copy}</small></div><p className="dh-muted">The template illustrates this chapter’s stated input contract. Adapt parameters, return values and constraints to the exercise.</p><h3>Why it works: the invariant</h3><p>{c.invariant}</p></section>
    <section id="chapter-example"><span className="dh-eyebrow">03 / TRACE</span><h2>A worked example</h2><div className="dh-trace"><b>Input</b><code>{c.example.input}</code><ol>{c.example.trace.slice(0,step+1).map((line,i) => <li className={i === step ? 'current' : ''} key={line}><span>{i+1}</span>{line}</li>)}</ol><div className="dh-trace-controls"><button disabled={step === 0} onClick={() => setStep(s => s-1)}>Back</button><span>Step {step+1} / {c.example.trace.length}</span><button disabled={step === c.example.trace.length-1} onClick={() => setStep(s => s+1)}>Next step →</button><button onClick={() => setStep(0)}>Reset</button></div>{step === c.example.trace.length-1 && <p role="status"><b>Result:</b> {c.example.output}</p>}</div></section>
    <section id="chapter-cost"><span className="dh-eyebrow">04 / ANALYSE</span><h2>Time & space</h2><div className="dh-cost"><div><b>Time</b><p>{c.time}</p></div><div><b>Space</b><p>{c.space}</p></div></div></section>
    <section id="chapter-pitfalls"><span className="dh-eyebrow">05 / WATCH THE BOUNDARIES</span><h2>Pitfalls</h2><div className="dh-warning"><b>Check the assumptions</b><p>{c.pitfall}</p></div><h3>When the pattern changes</h3><ul>{c.variants.map(v => <li key={v}>{v}</li>)}</ul></section>
    <section id="chapter-practice"><span className="dh-eyebrow">06 / PUT IT TO WORK</span><h2>Your practice ladder</h2><p>Follow this suggested order. Checkmarks reflect your saved practice or accepted solutions; reading is not counted as solving.</p><LoadNote state={state} /><div className="dh-ladder">{c.ladder.map((ref,i) => {
      const q = state.data?.questions[ref], done = q && isPractised(q,state.data.items);
      return <div key={ref}><span className="dh-ladder-number">{done ? '✓' : String(i+1).padStart(2,'0')}</span><div><small>{i === 0 ? 'FOUNDATION' : i === c.ladder.length-1 ? 'STRETCH' : 'CORE PRACTICE'}</small><Link to={problemHref(ref)}>{q?.title || ref.split(':')[1].replaceAll('-',' ')}</Link></div><span className={`dh-difficulty ${(q?.difficulty || '').toLowerCase()}`}>{q?.difficulty || 'Practice'}</span><Link aria-label={`Theory for ${q?.title || ref}`} to={`${problemHref(ref)}?view=theory`}>Theory ↗</Link></div>;
    })}</div>{relevant.length > 0 && <div className="dh-company-links"><b>Explore interview reports for this pattern</b>{relevant.map(company => <Link key={company.id} to={`/dsa/companies/${company.id}?pattern=${c.id}`}>{company.name}</Link>)}</div>}</section>
    <section id="chapter-check"><span className="dh-eyebrow">07 / CHECK YOUR REASONING</span><h2>Quick check</h2><fieldset className="dh-quiz"><legend>{c.quiz.question}</legend>{c.quiz.options.map((option,i) => <label key={option}><input type="radio" name={`chapter-${c.id}`} checked={answer === i} onChange={() => { setAnswer(i); setChecked(false); }} />{option}</label>)}<button disabled={answer === null} onClick={() => setChecked(true)}>Check answer</button>{checked && <p role="status"><b>{answer === c.quiz.correct ? 'Correct. ' : 'Try the reasoning again. '}</b>{c.quiz.explanation}</p>}</fieldset></section>
    <section id="chapter-references"><h2>Continue learning</h2><p>These original notes can be studied alongside the following algorithm references.</p><a href={handbookReferences[0].url} target="_blank" rel="noreferrer">{handbookReferences[0].title} ↗</a>{c.id === 'binary-search' && <p><a href={handbookReferences[1].url} target="_blank" rel="noreferrer">{handbookReferences[1].title} ↗</a></p>}</section>
    <footer className="dh-chapter-footer">{index > 0 && <Link to={`/dsa/learn/${handbook[index-1].id}`}>← {handbook[index-1].title}</Link>}{index < handbook.length-1 && <Link to={`/dsa/learn/${handbook[index+1].id}`}>Next: {handbook[index+1].title} →</Link>}</footer>
  </article>;
}

export function PatternTheoryBridge({ topicId, problem, lesson }) {
  const c = handbookById(patternForQuestion(topicId, { ...problem, subcategory:lesson?.pattern }));
  return <div className="dh-theory-bridge"><span className="dh-eyebrow">CONNECT THIS QUESTION TO A PATTERN</span><h3>{c.title}</h3><p>{c.when}</p><Link to={`/dsa/learn/${c.id}`}>Read the pattern chapter, proof & practice ladder →</Link><details><summary>Pattern assumptions & pitfalls</summary><p>{c.pitfall}</p><small>This is pattern-level guidance. Use the question’s exact constraints when choosing a solution.</small></details></div>;
}

const evidenceLabels = { reported:'Named in source', variant:'Reported variant', related:'Related practice' };
const brandIcons = { apple:siApple, atlassian:siAtlassian, goldmansachs:siGoldmansachs, google:siGoogle, meta:siMeta, nvidia:siNvidia, paypal:siPaypal, swiggy:siSwiggy, uber:siUber };
function CompanyLogo({ company }) {
  const icon = brandIcons[company.logo];
  return <span className={`dh-company-logo logo-${company.id}`} style={{'--company-color':company.color}} aria-hidden="true">
    {icon ? <svg viewBox="0 0 24 24"><path fill={`#${icon.hex}`} d={icon.path} /></svg> : <span>{company.initials}</span>}
  </span>;
}
function CompanyCard({ company, active, questions }) {
  const mix = { Easy:0, Medium:0, Hard:0 };
  const patternCount = new Set(company.questions.map(q => q.pattern)).size;
  for (const item of company.questions) { const level = questions?.[item.ref]?.difficulty; if (level in mix) mix[level] += 1; }
  const known = Object.values(mix).reduce((sum,value) => sum + value,0);
  const label = known ? `Difficulty mix: ${mix.Easy} easy, ${mix.Medium} medium, ${mix.Hard} hard` : 'Difficulty mix loading';
  return <Link className={`dh-company-card ${active ? 'active' : ''}`} to={`/dsa/companies/${company.id}`} aria-current={active ? 'page' : undefined}>
    <CompanyLogo company={company} /><div className="dh-company-card-copy"><h3>{company.name}</h3><small>{company.questions.length} mapped {company.questions.length === 1 ? 'question' : 'questions'} · {patternCount} {patternCount === 1 ? 'pattern' : 'patterns'}</small><div className={`dh-difficulty-mix ${known ? '' : 'loading'}`} aria-label={label} title={label}>{known ? <><i className="easy" style={{width:`${mix.Easy/known*100}%`}} /><i className="medium" style={{width:`${mix.Medium/known*100}%`}} /><i className="hard" style={{width:`${mix.Hard/known*100}%`}} /></> : <i />}</div></div>
  </Link>;
}
export function DsaCompaniesPage({ user }) {
  const state = usePracticeIndex();
  const { companyId } = useParams();
  const [params, setParams] = useSearchParams();
  const requestedCompany = companyId || params.get('company');
  const company = dsaCompanies.find(c => c.id === requestedCompany);
  const pattern = params.get('pattern') || 'all', difficulty = params.get('difficulty') || 'all', query = params.get('q') || '';
  const setFilter = (key,value) => setParams(previous => { const next = new URLSearchParams(previous); if (value && value !== 'all') next.set(key,value); else next.delete(key); return next; }, { replace:true });
  const rows = useMemo(() => (company?.questions || []).filter(q => {
    const question = state.data?.questions[q.ref];
    return (pattern === 'all' || q.pattern === pattern) && (difficulty === 'all' || question?.difficulty === difficulty) && `${q.title} ${question?.title || ''} ${handbookById(q.pattern).title}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a,b) => ({Easy:0,Medium:1,Hard:2}[state.data?.questions[a.ref]?.difficulty] ?? 3) - ({Easy:0,Medium:1,Hard:2}[state.data?.questions[b.ref]?.difficulty] ?? 3) || a.title.localeCompare(b.title)), [company,pattern,difficulty,query,state.data]);
  const totalMapped = dsaCompanies.reduce((sum,item) => sum + item.questions.length,0);
  if (!company) return <WorkspaceLayout user={user}><div className="dh-workspace dh-company-page"><DsaExploreNav />
    <Header eyebrow="PREPARE WITH CONTEXT" title="Company interview practice">Choose a company, see the reported patterns, and open any question directly in your practice workspace.</Header>
    <p className="dh-evidence-note">Candidate reports and community collections, not official company question banks. “Related practice” trains a reported pattern rather than reproducing the question. These selected reports do not establish interview frequency. Sources checked {companyEvidenceChecked}.</p>
    <div className="dh-company-overview"><b>{dsaCompanies.length} companies</b><span>{totalMapped} sourced question mappings</span><div className="dh-company-legend"><span><i className="easy" />Easy</span><span><i className="medium" />Medium</span><span><i className="hard" />Hard</span></div></div>
    {requestedCompany && <div className="dh-notice">That company page was not found. Choose one from the catalog.</div>}
    <div className="dh-company-catalog">{dsaCompanyGroups.map(group => { const companies = group.companyIds.map(id => dsaCompanies.find(item => item.id === id)).filter(Boolean); return <section key={group.id} className="dh-company-group"><header><div><h2>{group.title}</h2><p>{group.description}</p></div><span>{companies.length} {companies.length === 1 ? 'company' : 'companies'}</span></header><div className="dh-company-grid">{companies.map(item => <CompanyCard key={item.id} company={item} active={false} questions={state.data?.questions} />)}</div></section>; })}</div>
  </div></WorkspaceLayout>;

  const group = dsaCompanyGroups.find(item => item.companyIds.includes(company.id));
  const counts = { Easy:0, Medium:0, Hard:0 };
  for (const item of company.questions) { const level = state.data?.questions[item.ref]?.difficulty; if (level in counts) counts[level] += 1; }
  const patternCount = new Set(company.questions.map(item => item.pattern)).size;
  return <WorkspaceLayout user={user}><div className="dh-workspace dh-company-page dh-company-detail"><DsaExploreNav />
    <header className="dh-company-hero"><CompanyLogo company={company} /><div><span className="dh-eyebrow">{group?.title || 'INTERVIEW PRACTICE'}</span><h1>{company.name} interview questions</h1><p>{company.description} Select a question to open the CareerForge solver, or read its theory first.</p></div></header>
    <p className="dh-evidence-note">This is a curated map of public candidate reports to CareerForge exercises. Named questions, reported variants and related pattern practice are labelled separately. Sources checked {companyEvidenceChecked}.</p>
    <section className="dh-company-stats" aria-label={`${company.name} question summary`}><div><small>QUESTIONS</small><b>{company.questions.length}</b></div><div><small>EASY</small><b>{state.data ? counts.Easy : '—'}</b></div><div><small>MEDIUM</small><b>{state.data ? counts.Medium : '—'}</b></div><div><small>HARD</small><b>{state.data ? counts.Hard : '—'}</b></div><div><small>PATTERNS</small><b>{patternCount}</b></div></section>
    <section className="dh-company-toolbar" aria-label="Question filters"><div className="dh-difficulty-buttons">{[['all','All'],['Easy','Easy'],['Medium','Medium'],['Hard','Hard']].map(([value,label]) => <button key={value} className={value.toLowerCase()} aria-pressed={difficulty === value} onClick={() => setFilter('difficulty',value)}>{label}{value !== 'all' && <span>{counts[value]}</span>}</button>)}</div><label>Search questions<input type="search" placeholder="Title or pattern…" value={query} onChange={e => setFilter('q',e.target.value)} /></label><label>Pattern<select value={pattern} onChange={e => setFilter('pattern',e.target.value)}><option value="all">All patterns</option>{[...new Set(company.questions.map(q => q.pattern))].map(id => <option key={id} value={id}>{handbookById(id).title}</option>)}</select></label><b>{rows.length} / {company.questions.length}</b></section>
    <LoadNote state={state} />
    <p className="dh-company-help">Question titles and Practice buttons open the solver. Theory opens the explanation for the same local exercise.</p>
    {handbook.filter(chapter => rows.some(q => q.pattern === chapter.id)).map(chapter => { const chapterRows = rows.filter(q => q.pattern === chapter.id); return <section className="dh-company-question-group" key={chapter.id}><header><div><span className="dh-eyebrow">PATTERN</span><h2>{chapter.title}</h2></div><span>{chapterRows.length} {chapterRows.length === 1 ? 'question' : 'questions'}</span><Link to={`/dsa/learn/${chapter.id}`}>Read pattern chapter</Link></header><div>{chapterRows.map(q => {
      const local = state.data?.questions[q.ref], source = companySources[q.source], done = local && isPractised(local,state.data.items);
      const displayTitle = local?.title || q.title;
      const alsoAt = dsaCompanies.filter(other => other.id !== company.id && other.questions.some(item => item.ref === q.ref)).slice(0,4);
      return <article className="dh-company-problem-row" key={`${q.source}:${q.ref}`}><div className="dh-company-problem-copy"><div><span className="dh-report-status">{done ? '✓ Practised' : evidenceLabels[q.match]}</span>{q.title !== displayTitle && <span className="dh-reported-title">Reported as: {q.title}</span>}</div><h3><Link to={problemHref(q.ref)}>{displayTitle}</Link></h3>{q.note && <p>{q.note}</p>}{alsoAt.length > 0 && <div className="dh-also-at"><small>ALSO AT</small>{alsoAt.map(other => <Link key={other.id} to={`/dsa/companies/${other.id}`}>{other.name}</Link>)}</div>}<footer><span>{source.type}</span><a href={source.url} target="_blank" rel="noreferrer">View interview report</a></footer></div><div className="dh-company-problem-actions"><span className={`dh-difficulty ${(local?.difficulty || '').toLowerCase()}`}>{local?.difficulty || 'Loading'}</span><Link to={`${problemHref(q.ref)}?view=theory`}>Theory</Link><Link className="dh-practice-button" to={problemHref(q.ref)}>Practice</Link></div></article>;
    })}</div></section>; })}
    {!rows.length && <div className="dh-empty"><h2>No matching questions</h2><button onClick={() => setParams({})}>Reset filters</button></div>}
  </div></WorkspaceLayout>;
}
