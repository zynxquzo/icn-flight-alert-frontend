import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, {
  AUTH_FORCE_LOGOUT_EVENT,
  isAuthExemptPath,
  requestPath,
} from './axios.js';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

describe('requestPath / isAuthExemptPath', () => {
  it('extracts pathname from relative url', () => {
    expect(requestPath({ url: '/flights?is_active=true' })).toBe('/flights');
  });

  it('marks auth endpoints as exempt', () => {
    expect(isAuthExemptPath('/auth/login')).toBe(true);
    expect(isAuthExemptPath('/auth/refresh')).toBe(true);
    expect(isAuthExemptPath('/flights')).toBe(false);
  });
});

describe('api 401 refresh interceptor', () => {
  let mock;
  let postSpy;
  const storage = new Map();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear(),
    });
    mock = new MockAdapter(api);
    postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      },
    });
  });

  afterEach(() => {
    mock.restore();
    postSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('retries protected request after refresh on 401', async () => {
    storage.set('access_token', 'old-access');
    storage.set('refresh_token', 'old-refresh');

    mock.onGet('/flights').replyOnce(401).onGet('/flights').reply(200, [{ flight_pk: 1 }]);

    const res = await api.get('/flights');

    expect(res.status).toBe(200);
    expect(res.data).toEqual([{ flight_pk: 1 }]);
    expect(postSpy).toHaveBeenCalledWith(
      `${BASE}/auth/refresh`,
      { refresh_token: 'old-refresh' },
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    expect(storage.get('access_token')).toBe('new-access');
    expect(storage.get('refresh_token')).toBe('new-refresh');
  });

  it('does not refresh on auth-exempt 401', async () => {
    mock.onPost('/auth/login').reply(401, { detail: 'bad credentials' });

    await expect(
      api.post('/auth/login', { email: 'a@b.com', password: 'x' }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('clears tokens and dispatches logout when refresh fails', async () => {
    const events = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e) => events.push(e),
    });

    storage.set('access_token', 'old-access');
    storage.set('refresh_token', 'bad-refresh');
    postSpy.mockRejectedValueOnce(new Error('refresh failed'));
    mock.onGet('/me').reply(401);

    await expect(api.get('/me')).rejects.toBeTruthy();

    expect(storage.get('access_token')).toBeUndefined();
    expect(storage.get('refresh_token')).toBeUndefined();
    expect(events.some((e) => e.type === AUTH_FORCE_LOGOUT_EVENT)).toBe(true);
  });

  it('forces logout on second 401 after retry', async () => {
    const events = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e) => events.push(e),
    });

    storage.set('access_token', 'old-access');
    storage.set('refresh_token', 'old-refresh');
    mock.onGet('/flights').reply(401);

    await expect(api.get('/flights')).rejects.toBeTruthy();

    expect(storage.get('access_token')).toBeUndefined();
    expect(events.some((e) => e.type === AUTH_FORCE_LOGOUT_EVENT)).toBe(true);
  });
});
