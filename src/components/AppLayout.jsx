import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="mr-2 flex items-center">
                <span className="mr-2 text-2xl">✈️</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">ICN Flight Alert</span>
              </div>
              <div className="flex items-center gap-1">
                <NavLink to="/dashboard" className={navClass} end>
                  대시보드
                </NavLink>
                <NavLink to="/chatbot" className={navClass}>
                  공항 챗봇
                </NavLink>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:space-x-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
                aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <span className="max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-400">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="shrink-0 rounded-xl bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

export default AppLayout;
