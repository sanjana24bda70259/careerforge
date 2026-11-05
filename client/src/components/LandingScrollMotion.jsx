import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LandingScrollMotion() {
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.utils.toArray('[data-cinematic-reveal]').forEach(section => {
        gsap.fromTo(section, { opacity: .38, y: 48, rotateX: 2 }, { opacity: 1, y: 0, rotateX: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 84%', once: true } });
      });
    });
    return () => context.revert();
  }, []);
  return null;
}
