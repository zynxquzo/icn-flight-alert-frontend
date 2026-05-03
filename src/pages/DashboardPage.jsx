import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/AppLayout';
import FlightCard from '../components/FlightCard';
import RegisterFlightModal from '../components/RegisterFlightModal';
import FlightDetailsModal from '../components/FlightDetailsModal';
import {
  fetchFlights,
  deleteFlight,
  updateFlightStatus,
  refreshFlight,
} from '../api/flights';
import { fetchMyNotifications, fetchFlightNotifications } from '../api/notifications';
import { fetchFlightLogs } from '../api/flightLogs';
import { getApiErrorMessage } from '../utils/apiError';
import { summarizeRefreshResult } from '../utils/format';
import { useToast } from '../hooks/useToast';

const NOTIFICATION_TYPES = [
  { value: '', label: '전체' },
  { value: 'delay', label: '지연' },
  { value: 'gate_change', label: '게이트 변경' },
  { value: 'cancel', label: '취소' },
  { value: 'terminal_change', label: '터미널 변경' },
];

const ACTIVE_FILTERS = [
  { value: '', label: '전체' },
  { value: 'active', label: '모니터링 중' },
  { value: 'inactive', label: '비활성' },
];

function activeParams(filterValue) {
  if (filterValue === 'active') return { is_active: true };
  if (filterValue === 'inactive') return { is_active: false };
  return {};
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [flights, setFlights] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifType, setNotifType] = useState('');

  /** 비행편 카드에서 펼친 패널: 변경 이력 또는 이 편 알림 */
  const [panel, setPanel] = useState(null);
  const [logChangeType, setLogChangeType] = useState('');

  const [flightLogs, setFlightLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const [flightNotifs, setFlightNotifs] = useState([]);
  const [flightNotifsLoading, setFlightNotifsLoading] = useState(false);
  const [flightNotifsError, setFlightNotifsError] = useState('');

  const [actionFlightPk, setActionFlightPk] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailPk, setDetailPk] = useState(null);

  const loadFlights = useCallback(async () => {
    setListError('');
    setListLoading(true);
    try {
      const params = activeParams(activeFilter);
      const data = await fetchFlights(params);
      setFlights(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(getApiErrorMessage(e, '비행편 목록을 불러오지 못했습니다.'));
      setFlights([]);
    } finally {
      setListLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotifError('');
    setNotifLoading(true);
    try {
      const params = notifType ? { notification_type: notifType } : {};
      const data = await fetchMyNotifications(params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotifError(getApiErrorMessage(e, '알림을 불러오지 못했습니다.'));
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, [user, notifType]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!panel || panel.tab !== 'logs') return;

    let cancelled = false;
    setLogsLoading(true);
    setLogsError('');
    const params = logChangeType ? { change_type: logChangeType } : {};
    fetchFlightLogs(panel.flightPk, params)
      .then((data) => {
        if (!cancelled) setFlightLogs(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setLogsError(getApiErrorMessage(e, '변경 이력을 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panel, logChangeType]);

  useEffect(() => {
    if (!panel || panel.tab !== 'notifications') return;

    let cancelled = false;
    setFlightNotifsLoading(true);
    setFlightNotifsError('');
    fetchFlightNotifications(panel.flightPk)
      .then((data) => {
        if (!cancelled) setFlightNotifs(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setFlightNotifsError(getApiErrorMessage(e, '알림을 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!cancelled) setFlightNotifsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panel]);

  const toggleLogs = (flightPk) => {
    setPanel((p) => {
      if (p?.flightPk === flightPk && p?.tab === 'logs') return null;
      return { flightPk, tab: 'logs' };
    });
  };

  const toggleFlightNotifs = (flightPk) => {
    setPanel((p) => {
      if (p?.flightPk === flightPk && p?.tab === 'notifications') return null;
      return { flightPk, tab: 'notifications' };
    });
  };

  const handleDelete = async (flightPk) => {
    if (!window.confirm('이 비행편을 삭제할까요? 관련 알림·이력도 함께 삭제됩니다.')) {
      return;
    }
    setActionFlightPk(flightPk);
    try {
      await deleteFlight(flightPk);
      await loadFlights();
      showToast('비행편이 삭제되었습니다.', 'success');
      if (panel?.flightPk === flightPk) setPanel(null);
    } catch (e) {
      showToast(getApiErrorMessage(e, '삭제에 실패했습니다.'), 'error');
    } finally {
      setActionFlightPk(null);
    }
  };

  const handleToggleActive = async (flightPk, nextActive) => {
    setActionFlightPk(flightPk);
    try {
      await updateFlightStatus(flightPk, nextActive);
      await loadFlights();
      showToast(nextActive ? '모니터링을 켰습니다.' : '모니터링을 껐습니다.', 'success');
    } catch (e) {
      showToast(getApiErrorMessage(e, '상태 변경에 실패했습니다.'), 'error');
    } finally {
      setActionFlightPk(null);
    }
  };

  const handleRefresh = async (flightPk) => {
    setActionFlightPk(flightPk);
    try {
      const result = await refreshFlight(flightPk);
      await loadFlights();
      await loadNotifications();
      showToast(summarizeRefreshResult(result), result?.changes_detected ? 'info' : 'success');
    } catch (e) {
      showToast(getApiErrorMessage(e, '갱신에 실패했습니다.'), 'error');
    } finally {
      setActionFlightPk(null);
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">내 비행편</h2>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="active-filter" className="text-sm text-slate-600 dark:text-slate-400">
                상태
              </label>
              <select
                id="active-filter"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {ACTIVE_FILTERS.map((f) => (
                  <option key={f.value || 'all'} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                비행편 등록
              </button>
            </div>
          </div>

          {listError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {listError}
            </div>
          )}

          {listLoading ? (
            <p className="text-slate-600 dark:text-slate-400">불러오는 중...</p>
          ) : flights.length === 0 ? (
            <p className="mb-4 text-slate-600 dark:text-slate-400">
              등록된 비행편이 없습니다. 상단에서 비행편을 등록해 주세요.
            </p>
          ) : (
            <ul className="space-y-4">
              {flights.map((f) => {
                const busy = actionFlightPk === f.flight_pk;
                return (
                  <FlightCard
                    key={f.flight_pk}
                    flight={f}
                    busy={busy}
                    panel={panel}
                    logChangeType={logChangeType}
                    onLogChangeTypeChange={setLogChangeType}
                    flightLogs={flightLogs}
                    logsLoading={logsLoading}
                    logsError={logsError}
                    flightNotifs={flightNotifs}
                    flightNotifsLoading={flightNotifsLoading}
                    flightNotifsError={flightNotifsError}
                    onToggleLogs={toggleLogs}
                    onToggleFlightNotifs={toggleFlightNotifs}
                    onRefresh={handleRefresh}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onOpenDetails={setDetailPk}
                  />
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">내 알림</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">
                  GET /notifications
                </code>{' '}
                — JWT 기준으로 등록한 비행편의 알림입니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="notif-type" className="text-sm text-slate-600 dark:text-slate-400">
                유형
              </label>
              <select
                id="notif-type"
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t.value === '' ? 'all' : t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadNotifications}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                새로고침
              </button>
            </div>
          </div>
          {notifError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {notifError}
            </div>
          )}
          {notifLoading ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">불러오는 중…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">알림이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {notifications.map((n) => (
                <li
                  key={n.notification_id}
                  className="bg-white px-4 py-3 hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/80"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                      {n.notification_type}
                    </span>
                    <span className="text-xs text-slate-500">비행편 #{n.flight_pk}</span>
                    <span
                      className={`text-xs ${n.is_sent ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                    >
                      {n.is_sent ? '발송됨' : '미발송'}
                    </span>
                    {n.sent_at && (
                      <span className="text-xs text-slate-400">
                        {new Date(n.sent_at).toLocaleString('ko-KR')}
                      </span>
                    )}
                  </div>
                  {n.message && (
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{n.message}</p>
                  )}
                  {n.sent_to && (
                    <p className="text-xs text-slate-500">수신: {n.sent_to}</p>
                  )}
                  {n.error_message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      오류: {n.error_message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
          <p className="text-sm text-indigo-900 dark:text-indigo-100">
            인천공항 OpenAPI와 연동되어 등록 시 실제 운항 정보가 채워지며, 스케줄러가 주기적으로 상태를
            확인합니다. API 주소는 환경 변수{' '}
            <code className="rounded bg-white/80 px-1 dark:bg-slate-900">VITE_API_BASE_URL</code>로
            설정합니다.
          </p>
        </div>
      </main>

      <RegisterFlightModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => {
          loadFlights();
          loadNotifications();
        }}
      />
      {detailPk != null && (
        <FlightDetailsModal
          key={String(detailPk)}
          flightPk={detailPk}
          onClose={() => setDetailPk(null)}
        />
      )}
    </AppLayout>
  );
}
