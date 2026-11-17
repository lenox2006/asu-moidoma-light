import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

/**
 * Состояние авторизации.
 *  user  — текущий пользователь (null, если не авторизован)
 *  start — стартовая точка навигации: { mark, crumbs } (выдаёт backend по области видимости)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [start, setStart] = useState({ mark: '', crumbs: [] });
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return undefined;
    }
    api
      .me()
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setStart(data.start);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStart({ mark: '', crumbs: [] });
    };
    window.addEventListener('asu:unauthorized', onUnauthorized);
    return () => window.removeEventListener('asu:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (login, password) => {
    const data = await api.login(login, password);
    setToken(data.token);
    setUser(data.user);
    setStart(data.start);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* игнорируем — токен всё равно удаляем */
    }
    setToken(null);
    setUser(null);
    setStart({ mark: '', crumbs: [] });
  }, []);

  const value = useMemo(
    () => ({ user, start, loading, login, logout, isSuperadmin: user?.role === 'superadmin' }),
    [user, start, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth вне AuthProvider');
  return ctx;
}
