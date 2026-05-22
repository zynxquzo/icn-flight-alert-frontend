import { useMemo } from 'react';
import { changeTypeLabel, formatIncheonDateTime } from '../utils/format';
import { useI18n } from '../hooks/useI18n';

export default function FlightLogs({
  flightPk,
  changeType,
  onChangeTypeChange,
  logs,
  loading,
  error,
  localeTag = 'ko-KR',
}) {
  const { t } = useI18n();
  const fid = `log-filter-${flightPk}`;

  const LOG_FILTERS = useMemo(
    () => [
      { value: '', label: t('dashboard.logFilterAll') },
      { value: 'gate_change', label: t('dashboard.logFilterGate') },
      { value: 'delay', label: t('dashboard.logFilterDelay') },
      { value: 'status_change', label: t('dashboard.logFilterStatus') },
      { value: 'terminal_change', label: t('dashboard.logFilterTerminal') },
    ],
    [t],
  );

  return (
    <div className="w-full border-t border-slate-100 pt-3 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor={fid} className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('dashboard.logFilterLabel')}
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
        <p className="text-sm text-slate-500">{t('dashboard.logsLoading')}</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('dashboard.logsEmpty')}</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {logs.map((log) => (
            <li
              key={log.log_id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {changeTypeLabel(t, log.change_type)}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {log.detected_at ? new Date(log.detected_at).toLocaleString(localeTag) : ''}
              </span>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {t('dashboard.logLineGate')} {log.gate_number ?? '—'} · {t('dashboard.logLineTerminal')}{' '}
                {log.terminal_id ?? '—'} · {t('dashboard.logLineRemark')} {log.remark ?? '—'}
              </p>
              <p className="text-xs text-slate-500">
                {t('dashboard.logLineSched')} {formatIncheonDateTime(log.schedule_date_time)} ·{' '}
                {t('dashboard.logLineEst')} {formatIncheonDateTime(log.estimated_date_time)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
