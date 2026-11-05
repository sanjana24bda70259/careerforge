import { lazy, Suspense, useState } from 'react';
import '../brandIntro.css';

const CinematicIntro = lazy(() => import('./CinematicIntro.jsx').then(module => ({ default: module.CinematicIntro })));

const seenKey = 'careerforge_intro_seen';

export function BrandIntro({ children }) {
  const [visible, setVisible] = useState(() => sessionStorage.getItem(seenKey) !== '1');
  if (!visible) return children;
  const skip = () => { sessionStorage.setItem(seenKey, '1'); setVisible(false); };
  return <Suspense fallback={<main className="brand-intro" />}><CinematicIntro onDone={skip} /></Suspense>;
}
