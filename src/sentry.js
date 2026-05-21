import * as Sentry from '@sentry/react';

/**
 * Sentry 초기화 (VITE_SENTRY_DSN 설정 시에만).
 * main.jsx에서 createRoot 이전에 호출합니다.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        const h = { ...event.request.headers };
        delete h.Authorization;
        delete h.authorization;
        event.request.headers = h;
      }
      return event;
    },
  });
}

export { Sentry };
