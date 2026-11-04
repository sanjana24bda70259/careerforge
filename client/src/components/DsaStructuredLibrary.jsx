import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from './Workspace.jsx';
import { api } from '../services/api.js';
import { notifyLearningChange } from './LearningActions.jsx';
import { buildTopicMap, isPractised, questionKey } from '../../../shared/dsaLearningMap.mjs';
import { dsaResources } from '../../../shared/dsaResources.mjs';
import '../dsaStructured.css';
import { DsaExploreNav } from './DsaExploreNav.jsx';
import { patternForBranch, patternForQuestion } from '../../../shared/dsaHandbook.mjs';
import { siCodechef, siLeetcode, siYoutube } from 'simple-icons';

const href = (q, theory = false) => `/learning/dsa/${q.topic}/problems/${q.id}${theory ? '?view=theory' : ''}`;
const labels = { solved: 'Accepted', attempted: 'Attempted', needs_revision: 'Needs revision', not_started: 'Not started' };
function Icon({ name }) {
  const paths = { book: 'M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3z M12 6v15', careerforge: 'm12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z', document: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6', play: 'm9 5 10 7-10 7z', video: 'M3 5h18v14H3z M10 9l5 3-5 3z', link: 'M14 3h7v7 M21 3l-11 11 M10 5H4v15h15v-6', source: 'M14.5 4 7 11.5l7.5 7.5 M17 7h3v3 M10.5 8.5 7.5 11.5l3 3', bookmark: 'M6 3h12v18l-6-4-6 4z', note: 'M14 3H4v18h16V10 M8 8h3 M8 12h3 M8 16h8 M14 8l6-6 2 2-6 6-3 1z', more: 'M12 5.5h.01M12 12h.01M12 18.5h.01', map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16' };
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={name === 'more' ? '3' : '1.5'} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.book} /></svg>;
}

function BrandIcon({ icon }) {
  return <svg className="ds-brand-icon" viewBox="0 0 24 24" fill={`#${icon.hex}`} aria-hidden="true"><path d={icon.path} /></svg>;
}

function QuestionRow({ question, items, busy, save, recommended, ready }) {
  const key = questionKey(question.topic, question.id), saved = items[key] || {};
  const done = isPractised(question, items), accepted = question.status === 'solved';
  const resources = dsaResources[`${question.topic}:${question.id}`];
  const sourceName = `${resources?.sourceLabel || ''} ${resources?.sourceUrl || ''}`.toLowerCase();
  const sourceBrand = sourceName.includes('codechef') ? siCodechef : sourceName.includes('leetcode') ? siLeetcode : null;
  return <div className={`ds-question ${recommended ? 'is-next' : ''}`}>
    <input type="checkbox" aria-label={`${accepted ? 'Accepted solution' : 'Mark practised'}: ${question.title}`} title={accepted ? 'Accepted solution. This checkmark cannot undo a judged result.' : 'Self-reported practice, saved to your account. Does not count as an accepted submission.'} checked={done} disabled={accepted || !ready || busy.has(key)} onChange={() => save(question, 'practised', !saved.practised)} />
    <div className="ds-question-name"><Link to={href(question)}>{question.title}</Link><div><span className={`ds-difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>{recommended && <span className="ds-next-tag">UP NEXT</span>}{question.status !== 'not_started' && <span>{labels[question.status]}</span>}{saved.practised && !accepted && <span>Practised</span>}{question.related && <span>From {question.topicName}</span>}</div></div>
    <div className="ds-row-actions" aria-label={`Resources for ${question.title}`}>
      <Link className="ds-action-brand" to={href(question)} title="Solve in CareerForge" aria-label={`Solve in CareerForge: ${question.title}`}><Icon name="careerforge" /></Link>
      <Link className="ds-action-document" to={href(question, true)} title="Theory & solution" aria-label={`Read theory: ${question.title}`}><Icon name="document" /></Link>
      {resources?.videoUrl ? <a className="ds-action-video" href={resources.videoUrl} target="_blank" rel="noreferrer" title={resources.videoScope === 'problem' ? 'YouTube video explanation' : 'Related YouTube topic video'} aria-label={`Open ${resources.videoScope === 'problem' ? 'YouTube video' : 'related YouTube topic video'}: ${question.title}`}><BrandIcon icon={siYoutube} /></a> : <button className="ds-action-video" type="button" disabled title="YouTube video not available" aria-label={`YouTube video not available: ${question.title}`}><BrandIcon icon={siYoutube} /></button>}
      {resources?.sourceUrl ? <a className="ds-action-source" href={resources.sourceUrl} target="_blank" rel="noreferrer" title={resources.sourceLabel || 'Open source problem'} aria-label={`Open source problem: ${question.title}`}>{sourceBrand ? <BrandIcon icon={sourceBrand} /> : <Icon name="link" />}</a> : <button className="ds-action-source" type="button" disabled title={`${sourceBrand?.title || 'External source'} problem not available`} aria-label={`External source not available: ${question.title}`}>{sourceBrand ? <BrandIcon icon={sourceBrand} /> : <Icon name="link" />}</button>}
      <Link className="ds-action-note" to={`/study/${encodeURIComponent(key)}`} title="Notes & review" aria-label={`Notes and review: ${question.title}`}><Icon name="note" /></Link>
      <button className="ds-action-bookmark" type="button" disabled={!ready || busy.has(key)} aria-pressed={Boolean(saved.bookmarked)} title={saved.bookmarked ? 'Remove bookmark' : 'Bookmark'} aria-label={`${saved.bookmarked ? 'Remove bookmark' : 'Bookmark'}: ${question.title}`} onClick={() => save(question, 'bookmarked', !saved.bookmarked)}><Icon name="bookmark" /></button>
      <details className="ds-action-more"><summary title="More actions" aria-label={`More actions: ${question.title}`}><Icon name="more" /></summary><div className="ds-action-menu"><Link to={href(question)}>Open practice</Link><Link to={href(question, true)}>Read theory</Link>{question.visualizationId && <Link to={`/dsa/visuals/${question.visualizationId}`}>Animated walkthrough</Link>}<Link to={`/dsa/learn/${patternForQuestion(question.topic, question)}`}>Open pattern guide</Link></div></details>
    </div>
  </div>;
}

export function DsaMapPanel({ topic, map, selected, onSelect, reset, ready }) {
  return <aside className="ds-map" aria-label={`${topic.name} learning map`}>
    <header><div><span className="ds-eyebrow">YOUR PATTERN COMPASS</span><h2>{topic.name} learning map</h2></div><Icon name="map" /></header>
    <p className="ds-map-intro">{topic.id === 'arrays' ? 'A path from your first loop to connected patterns.' : 'A suggested sequence, grouped by difficulty and pattern.'} Click a branch to focus the question sheet.</p>
    <div className="ds-map-root"><span>{topic.name.toUpperCase()}</span><b>LEARN  CONNECT  PRACTISE</b><small>{map.done} / {map.total} practised or accepted</small></div>
    <div className="ds-map-tree">{map.phases.map((phase, i) => <section key={phase.id} className={`ds-map-phase tone-${phase.color} ${selected?.phaseId === phase.id ? 'selected' : ''}`}><button className="ds-phase-title" aria-pressed={selected?.phaseId === phase.id && !selected?.branchId} onClick={() => onSelect(phase.id)}><span className="ds-phase-number">{phase.complete ? '✓' : `0${i+1}`}</span><span><small>PHASE {i+1}{map.recommendation?.phaseId === phase.id ? ' · START HERE' : phase.complete ? ' · PRACTISED' : ''}</small><b>{phase.title}</b></span><em>{phase.done}/{phase.total}</em></button><div className="ds-branches">{phase.branches.map(branch => <div className="ds-branch-entry" key={branch.id}><button className={selected?.phaseId === phase.id && selected?.branchId === branch.id ? 'selected' : ''} aria-pressed={selected?.phaseId === phase.id && selected?.branchId === branch.id} onClick={() => onSelect(phase.id, branch.id)}><i /><span>{branch.title}<small>{branch.cue}</small></span><em>{branch.done}/{branch.total}</em></button><Link to={`/dsa/learn/${patternForBranch(topic.id, branch)}`}>Read pattern theory ↗</Link></div>)}</div><p className="ds-phase-outcome">↳ {phase.outcome}</p></section>)}</div>
    <button className="ds-map-reset" onClick={reset}>Show all {topic.name.toLowerCase()} questions </button>
    <p className="ds-map-foot">{ready ? 'Recommendations update from accepted solutions and your saved practice checkmarks. Explore any phase; nothing is locked.' : 'Waiting for your saved practice progress before recommending a next step.'}{topic.id === 'arrays' && ' Related questions from other topics are included without duplicating progress.'}</p>
  </aside>;
}

export function DsaStructuredLibrary({ user, initialTopic }) {
  const [data, setData] = useState(null), [items, setItems] = useState({});
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [saveError, setSaveError] = useState('');
  const [reload, setReload] = useState(0), [busy, setBusy] = useState(new Set());
  const pending = useRef(new Set()), revisions = useRef({});
  const [activeTopic, setActiveTopic] = useState(initialTopic || 'arrays');
  const [open, setOpen] = useState({ [initialTopic || 'arrays']: true });
  const [selected, setSelected] = useState(null), [query, setQuery] = useState(''), [difficulty, setDifficulty] = useState('All'), [status, setStatus] = useState('All');
  const [scope, setScope] = useState(initialTopic || 'All'), [mode, setMode] = useState('all');
  const [mobileView, setMobileView] = useState('sheet');
  useEffect(() => {
    let current = true;
    setError(''); setReady(false);
    const started = { ...revisions.current };
    Promise.all([api.roadmap(), api.learningItems()]).then(([roadmap, learning]) => { if (current) {
      setData(roadmap);
      setItems(previous => {
        const next = Object.fromEntries(learning.items.map(item => [item.key, item]));
        for (const key of Object.keys(previous)) if (started[key] !== revisions.current[key]) next[key] = previous[key];
        return next;
      });
      setReady(true);
    } }).catch(err => { if (current) setError(err.message); });
    const changed = event => { if (event.detail?.key) {
      const key = event.detail.key;
      revisions.current[key] = (revisions.current[key] || 0) + 1;
      setItems(previous => ({ ...previous, [key]: event.detail }));
    } else setReload(n => n+1); };
    const refresh = () => { if (document.visibilityState === 'visible' && !pending.current.size) setReload(n => n+1); };
    window.addEventListener('careerforge:learning-change', changed);
    window.addEventListener('focus', refresh);
    return () => { current = false; window.removeEventListener('careerforge:learning-change', changed); window.removeEventListener('focus', refresh); };
  }, [reload, user.id]);
  const topics = data?.topics || [];
  const topic = topics.find(t => t.id === activeTopic) || topics[0];
  const map = useMemo(() => topic ? buildTopicMap(topic, topics, items) : null, [topic, topics, items]);
  const recommendation = ready ? map?.recommendation : null;
  const completed = topics.reduce((n,t) => n + t.questions.filter(q => isPractised({ ...q, topic:t.id }, items)).length, 0);
  function selectTopic(id) { setActiveTopic(id); setOpen(previous => ({ ...previous, [id]: true })); setSelected(null); }
  function selectBranch(phaseId, branchId = null) { setSelected({ phaseId, branchId }); setScope(topic.id); setOpen(previous => ({ ...previous, [topic.id]: true })); setQuery(''); setDifficulty('All'); setStatus('All'); setMode('all'); setMobileView('sheet'); }
  function clear() { setQuery(''); setDifficulty('All'); setStatus('All'); setMode('all'); setScope('All'); setSelected(null); }
  async function save(question, field, value) {
    const key = questionKey(question.topic, question.id);
    if (!ready || pending.current.has(key)) return;
    pending.current.add(key); setBusy(new Set(pending.current)); setSaveError('');
    try { const result = await api.saveLearningItem(key, { [field]: value }); setItems(previous => ({ ...previous, [key]: result.item })); notifyLearningChange(result.item); }
    catch (err) { setSaveError(err.message); }
    finally { pending.current.delete(key); setBusy(new Set(pending.current)); }
  }
  function matches(q) {
    const saved = items[questionKey(q.topic, q.id)];
    return (mode === 'all' || saved?.bookmarked) && (difficulty === 'All' || q.difficulty === difficulty) &&
      (status === 'All' || (status === 'practised' ? isPractised(q, items) : status === 'remaining' ? !isPractised(q, items) : q.status === status)) &&
      `${q.title} ${q.subcategory} ${q.topicName}`.toLowerCase().includes(query.trim().toLowerCase());
  }
  const sheet = topics.filter(t => scope === 'All' || scope === t.id).map(t => {
    let questions = t.questions.map(q => ({ ...q, topic:t.id, topicName:t.name }));
    if (selected && t.id === topic?.id) {
      const phase = map.phases.find(p => p.id === selected.phaseId);
      questions = (phase?.branches || []).filter(b => !selected.branchId || b.id === selected.branchId).flatMap(b => b.questions.map(q => ({ ...q, related:q.topic !== t.id })));
    }
    return { ...t, visible:questions.filter(matches), totalDone:t.questions.filter(q => isPractised({ ...q, topic:t.id }, items)).length };
  }).filter(t => t.visible.length);
  const visibleCount = sheet.reduce((n,t) => n+t.visible.length,0);
  return <WorkspaceLayout user={user}><div className="ds-workbench"><DsaExploreNav />
    <div className="ds-topline"><span className="ds-eyebrow">CAREERFORGE / DSA STUDIO</span><div><Link to="/cheatsheets">Pattern notes </Link><Link to="/bookmarks">Saved questions </Link></div></div>
    <header className="ds-page-heading"><div><span className="ds-pill">A CLEARER PATH TO PROBLEM SOLVING</span><h1>One pattern at a time<span>.</span></h1><p>Know what to practise. Understand why it comes next.</p></div><div className="ds-overall"><strong>{data ? completed : '—'}<small> / {data?.summary?.totalProblems ?? '—'}</small></strong><span>practised or accepted</span><progress max={data?.summary?.totalProblems || 1} value={completed} /></div></header>
    <section className="ds-recommendation" aria-label="Recommended next practice"><div className="ds-compass"><Icon name="map" /></div><div><span className="ds-eyebrow">{ready ? recommendation ? `YOUR NEXT STEP IN ${topic.name.toUpperCase()}` : 'THIS PATH IS PRACTISED' : 'BUILDING YOUR LEARNING PATH'}</span><h2>{ready ? recommendation?.branch || 'Revisit a pattern or choose another topic.' : 'Loading your saved progress…'}</h2><p>{recommendation?.reason || (ready ? 'Checkmarks reflect your practice, not a guarantee of mastery. Revisit difficult questions to build recall.' : 'Matching your progress to the topic map.')}</p>{recommendation && <small>Start with <b>{recommendation.question.title}</b> · first unfinished question in the earliest unfinished phase.</small>}</div>{recommendation && <div className="ds-next-actions"><Link to={href(recommendation.question)}>Practise next <span></span></Link><button onClick={() => selectBranch(recommendation.phaseId, recommendation.branchId)}>Show this branch </button></div>}</section>
    <div className="ds-mobile-switch"><button aria-pressed={mobileView === 'sheet'} onClick={() => setMobileView('sheet')}>Question sheet</button><button aria-pressed={mobileView === 'map'} onClick={() => setMobileView('map')}>{topic?.name || 'Topic'} learning map</button></div>
    <div className={`ds-workbench-grid ${mobileView === 'map' ? 'show-map' : ''}`}><section className="ds-sheet" aria-label="DSA question sheet">
      <div className="ds-sheet-heading"><div><span className="ds-eyebrow">YOUR PRACTICE SHEET</span><h2>Find your next challenge</h2></div><div className="ds-sheet-modes"><button aria-pressed={mode === 'all'} onClick={() => setMode('all')}>All questions</button><button aria-pressed={mode === 'saved'} onClick={() => setMode('saved')}>Bookmarked</button></div></div>
      <div className="ds-filters"><input aria-label="Search DSA questions" placeholder="Search questions or patterns…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter topic" value={scope} onChange={e => { setScope(e.target.value); if (e.target.value !== 'All') selectTopic(e.target.value); else setSelected(null); }}><option value="All">All topics</option>{topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select aria-label="Filter difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="All">Any difficulty</option>{['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}</select><select aria-label="Filter practice status" value={status} onChange={e => setStatus(e.target.value)}><option value="All">Any progress</option><option value="remaining">To practise</option><option value="practised">Practised / accepted</option><option value="solved">Accepted only</option><option value="needs_revision">Needs revision</option></select></div>
      <div className="ds-sheet-meta"><span>{visibleCount} matching questions {selected && `· ${map?.phases.find(p => p.id === selected.phaseId)?.title}`}</span><button onClick={clear}>Reset filters</button></div>
      {error && <div className="ds-error" role="alert">{error}<button onClick={() => setReload(n => n+1)}>Retry loading</button></div>}{saveError && <p className="ds-error" role="alert">Couldn’t save: {saveError}. Your saved progress was not changed.</p>}
      {!data && !error ? <p className="ds-empty" role="status">Loading your question sheet…</p> : !sheet.length && !error ? <div className="ds-empty"><h3>No matching questions</h3><p>Try another filter or bookmark a question to find it here.</p><button onClick={clear}>Show all questions</button></div> : sheet.map(t => {
        const expanded = Boolean(open[t.id]) || Boolean(query.trim()) || difficulty !== 'All' || status !== 'All' || mode !== 'all';
        const groups = t.visible.reduce((all,q) => { const label=q.subcategory || 'Fundamentals'; (all[label] ||= []).push(q); return all; }, {});
        return <section className={`ds-topic ${activeTopic === t.id ? 'active' : ''}`} key={t.id}><h3><button aria-expanded={expanded} aria-controls={`sheet-${t.id}`} onClick={() => { if (!expanded) selectTopic(t.id); else setOpen(previous => ({ ...previous, [t.id]: false })); }}><span className="ds-chevron">{expanded ? '⌄' : '›'}</span><span>{t.name}</span><progress max={t.questions.length} value={t.totalDone} /><small>{t.totalDone}/{t.questions.length}</small></button></h3>{expanded && <div id={`sheet-${t.id}`} className="ds-topic-body"><div className="ds-topic-tools"><span>Click a question to practise · use the icons to learn</span><button onClick={() => { selectTopic(t.id); setMobileView('map'); }}><Icon name="map" /> View {t.name} map</button></div><details className="ds-theory-group"><summary><span>Theory & foundations</span><small>{Object.keys(groups).length} patterns</small></summary><div>{Object.entries(groups).map(([name,qs]) => <Link key={name} to={`/dsa/learn/${patternForQuestion(t.id, qs[0])}`}><Icon name="book" />{name}<span></span></Link>)}</div></details>{Object.entries(groups).map(([name,qs]) => <details className="ds-question-group" key={`${t.id}:${selected?.phaseId}:${selected?.branchId}:${name}`} open><summary><span>{name}</span><small>{qs.filter(q => isPractised(q,items)).length}/{qs.length}</small></summary><div>{qs.map(q => <QuestionRow key={`${q.topic}:${q.id}`} question={q} items={items} busy={busy} ready={ready} save={save} recommended={q.id === recommendation?.question.id && q.topic === recommendation?.question.topic} />)}</div></details>)}</div>}</section>;
      })}
      <p className="ds-sheet-foot">✓ A checkbox means “I practised this question” and is saved to your account. Accepted solutions are tracked separately. Reading a theory page or watching a video never marks a question complete.</p>
    </section>{topic && map && <DsaMapPanel topic={topic} map={map} selected={selected} onSelect={selectBranch} reset={() => { setMobileView('sheet'); setSelected(null); setScope(topic.id); setQuery(''); setDifficulty('All'); setStatus('All'); setMode('all'); setOpen(previous => ({ ...previous, [topic.id]:true })); }} ready={ready} />}</div>
  </div></WorkspaceLayout>;
}
