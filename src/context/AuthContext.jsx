import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';
import { AUTH_FORCE_LOGOUT_EVENT } from '../api/axios';
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
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
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

  // axios 인터셉터가 401을 만나면 토큰을 지우고 이 이벤트를 발행함.
  // 풀 페이지 리로드 대신 React 상태와 라우터를 정리한다.
  useEffect(() => {
    const handler = () => {
      setUser(null);
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
      setUser(null);
      navigate('/login');
    }
  };

  const signup = async (email, password) => {
    try {
      const data = await authApi.signup({ email, password });
      // 회원가입 성공 후 자동 로그인 시도. 실패 시 사용자에게 로그인 페이지로 안내.
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

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
