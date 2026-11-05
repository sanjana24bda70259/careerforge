import { useNavigate } from 'react-router-dom';
import { CareerForgeScene } from './three/CareerForgeScene.jsx';
import '../cinematicHero.css';

export function CinematicHero() {
  const navigate = useNavigate();
  return <div className="cinematic-hero-scene"><CareerForgeScene onNavigate={navigate} /></div>;
}
