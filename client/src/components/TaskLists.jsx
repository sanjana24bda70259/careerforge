import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import '../taskLists.css';

const taskLinks = { DSA: '/dsa', APTITUDE: '/aptitude', REVISION: '/backlogs', CAREER: '/resume' };
const taskDate = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// Refresh after midnight or a change in another tab; old responses never win.
function useTaskData(fetcher) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    try {
      const result = await fetcher();
      if (current === request.current) { setData(result); setError(''); }
    } catch (err) { if (current === request.current) setError(err.message); }
    finally { if (current === request.current) setLoading(false); }
  }, [fetcher]);
  useEffect(() => {
    void refresh();
    const visibleRefresh = () => { if (!document.hidden) void refresh(); };
    const timer = setInterval(visibleRefresh, 60000);
    window.addEventListener('focus', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => { request.current++; clearInterval(timer); window.removeEventListener('focus', visibleRefresh); document.removeEventListener('visibilitychange', visibleRefresh); };
  }, [refresh]);
  return { data, error, loading, refresh };
}

function TaskError({ message, retry }) {
  return message ? <div className="task-error" role="alert"><span>{message}</span><button type="button" onClick={retry}>Retry</button></div> : null;
}

export function DailyTasks({ compact = false }) {
  const { data, error, loading, refresh } = useTaskData(api.todayQuest);
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(null);
  const [saveError, setSaveError] = useState('');
  const saving = useRef(false);
  const quest = data?.quest;
  const tasks = quest?.tasks || [];
  const done = tasks.filter(task => task.completed).length;
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.completed : !task.completed));
  const mutate = async (key, action, after) => {
    if (saving.current) return;
    saving.current = true; setBusy(key); setSaveError('');
    try { await action(); after?.(); await refresh(); }
    catch (err) { setSaveError(err.message); }
    finally { saving.current = false; setBusy(null); }
  };
  const add = event => {
    event.preventDefault();
    if (!title.trim()) return;
    void mutate('add', () => api.addDailyTask(title.trim()), () => { setTitle(''); setFilter('all'); });
  };
  return <section className={`task-card ${compact ? 'task-card-compact' : ''}`} aria-label="Daily to-do list">
    <div className="task-card-heading"><div><span className="ws-eyebrow">ONE STEP AT A TIME</span><h2>Today’s to-do</h2></div><span className="task-day">{quest ? taskDate(quest.dateKey) : 'Today'}</span></div>
    <TaskError message={error} retry={refresh} />
    {saveError && <p className="task-error" role="alert">{saveError} Your change was not saved. Please try again.</p>}
    {loading ? <p className="task-empty" role="status">Loading your tasks…</p> : quest && <>
      <div className="task-completion"><span aria-live="polite"><b>{done} done</b> · {tasks.length - done} pending</span><span>{tasks.length ? Math.round(done / tasks.length * 100) : 0}%</span></div>
      <progress className="task-progress" value={done} max={tasks.length || 1} aria-label="Daily task completion" />
      <div className="task-filters" role="group" aria-label="Filter daily tasks">{[['all', 'All'], ['pending', 'Pending'], ['done', 'Done']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <div className="task-rows">
        {visible.map(task => <div className={`task-row ${task.completed ? 'task-is-done' : ''}`} key={task.id}>
          <label><input type="checkbox" checked={task.completed === true} disabled={busy !== null} onChange={() => void mutate(task.id, () => api.updateDailyTask(quest.dateKey, task.id, !task.completed))} /><span><b>{task.title}</b><small>{busy === task.id ? 'Saving…' : task.completed ? 'Done' : task.detail || task.type}</small></span></label>
          {!task.completed && taskLinks[task.type] && <Link to={taskLinks[task.type]} aria-label={`Open ${task.title}`}>↗</Link>}
        </div>)}
        {!visible.length && <p className="task-empty">{filter === 'done' ? 'Your completed tasks will appear here.' : filter === 'pending' ? 'All caught up. Nice work!' : 'Add a task to plan your day.'}</p>}
      </div>
      <form className="task-add" onSubmit={add}><input aria-label="New daily task" placeholder="Add your own task…" maxLength={160} value={title} disabled={busy !== null} onChange={event => setTitle(event.target.value)} /><button type="submit" disabled={busy !== null || !title.trim()}>{busy === 'add' ? 'Adding…' : '+ Add'}</button></form>
      <div className="task-note"><span>Unfinished tasks go to Backlogs after midnight ({data.timeZone || 'Asia/Kolkata'}).</span><Link to="/backlogs">View backlogs →</Link></div>
    </>}
  </section>;
}

export function BacklogTasks() {
  const { data, error, loading, refresh } = useTaskData(api.backlogs);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState(null);
  const [saveError, setSaveError] = useState('');
  const saving = useRef(false);
  const pending = data?.backlogs || [];
  const completed = data?.completed || [];
  const rows = filter === 'pending' ? pending : completed;
  const update = async item => {
    if (saving.current) return;
    saving.current = true; setBusy(item.id); setSaveError('');
    try {
      if (item.type === 'revision') await api.completeRevision(item.id);
      else await api.updateDailyTask(item.dateKey, item.taskId, !item.completed);
      await refresh();
    } catch (err) { setSaveError(err.message); }
    finally { saving.current = false; setBusy(null); }
  };
  return <section className="task-card" aria-label="Backlogs">
    <div className="task-card-heading"><div><span className="ws-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Backlogs</h2></div><Link to="/daily-challenge" className="task-today-link">Today’s list →</Link></div>
    <p className="task-description">Unfinished tasks from earlier days stay here until you complete them. Today’s pending tasks remain in today’s list.</p>
    <TaskError message={error} retry={refresh} />
    {saveError && <p className="task-error" role="alert">{saveError} Please try again.</p>}
    {loading ? <p className="task-empty" role="status">Loading your backlogs…</p> : data && <>
      <div className="task-filters" role="group" aria-label="Filter backlogs"><button aria-pressed={filter === 'pending'} onClick={() => setFilter('pending')}>Pending ({pending.length})</button><button aria-pressed={filter === 'done'} onClick={() => setFilter('done')}>Done ({completed.length})</button></div>
      <div className="task-rows">{rows.map(item => <div className={`task-row ${item.completed ? 'task-is-done' : ''}`} key={item.id}>
        <label><input type="checkbox" checked={item.completed === true} disabled={busy !== null} onChange={() => void update(item)} /><span><b>{item.title}</b><small>{busy === item.id ? 'Saving…' : item.dateKey ? `${taskDate(item.dateKey)} · ${item.completed ? 'Done' : 'Pending'}` : `Revision due ${new Date(item.dueAt).toLocaleDateString()}`}</small></span></label>
        <span className="task-tag">{item.type === 'revision' ? 'Revision' : item.category || 'Task'}</span>
      </div>)}</div>
      {!rows.length && <p className="task-empty">{filter === 'pending' ? 'All caught up! No tasks carried over from earlier days.' : 'Completed tasks from earlier days will appear here.'}</p>}
      {filter === 'done' && <p className="task-description">Uncheck a task to move it back to Pending. Completed revisions are scheduled for their next review.</p>}
    </>}
  </section>;
}
