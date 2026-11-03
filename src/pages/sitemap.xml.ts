// sitemap.xml: landing, stub pages, and every photography list and photo URL.
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { loadPhotos } from '../lib/photos/load';
import { esc } from '../lib/photos/render';
import { hasResumePdf } from '../lib/resume';
import { withBase } from '../lib/url';
import { getWorkshop } from '../lib/workshop';

export const GET: APIRoute = async ({ site }) => {
  const { categories } = await loadPhotos();
  const workshop = SITE.showWorkshop ? await getWorkshop() : [];
  const paths = [
    '/',
    ...(SITE.showAbout ? ['/about/'] : []),
    ...(hasResumePdf() ? ['/resume/'] : []),
    ...(SITE.showWorkshop ? ['/workshop/', ...workshop.flatMap((w) => w.url ?? [])] : []),
    '/photography/',
    ...categories.flatMap((c) => [c.url, ...c.photos.map((ph) => ph.url)]),
  ];
  const urls = paths.map((p) => `  <url><loc>${esc(new URL(withBase(p), site).href)}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
