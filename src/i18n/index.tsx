import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import uz from './uz';
import ru from './ru';
import en from './en';

export type Language = 'uz' | 'ru' | 'en';
export type TranslationKey = string;

const dictionaries = { uz, ru, en };

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  get: <T = unknown>(key: TranslationKey) => T;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readKey(source: unknown, key: string): unknown {
  return key.split('.').reduce((acc: any, part) => acc?.[part], source as any);
}

function interpolate(value: string, params?: Record<string, string | number>) {
  if (!params) return value;
  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('savdolab-language');
    return stored === 'ru' || stored === 'en' || stored === 'uz' ? stored : 'uz';
  });

  useEffect(() => {
    localStorage.setItem('savdolab-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const get = <T = unknown,>(key: TranslationKey) => {
      const translated = readKey(dictionaries[language], key);
      const fallback = readKey(dictionaries.uz, key);
      return (translated ?? fallback) as T;
    };

    const t = (key: TranslationKey, params?: Record<string, string | number>) => {
      const translated = get(key);
      const fallback = readKey(dictionaries.uz, key);
      const value = typeof translated === 'string' ? translated : typeof fallback === 'string' ? fallback : key;
      return interpolate(value, params);
    };

    return {
      language,
      setLanguage: setLanguageState,
      t,
      get,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
