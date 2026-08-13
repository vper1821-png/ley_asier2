import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, register as apiRegister, getUserInfo } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFromStorage = () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        let u;
        try { u = JSON.parse(savedUser); } catch { localStorage.removeItem('user'); localStorage.removeItem('token'); setLoading(false); return; }
        if (!u.role) u.role = u.isAdmin ? 'superadmin' : 'user';
        setToken(savedToken);
        setUser(u);
        getUserInfo(savedToken).then(res => {
          if (!res.error) {
            const fresh = { ...u, ...res };
            delete fresh.token;
            localStorage.setItem('user', JSON.stringify(fresh));
            setUser(fresh);
          } else if (res.error === 'token inválido' || res.error === 'token requerido') {
            if (!window.__sessionExpiredFired) {
              window.__sessionExpiredFired = true;
              window.dispatchEvent(new CustomEvent('session-expired'));
            }
          }
        }).catch(() => {});
      }
      setLoading(false);
    };

    loadFromStorage();

    const onAuthChange = () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        const u = JSON.parse(savedUser);
        if (!u.role) u.role = u.isAdmin ? 'superadmin' : 'user';
        setToken(savedToken);
        setUser(u);
      }
    };
    window.addEventListener('auth-change', onAuthChange);

    const onSessionExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    };
    window.addEventListener('session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('auth-change', onAuthChange);
      window.removeEventListener('session-expired', onSessionExpired);
    };
  }, []);

  const login = useCallback(async (email, password, captchaToken) => {
    const result = await apiLogin(email, password, captchaToken);
    if (result.error) return result;
    // 2FA required - pass tempToken to caller
    if (result.requireTwoFactor) {
      return { requireTwoFactor: true, tempToken: result.tempToken };
    }
    const token = result.token;
    const user = {
      userId: result.user.user_id,
      companyName: result.user.companyName,
      domain: result.user.domain,
      email: result.user.email,
      planType: result.user.planType,
      isActive: result.user.isActive,
      paymentStatus: result.user.paymentStatus,
      twoFactorEnabled: result.user.twoFactorEnabled || false,
      role: result.user.role || 'user',
      isAdmin: result.user.isAdmin || false,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return { success: true };
  }, []);

  const register = useCallback(async (companyName, domain, email, password) => {
    const result = await apiRegister(companyName, domain, email, password);
    if (result.error) return result;
    const token = result.token;
    const user = {
      userId: result.user.user_id,
      companyName: result.user.companyName,
      domain: result.user.domain,
      email: result.user.email,
      planType: result.user.planType,
      isActive: result.user.isActive,
      paymentStatus: result.user.paymentStatus,
      twoFactorEnabled: result.user.twoFactorEnabled || false,
      role: result.user.role || 'user',
      isAdmin: result.user.isAdmin || false,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
