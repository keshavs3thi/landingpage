// Turns a full-size transparent render into the web-sized WebPs the hero shows (spec §8).
//
//   npm run optimize-render -- laptop     reads renders-src/laptop.png, writes public/renders/laptop.webp
//                                         and public/renders/laptop-800.webp
//
// renders-src/ is gitignored, so originals never get committed. The id is the project's id in
// src/data/projects.ts. Afterwards, set that project's `image`, `width` and `height` to the printed values.

import { existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const LONG_EDGE = 1500;
const SMALL_EDGE = 800;
const MIN_SOURCE_EDGE = 1400;
const PADDING = 0.06; // transparent margin on each side, as a fraction of the long edge
const ALPHA_FLOOR = 8; // alpha at or below this counts as empty, so stray render noise can't widen the trim
const WARN_BYTES = 300 * 1024;
const WEBP = { quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true };

const id = process.argv[2];
if (!id || id.startsWith('-')) {
  console.error('Usage: npm run optimize-render -- <project-id>   (reads renders-src/<project-id>.png)');
  process.exit(1);
}
const input = join('renders-src', `${id}.png`);
if (!existsSync(input)) {
  console.error(`${input} not found. Export the render as a transparent PNG with that name.`);
  process.exit(1);
}

const meta = await sharp(input).metadata();
if (!meta.hasAlpha) {
  console.error(`${input} has no alpha channel. Re-render with a transparent background.`);
  process.exit(1);
}
if (Math.max(meta.width, meta.height) < MIN_SOURCE_EDGE) {
  console.warn(`Source is only ${meta.width}x${meta.height}; aim for a long edge of ${MIN_SOURCE_EDGE}px or more.`);
}

// Bounding box of the visible pixels, and whether any of them touch the frame.
const { data: alpha, info } = await sharp(input).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
let left = w, right = -1, top = h, bottom = -1;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (alpha[y * w + x] <= ALPHA_FLOOR) continue;
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
}
if (right < 0) {
  console.error(`${input} is fully transparent.`);
  process.exit(1);
}
if (left === 0 && right === w - 1 && top === 0 && bottom === h - 1) {
  console.error(`${input} has visible pixels on all four edges, so it has no real transparency. Re-render it.`);
  process.exit(1);
}
if (left === 0 || top === 0 || right === w - 1 || bottom === h - 1) {
  console.warn('Visible pixels touch the image edge, so the object may be cropped. Check the camera framing.');
}

// Trim to the object, then add the same margin to every render so they sit alike in their frames.
// The margin scales with the object, because a small source is never enlarged to fill LONG_EDGE.
const inner = Math.round(LONG_EDGE * (1 - PADDING * 2));
const { data: trimmed, info: object } = await sharp(input)
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize({ width: inner, height: inner, fit: 'inside', withoutEnlargement: true })
  .png()
  .toBuffer({ resolveWithObject: true });
const pad = Math.round((Math.max(object.width, object.height) * PADDING) / (1 - PADDING * 2));
const master = await sharp(trimmed)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const dir = join('public', 'renders');
await mkdir(dir, { recursive: true });
const large = join(dir, `${id}.webp`);
const small = join(dir, `${id}-${SMALL_EDGE}.webp`);
const { width, height } = await sharp(master).webp(WEBP).toFile(large);
await sharp(master)
  .resize({ width: SMALL_EDGE, height: SMALL_EDGE, fit: 'inside', withoutEnlargement: true })
  .webp(WEBP)
  .toFile(small);

const kb = (b) => `${Math.round(b / 1024)}KB`;
const [largeSize, smallSize] = [(await stat(large)).size, (await stat(small)).size];
console.log(`${input} (${meta.width}x${meta.height}) -> ${large} (${kb(largeSize)}), ${small} (${kb(smallSize)})`);
if (largeSize > WARN_BYTES) console.warn(`Over ${kb(WARN_BYTES)}; heavy for the mobile performance target.`);
console.log(`\nIn src/data/projects.ts:\n  image: '/renders/${id}.webp',\n  width: ${width},\n  height: ${height},`);
