import { NavLink } from 'react-router-dom';
import '../dsaHandbook.css';

export function DsaExploreNav() {
  return <nav className="dh-tabs" aria-label="DSA sections">
    <NavLink to="/dsa" end>Questions & learning maps</NavLink>
    <NavLink to="/dsa/learn">Theory & patterns</NavLink>
    <NavLink to="/dsa/companies">Companies</NavLink>
  </nav>;
}
