import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { WorkspaceLayout } from './Workspace.jsx';
import '../skillGraph.css';

const domainLabel = value => ({ dsa: 'DSA', aptitude: 'Aptitude', cs: 'CS fundamentals', interview: 'Interview', project: 'Project evidence' }[value] || value);
const statusLabel = value => ({
  supported: 'Supported by evidence', needs_revision: 'Needs revision', collecting_evidence: 'Collecting evidence',
  self_declared: 'Self-declared', demonstrated_in_project: 'Listed in a project', no_evidence: 'No evidence yet'
}[value] || value);
const statusClass = value => `skill-status ${value || 'no_evidence'}`;

function Page({ user, title, subtitle, children }) {
  return <WorkspaceLayout user={user}><div className="page-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>{children}</WorkspaceLayout>;
}
const Button = ({ children, secondary = false, ...props }) => <button className={secondary ? 'button secondary' : 'button'} {...props}>{children}</button>;

function EvidenceLine({ skill }) {
  const facts = [];
  if (skill.graded) facts.push(`${skill.graded} graded question${skill.graded === 1 ? '' : 's'}`);
  if (skill.accuracy !== null && skill.accuracy !== undefined) facts.push(`${skill.accuracy}% accuracy`);
  if (skill.completed) facts.push(`${skill.completed} completion${skill.completed === 1 ? '' : 's'}`);
  if (skill.interviewResponses) facts.push(`${skill.interviewResponses} saved response${skill.interviewResponses === 1 ? '' : 's'}`);
  if (skill.revisionPassed || skill.revisionMissed) facts.push(`${skill.revisionPassed || 0} recall / ${skill.revisionMissed || 0} revisit`);
  if (!facts.length) facts.push(skill.confidence || 'No assessment evidence yet');
  return <p>{facts.join(' · ')}</p>;
}

export function SkillGraphPanel({ user }) {
  const [data, setData] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [overview, due] = await Promise.all([api.skillGraph(), api.dueSkillRevisions()]);
      setData(overview); setRevisions(due.revisions);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const complete = async (revision, recalled) => {
    setWorking(`${revision._id}:${recalled}`); setError('');
    try { await api.completeRevision(revision._id, recalled); await load(); }
    catch (err) { setError(err.message); }
    finally { setWorking(''); }
  };
  const skills = data?.skills || [];
  const evidenceSkills = skills.filter(item => item.evidenceCount > 0 || item.status === 'needs_revision');
  const claimedSkills = skills.filter(item => !evidenceSkills.includes(item));
  const assessed = skills.filter(item => item.graded > 0).length;
  return <Page user={user} title="Your Skill Graph" subtitle="A living view of what CareerForge has evidence for—never a made-up readiness score.">
    {error && <p className="api-error">{error}</p>}
    <section className="skill-hero">
      <div><span className="overline">CAREER DIGITAL TWIN</span><h2>Evidence first. Recommendations second.</h2><p>Correctness, timing, revisions, completed work, and saved interview answers build this map. Self-declared skills remain clearly marked until they have assessment evidence.</p></div>
      <div className="skill-hero-stats"><span><b>{loading ? '—' : assessed}</b> assessed skills</span><span><b>{loading ? '—' : data?.dueRevisionCount || 0}</b> due revisions</span></div>
    </section>
    <section className="skill-actions-section"><div className="section-title"><div><span className="overline">NEXT BEST ACTIONS</span><h2>What to do next</h2></div><Link to="/placement">Placement evidence view →</Link></div>{loading ? <p className="skill-loading">Loading your saved evidence…</p> : <div className="skill-actions">{(data?.nextActions || []).map(action => <Link to={action.href} className="skill-action" key={`${action.kind}-${action.title}`}><span>{action.kind === 'revision' ? '↻' : '→'}</span><div><b>{action.title}</b><small>{action.detail}</small></div></Link>)}</div>}</section>
    <section className="skill-map-section"><div className="section-title"><div><span className="overline">SKILL MAP</span><h2>Recorded evidence</h2></div><span>{evidenceSkills.length ? `${evidenceSkills.length} concepts with activity` : 'No activity recorded'}</span></div>{loading ? <p className="skill-loading">Loading…</p> : evidenceSkills.length ? <div className="skill-map">{evidenceSkills.map(skill => <article key={skill.skillId} className="skill-row"><div className="skill-row-title"><span className={`skill-domain ${skill.domain}`}>{domainLabel(skill.domain)}</span><h3>{skill.label}</h3></div><EvidenceLine skill={skill} /><span className={statusClass(skill.status)}>{statusLabel(skill.status)}</span></article>)}</div> : <section className="empty-panel"><h2>No evidence yet</h2><p>Start a scored aptitude set or record a DSA problem. Your first real signals will appear here.</p><Link className="button" to="/aptitude">Start Aptitude Practice</Link></section>}</section>
    {claimedSkills.length > 0 && <section className="skill-claims"><div><span className="overline">CLAIMED OR PROJECT-LISTED</span><h2>Context, not verification</h2><p>These skills came from your profile, resume, or project stack. They are not presented as assessed strengths.</p></div><div>{claimedSkills.map(skill => <span key={skill.skillId}>{skill.label}<small>{statusLabel(skill.status)}</small></span>)}</div></section>}
    <section className="skill-revisions"><div className="section-title"><div><span className="overline">SMART REVISION</span><h2>Due now</h2></div><span>{revisions.length} due</span></div>{loading ? <p className="skill-loading">Loading…</p> : revisions.length ? <div>{revisions.map(revision => <article key={revision._id}><div><b>{revision.label}</b><p>{revision.prompt || 'Revisit this concept before moving on.'}</p></div><div className="revision-actions"><Button secondary disabled={Boolean(working)} onClick={() => void complete(revision, false)}>{working === `${revision._id}:false` ? 'Saving…' : 'Need another pass'}</Button><Button disabled={Boolean(working)} onClick={() => void complete(revision, true)}>{working === `${revision._id}:true` ? 'Saving…' : 'I recalled it'}</Button></div></article>)}</div> : <p className="skill-empty">Nothing is due yet. Incorrect answers and saved practice will come back here at an appropriate interval.</p>}</section>
  </Page>;
}

const roundStatus = value => ({ assessment_recorded: 'Assessment recorded', practice_evidence: 'Practice evidence', not_started: 'Not assessed' }[value] || 'Not assessed');
export function PlacementSimulatorPanel({ user }) {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [starting, setStarting] = useState(false);
  const load = async () => { setLoading(true); setError(''); try { setData(await api.placementOverview()); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const start = async () => { setStarting(true); setError(''); try { setData(await api.startPlacementSimulation()); } catch (err) { setError(err.message); } finally { setStarting(false); } };
  const report = data?.report?.profile;
  return <Page user={user} title="Placement Evidence Route" subtitle="Move through an end-to-end preparation route without pretending that practice alone is a placement result.">
    {error && <p className="api-error">{error}</p>}
    <section className="placement-intro"><div><span className="overline">FULL PLACEMENT PROCESS</span><h2>Five rounds. One honest evidence trail.</h2><p>CareerForge only records a round after there is saved assessment or practice evidence. A final verdict is intentionally withheld until all required assessment evidence exists.</p></div>{!data?.simulation && <Button onClick={() => void start()} disabled={starting}>{starting ? 'Starting…' : 'Start placement simulation'}</Button>}</section>
    {loading ? <p className="skill-loading">Loading your recorded evidence…</p> : <section className="placement-rounds">{(data?.rounds || []).map((round, index) => <article key={round.id}><span className="placement-number">0{index + 1}</span><div><span className={`placement-status ${round.status}`}>{roundStatus(round.status)}</span><h2>{round.title.replace(/^Round \d+ — /, '')}</h2><p>{round.evidence}</p></div><Link className="button secondary" to={round.href}>{round.status === 'not_started' ? 'Build evidence' : 'Review'}</Link></article>)}</section>}
    <section className="placement-report"><div><span className="overline">YOUR PLACEMENT PROFILE</span><h2>Evidence report</h2><p>No placement-ready percentage is calculated. These are the saved facts currently available.</p></div><dl><div><dt>DSA</dt><dd>{report?.dsaSolved ?? 0} problems solved</dd></div><div><dt>Aptitude</dt><dd>{report?.aptitudeMocks ?? 0} timed mocks{report?.aptitudeAccuracy == null ? '' : ` · ${report.aptitudeAccuracy}% accuracy`}</dd></div><div><dt>CS fundamentals</dt><dd>{report?.csAssessedSkills ?? 0} assessed skills</dd></div><div><dt>Technical interviews</dt><dd>{report?.technicalInterviews ?? 0} saved responses</dd></div><div><dt>HR interviews</dt><dd>{report?.hrInterviews ?? 0} saved responses</dd></div></dl>{data?.report?.needsRevision?.length ? <p className="placement-revise"><b>Needs revision:</b> {data.report.needsRevision.join(', ')}</p> : <p className="placement-revise">No weak-skill claim is shown until scored evidence identifies one.</p>}</section>
  </Page>;
}
