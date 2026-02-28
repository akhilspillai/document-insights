import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';
import kn from './kn.json';
import ml from './ml.json';
import mr from './mr.json';

export const languages = {
  en: { label: 'English', nativeLabel: 'English', translations: en },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी', translations: hi },
  ta: { label: 'Tamil', nativeLabel: 'தமிழ்', translations: ta },
  te: { label: 'Telugu', nativeLabel: 'తెలుగు', translations: te },
  kn: { label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', translations: kn },
  ml: { label: 'Malayalam', nativeLabel: 'മലയാളം', translations: ml },
  mr: { label: 'Marathi', nativeLabel: 'मराठी', translations: mr },
};

export const defaultLanguage = 'en';

export function getTranslations(lang) {
  return languages[lang]?.translations || languages[defaultLanguage].translations;
}
