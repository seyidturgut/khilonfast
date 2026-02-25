import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly for now, or use backends if files grow large
import trCommon from './locales/tr/common.json';
import enCommon from './locales/en/common.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            tr: { common: trCommon },
            en: { common: enCommon }
        },
        supportedLngs: ['tr', 'en'],
        load: 'languageOnly',
        cleanCode: true,
        fallbackLng: 'tr',
        ns: ['common'],
        defaultNS: 'common',
        react: {
            useSuspense: false
        },
        interpolation: {
            escapeValue: false
        },
        detection: {
            // URL locale is synchronized in App.tsx; do not parse non-locale TR slugs as language.
            order: ['localStorage', 'cookie', 'navigator']
        }
    });

export default i18n;
