const skills = [
  ['DSA', '⌘', 'card-a'], ['CS Fundamentals', '◫', 'card-b'], ['Aptitude', '∿', 'card-c'],
  ['AI Interviews', '✦', 'card-d'], ['Resume Builder', '▤', 'card-e'], ['Job Tracker', '↗', 'card-f'],
  ['Mock Tests', '◌', 'card-g'], ['System Design', '◇', 'card-h'], ['Placement Prep', '◎', 'card-i']
];

export function CinematicSkillCards({ intro = false }) {
  return <div className={`cinematic-skill-cards${intro ? ' intro-cards' : ''}`}>{skills.map(([label, icon, tone], index) => <article className={`cinematic-skill-card ${tone}`} data-card key={label} style={{ '--index': index }}><span className="cinematic-card-icon" aria-hidden="true">{icon}</span><b>{label}</b><i aria-hidden="true" /></article>)}</div>;
}
