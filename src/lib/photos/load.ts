// Builds the gallery from the photos/ folder: years -> (projects and/or loose photos), plus selected.yml.
// EXIF is read from each source file, then project.yml/year.yml defaults and per-photo overrides win.
// Duplicate slugs fail the build; everything else that's off is a warning.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import exifr from 'exifr';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';
import * as fmt from './format';
import type { Photo, PhotoData, PhotoInfo, Project, Year } from './types';

const ROOT = join(process.cwd(), 'photos');
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 3200;

// Vite turns every source JPEG into ImageMetadata, which getImage() needs. Don't read any property of
// these objects: Astro's proxy then counts the original as used and ships it, EXIF and all.
// Dimensions come from sharp instead.
const IMAGES = import.meta.glob<ImageMetadata>('/photos/**/*.{jpg,jpeg,JPG,JPEG}', {
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
  date?: string;
}

// project.yml, or year.yml for loose photos (title/order/description only apply to projects).
interface GroupYml extends Overrides {
  title?: string;
  order?: number;
  description?: string;
  photos?: Record<string, Overrides>;
}

// Photos either belong to a project (photos/<year>/<project>/) or sit loose in a year folder
// (photos/<year>/). A group is one of those folders plus its yml.
interface Group {
  year: string;
  dir: string; // path under photos/: "2025/harbor-walk" or "2025"
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
  const { year, yml, project } = g;
  const key = `${g.dir}/${file}`;
  const path = join(ROOT, g.dir, file);
  const image = IMAGES[`/photos/${key}`];
  if (!image) {
    warn(`${key}: not picked up as an image (only .jpg/.jpeg are supported)`);
    return undefined;
  }

  const bytes = statSync(path).size;
  if (bytes > MAX_BYTES) warn(`${key}: ${(bytes / 1048576).toFixed(1)} MB; export at 2400-3000px, quality 85-90`);
  const [exif, { width, height, color }] = await Promise.all([readExif(path), measure(path)]);
  if (Math.max(width, height) > MAX_EDGE)
    warn(`${key}: ${width}x${height}; the long edge should be about 2400-3000px`);

  const own = yml.photos?.[file] ?? {};
  const o = { ...yml, photos: undefined, ...own } as Overrides;
  const medium = o.medium ?? 'digital';
  const slug = fmt.slugFromFile(file);
  const yearUrl = `/photography/${year}/`;

  const info: PhotoInfo = {
    location: o.location,
    subject: o.subject,
    camera: o.camera ?? fmt.camera(exif.Make, exif.Model),
    lens: o.lens ?? exif.LensModel,
    film: medium === 'film' ? o.film : undefined,
    aperture: fmt.aperture(exif.FNumber),
    shutter: fmt.shutter(exif.ExposureTime),
    iso: fmt.iso(exif.ISO),
    // A film scan's EXIF date is the scan date, so film shows a date only when set in the yml.
    date: fmt.date(o.date ?? (medium === 'film' ? undefined : exif.DateTimeOriginal)),
  };
  for (const k of Object.keys(info) as (keyof PhotoInfo)[]) if (!info[k]) delete info[k];

  return {
    key,
    file,
    slug,
    year,
    projectSlug: project?.slug,
    projectTitle: project?.title,
    projectDescription: project?.description,
    url: `${project?.url ?? yearUrl}${slug}/`,
    projectUrl: project?.url,
    yearUrl,
    image,
    width,
    height,
    color,
    title: own.title, // a project title is not a photo title
    alt: own.alt ?? fmt.altFallback(own.title ?? project?.title ?? 'Photograph', info.location, year),
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

  const seen = new Map<string, string>();
  for (const p of photos) {
    const prev = seen.get(p.slug);
    if (prev)
      throw new Error(
        `[photos] ${g.dir}: "${prev}" and "${p.file}" both map to the URL slug "${p.slug}". Rename one of them.`,
      );
    seen.set(p.slug, p.file);
  }

  const missingAlt = photos.filter((p) => !g.yml.photos?.[p.file]?.alt);
  if (missingAlt.length)
    warn(`${g.dir}: ${missingAlt.length} photo(s) without alt text (fallback, e.g. "${missingAlt[0].alt}")`);
  return photos;
}

async function loadProject(year: string, slug: string): Promise<Project & { order?: number }> {
  const ymlPath = join(ROOT, year, slug, 'project.yml');
  const yml = readYaml<GroupYml>(ymlPath) ?? {};
  if (!existsSync(ymlPath)) warn(`${year}/${slug}: no project.yml (using the folder name as the title)`);
  if (!/^[a-z0-9-]+$/.test(slug)) warn(`${year}/${slug}: folder names become URLs; use lowercase letters, digits and dashes`);
  const title = yml.title ?? slug;
  const url = `/photography/${year}/${slug}/`;

  const photos = await loadGroup({
    year,
    dir: `${year}/${slug}`,
    yml,
    ymlName: 'project.yml',
    project: { slug, title, description: yml.description, url },
  });
  if (photos.length && !yml.description) warn(`${year}/${slug}: no description in project.yml`);

  return { slug, year, title, description: yml.description, url, photos, order: yml.order };
}

async function loadYear(year: string): Promise<Year | undefined> {
  const dir = join(ROOT, year);
  const slugs = list(dir).filter((p) => !p.startsWith('.') && isDir(join(dir, p)));
  const projects = (await Promise.all(slugs.map((s) => loadProject(year, s))))
    .filter((p) => p.photos.length > 0)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title))
    .map(({ order: _order, ...p }) => p);

  // Photos straight in the year folder need no project. year.yml works like project.yml for them.
  const loose = await loadGroup({
    year,
    dir: year,
    yml: readYaml<GroupYml>(join(dir, 'year.yml')) ?? {},
    ymlName: 'year.yml',
  });

  // Loose photos and projects share the /photography/<year>/<name>/ URL space.
  const projectSlugs = new Set(projects.map((p) => p.slug));
  for (const p of loose)
    if (projectSlugs.has(p.slug))
      throw new Error(
        `[photos] ${year}: photo "${p.file}" and project folder "${p.slug}" would share the URL /photography/${year}/${p.slug}/. Rename one of them.`,
      );

  if (!projects.length && !loose.length) return undefined;
  return {
    year,
    url: `/photography/${year}/`,
    projects,
    loose,
    photos: [...projects.flatMap((p) => p.photos), ...loose],
  };
}

async function load(): Promise<PhotoData> {
  if (!existsSync(ROOT)) {
    warn('no photos/ folder; the gallery is empty');
    return { years: [], selected: [] };
  }

  const yearNames = list(ROOT)
    .filter((y) => /^\d{4}$/.test(y) && isDir(join(ROOT, y)))
    .sort((a, b) => Number(b) - Number(a));
  const years = (await Promise.all(yearNames.map(loadYear))).filter((y): y is Year => !!y);

  // Case-insensitive, like Windows and macOS: "02-anele1.jpg" in selected.yml matches 02-anele1.JPG.
  const byKey = new Map(years.flatMap((y) => y.photos).map((p) => [p.key.toLowerCase(), p]));
  const entries = readYaml<unknown>(join(ROOT, 'selected.yml'));
  if (entries === undefined) warn('photos/selected.yml is missing or empty; Selected will be empty');
  const selected: Photo[] = [];
  for (const raw of Array.isArray(entries) ? entries : []) {
    const key = String(raw).trim().replace(/^\/+|^photos\//g, '');
    const p = byKey.get(key.toLowerCase());
    if (!p) warn(`selected.yml: "${key}" not found`);
    else if (selected.includes(p)) warn(`selected.yml: "${key}" is listed twice`);
    else selected.push(p);
  }

  return { years, selected };
}

let cached: Promise<PhotoData> | undefined;
export const loadPhotos = () => (cached ??= load());
