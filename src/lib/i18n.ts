/**
 * Tiny dependency-free i18n. The source language is German (the key IS the German
 * string, gettext-style), so any string not yet translated falls back to readable
 * German rather than a missing-key marker — which lets us roll translations out
 * incrementally without ever showing broken text.
 *
 * Default language = the system language (navigator), overridable in Settings and
 * persisted in localStorage (a language code is not sensitive and is needed before
 * the vault is unlocked, for the lock screen).
 */
import { useSyncExternalStore } from 'react';
import { dicts } from './locales';

export const LANGS = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'zh', name: '中文' },
] as const;

export type Lang = (typeof LANGS)[number]['code'];
const SUPPORTED = new Set<string>(LANGS.map((l) => l.code));
const STORAGE_KEY = 'scytale-lang';

function detect(): Lang {
  try {
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const p of prefs) {
      const primary = p.toLowerCase().split('-')[0];
      if (SUPPORTED.has(primary)) return primary as Lang;
    }
  } catch {
    /* no navigator (tests) */
  }
  return 'en'; // system language not among the 12 → English is the friendlier default
}

let current: Lang = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.has(saved)) return saved as Lang;
  } catch {
    /* storage blocked */
  }
  return detect();
})();

const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang): void {
  if (!SUPPORTED.has(l) || l === current) return;
  current = l;
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    /* ignore */
  }
  try {
    document.documentElement.lang = l;
  } catch {
    /* no document */
  }
  for (const fn of listeners) fn();
}

/**
 * Translate a German source string into the current language. Unknown/untranslated
 * keys fall back to the German source. `vars` fills `{name}` placeholders.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let s = current === 'de' ? key : dicts[current]?.[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Subscribe a component to language changes so it re-renders when the user switches. */
export function useLang(): Lang {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
