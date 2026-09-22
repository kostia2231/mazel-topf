import type { APIRoute } from 'astro';
import { isCanonicalHost } from '../data/seo';

export const GET: APIRoute = ({ site }) => {
  const indexable = isCanonicalHost(site);

  const lines = indexable
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
      ]
    : ['User-agent: *', 'Disallow: /'];

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
