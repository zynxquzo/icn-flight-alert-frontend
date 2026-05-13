import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';

export default function ResetPasswordPage() {
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
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (password !== password2) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!token.trim()) {
      setError('유효한 재설정 링크가 아닙니다.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token: token.trim(), new_password: password });
      navigate('/login', { replace: true, state: { resetOk: true } });
    } catch (err) {
      setError(getApiErrorMessage(err, '재설정에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 px-4 dark:from-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">새 비밀번호 설정</h1>
        {!token.trim() && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            링크에 토큰이 없습니다. 이메일의 링크를 다시 열어 주세요.
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
              새 비밀번호
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
              새 비밀번호 확인
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
            {loading ? '저장 중…' : '비밀번호 저장'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
