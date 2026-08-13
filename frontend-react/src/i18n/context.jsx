import { createContext, useContext, useState, useEffect } from 'react';
import es from './translations/es.js';

const I18nContext = createContext();
const LANG_KEY = 'invisia_lang';

function loadLang() {
  return 'es';
}

function saveLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
}

function isValidFallback(v) {
  return typeof v === 'string' || typeof v === 'number' || v === null || v === undefined;
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(loadLang);
  const [dict, setDict] = useState(es);

  useEffect(() => {
    if (lang === 'es') { setDict(es); return; }
    import('./translations/en.js').then(m => setDict(m.default || m)).catch(() => setDict(es));
  }, [lang]);

  const t = (key, fallback) => {
    if (!key) return isValidFallback(fallback) ? (fallback || '') : '';
    const parts = key.split('.');
    let val = dict;
    for (const p of parts) {
      if (val && typeof val === 'object' && val !== null) val = val[p];
      else return isValidFallback(fallback) ? (fallback || parts[parts.length - 1]) : parts[parts.length - 1];
    }
    if (val !== undefined && val !== null) return val;
    return isValidFallback(fallback) ? (fallback || parts[parts.length - 1]) : parts[parts.length - 1];
  };

  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es';
    setLang(next);
    saveLang(next);
  };

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export default I18nContext;
