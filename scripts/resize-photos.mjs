// Shrinks oversized source photos in photos/ to web-sized JPEGs and moves the originals OUT of the
// repo, so full-resolution files never get committed (spec §8: JPEG, sRGB, ~2400-3000px, q85-90).
//
//   npm run resize-photos                      move originals to ../photo-originals/ and resize
//   npm run resize-photos -- --dry-run         only list what would change
//   npm run resize-photos -- --to <folder>     put originals somewhere else
//
// Only files over the limits are touched; running it again is safe. Each original keeps its path
// under photos/ (photos/2025/01-m4.jpg -> ../photo-originals/2025/01-m4.jpg). The resized copy keeps
// the same filename, so selected.yml and project.yml entries still match, and keeps its EXIF
// (camera, lens, exposure, date) because the build reads it. The build strips EXIF/GPS from
// everything it publishes.

import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const LONG_EDGE = 3000;
const QUALITY = 88;
const MAX_BYTES = 8 * 1024 * 1024;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const toIdx = args.indexOf('--to');
const ROOT = resolve('photos');
const ORIGINALS = resolve(toIdx >= 0 ? args[toIdx + 1] : join('..', 'photo-originals'));

if (ORIGINALS.startsWith(resolve('.') + '\\') || ORIGINALS.startsWith(resolve('.') + '/')) {
  console.error(`Originals folder ${ORIGINALS} is inside the repo; pick a folder outside it.`);
  process.exit(1);
}

async function* jpegs(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* jpegs(p);
    else if (/\.jpe?g$/i.test(e.name)) yield p;
  }
}

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
let changed = 0;
let saved = 0;

for await (const src of jpegs(ROOT)) {
  const rel = relative(ROOT, src);
  const { size } = await stat(src);
  const meta = await sharp(src).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;
  if (Math.max(w, h) <= LONG_EDGE && size <= MAX_BYTES) continue;

  const dest = join(ORIGINALS, rel);
  if (existsSync(dest)) {
    console.warn(`skip ${rel}: ${dest} already exists (move it away first so nothing is overwritten)`);
    continue;
  }
  console.log(`${dryRun ? 'would resize' : 'resize'} ${rel}: ${w}x${h}, ${mb(size)}`);
  if (dryRun) continue;

  // Write the copy first, then move the original, then put the copy in place: a failure at any
  // step leaves the original untouched or already safe in the originals folder.
  const tmp = `${src}.resizing`;
  await sharp(src)
    .autoOrient()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .withMetadata({ orientation: 1 }) // keep EXIF for the info panel; converts to sRGB
    .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(tmp);
  await mkdir(dirname(dest), { recursive: true });
  await rename(src, dest).catch(async (e) => {
    await unlink(tmp);
    throw e;
  });
  await rename(tmp, src);

  const after = (await stat(src)).size;
  saved += size - after;
  changed++;
  console.log(`  -> ${mb(after)}; original moved to ${dest}`);
}

console.log(
  dryRun
    ? 'Dry run: nothing changed.'
    : changed
      ? `Resized ${changed} photo(s), ${mb(saved)} smaller. Originals are in ${ORIGINALS}`
      : 'All photos are already within the limits.',
);
