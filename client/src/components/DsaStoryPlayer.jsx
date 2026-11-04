import { useEffect, useMemo, useState } from 'react';
import { buildExplainerScenes } from '../../../shared/dsaExplainers.mjs';
import { DsaExampleDiagram } from './DsaExampleDiagram.jsx';

function VisualState({ text }) {
  // Animate actual values from the authored scene; never invent a simulated state.
  const parts = text.split(/(\[[^\[\]]*\])/g).filter(Boolean);
  return <div className="dv-state-tokens">{parts.map((part, i) => part.startsWith('[') ?
    <span className="dv-token-array" key={i} aria-label={part}><i aria-hidden="true">[</i>{part.slice(1, -1).split(',').filter(Boolean).map((value, j) => <b key={j} style={{ '--token-order': j }}>{value.trim()}</b>)}<i aria-hidden="true">]</i></span> :
    <span className="dv-token-caption" key={i}>{part}</span>)}</div>;
}

// A timed, captioned worked example. It never simulates executing user code.
export function DsaStoryPlayer({ lesson }) {
  const scenes = useMemo(() => buildExplainerScenes(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const scene = scenes[index];
  useEffect(() => {
    if (!playing) return undefined;
    if (index === scenes.length - 1) { setPlaying(false); return undefined; }
    // Allow enough time to read the caption before advancing.
    const milliseconds = Math.max(4000, (scene.text + ' ' + scene.state).split(/\s+/).length * 230) / speed;
    const timer = setTimeout(() => setIndex(value => Math.min(value + 1, scenes.length - 1)), milliseconds);
    return () => clearTimeout(timer);
  }, [playing, index, scenes.length, scene, speed]);
  const jump = value => { setPlaying(false); setIndex(value); };
  return <section className="dv-player dv-story" aria-label={`${lesson.title} animated explanation`}>
    <header className="dv-player-head"><span>CAREERFORGE / EXAMPLE FILM</span><span>Captions · {scenes.length} scenes</span></header>
    <div className="dv-story-layout">
      <aside className="dv-story-source"><span className="dv-eyebrow">OUR EXAMPLE</span><h2>{lesson.title}</h2><VisualState text={lesson.input} /><p>Follow one small example from the question to the answer.</p><span className="dv-story-pattern">{lesson.pattern}</span></aside>
      <div className="dv-story-screen">
        <div className="dv-story-phase"><span>{scene.phase}</span><span>{String(index + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}</span></div>
        <DsaExampleDiagram lesson={lesson} scene={scene} index={index} />
        <div key={index} className={`dv-scene ${index === scenes.length - 2 ? 'dv-scene-result' : ''}`} aria-live={playing ? 'off' : 'polite'}>
          <span className="dv-scene-number" aria-hidden="true">{index === scenes.length - 2 ? '✓' : String(index + 1).padStart(2, '0')}</span>
          <h3>{scene.title}</h3>
          <VisualState text={scene.state} />
          {scene.text !== scene.state && <p>{scene.text}</p>}
        </div>
        <div className="dv-scene-progress" aria-label="Choose a scene">{scenes.map((item, i) => <button key={i} aria-label={`${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} className={i <= index ? 'reached' : ''} onClick={() => jump(i)}><span /></button>)}</div>
      </div>
    </div>
    <div className="dv-controls"><button aria-label="Restart explanation" onClick={() => jump(0)}>↺</button><button aria-label="Previous scene" disabled={index === 0} onClick={() => jump(index - 1)}>‹</button><button className="dv-play" aria-label={playing ? 'Pause explanation' : 'Play explanation'} onClick={() => { if (index === scenes.length - 1) setIndex(0); setPlaying(value => !value); }}>{playing ? 'Ⅱ Pause' : '▶ Play'}</button><button aria-label="Next scene" disabled={index === scenes.length - 1} onClick={() => jump(index + 1)}>›</button><input aria-label="Explanation timeline" type="range" min="0" max={scenes.length - 1} value={index} onChange={event => jump(Number(event.target.value))} /><span>{index + 1} / {scenes.length}</span><select aria-label="Explanation playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div>
    <details className="dv-transcript"><summary>Read the full explanation</summary><ol>{scenes.map((item, i) => <li key={i}><strong>{item.title}</strong><p>{item.text}</p>{item.text !== item.state && <code>{item.state}</code>}</li>)}</ol></details>
  </section>;
}
