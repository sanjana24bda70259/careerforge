import { useEffect, useMemo, useState } from 'react';
import { buildSearchTrace } from '../../../shared/searchTrace.mjs';
import '../searchPlayground.css';

export function SearchPlayground({ compact = false }) {
  const [method, setMethod] = useState('linear');
  const [input, setInput] = useState('4, 9, 12, 18, 23, 31, 42');
  const [targetInput, setTargetInput] = useState('23');
  const [data, setData] = useState({ values: [4, 9, 12, 18, 23, 31, 42], target: 23 });
  const [step, setStep] = useState(0), [playing, setPlaying] = useState(false), [error, setError] = useState('');
  const frames = useMemo(() => buildSearchTrace(data.values, data.target, method), [data, method]);
  const frame = frames[step];
  useEffect(() => {
    if (!playing || step >= frames.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(n => n + 1), 800);
    return () => clearTimeout(timer);
  }, [playing, step, frames.length]);
  function changeMethod(next) {
    try { buildSearchTrace(data.values, data.target, next); setMethod(next); setStep(0); setPlaying(false); setError(''); }
    catch (err) { setError(err.message); }
  }
  function apply(event) {
    event.preventDefault();
    const pieces = input.trim() ? input.split(',') : [];
    const values = pieces.map(x => Number(x.trim()));
    try {
      if (pieces.some(x => !x.trim()) || !targetInput.trim() || values.length > 12) throw new Error('Enter up to 12 comma-separated numbers and a numeric target. An empty array is allowed.');
      const target = Number(targetInput);
      buildSearchTrace(values, target, method);
      setData({ values, target }); setStep(0); setPlaying(false); setError('');
    } catch (err) { setError(err.message); }
  }
  return <div className={`search-playground ${compact ? 'search-compact' : ''}`}>
    <div className="search-toolbar"><span className="search-live"><i /> LIVE PLAYGROUND</span><span>Try it yourself </span></div>
    <div className="search-methods" aria-label="Search method">{['linear', 'binary'].map(m => <button key={m} aria-pressed={m === method} onClick={() => changeMethod(m)}>{m === 'linear' ? 'Linear search' : 'Binary search'}</button>)}</div>
    <div className="search-goal"><h3>Find the number <em>{data.target}</em></h3><span>{method === 'linear' ? 'One element at a time.' : 'Cut the search space in half.'}</span></div>
    <div className="search-array">{data.values.length ? data.values.map((value, index) => <div key={index} className={`${frame.index === index ? frame.found ? 'found' : 'current' : frame.checked.includes(index) ? 'checked' : ''} ${method === 'binary' && (index < frame.low || index > frame.high) ? 'discarded' : ''}`}><b>{value}</b><small>{index}</small></div>) : <p>Empty array — no elements to inspect.</p>}</div>
    <p className="search-explanation" aria-live="polite">{frame.message}</p>
    <div className="search-controls"><button className="search-play" onClick={() => { if (frame.done) setStep(0); setPlaying(!playing); }}>{playing ? 'Ⅱ Pause' : frame.done ? '↻ Replay' : '▶ Play'}</button><button disabled={step === 0} onClick={() => { setPlaying(false); setStep(n => n - 1); }}>Back</button><button disabled={frame.done} onClick={() => { setPlaying(false); setStep(n => n + 1); }}>Step </button><button onClick={() => { setPlaying(false); setStep(0); }}>Reset</button><span>{step} / {frames.length - 1}</span></div>
    {!compact && <form className="search-inputs" onSubmit={apply}><label>Array<input value={input} onChange={e => setInput(e.target.value)} placeholder="4, 9, 12, 18, 23" /></label><label>Target<input value={targetInput} onChange={e => setTargetInput(e.target.value)} /></label><button type="submit">Apply input</button></form>}
    {error && <p role="alert" className="search-error">{error}</p>}
    <div className="search-legend"><span><i /> Unvisited</span><span><i /> Comparing</span><span><i /> Found</span><b>{method === 'linear' ? 'O(n)' : 'O(log n)'} worst-case time</b></div>
    {method === 'binary' && <small className="search-note">Requires sorted input. With duplicates, this version returns any matching index.</small>}
  </div>;
}
