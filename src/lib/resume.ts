import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../data/site';

const inPublic = (path: string) => existsSync(join(process.cwd(), 'public', path));

// True once the resume PDF is in public/. Gates the nav link, download button and sitemap entry
// so nothing points at a 404.
export function hasResumePdf(): boolean {
  return inPublic(SITE.resumeHref);
}

// Root-relative path of an entry's logo (public/logos/<id>.svg, else .png), or undefined until
// the file is supplied.
export function logoSrc(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return ['svg', 'png'].map((ext) => `/logos/${id}.${ext}`).find(inPublic);
}
