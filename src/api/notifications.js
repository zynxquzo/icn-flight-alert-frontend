import api from './axios';

/**
 * GET /notifications — JWT 사용자 기준 전체 알림
 * @param {{ notification_type?: string }} params
 */
export async function fetchMyNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params });
  return data;
}

/**
 * GET /notifications/flights/{flight_pk}
 */
export async function fetchFlightNotifications(flightPk) {
  const { data } = await api.get(`/notifications/flights/${flightPk}`);
  return data;
}
