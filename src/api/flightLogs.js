import api from './axios';

/**
 * GET /flights/{flight_pk}/logs — 상태 변경력
 */
export async function fetchFlightLogs(flightPk, params = {}) {
  const { data } = await api.get(`/flights/${flightPk}/logs`, { params });
  return data;
}
