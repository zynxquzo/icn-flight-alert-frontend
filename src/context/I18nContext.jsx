import { useCallback, useEffect, useMemo, useState } from 'react';
import { messages } from '../i18n/messages';
import { I18nContext } from './i18n-context';

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

function applyVars(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
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

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'en' ? 'en' : 'ko';
    }
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      const fromLang = getNested(messages[lang], key);
      if (fromLang) return applyVars(fromLang, vars);
      const fallback = getNested(messages.ko, key);
      if (fallback) return applyVars(fallback, vars);
      return typeof key === 'string' ? applyVars(key, vars) : key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
