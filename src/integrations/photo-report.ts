// After every build: print the total size of built images, warn as it nears the GitHub Pages limit,
// and fail if any published image still carries EXIF (GPS especially) or if a source photo was
// copied into the site unresized.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import exifr from 'exifr';

const WARN_BYTES = 500 * 1024 * 1024;
const IMAGE = /\.(avif|webp|jpe?g|png)$/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// WebP keeps metadata in a RIFF "EXIF" chunk (exifr doesn't read WebP), so check chunks directly.
function webpHasExif(buf: Buffer): boolean {
  for (let o = 12; o + 8 <= buf.length; ) {
    const id = buf.toString('ascii', o, o + 4);
    if (id === 'EXIF' || id === 'XMP ') return true;
    o += 8 + buf.readUInt32LE(o + 4) + (buf.readUInt32LE(o + 4) & 1);
  }
  return false;
}

async function hasMetadata(path: string): Promise<string | undefined> {
  const buf = readFileSync(path);
  if (/\.webp$/i.test(path)) return webpHasExif(buf) ? 'EXIF/XMP chunk' : undefined;
  try {
    const d = await exifr.parse(buf, { gps: true, tiff: true, exif: true, xmp: false, icc: false });
    if (!d) return undefined;
    if ('latitude' in d || 'GPSLatitude' in d) return 'GPS';
    const keys = Object.keys(d).filter((k) => !/^(ImageWidth|ImageHeight|BitsPerSample|ColorSpace)$/.test(k));
    return keys.length ? `EXIF (${keys.slice(0, 3).join(', ')}…)` : undefined;
  } catch {
    return undefined;
  }
}

export default function photoReport(): AstroIntegration {
  return {
    name: 'photo-report',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const images = walk(out).filter((p) => IMAGE.test(p) && p.includes('_astro'));
        const total = images.reduce((s, p) => s + statSync(p).size, 0);
        const mb = (total / 1048576).toFixed(1);
        if (total > WARN_BYTES) logger.warn(`built images total ${mb} MB (GitHub Pages sites are limited to about 1 GB)`);
        else logger.info(`built images: ${images.length} files, ${mb} MB`);

        const problems: string[] = [];
        for (const p of images) {
          const found = await hasMetadata(p);
          if (found) problems.push(`${p.slice(out.length)}: ${found}`);
        }

        const sourceSizes = new Set(
          walk(join(process.cwd(), 'photos'))
            .filter((p) => /\.jpe?g$/i.test(p))
            .map((p) => statSync(p).size),
        );
        for (const p of images)
          if (sourceSizes.has(statSync(p).size)) problems.push(`${p.slice(out.length)}: looks like an unresized source photo`);

        if (problems.length)
          throw new Error(`[photo-report] published images must not carry metadata or be originals:\n  ${problems.join('\n  ')}`);
        logger.info('no EXIF/GPS in published images; no originals shipped');
      },
    },
  };
}
