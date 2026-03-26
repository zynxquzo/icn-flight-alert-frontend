import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { fetchChatbotInfo, sendChatMessage } from '../api/chatbot';
import { getApiErrorMessage } from '../utils/apiError';

const TERMINALS = [
  { value: 'T1', label: '제1여객터미널 (T1)' },
  { value: 'T2', label: '제2여객터미널 (T2)' },
];

function ChatbotPage() {
  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState('');
  const [terminal, setTerminal] = useState('T1');
  const [waitHours, setWaitHours] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">공항 안내 챗봇</h1>
          <p className="text-gray-600 mt-1 text-sm">
            대기 시간 동안 식사·쇼핑·휴식 등 인천공항 이용 팁을 물어보세요. 백엔드{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">POST /chatbot/chat</code>과 연동됩니다.
          </p>
          {infoError && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {infoError}
            </p>
          )}
          {info?.features && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {info.features.map((f) => (
                <li
                  key={f}
                  className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100"
                >
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow flex flex-col h-[min(560px,calc(100vh-280px))]">
          <div className="border-b border-gray-100 p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cb-terminal" className="block text-xs font-medium text-gray-500 mb-1">
                  터미널
                </label>
                <select
                  id="cb-terminal"
                  value={terminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {TERMINALS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cb-wait" className="block text-xs font-medium text-gray-500 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              대기 시간을 넣으면 그에 맞춘 추천에 도움이 됩니다. 비워 두면 일반 질문만 전달됩니다.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80">
            {messages.length === 0 && !sending && (
              <p className="text-center text-gray-500 text-sm py-12">
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
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : m.isError
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 text-sm text-gray-500">
                  답변 작성 중…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={sending}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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

export default ChatbotPage;
