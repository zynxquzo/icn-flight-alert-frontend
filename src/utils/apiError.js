/** JWT/커스텀 예외 error.code — 서버 message가 없을 때 보조 */
const ERROR_CODE_HINTS = {
  TOKEN_MISSING: '인증이 필요합니다.',
  TOKEN_EXPIRED: '토큰이 만료되었습니다. 다시 로그인해 주세요.',
  TOKEN_INVALID: '유효하지 않은 토큰입니다.',
  TOKEN_REVOKED: '로그아웃되었거나 무효화된 토큰입니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  BAD_REQUEST: '잘못된 요청입니다.',
  EXTERNAL_API_ERROR: '외부 서비스 연동에 실패했습니다.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다.',
};

/**
 * FastAPI / axios 에러 응답에서 사용자용 메시지 추출
 */
export function getApiErrorMessage(error, fallback = '요청에 실패했습니다.') {
  const d = error.response?.data;
  if (!d) return error.message || fallback;

  if (typeof d.detail === 'string') return d.detail;

  if (Array.isArray(d.detail)) {
    const parts = d.detail.map((x) =>
      typeof x === 'object' && x?.msg != null ? x.msg : String(x)
    );
    return parts.filter(Boolean).join(' ') || fallback;
  }

  if (d.success === false && d.error && typeof d.error === 'object') {
    const { code, message } = d.error;
    if (typeof message === 'string' && message.trim()) return message;
    if (code && ERROR_CODE_HINTS[code]) return ERROR_CODE_HINTS[code];
  }

  if (d.error?.message) return d.error.message;

  return fallback;
}
