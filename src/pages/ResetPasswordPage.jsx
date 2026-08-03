import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';
import { useI18n } from '../hooks/useI18n';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(t('resetPassword.errMinLen'));
      return;
    }
    if (password !== password2) {
      setError(t('resetPassword.errMismatch'));
      return;
    }
    if (!token.trim()) {
      setError(t('resetPassword.errNoToken'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token: token.trim(), new_password: password });
      navigate('/login', { replace: true, state: { resetOk: true } });
    } catch (err) {
      setError(getApiErrorMessage(err, t('resetPassword.resetFail')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 px-4 dark:from-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('resetPassword.title')}</h1>
        {!token.trim() && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {t('resetPassword.noToken')}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="np1" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('resetPassword.newPassword')}
            </label>
            <input
              id="np1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="np2" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('resetPassword.confirmPassword')}
            </label>
            <input
              id="np2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? t('resetPassword.saving') : t('resetPassword.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400">
            {t('resetPassword.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
