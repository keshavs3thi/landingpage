// Builds the gallery from the photos/ folder: categories (people, places, cars) -> loose photos and
// optional project folders, plus selected.yml. Each photo's title, film stock, year and film camera
// come from its filename (format.ts parseFilename). Precedence: per-photo yml override > filename >
// category.yml/project.yml defaults > EXIF. Film photos ignore EXIF entirely (it's the scanner's).
// Duplicate slugs fail the build; everything else that's off is a warning.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import exifr from 'exifr';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';
import * as fmt from './format';
import type { Category, Photo, PhotoData, PhotoInfo, Project } from './types';

// The fixed set of categories, in sidebar order. Each is a folder under photos/.
export const CATEGORIES = [
  { slug: 'people', title: 'People' },
  { slug: 'places', title: 'Places' },
  { slug: 'cars', title: 'Cars' },
] as const;

const ROOT = join(process.cwd(), 'photos');
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 3200;

// Vite turns every source JPEG into ImageMetadata, which getImage() needs. Don't read any property of
// these objects: Astro's proxy then counts the original as used and ships it, EXIF and all.
// Dimensions come from sharp instead.
// Only the category folders: an imported image that's never used skips the resize step, so Astro
// ships it as the untouched original, EXIF and all. Must be a literal; keep in sync with CATEGORIES.
const IMAGES = import.meta.glob<ImageMetadata>('/photos/{people,places,cars}/**/*.{jpg,jpeg,JPG,JPEG}', {
  eager: true,
  import: 'default',
});

interface Overrides {
  title?: string;
  alt?: string;
  location?: string;
  subject?: string;
  medium?: 'film' | 'digital';
  film?: string;
  camera?: string;
  lens?: string;
  date?: string; // "2024" or "2024-03-01"
}

// project.yml, or category.yml for loose photos (title/order/description only apply to projects).
interface GroupYml extends Overrides {
  title?: string;
  order?: number;
  description?: string;
  photos?: Record<string, Overrides>;
}

interface CategoryRef {
  slug: string;
  title: string;
  url: string;
}

// Photos either belong to a project (photos/<category>/<project>/) or sit loose in a category folder
// (photos/<category>/). A group is one of those folders plus its yml.
interface Group {
  category: CategoryRef;
  dir: string; // path under photos/: "people/weddings" or "people"
  yml: GroupYml;
  ymlName: string; // for messages
  project?: { slug: string; title: string; description?: string; url: string };
}

const warn = (msg: string) => console.warn(`\x1b[33m[photos]\x1b[0m ${msg}`);

const isDir = (p: string) => statSync(p).isDirectory();
const list = (p: string) => (existsSync(p) ? readdirSync(p) : []);

function readYaml<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return (parseYaml(readFileSync(path, 'utf8')) ?? undefined) as T | undefined;
  } catch (e) {
    warn(`${path}: invalid YAML (${(e as Error).message.split('\n')[0]})`);
    return undefined;
  }
}

async function readExif(path: string) {
  try {
    const d = await exifr.parse(path, {
      pick: ['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'],
      reviveValues: false, // keep EXIF dates as written; no timezone conversion
    });
    return (d ?? {}) as Record<string, any>;
  } catch {
    return {};
  }
}

// Orientation-corrected size and dominant colour (shown while the image loads).
async function measure(path: string) {
  const img = sharp(path);
  const [m, { dominant: c }] = await Promise.all([img.metadata(), img.stats()]);
  const swap = (m.orientation ?? 1) >= 5;
  return {
    width: swap ? m.height : m.width,
    height: swap ? m.width : m.height,
    color: `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`,
  };
}

async function loadPhoto(g: Group, file: string): Promise<Photo | undefined> {
  const { category, yml, project } = g;
  const key = `${g.dir}/${file}`;
  const path = join(ROOT, g.dir, file);
  const image = IMAGES[`/photos/${key}`];
  if (!image) {
    warn(`${key}: not picked up as an image (only .jpg/.jpeg are supported)`);
    return undefined;
  }

  const bytes = statSync(path).size;
  if (bytes > MAX_BYTES) warn(`${key}: ${(bytes / 1048576).toFixed(1)} MB; export at 2400-3000px, quality 85-90`);
  const name = fmt.parseFilename(file);
  if (name.extra.length)
    warn(`${key}: ignored "${name.extra.join('", "')}" in the filename (after the title: film, year, camera)`);

  const own = yml.photos?.[file] ?? {};
  const film = (own.medium ?? (name.film ? 'film' : (yml.medium ?? 'digital'))) === 'film';
  // A film photo's EXIF is the scanner's, so it isn't read at all.
  const [exif, { width, height, color }] = await Promise.all([film ? {} : readExif(path), measure(path)]);
  if (Math.max(width, height) > MAX_EDGE)
    warn(`${key}: ${width}x${height}; the long edge should be about 2400-3000px`);

  const pick = <K extends keyof Overrides>(k: K, fromName?: Overrides[K]) => own[k] ?? fromName ?? yml[k];
  const date = pick('date', name.year) ?? (film ? undefined : exif.DateTimeOriginal);
  if (film && !date) warn(`${key}: film photo without a year; add one to the filename, e.g. __2024`);

  const info: PhotoInfo = {
    location: pick('location'),
    subject: pick('subject'),
    camera: pick('camera', name.camera) ?? (film ? undefined : fmt.camera(exif.Make, exif.Model)),
    lens: pick('lens') ?? (film ? undefined : exif.LensModel),
    film: film ? pick('film', name.film) : undefined,
    aperture: fmt.aperture(exif.FNumber),
    shutter: fmt.shutter(exif.ExposureTime),
    iso: fmt.iso(exif.ISO),
    date: fmt.date(date),
  };
  for (const k of Object.keys(info) as (keyof PhotoInfo)[]) if (!info[k]) delete info[k];

  const title = own.title ?? name.title;
  const year = String(date ?? '').match(/^\d{4}/)?.[0];
  return {
    key,
    file,
    slug: name.slug,
    category: category.slug,
    categoryTitle: category.title,
    categoryUrl: category.url,
    projectSlug: project?.slug,
    projectTitle: project?.title,
    projectDescription: project?.description,
    url: `${category.url}${name.slug}/`,
    projectUrl: project?.url,
    image,
    width,
    height,
    color,
    title, // a project title is not a photo title
    year,
    alt: own.alt ?? fmt.altFallback(title ?? project?.title ?? 'Photograph', info.location, year),
    info,
  };
}

async function loadGroup(g: Group): Promise<Photo[]> {
  const files = list(join(ROOT, g.dir))
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .sort(fmt.fileOrder);
  for (const f of Object.keys(g.yml.photos ?? {}))
    if (!files.includes(f)) warn(`${g.dir}/${g.ymlName}: override for "${f}", but no such file`);

  const photos = (await Promise.all(files.map((f) => loadPhoto(g, f)))).filter((p): p is Photo => !!p);

  const missingAlt = photos.filter((p) => !g.yml.photos?.[p.file]?.alt);
  if (missingAlt.length)
    warn(`${g.dir}: ${missingAlt.length} photo(s) without alt text (fallback, e.g. "${missingAlt[0].alt}")`);
  return photos;
}

async function loadProject(category: CategoryRef, slug: string): Promise<Project & { order?: number }> {
  const dir = `${category.slug}/${slug}`;
  const ymlPath = join(ROOT, dir, 'project.yml');
  const yml = readYaml<GroupYml>(ymlPath) ?? {};
  if (!existsSync(ymlPath)) warn(`${dir}: no project.yml (using the folder name as the title)`);
  if (!/^[a-z0-9-]+$/.test(slug)) warn(`${dir}: folder names become links; use lowercase letters, digits and dashes`);
  const title = yml.title ?? slug;
  const url = `${category.url}#${slug}`;

  const photos = await loadGroup({
    category,
    dir,
    yml,
    ymlName: 'project.yml',
    project: { slug, title, description: yml.description, url },
  });

  return { slug, category: category.slug, title, description: yml.description, url, photos, order: yml.order };
}

async function loadCategory(slug: string, title: string): Promise<Category> {
  const dir = join(ROOT, slug);
  const category = { slug, title, url: `/photography/${slug}/` };
  const sub = list(dir).filter((p) => !p.startsWith('.') && isDir(join(dir, p)));
  const projects = (await Promise.all(sub.map((s) => loadProject(category, s))))
    .filter((p) => p.photos.length > 0)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title))
    .map(({ order: _order, ...p }) => p);

  // Photos straight in the category folder need no project. category.yml works like project.yml for them.
  const loose = await loadGroup({
    category,
    dir: slug,
    yml: readYaml<GroupYml>(join(dir, 'category.yml')) ?? {},
    ymlName: 'category.yml',
  });

  // Every photo in a category, in a project or not, gets /photography/<category>/<slug>/.
  const photos = [...loose, ...projects.flatMap((p) => p.photos)];
  const seen = new Map<string, string>();
  for (const p of photos) {
    const prev = seen.get(p.slug);
    if (prev)
      throw new Error(`[photos] "${prev}" and "${p.key}" would both be ${p.url}. Rename one of them.`);
    seen.set(p.slug, p.key);
  }
  return { slug, title, url: category.url, loose, projects, photos };
}

async function load(): Promise<PhotoData> {
  if (!existsSync(ROOT)) warn('no photos/ folder; the gallery is empty');

  const known = new Set<string>(CATEGORIES.map((c) => c.slug));
  for (const d of list(ROOT).filter((d) => !d.startsWith('.') && isDir(join(ROOT, d)) && !known.has(d)))
    warn(`photos/${d} is not read; move its photos into ${[...known].join(', ')}`);

  const categories = await Promise.all(CATEGORIES.map((c) => loadCategory(c.slug, c.title)));

  // Case-insensitive, like Windows and macOS: "02-anele1.jpg" in selected.yml matches 02-anele1.JPG.
  const byKey = new Map(categories.flatMap((c) => c.photos).map((p) => [p.key.toLowerCase(), p]));
  const entries = readYaml<unknown>(join(ROOT, 'selected.yml'));
  if (entries === undefined) warn('photos/selected.yml is missing or empty; Featured will be empty');
  const selected: Photo[] = [];
  for (const raw of Array.isArray(entries) ? entries : []) {
    const key = String(raw).trim().replace(/^\/+|^photos\//g, '');
    const p = byKey.get(key.toLowerCase());
    if (!p) warn(`selected.yml: "${key}" not found`);
    else if (selected.includes(p)) warn(`selected.yml: "${key}" is listed twice`);
    else selected.push(p);
  }

  return { categories, selected };
}

let cached: Promise<PhotoData> | undefined;
export const loadPhotos = () => (cached ??= load());
