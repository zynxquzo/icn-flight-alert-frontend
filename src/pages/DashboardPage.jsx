// src/pages/DashboardPage.jsx
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import {
  fetchFlights,
  createFlight,
  deleteFlight,
  updateFlightStatus,
  refreshFlight,
} from '../api/flights';
import { fetchUserNotifications } from '../api/notifications';
import { fetchFlightLogs } from '../api/flightLogs';
import { getApiErrorMessage } from '../utils/apiError';

const FLIGHT_TYPE_LABEL = {
  departure: '출발',
  arrival: '도착',
};

function normalizeFlightId(value) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

const NOTIFICATION_TYPES = [
  { value: '', label: '전체' },
  { value: 'delay', label: '지연' },
  { value: 'gate_change', label: '게이트 변경' },
  { value: 'cancel', label: '취소' },
  { value: 'terminal_change', label: '터미널 변경' },
];

function DashboardPage() {
  const { user } = useAuth();
  const [flights, setFlights] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifType, setNotifType] = useState('');

  const [logsFlightPk, setLogsFlightPk] = useState(null);
  const [flightLogs, setFlightLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const [registerOpen, setRegisterOpen] = useState(false);
  const [flightId, setFlightId] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [flightType, setFlightType] = useState('departure');
  const [registerError, setRegisterError] = useState('');
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  const [actionFlightPk, setActionFlightPk] = useState(null);

  const loadFlights = useCallback(async () => {
    setListError('');
    setListLoading(true);
    try {
      const data = await fetchFlights();
      setFlights(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(getApiErrorMessage(e, '비행편 목록을 불러오지 못했습니다.'));
      setFlights([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const loadNotifications = useCallback(async () => {
    if (!user?.email) return;
    setNotifError('');
    setNotifLoading(true);
    try {
      const params = notifType ? { notification_type: notifType } : {};
      const data = await fetchUserNotifications(user.email, params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotifError(getApiErrorMessage(e, '알림을 불러오지 못했습니다.'));
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, [user?.email, notifType]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const toggleFlightLogs = async (flightPk) => {
    if (logsFlightPk === flightPk) {
      setLogsFlightPk(null);
      setFlightLogs([]);
      setLogsError('');
      return;
    }
    setLogsFlightPk(flightPk);
    setLogsError('');
    setLogsLoading(true);
    setFlightLogs([]);
    try {
      const data = await fetchFlightLogs(flightPk);
      setFlightLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setLogsError(getApiErrorMessage(e, '변경 이력을 불러오지 못했습니다.'));
    } finally {
      setLogsLoading(false);
    }
  };

  const openRegister = () => {
    setRegisterError('');
    setRegisterSuccess('');
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFlightDate((prev) => prev || `${y}-${m}-${d}`);
    setRegisterOpen(true);
  };

  const closeRegister = () => {
    if (registerSubmitting) return;
    setRegisterOpen(false);
    setRegisterError('');
    setFlightId('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    const id = normalizeFlightId(flightId);
    if (id.length < 2 || id.length > 10) {
      setRegisterError('편명은 2~10자(공백 제외)로 입력해 주세요. 예: KE123');
      return;
    }
    if (!flightDate) {
      setRegisterError('출발/도착 날짜를 선택해 주세요.');
      return;
    }

    setRegisterSubmitting(true);
    try {
      await createFlight({
        flight_id: id,
        flight_date: flightDate,
        flight_type: flightType,
      });
      setRegisterSuccess('비행편이 등록되었습니다. 목록이 곧 갱신됩니다.');
      setFlightId('');
      await loadFlights();
      setTimeout(() => {
        setRegisterOpen(false);
        setRegisterSuccess('');
      }, 800);
    } catch (err) {
      setRegisterError(getApiErrorMessage(err, '비행편 등록에 실패했습니다.'));
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const handleDelete = async (flightPk) => {
    if (!window.confirm('이 비행편을 삭제할까요? 관련 알림·이력도 함께 삭제됩니다.')) {
      return;
    }
    setActionFlightPk(flightPk);
    try {
      await deleteFlight(flightPk);
      await loadFlights();
    } catch (e) {
      alert(getApiErrorMessage(e, '삭제에 실패했습니다.'));
    } finally {
      setActionFlightPk(null);
    }
  };

  const handleToggleActive = async (flightPk, nextActive) => {
    setActionFlightPk(flightPk);
    try {
      await updateFlightStatus(flightPk, nextActive);
      await loadFlights();
    } catch (e) {
      alert(getApiErrorMessage(e, '상태 변경에 실패했습니다.'));
    } finally {
      setActionFlightPk(null);
    }
  };

  const handleRefresh = async (flightPk) => {
    setActionFlightPk(flightPk);
    try {
      const result = await refreshFlight(flightPk);
      await loadFlights();
      if (import.meta.env.DEV && result != null) {
        console.debug('refreshFlight', result);
      }
    } catch (e) {
      alert(getApiErrorMessage(e, '갱신에 실패했습니다.'));
    } finally {
      setActionFlightPk(null);
    }
  };

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">내 비행편</h2>
            <button
              type="button"
              onClick={openRegister}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shrink-0"
            >
              ➕ 비행편 등록
            </button>
          </div>

          {listError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {listError}
            </div>
          )}

          {listLoading ? (
            <p className="text-gray-600">불러오는 중...</p>
          ) : flights.length === 0 ? (
            <p className="text-gray-600 mb-4">
              등록된 비행편이 없습니다. 상단의 비행편 등록으로 추가해 주세요.
            </p>
          ) : (
            <ul className="space-y-4">
              {flights.map((f) => {
                const busy = actionFlightPk === f.flight_pk;
                const typeLabel = FLIGHT_TYPE_LABEL[f.flight_type] || f.flight_type;
                return (
                  <li
                    key={f.flight_pk}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col gap-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-lg font-semibold text-gray-900">
                          {f.flight_id || '—'}
                        </span>
                        <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {typeLabel}
                        </span>
                        <span
                          className={`text-sm px-2 py-0.5 rounded-full ${
                            f.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {f.is_active ? '모니터링 중' : '비활성'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {f.flight_date} · {f.airline || '항공사 정보 대기'}
                        {f.airport ? ` · ${f.airport}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        게이트: {f.gate_number ?? '—'} · 예정:{' '}
                        {f.schedule_date_time ?? '—'} · 추정:{' '}
                        {f.estimated_date_time ?? '—'}
                        {f.remark ? ` · ${f.remark}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleFlightLogs(f.flight_pk)}
                        className="px-3 py-2 text-sm bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                      >
                        {logsFlightPk === f.flight_pk ? '이력 닫기' : '변경 이력'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRefresh(f.flight_pk)}
                        className="px-3 py-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg disabled:opacity-50"
                      >
                        정보 갱신
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleActive(f.flight_pk, !f.is_active)}
                        className="px-3 py-2 text-sm bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg disabled:opacity-50"
                      >
                        {f.is_active ? '모니터링 끄기' : '모니터링 켜기'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(f.flight_pk)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                    </div>
                    {logsFlightPk === f.flight_pk && (
                      <div className="w-full border-t border-gray-100 pt-3">
                        {logsLoading ? (
                          <p className="text-sm text-gray-500">이력 불러오는 중…</p>
                        ) : logsError ? (
                          <p className="text-sm text-red-600">{logsError}</p>
                        ) : flightLogs.length === 0 ? (
                          <p className="text-sm text-gray-500">저장된 변경 이력이 없습니다.</p>
                        ) : (
                          <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
                            {flightLogs.map((log) => (
                              <li
                                key={log.log_id}
                                className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                              >
                                <span className="font-medium text-gray-800">
                                  {log.change_type || '변경'}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  {log.detected_at
                                    ? new Date(log.detected_at).toLocaleString('ko-KR')
                                    : ''}
                                </span>
                                <p className="text-gray-600 mt-1">
                                  게이트 {log.gate_number ?? '—'} · 터미널 {log.terminal_id ?? '—'} ·
                                  비고 {log.remark ?? '—'}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">내 알림</h2>
              <p className="text-sm text-gray-600 mt-1">
                <code className="text-xs bg-gray-100 px-1 rounded">GET /notifications</code> —
                등록한 비행편에서 발송·기록된 알림입니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="notif-type" className="text-sm text-gray-600">
                유형
              </label>
              <select
                id="notif-type"
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t.value || 'all'} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadNotifications}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                새로고침
              </button>
            </div>
          </div>
          {notifError && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {notifError}
            </div>
          )}
          {notifLoading ? (
            <p className="text-gray-600 text-sm">불러오는 중…</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-600 text-sm">알림이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {notifications.map((n) => (
                <li key={n.notification_id} className="px-4 py-3 bg-white hover:bg-gray-50/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {n.notification_type}
                    </span>
                    <span className="text-xs text-gray-500">비행편 #{n.flight_pk}</span>
                    <span
                      className={`text-xs ${n.is_sent ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      {n.is_sent ? '발송됨' : '미발송'}
                    </span>
                    {n.sent_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(n.sent_at).toLocaleString('ko-KR')}
                      </span>
                    )}
                  </div>
                  {n.message && <p className="text-sm text-gray-700 mt-1">{n.message}</p>}
                  {n.error_message && (
                    <p className="text-xs text-red-600 mt-1">오류: {n.error_message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            인천공항 OpenAPI와 연동되어 등록 시 실제 운항 정보가 채워지며, 스케줄러가 주기적으로
            상태를 확인합니다. 백엔드는{' '}
            <code className="text-blue-900 bg-blue-100/80 px-1 rounded">localhost:8000</code>
            에서 실행되어야 합니다.
          </p>
        </div>
      </main>

      {/* 비행편 등록 모달 */}
      {registerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-flight-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRegister();
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 id="register-flight-title" className="text-xl font-bold text-gray-900">
                비행편 등록
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                백엔드 <code className="text-xs bg-gray-100 px-1 rounded">POST /flights</code>와
                동일합니다. 편명·날짜·출발/도착을 입력하면 로그인한 계정에 연결됩니다.
              </p>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {registerError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {registerError}
                </div>
              )}
              {registerSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
                  {registerSuccess}
                </div>
              )}

              <div>
                <label htmlFor="reg-flight-id" className="block text-sm font-medium text-gray-700 mb-1">
                  항공편명 <span className="text-red-500">*</span>
                </label>
                <input
                  id="reg-flight-id"
                  type="text"
                  value={flightId}
                  onChange={(e) => setFlightId(e.target.value)}
                  placeholder="예: KE123"
                  autoComplete="off"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">2~10자, 저장 시 공백 제거·대문자 변환</p>
              </div>

              <div>
                <label htmlFor="reg-flight-date" className="block text-sm font-medium text-gray-700 mb-1">
                  출발/도착 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  id="reg-flight-date"
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">구분</legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flight_type"
                      value="departure"
                      checked={flightType === 'departure'}
                      onChange={() => setFlightType('departure')}
                    />
                    <span className="text-gray-800">출발 (departure)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flight_type"
                      value="arrival"
                      checked={flightType === 'arrival'}
                      onChange={() => setFlightType('arrival')}
                    />
                    <span className="text-gray-800">도착 (arrival)</span>
                  </label>
                </div>
              </fieldset>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRegister}
                  disabled={registerSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={registerSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {registerSubmitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default DashboardPage;
