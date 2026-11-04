import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';

const Context = createContext({ data: null, loading: true, error: '', refresh: () => {} });
export const useWorkspace = () => useContext(Context);
export function WorkspaceProvider({ user, children }) {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('careerforge_theme') || 'light');
  const { pathname } = useLocation();
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try { const next = await api.workspaceOverview(); setData(next); setTheme(next.preferences.theme); setError(''); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [user?.id]);
  useEffect(() => { setData(null); setLoading(true); }, [user?.id]);
  useEffect(() => { void refresh(); }, [refresh, pathname]);
  useEffect(() => {
    const onChange = () => { void refresh(); };
    window.addEventListener('careerforge:workspace-change', onChange);
    window.addEventListener('careerforge:learning-change', onChange);
    return () => { window.removeEventListener('careerforge:workspace-change', onChange); window.removeEventListener('careerforge:learning-change', onChange); };
  }, [refresh]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { document.documentElement.dataset.theme = theme === 'system' ? (query.matches ? 'dark' : 'light') : theme; };
    apply(); localStorage.setItem('careerforge_theme', theme); query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);
  const preferences = async change => {
    const next = await api.workspacePreferences(change);
    setData(current => current ? { ...current, preferences: next.preferences } : current);
    if (change.theme) setTheme(change.theme);
    await refresh();
  };
  return <Context.Provider value={{ data, loading, error, refresh, preferences, theme }}>{children}</Context.Provider>;
}
