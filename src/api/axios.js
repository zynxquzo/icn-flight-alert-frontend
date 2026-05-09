// src/api/axios.js
import axios from 'axios';

/** 401 발생 시 SPA 상태 손실 없이 정리하기 위해 사용하는 커스텀 이벤트명. AuthContext가 listen 함. */
export const AUTH_FORCE_LOGOUT_EVENT = 'auth:force-logout';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function requestPath(config) {
  const u = config?.url ?? '';
  if (!u) return '';
  if (u.startsWith('http')) {
    try {
      return new URL(u).pathname;
    } catch {
      return u;
    }
  }
  return u.split('?')[0];
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = requestPath(error.config);
    // login/signup/logout은 401이라도 인터셉터가 추가 동작하지 않음
    // (logout은 만료 토큰으로 호출될 수 있고, AuthContext에서 자체적으로 정리함)
    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/signup') ||
      path.includes('/auth/logout');
    const hadToken = !!localStorage.getItem('access_token');

    if (error.response?.status === 401 && !isAuthEndpoint && hadToken) {
      localStorage.removeItem('access_token');
      // 풀 페이지 리로드 대신 커스텀 이벤트로 AuthContext가 React Router로 전환하게 함
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
