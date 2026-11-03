// Formatting for EXIF and project.yml values shown in the viewer's info panel.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function camera(make?: string, model?: string): string | undefined {
  const mk = make?.trim();
  const md = model?.trim();
  if (!md) return mk || undefined;
  if (!mk || md.toLowerCase().startsWith(mk.toLowerCase().split(' ')[0])) return md;
  return `${mk} ${md}`;
}

export const aperture = (n?: number) => (n ? `f/${Number(n.toFixed(1))}` : undefined);

export function shutter(t?: number): string | undefined {
  if (!t) return undefined;
  if (t >= 1) return `${Number(t.toFixed(1))} s`;
  return `1/${Math.round(1 / t)} s`;
}

export const iso = (n?: number) => (n ? String(n) : undefined);

// Accepts EXIF "2024:02:11 10:00:00" or YAML "2025-03-01". Parsed by hand to avoid timezone shifts.
export function date(raw?: string | Date): string | undefined {
  if (!raw) return undefined;
  const s = raw instanceof Date ? raw.toISOString() : String(raw);
  const m = s.match(/^(\d{4})[:-](\d{2})(?:[:-](\d{2}))?/);
  if (!m) return s;
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return s;
  return d ? `${month} ${Number(d)}, ${y}` : `${month} ${y}`;
}

// "Title or Project, location, year" (spec §11).
export const altFallback = (name: string, location?: string, year?: string) =>
  [name, location, year].filter(Boolean).join(', ');

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Filename grammar (spec §8): [NN-]title-words[__part]...
//   "01-morning-tide__portra-400__2023__pentax-k1000.jpg"
//   NN-      optional sort order, not part of the title or URL
//   parts    a 4-digit number is the year; the first other part is the film stock (which makes the
//            photo film), the next is the film camera
export interface ParsedName {
  title?: string; // unset for camera default names like KESH1234
  slug: string;
  film?: string;
  year?: string;
  camera?: string;
  extra: string[]; // parts that matched nothing; the loader warns
}

// Camera, phone and scanner default names: these aren't titles.
const DEFAULT_NAME = /^(?:kesh|imag?|img|dsc[f]?|pxl|scan|r\d+|[a-z]\d{2}kesh)[\w-]*$|^\d+$/i;

const SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

// Stock names whose casing can't be guessed from the slug. Anything else: "portra-400" -> "Portra 400".
const FILM_NAMES: Record<string, string> = {
  'tri-x': 'Tri-X',
  'tri-x-400': 'Tri-X 400',
  'tri-x-320': 'Tri-X 320',
  'tmax-100': 'T-Max 100',
  'tmax-400': 'T-Max 400',
  't-max-100': 'T-Max 100',
  't-max-400': 'T-Max 400',
  'ultramax-400': 'UltraMax 400',
  'colorplus-200': 'ColorPlus 200',
  'cinestill-800t': 'CineStill 800T',
  'cinestill-400d': 'CineStill 400D',
  'cinestill-50d': 'CineStill 50D',
  'hp5-plus': 'HP5 Plus',
  'fp4-plus': 'FP4 Plus',
};

// Words with digits read as model names (hp5 -> HP5, k1000 -> K1000, 800t -> 800T).
const word = (w: string) => (/\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1));
// Film and camera names also capitalise short model words (canon-ae-1 -> Canon AE 1).
const nameCase = (part: string) =>
  part
    .split('-')
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : word(w)))
    .join(' ');

function titleCase(part: string): string {
  return part
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w.toLowerCase())) return w.toLowerCase();
      // Short words with digits are model names (m4 -> M4); longer ones are words (dekatemousa2).
      return w.length <= 4 ? word(w) : w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

export function parseFilename(file: string): ParsedName {
  const [head, ...parts] = file.replace(/\.[^.]+$/, '').split('__');
  const titlePart = head.replace(/^\d+[-_ .]+(?=.)/, '');
  const out: ParsedName = { slug: slugify(titlePart) || slugify(head), extra: [] };
  if (!DEFAULT_NAME.test(titlePart)) out.title = titleCase(titlePart);

  for (const raw of parts) {
    const part = slugify(raw);
    if (!part) continue;
    if (/^\d{4}$/.test(part) && !out.year) out.year = part;
    else if (!out.film) out.film = FILM_NAMES[part] ?? nameCase(part);
    else if (!out.camera) out.camera = nameCase(part);
    else out.extra.push(raw);
  }
  return out;
}

export const slugFromFile = (file: string) => parseFilename(file).slug;

// Numbered files first by number, then unnumbered in natural order (KESH-29 before KESH-133).
const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export function fileOrder(a: string, b: string): number {
  const na = a.match(/^(\d+)/)?.[1];
  const nb = b.match(/^(\d+)/)?.[1];
  if (na && nb) return Number(na) - Number(nb) || natural(a, b);
  if (na) return -1;
  if (nb) return 1;
  return natural(a, b);
}
