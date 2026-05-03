import { useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { fetchFlightDetail } from '../api/flights';
import { getApiErrorMessage } from '../utils/apiError';
import { flightTypeLabel, formatIncheonDateTime, formatIsoDateTime } from '../utils/format';

/**
 * 부모는 detailPk가 있을 때만 마운트하고, 편이 바뀌면 key로 리마운트해 로딩 초기 상태를 맞춥니다.
 */
export default function FlightDetailsModal({ flightPk, onClose }) {
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
          setError(getApiErrorMessage(e, '상세 정보를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [flightPk]);

  const row = (label, value) => (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800 sm:flex-row sm:justify-between">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-slate-100">{value ?? '—'}</span>
    </div>
  );

  return (
    <Modal open onClose={onClose} title="비행편 상세" ariaLabelledBy="flight-detail-title">
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner className="text-indigo-600" />
        </div>
      )}
      {!loading && error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!loading && detail && (
        <div className="space-y-1">
          {row('편명', detail.flight_id)}
          {row('날짜', detail.flight_date)}
          {row('구분', flightTypeLabel(detail.flight_type))}
          {row('항공사', detail.airline)}
          {row('공항', detail.airport)}
          {row('공항 코드', detail.airport_code)}
          {row('터미널', detail.terminal_id)}
          {row('게이트', detail.gate_number)}
          {row('예정 시각', formatIncheonDateTime(detail.schedule_date_time))}
          {row('추정 시각', formatIncheonDateTime(detail.estimated_date_time))}
          {row('비고', detail.remark)}
          {row('체크인', detail.chkin_range)}
          {row('캐러셀', detail.carousel)}
          {row('출구', detail.exit_number)}
          {row('모니터링', detail.is_active ? '켜짐' : '꺼짐')}
          {row('등록일', formatIsoDateTime(detail.created_at))}
          {row('마지막 갱신', formatIsoDateTime(detail.last_checked_at))}
          {row('사용자 이메일', detail.user_email)}
        </div>
      )}
    </Modal>
  );
}
