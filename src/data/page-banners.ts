import type { ImageMetadata } from 'astro';
import type { RouteKey } from '../i18n/config';
import imprintBanner from '../assets/imprint-banner-terrace.webp';
import privacyBanner from '../assets/privacy-banner-candle.webp';

export const pageBanners: Partial<Record<RouteKey, ImageMetadata>> = {
  imprint: imprintBanner,
  privacy: privacyBanner,
};
