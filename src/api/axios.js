// src/api/axios.js
import axios from 'axios';

/** 401 발생 시 SPA 상태 손실 없이 정리하기 위해 사용하는 커스텀 이벤트명. AuthContext가 listen 함. */
export const AUTH_FORCE_LOGOUT_EVENT = 'auth:force-logout';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

function isAuthExemptPath(path) {
  return (
    path.includes('/auth/login') ||
    path.includes('/auth/signup') ||
    path.includes('/auth/logout') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/forgot-password') ||
    path.includes('/auth/reset-password') ||
    path.includes('/auth/verify-email')
  );
}

let refreshPromise = null;

async function refreshAccessToken() {
  const rt = localStorage.getItem('refresh_token');
  if (!rt) throw new Error('no_refresh');
  const { data } = await axios.post(
    `${BASE}/auth/refresh`,
    { refresh_token: rt },
    { headers: { 'Content-Type': 'application/json' } },
  );
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.access_token;
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config || {};
    const path = requestPath(cfg);
    const skip = isAuthExemptPath(path);

    if (error.response?.status !== 401 || skip) {
      return Promise.reject(error);
    }

    if (cfg._retryAfterRefresh) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
      }
      return Promise.reject(error);
    }

    const hadAccess = !!localStorage.getItem('access_token');
    const hadRefresh = !!localStorage.getItem('refresh_token');

    if (!hadAccess || !hadRefresh) {
      if (hadAccess) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
        }
      }
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      cfg._retryAfterRefresh = true;
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
      return api(cfg);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
      }
      return Promise.reject(error);
    }
  },
);

export default api;
