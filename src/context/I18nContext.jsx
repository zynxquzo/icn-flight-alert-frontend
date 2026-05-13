import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { messages } from '../i18n/messages';

const I18nContext = createContext(null);

const STORAGE_KEY = 'icn_flight_alert_lang';

function getNested(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return s === 'en' ? 'en' : 'ko';
  });

  const setLang = useCallback((next) => {
    const l = next === 'en' ? 'en' : 'ko';
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key) => {
      const fromLang = getNested(messages[lang], key);
      if (fromLang) return fromLang;
      const fallback = getNested(messages.ko, key);
      return fallback ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (ctx == null) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
