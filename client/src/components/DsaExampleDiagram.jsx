import { useId, useMemo } from 'react';
import { exampleDiagram } from '../../../shared/dsaExampleDiagrams.mjs';

export function DsaExampleDiagram({ lesson, scene, index }) {
  const marker = useId().replaceAll(':', '');
  const diagram = useMemo(() => exampleDiagram(lesson.input, lesson.topic), [lesson]);
  if (!diagram) return null;
  const mentioned = new Set(scene.state.match(/-?\d+/g) || []);
  return <figure className="dv-example-diagram"><svg viewBox="0 0 600 235" role="img" aria-label={`${diagram.label}: ${lesson.input}`}>
    <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--cf-accent)" /></marker></defs>
    {diagram.edges.map(({ from, to }) => { const a = diagram.nodes[from], b = diagram.nodes[to]; return <line key={`${from}-${to}`} x1={a.x + (diagram.directed ? 23 : 0)} y1={a.y} x2={b.x - (diagram.directed ? 27 : 0)} y2={b.y} markerEnd={diagram.directed ? `url(#${marker})` : undefined} />; })}
    {diagram.nodes.map(node => <g key={node.id} className={index > 0 && mentioned.has(node.label) ? 'mentioned' : ''}><circle cx={node.x} cy={node.y} r="23" /><text x={node.x} y={node.y} dy=".35em" textAnchor="middle">{node.label}</text></g>)}
  </svg><figcaption>Input structure · highlighted values are mentioned in this scene</figcaption></figure>;
}
