// Prints what the gallery will read from each photo's filename (title, film, year, camera, URL),
// so renames can be checked without a full build. Reads photos/<category>/ and its project folders.
// Usage: npm run photo-names

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileOrder, parseFilename } from '../src/lib/photos/format.ts';

const ROOT = 'photos';
const CATEGORIES = ['people', 'places', 'cars']; // keep in sync with CATEGORIES in src/lib/photos/load.ts
const isJpeg = (f) => /\.jpe?g$/i.test(f);
const ls = (p) => (existsSync(p) ? readdirSync(p) : []);

for (const d of ls(ROOT))
  if (statSync(join(ROOT, d)).isDirectory() && !CATEGORIES.includes(d))
    console.log(`! photos/${d}/ is not read; move its photos into ${CATEGORIES.join(', ')}`);

for (const cat of CATEGORIES) {
  const dir = join(ROOT, cat);
  const groups = [['', ls(dir).filter(isJpeg)]];
  for (const sub of ls(dir).filter((s) => statSync(join(dir, s)).isDirectory()))
    groups.push([`${sub}/`, ls(join(dir, sub)).filter(isJpeg)]);

  console.log(`\n${cat}/`);
  const seen = new Map();
  for (const [prefix, files] of groups)
    for (const file of files.sort(fileOrder)) {
      const n = parseFilename(file);
      const fields = [
        n.title ? `"${n.title}"` : '(untitled)',
        n.film && `film: ${n.film}`,
        n.year && `year: ${n.year}`,
        n.camera && `camera: ${n.camera}`,
      ].filter(Boolean);
      const url = `/photography/${cat}/${n.slug}/`;
      const notes = [
        n.film && !n.year && 'film without a year',
        n.extra.length && `ignored: ${n.extra.join(', ')}`,
        seen.has(n.slug) && `same URL as ${seen.get(n.slug)}`,
      ].filter(Boolean);
      seen.set(n.slug, prefix + file);
      console.log(`  ${prefix}${file}\n    ${fields.join(' · ')}  ${url}${notes.length ? `  ! ${notes.join('; ')}` : ''}`);
    }
}
