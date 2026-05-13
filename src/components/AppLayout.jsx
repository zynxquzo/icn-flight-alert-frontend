import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../context/I18nContext';

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="mr-2 flex items-center">
                <span className="mr-2 text-2xl">✈️</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{t('brand')}</span>
              </div>
              <div className="flex items-center gap-1">
                <NavLink to="/dashboard" className={navClass} end>
                  {t('nav.dashboard')}
                </NavLink>
                <NavLink to="/chatbot" className={navClass}>
                  {t('nav.chatbot')}
                </NavLink>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-0.5 dark:border-slate-600">
                <button
                  type="button"
                  onClick={() => setLang('ko')}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    lang === 'ko'
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  aria-pressed={lang === 'ko'}
                >
                  KO
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    lang === 'en'
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  aria-pressed={lang === 'en'}
                >
                  EN
                </button>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
                aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
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
                {t('nav.logout')}
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
