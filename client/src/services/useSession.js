import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { endSession, getToken, SESSION_ENDED, TOKEN_KEY, USER_KEY } from './session.js';

export function useSession() {
  // Cached profile data is not proof of a valid session. Verify with the API
  // before mounting any protected page, including after a reload or update.
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const revision = useRef(0);

  const updateUser = useCallback(nextUser => {
    revision.current += 1;
    setUser(nextUser);
    setChecking(false);
    setError('');
  }, []);

  const validate = useCallback(async () => {
    const attempt = ++revision.current;
    const token = getToken();
    setUser(null);
    setError('');
    if (!token) {
      endSession(token);
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const data = await api.me();
      if (attempt !== revision.current || token !== getToken()) return;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      if (attempt !== revision.current || token !== getToken()) return;
      // Network/server failures are retryable; keep the saved credentials.
      setError(err.message);
    } finally {
      if (attempt === revision.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    const onEnded = () => updateUser(null);
    const onStorage = event => {
      if (event.key === TOKEN_KEY || event.key === null) void validate();
    };
    window.addEventListener(SESSION_ENDED, onEnded);
    window.addEventListener('storage', onStorage);
    void validate();
    return () => {
      revision.current += 1;
      window.removeEventListener(SESSION_ENDED, onEnded);
      window.removeEventListener('storage', onStorage);
    };
  }, [updateUser, validate]);

  return { user, setUser: updateUser, checking, error, retry: validate };
}
