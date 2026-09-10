import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

type Locale = 'en' | 'es';
export type Dictionary = typeof en;
export type TranslationFunction = (key: keyof Dictionary, params?: Record<string, string | number>) => string;

const dictionaries = { en, es };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);
const LOCALE_STORAGE_KEY = 'brew-profile-locale-v1';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((val) => {
      if (val === 'en' || val === 'es') setLocaleState(val);
      setHydrated(true);
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  const t: TranslationFunction = (key, params) => {
    let str = dictionaries[locale][key] || dictionaries.en[key] || key;
    if (params) {
      Object.keys(params).forEach(k => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
      });
    }
    return str;
  };

  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);

  if (!hydrated) return null;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
