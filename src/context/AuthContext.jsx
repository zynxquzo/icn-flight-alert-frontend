import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';
import { AUTH_FORCE_LOGOUT_EVENT } from '../api/axios';
import { Sentry } from '../sentry.js';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const legacy = localStorage.getItem('token');
    if (legacy && !localStorage.getItem('access_token')) {
      localStorage.setItem('access_token', legacy);
      localStorage.removeItem('token');
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const data = await authApi.fetchMe();
      setUser(data);
      if (data?.user_id != null) {
        Sentry.setUser({ id: String(data.user_id), email: data.email });
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      Sentry.setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      Sentry.setUser(null);
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener(AUTH_FORCE_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_FORCE_LOGOUT_EVENT, handler);
  }, [navigate]);

  const login = async (email, password) => {
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const me = await authApi.fetchMe();
      setUser(me);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, '로그인에 실패했습니다.'),
      };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* 서버 실패(만료 토큰 등)에도 로컬 세션 정리 */
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      Sentry.setUser(null);
      navigate('/login');
    }
  };

  const signup = async (email, password) => {
    try {
      const data = await authApi.signup({ email, password });
      const loginResult = await login(email, password);
      return {
        success: true,
        data,
        autoLogin: loginResult.success,
        autoLoginError: loginResult.success ? undefined : loginResult.error,
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, '회원가입에 실패했습니다.'),
      };
    }
  };

  const resendVerification = async () => {
    try {
      await authApi.resendVerification();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, '재발송에 실패했습니다.'),
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, resendVerification, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
