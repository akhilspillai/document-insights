import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { languages, defaultLanguage, getTranslations } from './index.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('lang') || defaultLanguage;
    } catch {
      return defaultLanguage;
    }
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const translations = useMemo(() => getTranslations(language), [language]);

  const t = useCallback((key, vars) => {
    let text = translations[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replaceAll(`{{${k}}}`, v);
      });
    }
    return text;
  }, [translations]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    languages,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
