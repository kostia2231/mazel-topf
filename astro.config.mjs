import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Cormorant Infant',
      cssVariable: '--font-cormorant-infant',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'block',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Nunito',
      cssVariable: '--font-nunito',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'block',
      fallbacks: ['Segoe UI', 'system-ui', 'sans-serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
