import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { WorkspaceLayout } from './Workspace.jsx';
import { LearningActions, notifyLearningChange } from './LearningActions.jsx';

export function LearningCollection({ user, collection = 'revision' }) {
  const [items, setItems] = useState([]); const [dateKey, setDateKey] = useState(''); const [domain, setDomain] = useState('all');
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [legacy, setLegacy] = useState([]);
  const bookmarks = collection === 'bookmarks';
  const load = async () => {
    setError('');
    try { const data = await api.learningItems(collection); setItems(data.items); setDateKey(data.dateKey);  }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [collection]);
  const visible = items.filter(item => domain === 'all' || item.domain === domain);
  const due = visible.filter(item => item.dueDate <= dateKey); const upcoming = visible.filter(item => item.dueDate > dateKey);
  const cards = list => <div className="study-collection">{list.map(item => <article className="study-card" key={item.key}><span className="ws-eyebrow">{item.domain} · {item.kind}</span><h2>{item.title}</h2><p>{item.topic.replaceAll('-', ' ')}</p><Link className="button" to={`/study/${encodeURIComponent(item.key)}`}>{bookmarks ? 'Open saved item' : item.dueDate <= dateKey ? 'Start revision' : 'Preview item'} </Link><LearningActions itemKey={item.key} onChange={load} /></article>)}</div>;
  return <WorkspaceLayout user={user}><div className="page-header"><div><span className="overline">YOUR LEARNING LIBRARY</span><h1>{bookmarks ? 'Bookmarks' : 'Your selected revisions'}</h1><p>{bookmarks ? 'Questions, concepts and references you chose to keep.' : 'Only items you marked “Revise later”. Extra practice appears separately in your daily plan.'}</p></div></div><div className="study-filters">{['all', 'dsa', 'aptitude', 'cs'].map(value => <button key={value} aria-pressed={domain === value} onClick={() => setDomain(value)}>{value === 'all' ? 'All subjects' : value.toUpperCase()}</button>)}<Link to="/dashboard">Back to my day </Link></div>{error && <p role="alert" className="api-error">{error} <button onClick={() => void load()}>Retry</button></p>}{loading ? <p>Loading your saved items…</p> : <>{bookmarks ? cards(visible) : <><h2 className="study-section-title">Due today <span>{due.length}</span></h2>{due.length ? cards(due) : <p className="study-empty">Nothing due today. Use ↻ Revise later on a question or concept to schedule it for tomorrow.</p>}<h2 className="study-section-title">Coming up <span>{upcoming.length}</span></h2>{cards(upcoming)}</>}{bookmarks && !visible.length && <p className="study-empty">No saved items in this subject yet. Tap ☆ Bookmark while learning.</p>}{bookmarks && legacy.length > 0 && (domain === 'all' || domain === 'dsa') && <section><h2 className="study-section-title">Saved cheatsheets</h2><div className="study-collection">{legacy.map(sheet => <Link className="study-card" key={sheet.id} to={`/cheatsheets?sheet=${sheet.id}`}>{sheet.title} </Link>)}</div></section>}</>}</WorkspaceLayout>;
}

function Context({ data }) {
  if (!data) return null;
  return <aside className="study-context"><h3>{data.title}</h3>{data.text && <p>{data.text}</p>}{data.labels && <table><tbody>{data.labels.map((label, index) => <tr key={label}><th>{label}</th><td>{data.values[index]} {data.unit || ''}</td></tr>)}</tbody></table>}</aside>;
}
export function StudyItem({ user }) {
  const { itemKey } = useParams(); const [item, setItem] = useState(null); const [answer, setAnswer] = useState(null); const [result, setResult] = useState(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const load = () => api.learningItem(itemKey).then(data => setItem(data.item)).catch(err => setError(err.message));
  useEffect(() => { setItem(null); setResult(null); setAnswer(null); setError(''); setNotice(''); void load(); }, [itemKey]);
  const act = async type => {
    setBusy(true); setError('');
    try {
      if (type === 'answer') setResult(await api.answerLearningItem(itemKey, answer));
      else if (type === 'reveal') setResult(await api.revealLearningItem(itemKey));
      else {
        const response = await api.reviewLearningItem(itemKey, type === 'recalled');
        const updated = { ...item, ...response.item }; setItem(updated); notifyLearningChange(updated);
        setNotice(`Revision saved. Next review: ${updated.dueDate}.`);
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const dateKey = new Intl.DateTimeFormat('en-CA').format(new Date());
  return <WorkspaceLayout user={user}><Link className="back-link" to="/dashboard"> My day</Link>{error && <p role="alert" className="api-error">{error} {!item && <button onClick={() => void load()}>Retry</button>}</p>}{!item ? <p>Loading your learning item…</p> : <article className="study-detail"><span className="ws-eyebrow">{item.domain} · {item.kind} · {item.topic.replaceAll('-', ' ')}</span><h1>{item.title}</h1><Context data={item.setContext} />{item.prompt !== item.title && <p className="study-prompt">{item.prompt}</p>}<LearningActions itemKey={item.key} userAnswer={item.options?.[answer] || ''} onChange={load} />{item.options ? <fieldset className="study-options"><legend>Choose your answer</legend>{item.options.map((option, index) => <label className={answer === index ? 'selected' : ''} key={option}><input type="radio" name="study-answer" checked={answer === index} disabled={Boolean(result)} onChange={() => setAnswer(index)} />{option}</label>)}<button className="button" disabled={busy || answer === null || Boolean(result)} onClick={() => void act('answer')}>Check answer</button></fieldset> : <div className="study-next"><Link className="button" to={item.href}>{item.domain === 'dsa' && item.kind === 'question' ? 'Open coding workspace' : 'Open full lesson'} </Link><button className="button secondary" disabled={busy} onClick={() => void act('reveal')}>Show recall notes</button></div>}{result && <section className="study-result" aria-live="polite"><h2>{result.correct === true ? 'Correct answer' : result.correct === false ? 'Let’s review the approach' : 'Recall notes'}</h2>{item.options && <p><b>Answer:</b> {item.options[result.correctAnswer]}</p>}<p>{result.explanation}</p><p>Your saved answer contributes to your learning history.</p></section>}{item.revisionSelected && item.dueDate <= dateKey && <section className="study-recall"><h2>How well did you recall it?</h2><p>Try it first, then choose your next review interval.</p><button className="button secondary" disabled={busy} onClick={() => void act('again')}>Need another pass · tomorrow</button><button className="button" disabled={busy} onClick={() => void act('recalled')}>I recalled it ✓</button></section>}{notice && <p className="success-note" role="status">{notice} <Link to="/revisions">Back to revisions </Link></p>}</article>}</WorkspaceLayout>;
}
