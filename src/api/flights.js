import api from './axios';

/**
 * GET /flights — 내 비행편 목록
 * @param {{ is_active?: boolean }} params
 */
export async function fetchFlights(params = {}) {
  const { data } = await api.get('/flights', { params });
  return data;
}

/**
 * POST /flights — 비행편 등록
 * @param {{ flight_id: string, flight_date: string, flight_type: 'departure' | 'arrival' }} payload
 */
export async function createFlight(payload) {
  const { data } = await api.post('/flights', payload);
  return data;
}

export async function deleteFlight(flightPk) {
  await api.delete(`/flights/${flightPk}`);
}

export async function updateFlightStatus(flightPk, isActive) {
  const { data } = await api.patch(`/flights/${flightPk}/status`, {
    is_active: isActive,
  });
  return data;
}

export async function refreshFlight(flightPk) {
  const { data } = await api.post(`/flights/${flightPk}/refresh`);
  return data;
}
