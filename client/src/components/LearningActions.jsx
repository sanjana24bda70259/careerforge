import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import '../personalStudy.css';

let cache = null; let pending = null; let cacheToken = null;
async function savedItems() {
  const token = localStorage.getItem('careerforge_token');
  if (token !== cacheToken) { cache = null; pending = null; cacheToken = token; }
  if (cache) return cache;
  if (!pending) pending = api.learningItems().then(data => {
    const items = new Map(data.items.map(item => [item.key, item]));
    if (cacheToken === token) cache = items;
    return items;
  }).finally(() => { if (cacheToken === token) pending = null; });
  return pending;
}
export function notifyLearningChange(item) {
  if (item) cache?.set(item.key, item); else cache = null;
  window.dispatchEvent(new CustomEvent('careerforge:learning-change', { detail: item }));
}
export const aptitudeKey = question => `aptitude:${question.id.startsWith('advanced-') ? 'advanced' : 'foundation'}:${question.id}`;

export function LearningActions({ itemKey, userAnswer = '', onChange }) {
  const [saved, setSaved] = useState(null); const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(''); const [reason, setReason] = useState('Concept Gap');
  useEffect(() => {
    let active = true; setReady(false); setError(''); setEditing(false);
    const load = () => savedItems().then(items => { if (active) { setSaved(items.get(itemKey) || {}); setReady(true); } }).catch(err => { if (active) setError(err.message); });
    const changed = event => { if (event.detail?.key === itemKey) setSaved(event.detail); else if (!event.detail) void load(); };
    window.addEventListener('careerforge:learning-change', changed); void load();
    return () => { active = false; window.removeEventListener('careerforge:learning-change', changed); };
  }, [itemKey]);
  const save = async field => {
    setBusy(field); setError('');
    try { const data = await api.saveLearningItem(itemKey, { [field]: !saved?.[field] }); setSaved(data.item); notifyLearningChange(data.item); onChange?.(); }
    catch (err) { setError(err.message); } finally { setBusy(''); }
  };
  const saveMistake = async () => {
    setBusy('mistake'); setError('');
    try { const data = await api.saveLearningMistake(itemKey, { reason, note, userAnswer }); const item = { ...saved, key: itemKey, mistakeId: data.mistake._id }; setSaved(item); notifyLearningChange(item); setEditing(false); onChange?.(); }
    catch (err) { setError(err.message); } finally { setBusy(''); }
  };
  const editMistake = async () => {
    if (editing) { setEditing(false); return; }
    if (saved?.mistakeId) {
      setBusy('load-note');
      try { const data = await api.mistakes(); const mistake = data.mistakes.find(item => item._id === saved.mistakeId); setNote(mistake?.note || ''); setReason(mistake?.reason || 'Concept Gap'); }
      catch (err) { setError(err.message); return; } finally { setBusy(''); }
    }
    setEditing(true);
  };
  return <div className="learning-actions">
    <div className="learning-action-buttons">
      <button type="button" disabled={!ready || Boolean(busy)} aria-pressed={Boolean(saved?.revisionSelected)} title={saved?.revisionSelected ? `Next review: ${saved.dueDate}. Click to remove from future revisions.` : 'Schedule this exact item for tomorrow, then space reviews by recall.'} onClick={() => void save('revisionSelected')}><span aria-hidden="true">↻</span> {saved?.revisionSelected ? 'Revision scheduled' : 'Revise later'}</button>
      <button type="button" disabled={!ready || Boolean(busy)} aria-pressed={Boolean(saved?.bookmarked)} onClick={() => void save('bookmarked')}><span aria-hidden="true">{saved?.bookmarked ? '★' : '☆'}</span> {saved?.bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
      {!itemKey.startsWith('mistake:') && <button type="button" disabled={!ready || Boolean(busy)} aria-expanded={editing} onClick={() => void editMistake()}><span aria-hidden="true">✎</span> {saved?.mistakeId ? 'Update mistake' : 'Save mistake'}</button>}
    </div>
    {saved?.revisionSelected && <small className="learning-due">Next review · {saved.dueDate} · {saved.reviewCount || 0} reviews recorded</small>}
    {editing && <div className="learning-note"><label>What went wrong?<select value={reason} onChange={event => setReason(event.target.value)}>{['Concept Gap', 'Calculation Error', 'Forgot Formula', 'Coding Bug', 'Misread Question', 'Time Pressure', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label><label>Your note<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={3000} placeholder="What will you do differently next time?" /></label><button type="button" className="button" disabled={Boolean(busy)} onClick={() => void saveMistake()}>{busy ? 'Saving…' : 'Save to Mistake Notebook'}</button></div>}
    {error && <p className="api-error" role="alert">{error} {!ready && <button type="button" onClick={() => { cache = null; notifyLearningChange(); }}>Retry</button>}</p>}
  </div>;
}
