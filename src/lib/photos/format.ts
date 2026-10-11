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
export const altFallback = (name: string, location: string | undefined, year: string) =>
  [name, location, year].filter(Boolean).join(', ');

// "01-harbor.jpg" -> "harbor"; unnumbered names keep their full base name.
export function slugFromFile(file: string): string {
  const base = file.replace(/\.[^.]+$/, '').replace(/^\d+[-_ .]*/, '') || file.replace(/\.[^.]+$/, '');
  return base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Numbered files first by number, then unnumbered alphabetically.
export function fileOrder(a: string, b: string): number {
  const na = a.match(/^(\d+)/)?.[1];
  const nb = b.match(/^(\d+)/)?.[1];
  if (na && nb) return Number(na) - Number(nb) || a.localeCompare(b);
  if (na) return -1;
  if (nb) return 1;
  return a.localeCompare(b);
}
