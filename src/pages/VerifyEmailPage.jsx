import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token.trim()) {
      setStatus('error');
      setMessage('토큰이 없습니다. 메일의 링크를 그대로 사용해 주세요.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await verifyEmail(token.trim());
        if (!cancelled) {
          setStatus('ok');
          setMessage(data?.detail ?? '이메일 인증이 완료되었습니다.');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(getApiErrorMessage(e, '인증에 실패했습니다.'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 px-4 dark:from-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">이메일 인증</h1>
        {status === 'loading' && <p className="mt-4 text-slate-600 dark:text-slate-400">처리 중…</p>}
        {status === 'ok' && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {message}
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {message}
          </p>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400">
            로그인으로 이동
          </Link>
        </p>
      </div>
    </div>
  );
}
