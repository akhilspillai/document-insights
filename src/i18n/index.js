import en from './en.json';
import hi from './hi.json';

export const languages = {
  en: { label: 'English', nativeLabel: 'English', translations: en },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी', translations: hi },
};

export const defaultLanguage = 'en';

export function getTranslations(lang) {
  return languages[lang]?.translations || languages[defaultLanguage].translations;
}
