import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import Spinner from './Spinner';
import { fetchFlightDetail } from '../api/flights';
import { getApiErrorMessage } from '../utils/apiError';
import { useI18n } from '../context/I18nContext';
import {
  flightTypeLabel,
  formatIncheonDateTime,
  formatIsoDateTime,
  estimateWaitHoursUntilSchedule,
  terminalForChatOption,
} from '../utils/format';

/**
 * 부모는 detailPk가 있을 때만 마운트하고, 편이 바뀌면 key로 리마운트해 로딩 초기 상태를 맞춥니다.
 */
export default function FlightDetailsModal({ flightPk, onClose }) {
  const { t, lang } = useI18n();
  const localeTag = lang === 'en' ? 'en-US' : 'ko-KR';
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchFlightDetail(flightPk)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(getApiErrorMessage(e, t('flightDetail.loadError')));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [flightPk, t]);

  const row = (label, value) => (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800 sm:flex-row sm:justify-between">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-slate-100">{value ?? '—'}</span>
    </div>
  );

  return (
    <Modal open onClose={onClose} title={t('flightDetail.title')} ariaLabelledBy="flight-detail-title">
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner className="text-indigo-600" />
        </div>
      )}
      {!loading && error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!loading && detail && (
        <div className="space-y-1">
          {row(t('flightDetail.flightNo'), detail.flight_id)}
          {row(t('flightDetail.date'), detail.flight_date)}
          {row(t('flightDetail.type'), flightTypeLabel(t, detail.flight_type))}
          {row(t('flightDetail.airline'), detail.airline)}
          {row(t('flightDetail.airport'), detail.airport)}
          {row(t('flightDetail.airportCode'), detail.airport_code)}
          {row(t('flightDetail.terminal'), detail.terminal_id)}
          {row(t('flightDetail.gate'), detail.gate_number)}
          {row(t('flightDetail.schedTime'), formatIncheonDateTime(detail.schedule_date_time))}
          {row(t('flightDetail.estTime'), formatIncheonDateTime(detail.estimated_date_time))}
          {row(t('flightDetail.remark'), detail.remark)}
          {row(t('flightDetail.checkin'), detail.chkin_range)}
          {row(t('flightDetail.carousel'), detail.carousel)}
          {row(t('flightDetail.exit'), detail.exit_number)}
          {row(
            t('flightDetail.monitoring'),
            detail.is_active ? t('flightDetail.monitoringOn') : t('flightDetail.monitoringOff'),
          )}
          {row(t('flightDetail.created'), formatIsoDateTime(detail.created_at, localeTag))}
          {row(t('flightDetail.lastUpdated'), formatIsoDateTime(detail.last_checked_at, localeTag))}
          {row(t('flightDetail.userEmail'), detail.user_email)}
          <div className="pt-4">
            {(() => {
              const term = terminalForChatOption(detail.terminal_id);
              const waitH = estimateWaitHoursUntilSchedule(
                detail.schedule_date_time,
                detail.estimated_date_time,
              );
              const waitParam =
                waitH != null && waitH > 0 && waitH <= 48
                  ? `&wait=${encodeURIComponent(String(Math.round(waitH * 4) / 4))}`
                  : '';
              const to = `/chatbot?terminal=${encodeURIComponent(term)}${waitParam}`;
              return (
                <Link
                  to={to}
                  onClick={() => onClose?.()}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-indigo-700 sm:w-auto"
                >
                  {t('flightDetail.openChatbot')}
                </Link>
              );
            })()}
          </div>
        </div>
      )}
    </Modal>
  );
}
