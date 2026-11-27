import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en, type MessageKey } from './en';
import { nb } from './nb';

export type Lang = 'en' | 'nb';
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nb', label: 'Norsk (bokmål)' },
];
const DICTS: Record<Lang, Record<MessageKey, string>> = { en, nb };
const LANG_KEY = 'cobberdog:lang';

/** Bilingual content text. Missing translations fall back to English. */
export type L = { en: string; nb?: string };
export const pick = (text: L, lang: Lang) => (lang === 'nb' && text.nb) || text.en;

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'nb') return saved;
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  return /^(nb|no|nn)\b/.test(nav) ? 'nb' : 'en';
}

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** BCP-47 locale for date/number formatting. */
export const localeFor = (lang: Lang) => (lang === 'nb' ? 'nb-NO' : undefined);

interface I18n {
  lang: Lang;
  setLang(l: Lang): void;
  t(key: MessageKey, vars?: Record<string, string | number>): string;
  locale: string | undefined;
}
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
  }, []);
  const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t, locale: localeFor(lang) }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n must be used inside I18nProvider');
  return c;
}
export type { MessageKey };
