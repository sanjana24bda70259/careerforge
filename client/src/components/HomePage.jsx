import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchPlayground } from './SearchPlayground.jsx';
import { AuthForm } from './AuthForm.jsx';
import { PasswordResetForm } from './PasswordResetForm.jsx';
const CinematicHero = lazy(() => import('./CinematicHero.jsx').then(module => ({ default: module.CinematicHero })));
import '../homePage.css';
import '../entryPage.css';
import '../passwordReset.css';
import { PublicHeader, PublicFooter, HomeReviews } from './PublicLayout.jsx';
import { HomeFeatures, HomeFaq } from './HomeFeatures.jsx';
import { LandingScrollMotion } from './LandingScrollMotion.jsx';

const paths = {
  beginner: ['Start with arrays & strings', 'Build your aptitude foundation', 'Understand core CS concepts', 'Practise your first interview answers'],
  building: ['Explore trees, graphs & DP', 'Review mistakes and revisit patterns', 'Explain CS concepts in your own words', 'Refine your projects and resume'],
  interview: ['Revisit your saved DSA problems', 'Practise placement-style questions', 'Prepare project and technical answers', 'Organize applications in your job tracker']
};

export function HomePage({ authMode = 'login', setUser }) {
  const { pathname, state } = useLocation();
  const [path, setPath] = useState('beginner');
  useEffect(() => {
    if (window.location.hash) return;
    if (pathname !== '/' && window.matchMedia('(max-width: 760px)').matches) {
      document.getElementById('account-access')?.scrollIntoView({ block: 'start' });
    } else window.scrollTo(0, 0);
  }, [pathname]);
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) { const passwordPage = pathname === '/forgot-password' || pathname === '/reset-password'; return <div className={`cf-home entry-auth-page${passwordPage ? ' entry-password-page' : ''}`}><Link className="entry-back" to="/">Back to home</Link><main className="entry-auth-main"><Link className="entry-brand" to="/">Career<span className="brand-forge">Forge</span></Link>{passwordPage ? <PasswordResetForm mode={authMode} /> : <AuthForm key={authMode} mode={authMode} setUser={setUser} />}</main><aside className="entry-auth-preview"><div className="entry-preview-intro"><span className="entry-preview-orb" aria-hidden="true"><span /></span><span className="entry-preview-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>A little practice.<br />A clearer path forward.</h2><p>Build your foundations, see algorithms take shape and prepare for your next opportunity. One focused workspace, at your pace.</p></div><div className="entry-preview-demo"><span>TRY A LITTLE PROBLEM SOLVING</span><SearchPlayground compact /></div><p className="entry-preview-caption">Learn the idea. Watch it move. Make it yours.</p></aside></div>; }
  return <div className="cf-home">
    <a className="home-skip" href="#home-main">Skip to content</a>
    <PublicHeader state={state} />
    <main id="home-main"><LandingScrollMotion />
      <section className="entry-hero cinematic-entry-hero" aria-labelledby="entry-title"><Suspense fallback={null}><CinematicHero /></Suspense><div className="entry-hero-content"><span className="entry-badge">FOR YOUR NEXT CHAPTER</span><h1 id="entry-title">Your Career<br /><span>Journey Starts Here.</span></h1><p>Your space to master DSA, strengthen your foundations<br className="home-desktop-break" /> and prepare for the opportunities ahead.</p><div className="entry-actions"><Link className="home-button" to="/register" state={{ from: '/dsa' }}>Get Started</Link><a className="entry-secondary" href="#features">Explore Features</a></div><div className="entry-highlights"><div><strong>356</strong><span>DSA questions</span></div><div><strong>4</strong><span>Learning paths</span></div><div><strong>Your pace</strong><span>One focused workspace</span></div></div><a className="entry-explore" href="#features">Explore what you can do</a></div></section>
      <HomeFeatures />
      <section className="home-method" id="how-it-works" data-cinematic-reveal><div className="home-width"><div className="home-section-heading"><div><span className="home-eyebrow">MAKE THE CONCEPT CLICK</span><h2>Go beyond the right answer.</h2></div><p>A learning loop that helps you understand<br />why a solution works.</p></div><div className="home-learning-preview"><div><span className="home-eyebrow">TRY BEFORE YOU BEGIN</span><h3>Make the algorithm click.</h3><p>Press play. Follow the search. Switch between linear and binary search to see how the approach changes.</p><span className="home-preview-note">A little curiosity goes a long way. </span></div><SearchPlayground compact /></div><div className="home-method-grid">{[['01', 'Understand the idea', 'Start with the concept, a concrete example and the reasoning behind each step.', 'Read the theory', '/learning/dsa/arrays/problems/linear-search?view=theory'], ['02', 'Watch it take shape', 'Move through visual explanations at your pace. Pause, step back and connect the dots.', 'Explore DSA', '/dsa'], ['03', 'Put it into practice', 'Write your solution, save a draft and return to the ideas you want to strengthen.', 'Open your workspace', '/dashboard']].map(([n,title,copy,label,to]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p><Link to={to}>{label} </Link></article>)}</div></div></section>
      <section className="home-width home-roadmap" id="your-path" data-cinematic-reveal><div><span className="home-eyebrow">A STARTING POINT, NOT A FINISH LINE</span><h2>Where are you<br />in your journey?</h2><p>Choose your stage for a suggested starting path.<br />Your workspace helps you keep it moving.</p><div className="home-stage-buttons" aria-label="Preparation stage">{[['beginner','Just getting started'],['building','Building my skills'],['interview','Preparing for interviews']].map(([id,label]) => <button aria-pressed={path === id} key={id} onClick={() => setPath(id)}>{label}<span></span></button>)}</div></div><div className="home-roadmap-card"><span className="home-eyebrow">YOUR SUGGESTED PATH</span><ol>{paths[path].map((text, i) => <li key={text}><span>{String(i+1).padStart(2,'0')}</span><b>{text}</b></li>)}</ol><Link className="home-button" to="/register" state={state}>Make it personal <span></span></Link><small>Set your goals and available study time in your profile.</small></div></section>
      <HomeReviews />
      <HomeFaq />
    </main><PublicFooter />
  </div>;
}
