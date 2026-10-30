// File: lib/i18n/language-context.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries, type Dictionary } from './dictionaries';

type Language = 'ar' | 'en';
const STORAGE_KEY = 'reviewfox-lang';

interface LanguageContextValue {
  language: Language;
  dir: 'rtl' | 'ltr';
  t: Dictionary;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const initial: Language =
      stored === 'en' || stored === 'ar'
        ? stored
        : navigator.language?.toLowerCase().startsWith('ar')
          ? 'ar'
          : 'en';
    setLanguageState(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.documentElement.classList.toggle('font-cairo', language === 'ar');
    document.documentElement.classList.toggle('font-inter', language === 'en');
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);
  const toggleLanguage = useCallback(
    () => setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar')),
    []
  );

  const value: LanguageContextValue = {
    language,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    t: dictionaries[language],
    setLanguage,
    toggleLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
