import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/Badge';
import {
  createChatSession,
  deleteChatSession,
  fetchChatbotInfo,
  getChatSession,
  listChatSessions,
  sendSessionMessage,
  submitFeedback,
} from '../api/chatbot';
import { getApiErrorMessage } from '../utils/apiError';
import { useI18n } from '../hooks/useI18n';

const SESSION_STORAGE_KEY = 'icn-chatbot-session-id';

function modeLabel(mode) {
  const m = String(mode || '').toLowerCase();
  if (m === 'agent') return 'AGENT';
  if (m === 'rag') return 'RAG';
  return 'LEGACY';
}

/** localStorage에서 현재 세션 ID 로드 */
function loadStoredSessionId() {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function saveSessionId(id) {
  try {
    if (id) localStorage.setItem(SESSION_STORAGE_KEY, id);
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export default function ChatbotPage() {
  const { t } = useI18n();

  const terminals = useMemo(
    () => [
      { value: 'T1', label: t('chatbot.terminalT1') },
      { value: 'T2', label: t('chatbot.terminalT2') },
    ],
    [t],
  );
  const examples = useMemo(
    () => [
      { label: t('chatbot.ex1Label'), text: t('chatbot.ex1Text'), hours: 1 },
      { label: t('chatbot.ex2Label'), text: t('chatbot.ex2Text'), hours: 2 },
      { label: t('chatbot.ex3Label'), text: t('chatbot.ex3Text'), hours: 3 },
    ],
    [t],
  );

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState('');

  // 세션 상태
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(loadStoredSessionId);
  const [sessionLoading, setSessionLoading] = useState(false);

  // 메시지
  const [messages, setMessages] = useState([]);
  const [terminal, setTerminal] = useState('T1');
  const [waitHours, setWaitHours] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // 피드백 상태: { [message_id]: 'helpful'|'not_helpful'|'pending' }
  const [feedbackState, setFeedbackState] = useState({});

  const bottomRef = useRef(null);

  // URL 파라미터로 터미널·대기 시간 초기화
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('terminal');
    if (t === 'T1' || t === 'T2') setTerminal(t);
    const w = sp.get('wait');
    if (w != null && w !== '') setWaitHours(String(w));
    if (t || w) {
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // 서비스 정보 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchChatbotInfo();
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) setInfoError(getApiErrorMessage(e, t('chatbot.errInfo')));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // 세션 목록 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listChatSessions();
        if (!cancelled) setSessions(list);
      } catch {
        /* 목록 조회 실패는 조용히 처리 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 현재 세션 메시지 로드
  const loadSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      setSessionLoading(true);
      try {
        const session = await getChatSession(sessionId);
        setMessages(
          session.messages.map((m) => ({
            message_id: m.message_id,
            role: m.role,
            text: m.content,
            mode: m.mode,
            sources: m.sources,
            feedback: m.feedback,
          })),
        );
        setTerminal(session.terminal || 'T1');
        setCurrentSessionId(sessionId);
        saveSessionId(sessionId);
      } catch {
        // 세션 없거나 만료 → 초기화
        setCurrentSessionId(null);
        saveSessionId(null);
        setMessages([]);
      } finally {
        setSessionLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (currentSessionId) {
      loadSession(currentSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const applyExample = (ex) => {
    setInput(ex.text);
    setWaitHours(String(ex.hours));
  };

  /** 새 세션 생성 */
  const handleNewSession = async () => {
    try {
      const session = await createChatSession(terminal);
      setCurrentSessionId(session.session_id);
      saveSessionId(session.session_id);
      setMessages([]);
      setSessions((prev) => [session, ...prev]);
    } catch (e) {
      console.error('새 세션 생성 실패', e);
    }
  };

  /** 세션 선택 */
  const handleSelectSession = (sessionId) => {
    if (sessionId === currentSessionId) return;
    loadSession(sessionId);
  };

  /** 세션 삭제 */
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('chatbot.confirmDeleteSession'))) return;
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        saveSessionId(null);
        setMessages([]);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setSending(true);

    try {
      // 세션이 없으면 자동 생성
      let sessionId = currentSessionId;
      if (!sessionId) {
        const session = await createChatSession(terminal);
        sessionId = session.session_id;
        setCurrentSessionId(sessionId);
        saveSessionId(sessionId);
        setSessions((prev) => [session, ...prev]);
      }

      const data = await sendSessionMessage(sessionId, {
        message: text,
        wait_time_hours: waitHours === '' ? null : waitHours,
      });

      const reply = data?.response ?? t('chatbot.noReply');
      setMessages((prev) => [
        ...prev,
        {
          message_id: null, // 서버에서 받은 message_id가 없으면 null
          role: 'assistant',
          text: reply,
          mode: data?.mode,
          sources: Array.isArray(data?.sources) ? data.sources : [],
        },
      ]);

      // 세션 목록 updated_at 갱신
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s,
        ),
      );

      // 최신 메시지의 message_id를 얻기 위해 세션 재로드 (피드백용)
      loadSession(sessionId);
    } catch (err) {
      const msg = getApiErrorMessage(err, t('chatbot.errChat'));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `${t('chatbot.errPrefix')}: ${msg}`, isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (message_id, feedback) => {
    if (!currentSessionId || !message_id) return;
    setFeedbackState((prev) => ({ ...prev, [message_id]: 'pending' }));
    try {
      await submitFeedback(currentSessionId, message_id, feedback);
      setFeedbackState((prev) => ({ ...prev, [message_id]: feedback }));
      setMessages((prev) =>
        prev.map((m) => (m.message_id === message_id ? { ...m, feedback } : m)),
      );
    } catch {
      setFeedbackState((prev) => ({ ...prev, [message_id]: undefined }));
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 서비스 헤더 */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('chatbot.title')}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t('chatbot.subtitle')}{' '}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">{t('chatbot.postChat')}</code>{' '}
            {t('chatbot.subtitleApi')}
          </p>
          {infoError && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {infoError}
            </p>
          )}
          {info?.features && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {info.features.map((f) => (
                <li
                  key={f}
                  className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100"
                >
                  {f}
                </li>
              ))}
            </ul>
          )}
          {info?.env && (
            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
                {t('chatbot.envSummary')}
              </summary>
              <dl className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {Object.entries(info.env).map(([key, val]) => (
                  <div key={key} className="grid gap-1 sm:grid-cols-[minmax(0,140px)_1fr]">
                    <dt className="font-mono text-slate-500 dark:text-slate-500">{key}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>

        <div className="flex gap-4">
          {/* 세션 사이드바 */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t('chatbot.sessionListTitle')}
                </span>
                <button
                  type="button"
                  onClick={handleNewSession}
                  className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  + {t('chatbot.newSession')}
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">{t('chatbot.noSessions')}</p>
              ) : (
                <ul className="space-y-1">
                  {sessions.map((s) => (
                    <li key={s.session_id}>
                      <button
                        type="button"
                        onClick={() => handleSelectSession(s.session_id)}
                        className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                          s.session_id === currentSessionId
                            ? 'bg-indigo-50 font-medium text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="line-clamp-2 flex-1 leading-tight">
                          {s.title || t('chatbot.emptyPrompt')}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleDeleteSession(s.session_id, e)}
                          onKeyDown={(e) => e.key === 'Enter' && handleDeleteSession(s.session_id, e)}
                          className="ml-1 hidden shrink-0 text-slate-400 hover:text-red-500 group-hover:block"
                          aria-label={t('chatbot.deleteSession')}
                        >
                          ×
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* 채팅 영역 */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60" style={{ height: 'min(580px, calc(100vh - 260px))' }}>
            {/* 설정 패널 */}
            <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('chatbot.quickQuestions')}</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => applyExample(ex)}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                  >
                    {ex.label}
                  </button>
                ))}
                {/* 모바일: 새 대화 버튼 */}
                <button
                  type="button"
                  onClick={handleNewSession}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
                >
                  + {t('chatbot.newSession')}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="cb-terminal" className="mb-1 block text-xs font-medium text-slate-500">
                    {t('chatbot.terminal')}
                  </label>
                  <select
                    id="cb-terminal"
                    value={terminal}
                    onChange={(e) => setTerminal(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {terminals.map((tm) => (
                      <option key={tm.value} value={tm.value}>
                        {tm.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cb-wait" className="mb-1 block text-xs font-medium text-slate-500">
                    {t('chatbot.waitHours')}
                  </label>
                  <input
                    id="cb-wait"
                    type="number"
                    min={0}
                    max={24}
                    step={1}
                    placeholder={t('chatbot.waitPlaceholder')}
                    value={waitHours}
                    onChange={(e) => setWaitHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('chatbot.sessionHint')}</p>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/90 p-4 dark:bg-slate-950/40">
              {sessionLoading && (
                <p className="py-12 text-center text-sm text-slate-500">{t('chatbot.loadingSession')}</p>
              )}
              {!sessionLoading && messages.length === 0 && !sending && (
                <p className="py-12 text-center text-sm text-slate-500">{t('chatbot.emptyPrompt')}</p>
              )}
              {messages.map((m, i) => (
                <div key={m.message_id ?? i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-indigo-600 text-white'
                        : m.isError
                          ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100'
                          : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div>{m.text}</div>
                    {m.role === 'assistant' && !m.isError && (
                      <div className="mt-2 space-y-2 border-t border-slate-100 pt-2 dark:border-slate-700">
                        {m.mode && (
                          <Badge variant="info" className="text-[10px] uppercase tracking-wide">
                            {modeLabel(m.mode)}
                          </Badge>
                        )}
                        {m.sources?.length > 0 && (
                          <ul className="space-y-1 text-xs">
                            <li className="font-medium text-slate-500 dark:text-slate-400">{t('chatbot.sources')}</li>
                            {m.sources.map((s, j) => (
                              <li key={s.doc_id || j}>
                                {s.source_url ? (
                                  <a
                                    href={s.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400"
                                  >
                                    {s.title || s.doc_id || t('chatbot.link')}
                                  </a>
                                ) : (
                                  <span>{s.title || s.doc_id}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {/* 피드백 버튼 */}
                        {m.message_id && (
                          <div className="flex gap-2 pt-1">
                            {['helpful', 'not_helpful'].map((fb) => {
                              const current = feedbackState[m.message_id] ?? m.feedback;
                              const active = current === fb;
                              const pending = feedbackState[m.message_id] === 'pending';
                              return (
                                <button
                                  key={fb}
                                  type="button"
                                  disabled={pending || !!current}
                                  onClick={() => handleFeedback(m.message_id, fb)}
                                  className={`rounded-full px-2 py-0.5 text-[10px] border transition-colors ${
                                    active
                                      ? fb === 'helpful'
                                        ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300'
                                        : 'border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300'
                                      : 'border-slate-200 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400'
                                  } disabled:cursor-default disabled:opacity-60`}
                                >
                                  {fb === 'helpful' ? `👍 ${t('chatbot.feedbackHelpful')}` : `👎 ${t('chatbot.feedbackNotHelpful')}`}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                    {t('chatbot.typing')}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* 입력창 */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('chatbot.inputPlaceholder')}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  disabled={sending}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('chatbot.send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
