import type { ImageMetadata } from 'astro';
import grilledLamb from '../assets/dish-grilled-lamb.webp';
import drShawarma from '../assets/dish-dr-shawarma.webp';
import jerusalemGrill from '../assets/dish-jerusalem-grill.webp';

export const dishImages: Record<string, ImageMetadata> = {
  'grilled-lamb': grilledLamb,
  'dr-shawarma': drShawarma,
  'jerusalem-grill': jerusalemGrill,
};

export const carouselKeys = ['grilled-lamb', 'dr-shawarma', 'jerusalem-grill'] as const;
