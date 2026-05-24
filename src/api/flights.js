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
 * GET /flights/{flight_pk} — 상세 (FlightResponse 전 필드)
 */
export async function fetchFlightDetail(flightPk) {
  const { data } = await api.get(`/flights/${flightPk}`);
  return data;
}

/**
 * POST /flights — 비행편 등록
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

/**
 * GET /flights/{flight_pk}/calendar.ics — iCalendar 파일 다운로드
 * 브라우저에서 직접 <a href> 방식으로 내려받도록 URL 반환
 */
export function getCalendarUrl(flightPk) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return `${base}/flights/${flightPk}/calendar.ics`;
}

/** POST /flights/{flight_pk}/share — 공유 링크 토큰 생성 */
export async function createShareLink(flightPk) {
  const { data } = await api.post(`/flights/${flightPk}/share`);
  return data;
}

/** DELETE /flights/{flight_pk}/share — 공유 링크 취소 */
export async function revokeShareLink(flightPk) {
  await api.delete(`/flights/${flightPk}/share`);
}

/**
 * GET /flights/shared/{share_token} — 공개 읽기 전용 (인증 없이)
 */
export async function fetchSharedFlight(shareToken) {
  const { data } = await api.get(`/flights/shared/${shareToken}`);
  return data;
}
