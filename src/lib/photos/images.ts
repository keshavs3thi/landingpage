// Responsive image sets for the gallery, generated at build time by Astro's sharp service
// (which auto-rotates, converts to sRGB and drops all metadata, EXIF/GPS included).
// Astro's <Picture> uses one quality for every format, so sets are built per format here.

import { getImage } from 'astro:assets';
import type { Photo } from './types';

// Tune against real photos (dark scenes, film grain) before locking in. See spec §9.
export const QUALITY = { avif: 58, webp: 80, jpeg: 82 } as const;
export const GRID_WIDTHS = [600, 1000, 1400];
export const VIEWER_WIDTHS = [1600, 2400];
export const OG_WIDTH = 1600;

export { GRID_SIZES, VIEWER_SIZES } from './render';

export interface ImageSet {
  avif: string;
  webp: string;
  jpeg: string;
  fallback: string; // largest JPEG, for <img src>
}

const FORMATS = ['avif', 'webp', 'jpeg'] as const;

// Never upscale: drop widths above the source, and include the source width if all were dropped.
function widthsFor(photo: Photo, widths: number[]) {
  const fit = widths.filter((w) => w <= photo.width);
  return fit.length ? fit : [photo.width];
}

async function build(photo: Photo, widths: number[]): Promise<ImageSet> {
  const ws = widthsFor(photo, widths);
  const set = {} as ImageSet;
  for (const format of FORMATS) {
    const out = await Promise.all(
      ws.map((width) => getImage({ src: photo.image, width, format, quality: QUALITY[format] })),
    );
    set[format] = out.map((img, i) => `${img.src} ${ws[i]}w`).join(', ');
    if (format === 'jpeg') set.fallback = out[out.length - 1].src;
  }
  return set;
}

const memo = new Map<string, Promise<ImageSet>>();
const cached = (key: string, make: () => Promise<ImageSet>) => {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key)!;
};

export const gridSet = (p: Photo) => cached(`g:${p.key}`, () => build(p, GRID_WIDTHS));
export const viewerSet = (p: Photo) => cached(`v:${p.key}`, () => build(p, VIEWER_WIDTHS));

export async function ogImage(p: Photo) {
  const width = Math.min(OG_WIDTH, p.width);
  const img = await getImage({ src: p.image, width, format: 'jpeg', quality: QUALITY.jpeg });
  return { src: img.src, width, height: Math.round((width * p.height) / p.width) };
}
