import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';
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
      /* 서버 실패 시에도 로컬 세션 정리 */
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      navigate('/login');
    }
  };

  const signup = async (email, password) => {
    try {
      const data = await authApi.signup({ email, password });
      return { success: true, data };
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
