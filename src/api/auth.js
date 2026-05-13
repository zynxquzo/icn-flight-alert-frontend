import api from './axios';

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

/** POST /auth/logout — 204, Bearer 블랙리스트 등록 */
export async function logout() {
  await api.post('/auth/logout');
}

export async function fetchMe() {
  const { data } = await api.get('/me');
  return data;
}

export async function forgotPassword(payload) {
  await api.post('/auth/forgot-password', payload);
}

export async function resetPassword(payload) {
  await api.post('/auth/reset-password', payload);
}

export async function verifyEmail(token) {
  const { data } = await api.get('/auth/verify-email', { params: { token } });
  return data;
}

export async function resendVerification() {
  await api.post('/auth/resend-verification');
}
