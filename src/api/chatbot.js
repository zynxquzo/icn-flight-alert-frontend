import api from './axios';

/**
 * GET /chatbot/ — 서비스 소개
 */
export async function fetchChatbotInfo() {
  const { data } = await api.get('/chatbot');
  return data;
}

/**
 * POST /chatbot/chat
 * @param {{ message: string, terminal?: string, wait_time_hours?: number | null }} payload
 */
export async function sendChatMessage(payload) {
  const body = {
    message: payload.message,
    terminal: payload.terminal ?? 'T1',
  };
  if (
    payload.wait_time_hours != null &&
    payload.wait_time_hours !== '' &&
    !Number.isNaN(Number(payload.wait_time_hours))
  ) {
    body.wait_time_hours = Number(payload.wait_time_hours);
  }
  const { data } = await api.post('/chatbot/chat', body);
  return data;
}
