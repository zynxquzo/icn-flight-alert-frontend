import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/Badge';
import { fetchChatbotInfo, sendChatMessage } from '../api/chatbot';
import { getApiErrorMessage } from '../utils/apiError';

/** 같은 탭에서만 유지. 탭을 닫으면 브라우저가 sessionStorage를 비움 */
const CHATBOT_SESSION_KEY = 'icn-flight-alert-chatbot';
const CHATBOT_SESSION_VERSION = 1;
/** 마지막 저장 이후 이 시간이 지나면 대화·설정 초기화 */
const CHATBOT_SESSION_IDLE_MS = 30 * 60 * 1000;
const IDLE_CHECK_MS = 60 * 1000;

function loadChatbotSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CHATBOT_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.v !== CHATBOT_SESSION_VERSION || !Array.isArray(data.messages)) {
      sessionStorage.removeItem(CHATBOT_SESSION_KEY);
      return null;
    }
    const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
    if (Date.now() - updatedAt > CHATBOT_SESSION_IDLE_MS) {
      sessionStorage.removeItem(CHATBOT_SESSION_KEY);
      return null;
    }
    return {
      terminal: typeof data.terminal === 'string' ? data.terminal : 'T1',
      waitHours: typeof data.waitHours === 'string' ? data.waitHours : '',
      messages: data.messages,
      updatedAt,
    };
  } catch {
    return null;
  }
}

function persistChatbotSession(terminal, waitHours, messages) {
  if (typeof window === 'undefined') return Date.now();
  const now = Date.now();
  try {
    sessionStorage.setItem(
      CHATBOT_SESSION_KEY,
      JSON.stringify({
        v: CHATBOT_SESSION_VERSION,
        updatedAt: now,
        terminal,
        waitHours,
        messages,
      }),
    );
  } catch {
    // 저장 공간 부족·비공개 모드 등
  }
  return now;
}

function clearChatbotSessionStorage() {
  try {
    sessionStorage.removeItem(CHATBOT_SESSION_KEY);
  } catch {
    // ignore
  }
}

const TERMINALS = [
  { value: 'T1', label: '제1여객터미널 (T1)' },
  { value: 'T2', label: '제2여객터미널 (T2)' },
];

const EXAMPLES = [
  {
    label: '1시간 대기',
    text: '1시간 정도 남았는데 게이트 근처에서 할 만한 게 뭐가 있을까?',
    hours: 1,
  },
  {
    label: '2시간 대기',
    text: '2시간 여유가 있는데 식사하고 쇼핑하기 좋은 코스 추천해줘.',
    hours: 2,
  },
  {
    label: '3시간 대기',
    text: '3시간 기다려야 하는데 뭐하면 좋을까요?',
    hours: 3,
  },
];

function modeLabel(mode) {
  const m = String(mode || '').toLowerCase();
  if (m === 'agent') return 'AGENT';
  if (m === 'rag') return 'RAG';
  return 'LEGACY';
}

function getInitialChatbotSessionState() {
  const s = loadChatbotSession();
  return {
    terminal: s?.terminal ?? 'T1',
    waitHours: s?.waitHours ?? '',
    messages: s?.messages ?? [],
    persistedAt: s?.updatedAt ?? Date.now(),
  };
}

export default function ChatbotPage() {
  const initialSessionRef = useRef(null);
  if (initialSessionRef.current === null) {
    initialSessionRef.current = getInitialChatbotSessionState();
  }
  const initial = initialSessionRef.current;

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState('');
  const [terminal, setTerminal] = useState(initial.terminal);
  const [waitHours, setWaitHours] = useState(initial.waitHours);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initial.messages);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastPersistedAtRef = useRef(initial.persistedAt);
  const skipInitialPersistRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchChatbotInfo();
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) setInfoError(getApiErrorMessage(e, '챗봇 정보를 불러오지 못했습니다.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }
    const now = persistChatbotSession(terminal, waitHours, messages);
    lastPersistedAtRef.current = now;
  }, [terminal, waitHours, messages]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() - lastPersistedAtRef.current < CHATBOT_SESSION_IDLE_MS) return;
      clearChatbotSessionStorage();
      lastPersistedAtRef.current = Date.now();
      setMessages([]);
      setTerminal('T1');
      setWaitHours('');
    }, IDLE_CHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const applyExample = (ex) => {
    setInput(ex.text);
    setWaitHours(String(ex.hours));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setSending(true);

    try {
      const data = await sendChatMessage({
        message: text,
        terminal,
        wait_time_hours: waitHours === '' ? null : waitHours,
      });
      const reply = data?.response ?? '(응답 없음)';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          mode: data?.mode,
          sources: Array.isArray(data?.sources) ? data.sources : [],
        },
      ]);
    } catch (err) {
      const msg = getApiErrorMessage(err, '챗봇 응답을 받지 못했습니다.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `오류: ${msg}`, isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">공항 안내 챗봇</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            대기 시간 동안 식사·쇼핑·휴식 등 인천공항 이용 팁을 물어보세요.{' '}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">POST /chatbot/chat</code>
            과 연동됩니다.
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
                환경 변수 안내 (운영·관리자 참고)
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

        <div className="flex h-[min(560px,calc(100vh-280px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">빠른 질문</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => applyExample(ex)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cb-terminal" className="mb-1 block text-xs font-medium text-slate-500">
                  터미널
                </label>
                <select
                  id="cb-terminal"
                  value={terminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {TERMINALS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cb-wait" className="mb-1 block text-xs font-medium text-slate-500">
                  대기 시간 (시간, 선택)
                </label>
                <input
                  id="cb-wait"
                  type="number"
                  min={0}
                  max={24}
                  step={1}
                  placeholder="예: 3"
                  value={waitHours}
                  onChange={(e) => setWaitHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              대기 시간을 넣으면 그에 맞춘 추천에 도움이 됩니다. 비워 두면 일반 질문만 전달됩니다.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              이 탭에서만 대화가 저장됩니다. 탭을 닫거나 {CHATBOT_SESSION_IDLE_MS / 60000}분 동안 변화가 없으면 대화가 초기화됩니다.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/90 p-4 dark:bg-slate-950/40">
            {messages.length === 0 && !sending && (
              <p className="py-12 text-center text-sm text-slate-500">
                예: &quot;2시간 기다리는데 가볼 만한 곳 있어?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
                          <li className="font-medium text-slate-500 dark:text-slate-400">근거 문서</li>
                          {m.sources.map((s, j) => (
                            <li key={s.doc_id || j}>
                              {s.source_url ? (
                                <a
                                  href={s.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400"
                                >
                                  {s.title || s.doc_id || '링크'}
                                </a>
                              ) : (
                                <span>{s.title || s.doc_id}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                  답변 작성 중…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                disabled={sending}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                보내기
              </button>
            </div>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
