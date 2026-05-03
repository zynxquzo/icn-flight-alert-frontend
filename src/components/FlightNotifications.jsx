import Badge from './Badge';
import { notificationTypeLabel } from '../utils/format';

export default function FlightNotifications({ notifications, loading, error }) {
  if (loading) {
    return <p className="text-sm text-slate-500">알림 불러오는 중…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }
  if (!notifications?.length) {
    return <p className="text-sm text-slate-500">이 비행편에 대한 알림이 없습니다.</p>;
  }

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
      {notifications.map((n) => (
        <li
          key={n.notification_id}
          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">{notificationTypeLabel(n.notification_type)}</Badge>
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
          {n.message && <p className="mt-1 text-slate-700 dark:text-slate-200">{n.message}</p>}
        </li>
      ))}
    </ul>
  );
}
