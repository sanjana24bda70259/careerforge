import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import '../workspace.css';
import '../workspaceRefresh.css';
import '../workspaceSolid.css';

const groups = [
  { name: 'Learn', icon: 'book', items: [['DSA', '/dsa', 'Roadmap, topics and CareerForge coding workspace'], ['Aptitude', '/aptitude', 'Quantitative, logical, verbal and DI practice'], ['CS Fundamentals', '/cs', 'Notes, revision and separate knowledge checks'], ['Cheatsheets', '/cheatsheets', 'Patterns, complexity and code templates']] },
  { name: 'Practice', icon: 'code', items: [['Aptitude mock tests', '/mock-tests?type=aptitude', 'Timed original aptitude assessments'], ['DSA mock tests', '/mock-tests?type=dsa', 'Timed coding assessments when the secure judge is connected'], ['Placement mock tests', '/mock-tests?type=placement', 'Mixed preparation assessments'], ['Company-style assessments', '/mock-tests?type=company', 'Original formats without fictional company claims'], ['Interview prep', '/interviews', 'Practise structured answers and follow-up questions']] },
  { name: 'Career', icon: 'case', items: [['Resume', '/resume', 'Tell your story clearly'], ['Projects', '/projects', 'Show what you can build'], ['Applications', '/jobs', 'Keep your opportunities in one place']] },
  { name: 'Workspace', icon: 'chart', items: [['My day', '/dashboard', 'Today’s activity-based preparation plan'], ['Mistake Notebook', '/mistakes', 'Save and review real mistakes'], ['Revision', '/backlogs', 'Pick up what needs attention'], ['Bookmarks', '/bookmarks', 'Saved cheatsheets and revision material'], ['Analytics', '/analytics', 'See your preparation progress'], ['Weekly review', '/weekly-review', 'Reflect and plan your next steps']] }
];

function Icon({ name, ...props }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>,
    book: <><path d="M12 5v16M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" /></>,
    code: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" /></>,
    case: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V3h8v4M3 12a22 22 0 0 0 18 0M12 12v4" /></>,
    chart: <><path d="M4 3v18h17M8 16v-5m5 5V6m5 10v-7" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m12 12 8-8" /></>
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.grid}</svg>;
}

function groupActive(name, pathname) {
  if (name === 'Learn' && pathname.startsWith('/learning/')) return true;
  if (name === 'Practice' && pathname === '/mock-tests') return true;
  return groups.find(group => group.name === name)?.items.some(([, path]) => pathname === path || pathname.startsWith(path + '/'));
}

export function WorkspaceLayout({ user, children }) {
  const { pathname } = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const dockRef = useRef(null);
  const accountRef = useRef(null);
  const selectedGroup = groups.find(group => group.name === openGroup);
  const isHome = pathname === '/dashboard';
  const pageName = isHome ? 'Overview' : groups.flatMap(group => group.items).find(([, path]) => pathname === path || pathname === path.split('?')[0])?.[0] || (pathname.startsWith('/learning/') ? 'Learning workspace' : pathname === '/help' ? 'AI Help' : 'Settings');

  useEffect(() => { setOpenGroup(null); if (accountRef.current) accountRef.current.open = false; }, [pathname]);
  useEffect(() => {
    const dismiss = event => {
      if (!dockRef.current?.contains(event.target)) setOpenGroup(null);
      if (!accountRef.current?.contains(event.target) && accountRef.current) accountRef.current.open = false;
    };
    const escape = event => {
      if (event.key !== 'Escape') return;
      if (openGroup) { setOpenGroup(null); dockRef.current?.querySelector('[aria-expanded="true"]')?.focus(); }
      if (accountRef.current?.open) { accountRef.current.open = false; accountRef.current.querySelector('summary')?.focus(); }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [openGroup]);

  return <div className="workspace-shell">
    <a className="ws-skip" href="#workspace-content">Skip to content</a>
    <header className="ws-header">
      <Link className="ws-brand" to="/dashboard" aria-label="CareerForge home"><span className="ws-brandmark"><Icon name="spark" /></span>CareerForge<span className="ws-brand-dot">.</span></Link>
      <span className="ws-breadcrumb">Your workspace <span>/</span> <b>{pageName}</b></span>
      <details className="ws-account" ref={accountRef}>
        <summary aria-label="Account menu"><span className="ws-avatar">{user?.profile?.name?.[0]?.toUpperCase() || 'S'}</span><span className="ws-account-name">{user?.profile?.name || 'Student'}</span><Icon name="chevron" /></summary>
        <div className="ws-account-menu"><Link to="/onboarding">Edit profile</Link><Link to="/settings">Settings</Link><button onClick={() => { localStorage.removeItem('careerforge_token'); localStorage.removeItem('careerforge_user'); location.assign('/login'); }}>Sign out</button></div>
      </details>
    </header>
    <main id="workspace-content" tabIndex="-1" className={isHome ? 'ws-main ws-home' : 'ws-main'}>{children}</main>
    <div className="ws-dock-wrap" ref={dockRef}>
      {selectedGroup && <section className="ws-launcher" aria-label={`${selectedGroup.name} tools`} id={`ws-${selectedGroup.name.toLowerCase()}`}>
        <div className="ws-launcher-head"><div><span className="ws-eyebrow">YOUR WORKSPACE</span><h2>{selectedGroup.name}</h2></div><button aria-label="Close navigation" onClick={() => { setOpenGroup(null); dockRef.current?.querySelector('[aria-expanded="true"]')?.focus(); }}><Icon name="close" /></button></div>
        {selectedGroup.items.map(([name, path, description]) => <NavLink key={path} to={path} onClick={() => setOpenGroup(null)} className="ws-tool"><span className="ws-tool-icon"><Icon name={selectedGroup.icon} /></span><span><b>{name}</b><small>{description}</small></span><Icon name="arrow" /></NavLink>)}
      </section>}
      <nav className="ws-dock" aria-label="Main navigation">
        <NavLink to="/dashboard" className="ws-dock-item" onClick={() => setOpenGroup(null)}><Icon name="home" /><span>Home</span></NavLink>
        <span className="ws-dock-divider" />
        {groups.map(group => <button key={group.name} className={`ws-dock-item ${groupActive(group.name, pathname) ? 'active' : ''} ${openGroup === group.name ? 'is-open' : ''}`} aria-expanded={openGroup === group.name} aria-controls={`ws-${group.name.toLowerCase()}`} onClick={() => setOpenGroup(openGroup === group.name ? null : group.name)}><Icon name={group.icon} /><span>{group.name}</span></button>)}
        <span className="ws-dock-divider" />
        <NavLink to="/help" className="ws-dock-item ws-dock-help" onClick={() => setOpenGroup(null)}><Icon name="spark" /><span>AI Help</span></NavLink>
      </nav>
    </div>
  </div>;
}

function TodayPlan() {
  const [plan, setPlan] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [working, setWorking] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const data = await api.todayPlan(); setPlan(data.plan); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const update = async (taskId, action) => { setWorking(`${taskId}:${action}`); setError(''); try { const data = action === 'replace' ? await api.replaceTodayPlanTask(taskId) : action === 'reschedule' ? await api.rescheduleTodayPlanTask(taskId, window.prompt('Move this task to which date? Use YYYY-MM-DD.') || '') : await api.updateTodayPlanTask(taskId, action); setPlan(data.plan); } catch (err) { setError(err.message); } finally { setWorking(''); } };
  const start = async () => { setWorking('start'); try { const data = await api.startTodayPlan(); setPlan(data.plan); } catch (err) { setError(err.message); } finally { setWorking(''); } };
  return <section className="ws-today" aria-label="What should I do today">
    <div className="ws-today-heading"><div><span className="ws-eyebrow">YOUR PLAN FOR TODAY</span><h2>What should I do today?</h2><p>{loading ? 'Building a plan from your saved preparation…' : plan ? `${plan.completedCount} / ${plan.totalCount} completed · ${plan.estimatedMinutes} min still planned` : 'A focused plan from your saved preparation activity.'}</p></div><button className="ws-today-start" disabled={working === 'start' || Boolean(plan?.startedAt)} onClick={() => void start()}>{working === 'start' ? 'Starting…' : plan?.startedAt ? 'Day started' : 'Start My Day'}</button></div>
    {error && <div className="ws-today-error">{error}<button onClick={() => void load()}>Retry</button></div>}
    {loading ? <div className="ws-today-loading">Loading activity-based tasks…</div> : plan?.tasks?.length ? <div className="ws-today-list">{plan.tasks.map(task => <article className={`ws-today-task ${task.status}`} key={task.id}><button className="ws-task-check" aria-label={task.status === 'completed' ? 'Restore task' : 'Complete task'} disabled={Boolean(working)} onClick={() => void update(task.id, task.status === 'completed' ? 'planned' : 'completed')}>{task.status === 'completed' ? '✓' : '○'}</button><Link to={task.href}><span>{task.domain.toUpperCase()}</span><b>{task.title}</b><small>{task.detail}</small></Link><div className="ws-task-meta"><b>{task.estimatedMinutes} min</b>{task.status === 'planned' && <details><summary aria-label="Task actions">•••</summary><div><button disabled={Boolean(working)} onClick={() => void update(task.id, 'skipped')}>Skip</button><button disabled={Boolean(working)} onClick={() => void update(task.id, 'reschedule')}>Reschedule</button><button disabled={Boolean(working)} onClick={() => void update(task.id, 'replace')}>Replace</button></div></details>}{task.status === 'skipped' && <button className="ws-task-restore" disabled={Boolean(working)} onClick={() => void update(task.id, 'planned')}>Restore</button>}{task.status === 'rescheduled' && <small>Moved to {task.rescheduledFor}</small>}</div></article>)}</div> : <div className="ws-today-loading">No recommendations could be generated yet. Start one learning activity and try again.</div>}
  </section>;
}

function DashboardProgress() {
  const [overview, setOverview] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setError('');
    try {
      const [skillData, revisionData] = await Promise.all([api.skillGraph(), api.dueSkillRevisions()]);
      setOverview(skillData); setRevisions(revisionData.revisions);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const complete = async (revision, recalled) => {
    setWorking(`${revision._id}:${recalled}`);
    try { await api.completeRevision(revision._id, recalled); await load(); }
    catch (err) { setError(err.message); }
    finally { setWorking(''); }
  };
  const skills = (overview?.skills || []).filter(skill => skill.evidenceCount > 0 || skill.status === 'needs_revision').slice(0, 6);
  const assessed = (overview?.skills || []).filter(skill => skill.graded > 0).length;
  return <section className="ws-progress-home" aria-label="Your progress and next actions">
    <div className="ws-progress-heading"><div><span className="ws-eyebrow">YOUR PROGRESS</span><h2>Evidence, not a made-up score.</h2><p>See what your real practice says, then take one useful next step.</p></div><div className="ws-progress-counts"><span><b>{loading ? '—' : assessed}</b> assessed skills</span><span><b>{loading ? '—' : overview?.dueRevisionCount || 0}</b> due revisions</span></div></div>
    {error && <div className="ws-progress-error">Couldn’t load progress: {error}</div>}
    <div className="ws-progress-grid">
      <section className="ws-progress-card ws-progress-actions"><span className="ws-eyebrow">NEXT BEST ACTIONS</span><h3>Keep the loop moving</h3>{loading ? <p className="ws-progress-loading">Loading your recorded practice…</p> : (overview?.nextActions || []).map(action => <Link to={action.href} key={`${action.kind}-${action.title}`}><span>{action.kind === 'revision' ? '↻' : '→'}</span><div><b>{action.title}</b><small>{action.detail}</small></div></Link>)}</section>
      <section className="ws-progress-card ws-progress-map"><div className="ws-progress-card-head"><div><span className="ws-eyebrow">SKILL MAP</span><h3>Recorded signals</h3></div><Link to="/skills">View all</Link></div>{loading ? <p className="ws-progress-loading">Loading your recorded practice…</p> : skills.length ? skills.map(skill => <article key={skill.skillId}><div><b>{skill.label}</b><small>{skill.domain.toUpperCase()} · {skill.graded ? `${skill.graded} graded · ${skill.accuracy}% accuracy` : skill.completed ? `${skill.completed} completion${skill.completed === 1 ? '' : 's'} recorded` : `${skill.interviewResponses || 0} saved response${skill.interviewResponses === 1 ? '' : 's'}`}</small></div><span className={`ws-progress-status ${skill.status}`}>{skill.status === 'needs_revision' ? 'Needs revision' : skill.status === 'supported' ? 'Supported' : 'Building evidence'}</span></article>) : <div className="ws-progress-empty"><b>No evidence yet</b><p>Complete a scored aptitude set or record a DSA problem. Real signals will show here.</p><Link to="/aptitude">Start practice →</Link></div>}</section>
    </div>
    {revisions.length > 0 && <section className="ws-progress-card ws-revisions"><div className="ws-progress-card-head"><div><span className="ws-eyebrow">SMART REVISION</span><h3>Due now</h3></div><span>{revisions.length} due</span></div>{revisions.map(revision => <article key={revision._id}><div><b>{revision.label}</b><p>{revision.prompt || 'Revisit this concept before moving on.'}</p></div><div><button className="ws-revision-secondary" disabled={Boolean(working)} onClick={() => void complete(revision, false)}>{working === `${revision._id}:false` ? 'Saving…' : 'Need another pass'}</button><button className="ws-revision-primary" disabled={Boolean(working)} onClick={() => void complete(revision, true)}>{working === `${revision._id}:true` ? 'Saving…' : 'I recalled it'}</button></div></article>)}</section>}
  </section>;
}

export function WorkspaceDashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.dashboard().then(result => { if (active) setData(result); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const stats = data?.stats;
  const showStat = value => loading || error ? '—' : (value ?? 0).toLocaleString();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.profile?.name?.trim().split(/\s+/)[0] || 'there';
  const shortcuts = [
    ['code', 'Build your coding skills', 'Your DSA roadmap, one topic at a time.', '/dsa'],
    ['grid', 'Sharpen your aptitude', 'A little reasoning goes a long way.', '/aptitude'],
    ['clock', 'Pick up pending work', 'Revisit the things that need attention.', '/backlogs']
  ];
  return <WorkspaceLayout user={user}>
    <div className="ws-welcome"><div><span className="ws-eyebrow">MAKE ROOM FOR PROGRESS</span><h1>{greeting}, {name}<span>.</span></h1><p>A clear mind. A small step. A little closer to your next chapter.</p></div><time className="ws-date" dateTime={new Date().toISOString()}>{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</time></div>
    {error && <div className="ws-error" role="alert"><span>Couldn’t load your progress. {error}</span><button onClick={() => setReload(value => value + 1)}>Try again</button></div>}
    <TodayPlan />
    <section className="ws-stats" aria-label="Your progress" aria-busy={loading}>
      <Link to="/dsa" className="ws-stat"><span className="ws-stat-icon"><Icon name="code" /></span><div><span>Problems solved</span><strong>{showStat(stats?.solved)}</strong></div><Icon name="arrow" /></Link>
      <Link to="/aptitude" className="ws-stat"><span className="ws-stat-icon"><Icon name="target" /></span><div><span>Aptitude accuracy</span><strong>{loading || error || stats?.aptitude?.accuracy == null ? '—' : `${stats.aptitude.accuracy}%`}</strong><small>{!loading && !error && stats?.aptitude?.accuracy == null ? 'Start a set to see your score' : !loading && !error ? `${stats?.aptitude?.attempted ?? 0} questions attempted` : loading ? 'Loading your progress' : 'Progress unavailable'}</small></div><Icon name="arrow" /></Link>
      <Link to="/mock-tests" className="ws-stat"><span className="ws-stat-icon"><Icon name="check" /></span><div><span>Mock tests completed</span><strong>{showStat(stats?.mockTests)}</strong></div><Icon name="arrow" /></Link>
      <Link to="/cs" className="ws-stat"><span className="ws-stat-icon"><Icon name="book" /></span><div><span>CS topics learned</span><strong>{showStat(stats?.csTopicsLearned)}</strong><small>{!loading && !error && !stats?.csTopicsLearned ? 'Start with one core concept' : 'Recorded learning activity'}</small></div><Icon name="arrow" /></Link>
    </section>
    <div className="ws-focus-grid">
      <section className="ws-focus">
        <div className="ws-focus-top"><span className="ws-focus-label"><span /> YOUR NEXT MOVE</span><Icon name="spark" /></div>
        <h2>Big ambitions.<br />Small, daily steps.</h2>
        <p>You don’t have to do everything today.<br />Start with one problem. Make it count.</p>
        <Link className="ws-primary" to="/dsa">Start practising <Icon name="arrow" /></Link>
        <div className="ws-focus-bottom"><span>Consistency is your advantage.</span><span aria-hidden="true">01 — ∞</span></div>
        <div className="ws-orbits" aria-hidden="true"><i /><i /><i /><i /></div>
      </section>
      <section className="ws-shortcuts"><div className="ws-card-heading"><span className="ws-eyebrow">KEEP IT SIMPLE</span><h2>Where to next?</h2></div>{shortcuts.map(([icon, title, description, path]) => <Link className="ws-shortcut" to={path} key={path}><span className="ws-shortcut-icon"><Icon name={icon} /></span><span><b>{title}</b><small>{description}</small></span><Icon name="arrow" /></Link>)}<Link to="/daily-challenge" className="ws-daily"><span><Icon name="spark" /> Explore today’s challenge</span><Icon name="arrow" /></Link></section>
    </div>
    <DashboardProgress />
    <footer className="ws-home-footer"><span><span className="ws-footer-dot" /> Your pace. Your progress.</span><Link to="/weekly-review">Take a moment to reflect <Icon name="arrow" /></Link></footer>
  </WorkspaceLayout>;
}
