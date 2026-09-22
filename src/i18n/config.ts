export const languages = ['de', 'en'] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = 'de';

export const languageLabel: Record<Language, string> = {
  de: 'DE',
  en: 'EN',
};

export const routes = {
  home: { de: '/', en: '/en' },
  menu: { de: '/speisekarte', en: '/en/menu' },
  about: { de: '/ueber-uns', en: '/en/about' },
  catering: { de: '/catering', en: '/en/catering' },
  contact: { de: '/kontakt', en: '/en/contact' },
  privateDining: { de: '/privat-dinning', en: '/en/private-dining' },
  giftCard: { de: '/gutschein', en: '/en/gift-card' },
  feedback: { de: '/feedback', en: '/en/feedback' },
  privacy: { de: '/datenschutz', en: '/en/privacy' },
  imprint: { de: '/impressum', en: '/en/imprint' },
  newsletter: { de: '/newsletter', en: '/en/newsletter' },
  message: { de: '/nachricht', en: '/en/message' },
} as const;

export type RouteKey = keyof typeof routes;

export const path = (key: RouteKey, language: Language): string => routes[key][language];

export const otherLanguage = (language: Language): Language => (language === 'de' ? 'en' : 'de');

export const languageFromId = (id: string): Language =>
  (id.split('/')[0] as Language) ?? defaultLanguage;

export const slugFromId = (id: string): string => id.split('/').slice(1).join('/');
