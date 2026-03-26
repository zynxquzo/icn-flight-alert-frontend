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
  if (d.error?.message) return d.error.message;
  return fallback;
}
