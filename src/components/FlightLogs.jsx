import { changeTypeLabel, formatIncheonDateTime } from '../utils/format';

const LOG_FILTERS = [
  { value: '', label: '전체' },
  { value: 'gate_change', label: '게이트' },
  { value: 'delay', label: '지연' },
  { value: 'status_change', label: '상태' },
  { value: 'terminal_change', label: '터미널' },
];

export default function FlightLogs({
  flightPk,
  changeType,
  onChangeTypeChange,
  logs,
  loading,
  error,
}) {
  const fid = `log-filter-${flightPk}`;

  return (
    <div className="w-full border-t border-slate-100 pt-3 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor={fid} className="text-xs font-medium text-slate-500 dark:text-slate-400">
          이력 유형
        </label>
        <select
          id={fid}
          value={changeType}
          onChange={(e) => onChangeTypeChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {LOG_FILTERS.map((o) => (
            <option key={o.value === '' ? 'all' : o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">이력 불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-500">저장된 변경 이력이 없습니다.</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {logs.map((log) => (
            <li
              key={log.log_id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {changeTypeLabel(log.change_type)}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {log.detected_at ? new Date(log.detected_at).toLocaleString('ko-KR') : ''}
              </span>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                게이트 {log.gate_number ?? '—'} · 터미널 {log.terminal_id ?? '—'} · 비고{' '}
                {log.remark ?? '—'}
              </p>
              <p className="text-xs text-slate-500">
                예정 {formatIncheonDateTime(log.schedule_date_time)} · 추정{' '}
                {formatIncheonDateTime(log.estimated_date_time)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
