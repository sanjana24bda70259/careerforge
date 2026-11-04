import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useWorkspace } from './WorkspaceContext.jsx';
import '../personalStudy.css';

export function PersonalRoadmap() {
  const [roadmap, setRoadmap] = useState(null); const [error, setError] = useState('');
  const load = () => { setError(''); api.personalRoadmap().then(data => setRoadmap(data.roadmap)).catch(err => setError(err.message)); };
  useEffect(load, []);
  if (error) return <section className="personal-roadmap"><p role="alert">{error}</p><button className="button" onClick={load}>Retry roadmap</button></section>;
  if (!roadmap) return <section className="personal-roadmap" aria-busy="true">Finding your place on the roadmap…</section>;
  const current = roadmap.stages.find(stage => stage.status === 'current');
  return <section className="personal-roadmap" aria-label="Your personalized roadmap">
    <header><div><span className="ws-eyebrow">YOUR PATH · YOUR PACE</span><h2>Your road to {roadmap.targetRole}</h2><p>{roadmap.weeklyStudyHours} hours a week · about {roadmap.dailyMinutes} minutes a day{roadmap.studyGoal ? ` · ${roadmap.studyGoal}` : ''}</p></div><Link to="/settings">Edit your goals </Link></header>
    <div className="roadmap-checkpoint"><span className="roadmap-pin" aria-hidden="true">◎</span><div><small>YOU ARE HERE</small><h3>{current?.title || 'All checkpoints reached'}</h3><p>{current ? current.goals.filter(goal => !goal.completed).map(goal => `${Math.min(goal.value, goal.target)}/${goal.target} ${goal.title.toLowerCase()}`).join(' · ') : 'Keep practising and apply your skills to new projects.'}</p></div><strong>{roadmap.progress}%<small>milestones</small></strong></div>
    <div className="roadmap-stages">{roadmap.stages.map((stage, index) => <details className={`roadmap-stage ${stage.status}`} open={stage.status === 'current' ? true : undefined} key={stage.id}><summary><span className="roadmap-number">{stage.completed ? '✓' : String(index + 1).padStart(2, '0')}</span><span><small>{stage.status === 'current' ? 'CURRENT CHECKPOINT' : stage.completed ? 'COMPLETED' : 'NEXT CHECKPOINT'}</small><b>{stage.title}</b></span><span>{stage.progress}%</span></summary><p>{stage.detail}</p><div className="roadmap-meter" role="progressbar" aria-label={stage.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage.progress}><i style={{ width: `${stage.progress}%` }} /></div><ul>{stage.goals.map(goal => <li key={goal.title}><span>{goal.completed ? '✓' : '○'}</span><Link to={goal.href}>{goal.title}</Link><b>{goal.value}/{goal.target}</b></li>)}</ul></details>)}</div>
    <footer><span><b>{roadmap.achievements.practised}</b> DSA attempted · {roadmap.achievements.solved} accepted</span><span><b>{roadmap.achievements.aptitudeCorrect}</b> unique aptitude correct</span><span><b>{roadmap.achievements.conceptsLearned}</b> concepts learned</span><span><b>{roadmap.achievements.revisionsCompleted}</b> reviews</span></footer>
    {roadmap.knownSkills.length > 0 && <p className="roadmap-note">Your starting skills: {roadmap.knownSkills.join(', ')}. Checkpoints use recorded activity; profile skills guide what to practise.</p>}
  </section>;
}

export function DailyBriefing({ userId }) {
  const { data } = useWorkspace();
  const showBriefing = data?.preferences.dailyBriefing !== false && data?.preferences.planningMode !== 'custom';
  const [plan, setPlan] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const dialog = useRef(null); const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const load = () => api.todayPlan().then(data => { if (active) setPlan(data.plan.acknowledgedAt ? null : data.plan); }).catch(() => {});
    void load();
    const focus = () => { void load(); };
    window.addEventListener('focus', focus);
    const timer = window.setInterval(focus, 60000);
    return () => { active = false; window.removeEventListener('focus', focus); window.clearInterval(timer); };
  }, [userId]);
  useEffect(() => { if (plan && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [plan, showBriefing]);
  const dismiss = async openPlan => {
    setBusy(true); setError('');
    try { await api.acknowledgeDay(); dialog.current?.close(); setPlan(null); if (openPlan) navigate('/dashboard#today-plan'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (!plan || !showBriefing) return null;
  const active = plan.tasks.filter(task => task.status === 'planned');
  return <dialog className="daily-briefing" ref={dialog} aria-labelledby="daily-briefing-title" onCancel={event => { event.preventDefault(); void dismiss(false); }}><span className="ws-eyebrow">A FRESH DAY · {plan.dateKey}</span><h2 id="daily-briefing-title">Here’s your plan for today.</h2><p>{plan.questionCount} questions · {active.filter(task => !task.questionCount).length} other tasks · about {plan.estimatedMinutes} minutes</p><ul>{active.slice(0, 5).map(task => <li key={task.id}><span>{task.kind === 'revision' ? '↻' : ''}</span><div><small>{task.domain.toUpperCase()} · {task.estimatedMinutes} MIN</small><b>{task.title}</b></div></li>)}</ul>{active.length > 5 && <p>+ {active.length - 5} more in your daily plan</p>}<p className="roadmap-note">{plan.planningNote}</p>{error && <p role="alert">{error}</p>}<div className="briefing-actions"><button className="button secondary" disabled={busy} onClick={() => void dismiss(false)}>Continue here</button><button className="button" disabled={busy} onClick={() => void dismiss(true)}>See my day </button></div></dialog>;
}

export function ExtraPractice() {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); setError(''); try { setData(await api.personalizedSuggestions()); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  return <section className="personal-roadmap"><header><div><span className="ws-eyebrow">A LITTLE FURTHER</span><h2>More practice for your next step</h2><p>Extra questions based on your latest work, weak topics, mistakes and bookmarks. Your revision queue stays limited to your selections.</p></div><button className="button secondary" disabled={loading} onClick={() => void load()}>{loading ? 'Finding your next questions…' : data ? 'Refresh after my work' : 'Find personalized practice'}</button></header>{error && <p className="api-error" role="alert">{error}</p>}{data && <><p className="roadmap-note">{data.generatedBy === 'ai' ? 'AI-selected practice from your question bank' : 'Activity-based recommendations'}</p><div className="study-collection">{data.tasks.map(task => <Link className="study-card" key={task.id} to={task.href}><span className="ws-eyebrow">{task.domain} · {task.estimatedMinutes} min</span><h3>{task.title}</h3><p>{task.detail}</p><b>Start practice </b></Link>)}</div>{!data.tasks.length && <p>No additional suggestions right now. Continue your daily plan.</p>}</>}</section>;
}
