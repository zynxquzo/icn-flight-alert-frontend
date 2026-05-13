/** 인천 API 시각 문자열 YYYYMMDDHHmm (12자+) → 읽기 쉬운 형식 */
export function formatIncheonDateTime(s) {
  if (s == null || s === '') return '—';
  const str = String(s);
  if (str.length < 12) return str;
  const y = str.slice(0, 4);
  const M = str.slice(4, 6);
  const d = str.slice(6, 8);
  const h = str.slice(8, 10);
  const m = str.slice(10, 12);
  return `${y}-${M}-${d} ${h}:${m}`;
}

export function formatIsoDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export function flightTypeLabel(t) {
  return { departure: '출발', arrival: '도착' }[t] ?? t ?? '—';
}

export function notificationTypeLabel(t) {
  const map = {
    delay: '지연',
    gate_change: '게이트 변경',
    cancel: '취소',
    terminal_change: '터미널 변경',
  };
  return map[t] ?? t ?? '—';
}

export function changeTypeLabel(t) {
  const map = {
    gate_change: '게이트 변경',
    terminal_change: '터미널 변경',
    delay: '지연',
    status_change: '상태 변경',
    eta_adjust: '예정 시각 조정',
  };
  return map[t] ?? t ?? '변경';
}

export function normalizeFlightId(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

/** POST /flights/{pk}/refresh 응답 → 토스트 문구 */
export function summarizeRefreshResult(result) {
  if (result == null) return '갱신이 완료되었습니다.';
  if (!result.changes_detected) return '최신 상태입니다. 변경 사항이 없습니다.';
  const changes = result.changes || [];
  const parts = changes.slice(0, 5).map((c) => {
    const label = changeTypeLabel(c.change_type);
    return `${label}: ${c.old_value ?? '—'} → ${c.new_value ?? '—'}`;
  });
  const extra = changes.length > 5 ? ` …외 ${changes.length - 5}건` : '';
  return `변경 ${changes.length}건 감지: ${parts.join('; ')}${extra}`;
}

/** YYYYMMDDHHmm → Date (로컬 달력 기준) */
export function parseIncheonDateTimeToDate(s) {
  if (s == null || s === '') return null;
  const str = String(s);
  if (str.length < 12) return null;
  const y = Number(str.slice(0, 4));
  const M = Number(str.slice(4, 6)) - 1;
  const d = Number(str.slice(6, 8));
  const h = Number(str.slice(8, 10));
  const m = Number(str.slice(10, 12));
  if ([y, M, d, h, m].some((n) => Number.isNaN(n))) return null;
  return new Date(y, M, d, h, m, 0, 0);
}

/** 출발(또는 예정)까지 남은 시간(시간). 과거·파싱 실패 시 null */
export function estimateWaitHoursUntilSchedule(scheduleStr, estimatedStr) {
  const primary = estimatedStr && String(estimatedStr).length >= 12 ? estimatedStr : scheduleStr;
  const d = parseIncheonDateTimeToDate(primary);
  if (!d) return null;
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

/** 챗봇 터미널 선택값 T1 / T2 */
export function terminalForChatOption(terminalId) {
  const raw = String(terminalId || '').toUpperCase();
  if (raw.includes('T2') || raw === '2') return 'T2';
  return 'T1';
}

/** 활성 비행편이 곧 출발(3시간 이내)이면 스케줄러 주기 외 폴링에 사용 */
export function shouldPollFlightSoon(flight) {
  if (!flight?.is_active) return false;
  const h = estimateWaitHoursUntilSchedule(flight.schedule_date_time, flight.estimated_date_time);
  if (h == null) return false;
  return h > 0 && h <= 3;
}
