// src/api/axios.js
import axios from 'axios';

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
    const isAuthEndpoint =
      path.endsWith('/auth/login') ||
      path.endsWith('/auth/signup') ||
      path.includes('/auth/login') ||
      path.includes('/auth/signup');
    const hadToken = !!localStorage.getItem('access_token');

    if (error.response?.status === 401 && !isAuthEndpoint && hadToken) {
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
