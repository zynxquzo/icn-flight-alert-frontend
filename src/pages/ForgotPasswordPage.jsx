import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, '요청 처리에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 px-4 dark:from-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">비밀번호 재설정</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          가입 시 사용한 이메일을 입력하세요. 등록된 주소면 재설정 링크를 보냅니다.
        </p>

        {done && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            요청을 접수했습니다. 메일함을 확인해 주세요.
          </p>
        )}

        {!done && error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        )}

        {!done && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fp-email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                이메일
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '처리 중…' : '링크 보내기'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
