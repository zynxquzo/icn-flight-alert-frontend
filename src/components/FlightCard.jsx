import Badge from './Badge';
import FlightLogs from './FlightLogs';
import FlightNotifications from './FlightNotifications';
import { flightTypeLabel, formatIncheonDateTime } from '../utils/format';

export default function FlightCard({
  flight,
  busy,
  panel,
  logChangeType,
  onLogChangeTypeChange,
  flightLogs,
  logsLoading,
  logsError,
  flightNotifs,
  flightNotifsLoading,
  flightNotifsError,
  onToggleLogs,
  onToggleFlightNotifs,
  onRefresh,
  onToggleActive,
  onDelete,
  onOpenDetails,
}) {
  const typeLabel = flightTypeLabel(flight.flight_type);
  const isLogsOpen = panel?.flightPk === flight.flight_pk && panel.tab === 'logs';
  const isNotifsOpen = panel?.flightPk === flight.flight_pk && panel.tab === 'notifications';

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              {flight.flight_id || '—'}
            </span>
            <Badge variant="default">{typeLabel}</Badge>
            <Badge variant={flight.is_active ? 'success' : 'default'}>
              {flight.is_active ? '모니터링 중' : '비활성'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {flight.flight_date} · {flight.airline || '항공사 정보 대기'}
            {flight.airport ? ` · ${flight.airport}` : ''}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
            게이트: {flight.gate_number ?? '—'} · 예정: {formatIncheonDateTime(flight.schedule_date_time)}{' '}
            · 추정: {formatIncheonDateTime(flight.estimated_date_time)}
            {flight.remark ? ` · ${flight.remark}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenDetails(flight.flight_pk)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            상세
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleLogs(flight.flight_pk)}
            className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isLogsOpen ? '이력 닫기' : '변경 이력'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleFlightNotifs(flight.flight_pk)}
            className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-800 hover:bg-violet-100 disabled:opacity-50 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/50"
          >
            {isNotifsOpen ? '알림 닫기' : '이 편 알림'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRefresh(flight.flight_pk)}
            className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
          >
            정보 갱신
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleActive(flight.flight_pk, !flight.is_active)}
            className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            {flight.is_active ? '모니터링 끄기' : '모니터링 켜기'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(flight.flight_pk)}
            className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
          >
            삭제
          </button>
        </div>
      </div>

      {isLogsOpen && (
        <FlightLogs
          flightPk={flight.flight_pk}
          changeType={logChangeType}
          onChangeTypeChange={onLogChangeTypeChange}
          logs={flightLogs}
          loading={logsLoading}
          error={logsError}
        />
      )}
      {isNotifsOpen && (
        <div className="w-full border-t border-slate-100 pt-3 dark:border-slate-800">
          <FlightNotifications
            notifications={flightNotifs}
            loading={flightNotifsLoading}
            error={flightNotifsError}
          />
        </div>
      )}
    </li>
  );
}
