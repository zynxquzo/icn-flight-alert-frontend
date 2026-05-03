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
