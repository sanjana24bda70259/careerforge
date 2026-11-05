import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CareerForgeScene } from './three/CareerForgeScene.jsx';
import { StudyLaunchOverlay } from './StudyLaunchOverlay.jsx';
import '../cinematicIntro.css';

const title = 'CareerForge'.split('');

export function CinematicIntro({ onDone }) {
  const root = useRef(null);
  const finish = () => { sessionStorage.setItem('careerforge_intro_seen', '1'); onDone(); };
  useLayoutEffect(() => {
    const element = root.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { const timer = window.setTimeout(finish, 250); return () => window.clearTimeout(timer); }
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: finish });
      timeline.set('[data-letter]', { yPercent: 120, opacity: 0, rotateX: -70 })
        .set('[data-hand]', { xPercent: (_, target) => target.dataset.hand === 'left' ? -125 : 125, opacity: 0 })
        .set('[data-surface]', { scaleX: 1 })
        .set('[data-study-board]', { opacity: 0, scale: .7, y: 40, rotateX: -16 })
        .set('[data-study-step], [data-study-note]', { opacity: 0, scale: .5, y: 28 })
        .to('[data-letter]', { yPercent: 0, opacity: 1, rotateX: 0, duration: .78, stagger: .055, ease: 'power4.out' })
        .to('.cinematic-intro-copy', { opacity: .32, y: -18, duration: .45, ease: 'power2.out' }, 1.55)
        .to('[data-surface="left"]', { xPercent: -74, rotate: -2, duration: 1.15, ease: 'power3.inOut' }, 1.8)
        .to('[data-surface="right"]', { xPercent: 74, rotate: 2, duration: 1.15, ease: 'power3.inOut' }, 1.8)
        .to('[data-study-board]', { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: .8, ease: 'back.out(1.45)' }, 2.4)
        .to('[data-study-step], [data-study-note]', { opacity: 1, scale: 1, y: 0, duration: .55, stagger: .1, ease: 'back.out(1.7)' }, 2.8)
        .to('.cinematic-intro-copy', { opacity: 0, y: -18, duration: .5 }, 6.05)
        .to('[data-scene], .cinematic-surface, .study-launch', { opacity: 0, duration: .45, stagger: .03 }, 6.14);
    }, element);
    const move = event => { const bounds = element.getBoundingClientRect(); element.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`); element.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`); };
    element.addEventListener('pointermove', move, { passive: true });
    return () => { element.removeEventListener('pointermove', move); context.revert(); };
  }, []);
  return <main ref={root} className="cinematic-intro" aria-label="CareerForge cinematic introduction"><button className="cinematic-skip" onClick={finish}>Skip intro</button><div className="cinematic-beams" aria-hidden="true"/><div className="cinematic-particles" aria-hidden="true"/>
    <div className="cinematic-webgl" data-scene style={{ position: 'absolute', inset: 0, zIndex: 3 }}><CareerForgeScene intro /></div><div className="cinematic-surface left" data-surface="left" aria-hidden="true"/><div className="cinematic-surface right" data-surface="right" aria-hidden="true"/>
    <StudyLaunchOverlay />
    <div className="cinematic-intro-copy"><p>YOUR CAREER, IN MOTION</p><h1>{title.map((letter, index) => <span data-letter key={`${letter}-${index}`}>{letter}</span>)}</h1><h2>Forge Your Skills. Build Your Future.</h2></div>
  </main>;
}
