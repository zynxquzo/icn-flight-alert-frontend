import api from './axios';

/**
 * GET /notifications — 사용자 이메일 기준 전체 알림
 */
export async function fetchUserNotifications(userEmail, params = {}) {
  const { data } = await api.get('/notifications', {
    params: { user_email: userEmail, ...params },
  });
  return data;
}

/**
 * GET /notifications/flights/{flight_pk} — 특정 비행편 알림
 */
export async function fetchFlightNotifications(flightPk) {
  const { data } = await api.get(`/notifications/flights/${flightPk}`);
  return data;
}
