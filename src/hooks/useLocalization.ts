// import { useState } from 'react';
// import languages from '../languages';

// function getCurrentLanguage(): keyof typeof languages {
//     const steamLang = window.LocalizationManager.m_rgLocalesToUse[0];
//     const lang = steamLang.replace(/-([a-z])/g, (_, letter: string) =>
//         letter.toUpperCase()
//     ) as keyof typeof languages;
//     return languages[lang] ? lang : 'en';
// }

// export default function useLocalization() {
//     const [lang] = useState(getCurrentLanguage());
//     return function (key: keyof typeof languages['en']): string {
//         if (languages[lang]?.[key]?.length) {
//             return languages[lang]?.[key];
//         } else if (languages.en?.[key]?.length) {
//             return languages.en?.[key];
//         } else {
//             return key;
//         }
//     };
// }
