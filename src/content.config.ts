import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { routes } from './i18n/config';

const routeKeys = Object.keys(routes) as [keyof typeof routes, ...Array<keyof typeof routes>];

const dish = z.object({
  name: z.string(),
  key: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  priceText: z.string().optional(),
  tags: z.array(z.string()).default([]),
  variantsNote: z.string().optional(),
  variants: z
    .array(z.object({ name: z.string(), price: z.number() }))
    .default([]),
});

const menu = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/menu' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    group: z.enum(['lunch-special', 'set-menus', 'menu']).default('menu'),
    note: z.string().optional(),
    dishes: z.array(dish).default([]),
    menus: z
      .array(
        z.object({
          label: z.string(),
          name: z.string(),
          priceText: z.string(),
          courses: z.array(
            z.object({ title: z.string(), description: z.string().optional() }),
          ),
        }),
      )
      .default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    intro: z.string().optional(),
    route: z.enum(routeKeys),
  }),
});

export const collections = { menu, pages };
