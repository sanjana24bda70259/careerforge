import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useWorkspace } from './WorkspaceContext.jsx';
import { endSession } from '../services/session.js';
import '../workspaceFeatures.css';
import '../sidebarNavigation.css';

export function UiIcon({ name, size = 19 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18M7 15h2m4 0h2m-8 3h2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 9h18c0-1-3-1-3-9M9 21h6" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3" /></>,
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16" />,
    book: <><path d="M12 5v16M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" /></>,
    chart: <path d="M4 3v18h17M8 16v-5m5 5V6m5 10v-7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 3" /></>,
    note: <><path d="M15 3H4v18h16V8Z" /><path d="M15 3v5h5M8 12h8m-8 4h6" /></>,
    list: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m6 8 1 1 2-2m-3 8 1 1 2-2m3-6h6m-6 7h6" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m12 12 8-8" /></>,
    case: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V3h8v4M3 12h18" /></>,
    star: <path d="m12 3 3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-6.5L3 10l6-1Z" />,
    moon: <path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z" />,
    settings: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="9" cy="18" r="2" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    exit: <><path d="M9 3H3v18h6m5-14 5 5-5 5m-6-5h11" /></>,
    arrow: <path d="m9 5 7 7-7 7" />,
    spark: <path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.book}</svg>;
}
const navigation = [
  ['Workspace', [['Daily tasks', '/daily-challenge', 'list'], ['Study calendar', '/calendar', 'calendar'], ['Notifications', '/notifications', 'bell'], ['My progress', '/progress', 'chart']]],
  ['Learn & practise', [['DSA', '/dsa', 'code'], ['Aptitude', '/aptitude', 'target'], ['CS fundamentals', '/cs', 'book'], ['Mock tests', '/mock-tests', 'list'], ['Interview practice', '/interviews', 'case'], ['AI Copilot', '/help', 'spark']]],
  ['My space', [['Notes', '/notes', 'note'], ['My lists', '/lists', 'list'], ['Revision', '/revisions', 'clock'], ['Mistake Notebook', '/mistakes', 'note'], ['Bookmarks', '/bookmarks', 'star'], ['Goals & deadlines', '/goals', 'target']]],
  ['Career', [['Projects', '/projects', 'code'], ['Resume', '/resume', 'note'], ['Applications', '/jobs', 'case']]]
];
const groupIcons = { Workspace: 'home', 'Learn & practise': 'book', 'My space': 'note', Career: 'case' };
const groupId = group => `sidebar-${group.toLowerCase().replace(/[^a-z]+/g, '-')}`;
function matchesPage(pathname, href) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return (href === '/dsa' && pathname.startsWith('/learning/dsa/')) ||
    (href === '/cs' && pathname.startsWith('/learning/cs/')) ||
    (href === '/aptitude' && pathname.startsWith('/learning/aptitude/'));
}
export function WorkspaceChrome({ user, children }) {
  const { pathname } = useLocation(); const { data, theme, preferences } = useWorkspace();
  const currentGroup = navigation.find(([, items]) => items.some(([, href]) => matchesPage(pathname, href)))?.[0];
  const [openGroup, setOpenGroup] = useState(currentGroup || null);
  const [mobileOpen, setMobileOpen] = useState(false); const [collapsed, setCollapsed] = useState(() => localStorage.getItem('careerforge_sidebar') === 'collapsed');
  const [query, setQuery] = useState(''); const [error, setError] = useState(''); const account = useRef(null);
  useEffect(() => { setMobileOpen(false); setQuery(''); if (account.current) account.current.open = false; }, [pathname]);
  useEffect(() => { setOpenGroup(currentGroup || null); }, [pathname, currentGroup]);
  useEffect(() => { const escape = event => { if (event.key === 'Escape') { setMobileOpen(false); if (account.current) account.current.open = false; } }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, []);
  const toggleTheme = async () => { try { await preferences({ theme: theme === 'dark' ? 'light' : 'dark' }); setError(''); } catch (err) { setError(err.message); } };
  const collapse = () => { setQuery(''); setCollapsed(value => { localStorage.setItem('careerforge_sidebar', value ? 'expanded' : 'collapsed'); return !value; }); };
  const toggleGroup = group => {
    if (collapsed && !mobileOpen) {
      setCollapsed(false); localStorage.setItem('careerforge_sidebar', 'expanded'); setOpenGroup(group);
    } else setOpenGroup(previous => previous === group ? null : group);
  };
  const search = query.trim().toLowerCase();
  const showDashboard = !search || 'dashboard'.includes(search);
  return <div className={`workspace-shell workspace-with-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <a className="ws-skip" href="#workspace-content">Skip to content</a>
    {mobileOpen && <button className="feature-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`feature-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Workspace navigation">
      <div className="feature-brand"><Link to="/dashboard" aria-label="CareerForge home"><span><UiIcon name="spark" /></span><b>Career<span className="brand-forge">Forge</span><span>.</span></b></Link><button className="feature-collapse" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={collapse}><UiIcon name="menu" size={16} /></button></div>
      {(!collapsed || mobileOpen) && <label className="sidebar-search"><span className="sr-only">Find a page</span><input aria-label="Find a page" placeholder="Find a page…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear page search" onClick={() => setQuery('')}>×</button>}</label>}
      <nav aria-label="Main navigation" className="sidebar-tree">
        {showDashboard && <NavLink className={({ isActive }) => `sidebar-dashboard${isActive ? ' active' : ''}`} to="/dashboard" end title="Dashboard" aria-label="Dashboard"><UiIcon name="home" size={18} /><span>Dashboard</span></NavLink>}
        {navigation.map(([group, items]) => {
          const visible = items.filter(([label]) => !search || `${group} ${label}`.toLowerCase().includes(search));
          const expanded = Boolean(search) || openGroup === group;
          return visible.length ? <section key={group} className={currentGroup === group ? 'is-current-group' : ''}>
            <button type="button" className="sidebar-group-toggle" aria-expanded={expanded && (!collapsed || mobileOpen)} aria-controls={groupId(group)} aria-label={group} title={group} onClick={() => toggleGroup(group)}>
              <UiIcon name={groupIcons[group]} size={18} /><span>{group}</span><span className={`sidebar-chevron ${expanded ? 'is-expanded' : ''}`}><UiIcon name="arrow" size={13} /></span>
            </button>
            <div id={groupId(group)} className="sidebar-subpages" hidden={!expanded}>
              {visible.map(([label, href]) => <NavLink title={label} aria-label={label} to={href} key={href} className={() => matchesPage(pathname, href) ? 'active' : ''} aria-current={matchesPage(pathname, href) ? 'page' : undefined}><span>{label}</span>{href === '/notifications' && data?.unreadCount > 0 && <em>{data.unreadCount}</em>}{href === '/revisions' && data?.counts?.dueRevisions > 0 && <small>{data.counts.dueRevisions}</small>}</NavLink>)}
            </div>
          </section> : null;
        })}
        {search && !showDashboard && !navigation.some(([group, items]) => items.some(([label]) => `${group} ${label}`.toLowerCase().includes(search))) && <p className="sidebar-no-results" role="status">No pages found. Try another search.</p>}
      </nav>
      <div className="sidebar-manage"><button onClick={() => void toggleTheme()} aria-label="Toggle color theme"><UiIcon name="moon" /><span>Theme</span><small>{theme === 'dark' ? 'Dark' : theme === 'system' ? 'System' : 'Light'}</small></button><NavLink to="/settings" title="Settings"><UiIcon name="settings" /><span>Settings</span></NavLink><NavLink to="/support" title="Help & troubleshooting"><UiIcon name="help" /><span>Help & troubleshooting</span></NavLink></div>
      <Link className="sidebar-profile" to="/profile" title="Your profile"><span className="feature-avatar">{user?.profile?.name?.[0]?.toUpperCase() || 'S'}</span><span><b>{user?.profile?.name || 'Your profile'}</b><small>{user?.profile?.targetRole || 'Your preparation space'}</small></span><UiIcon name="arrow" size={15} /></Link>
    </aside>
    <header className="ws-header feature-header"><button className="feature-mobile-menu" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(value => !value)}><UiIcon name="menu" /></button><div className="feature-header-actions"><Link className="feature-header-icon" to="/calendar" aria-label="Study calendar"><UiIcon name="calendar" /></Link><Link className="feature-header-icon" to="/notifications" aria-label={`Notifications${data?.unreadCount ? `, ${data.unreadCount} unread` : ''}`}><UiIcon name="bell" />{data?.unreadCount > 0 && <i />}</Link><details className="feature-account" ref={account}><summary aria-label="Account menu"><span className="feature-avatar">{user?.profile?.name?.[0]?.toUpperCase() || 'S'}</span><span>{user?.profile?.name?.split(' ')[0] || 'Account'}</span><span aria-hidden="true">⌄</span></summary><div><Link to="/profile"><UiIcon name="user" /> Profile</Link><Link to="/notifications"><UiIcon name="bell" /> Notifications {data?.unreadCount ? `(${data.unreadCount})` : ''}</Link><Link to="/settings"><UiIcon name="settings" /> Account & preferences</Link><Link to="/support"><UiIcon name="help" /> Troubleshooting</Link><button onClick={() => void toggleTheme()}><UiIcon name="moon" /> {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</button><button className="feature-logout" onClick={() => endSession()}><UiIcon name="exit" /> Sign out</button></div></details></div></header>
    {error && <p role="alert" className="feature-global-error">{error}</p>}
    <main id="workspace-content" tabIndex="-1" className={pathname === '/dashboard' ? 'ws-main ws-home' : 'ws-main'}>{children}</main>
  </div>;
}
