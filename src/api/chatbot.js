import api from './axios';

/**
 * GET /chatbot/ — 서비스 소개
 */
export async function fetchChatbotInfo() {
  const { data } = await api.get('/chatbot');
  return data;
}

/**
 * POST /chatbot/chat — 단발성 (세션 없이)
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

// ---------------------------------------------------------------------------
// 세션 CRUD
// ---------------------------------------------------------------------------

/** POST /chatbot/sessions — 새 세션 생성 */
export async function createChatSession(terminal = 'T1') {
  const { data } = await api.post('/chatbot/sessions', { terminal });
  return data;
}

/** GET /chatbot/sessions — 내 세션 목록 */
export async function listChatSessions() {
  const { data } = await api.get('/chatbot/sessions');
  return data;
}

/** GET /chatbot/sessions/:id — 세션 + 메시지 */
export async function getChatSession(sessionId) {
  const { data } = await api.get(`/chatbot/sessions/${sessionId}`);
  return data;
}

/** DELETE /chatbot/sessions/:id */
export async function deleteChatSession(sessionId) {
  await api.delete(`/chatbot/sessions/${sessionId}`);
}

/**
 * POST /chatbot/sessions/:id/messages — 세션 내 메시지 전송
 * @param {string} sessionId
 * @param {{ message: string, wait_time_hours?: number | null }} payload
 */
export async function sendSessionMessage(sessionId, payload) {
  const body = { message: payload.message };
  if (
    payload.wait_time_hours != null &&
    payload.wait_time_hours !== '' &&
    !Number.isNaN(Number(payload.wait_time_hours))
  ) {
    body.wait_time_hours = Number(payload.wait_time_hours);
  }
  const { data } = await api.post(`/chatbot/sessions/${sessionId}/messages`, body);
  return data;
}

/**
 * POST /chatbot/sessions/:id/messages/:msgId/feedback
 * @param {string} sessionId
 * @param {number} messageId
 * @param {'helpful'|'not_helpful'} feedback
 */
export async function submitFeedback(sessionId, messageId, feedback) {
  const { data } = await api.post(
    `/chatbot/sessions/${sessionId}/messages/${messageId}/feedback`,
    { feedback },
  );
  return data;
}
