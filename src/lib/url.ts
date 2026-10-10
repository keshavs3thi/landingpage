// Prefix a root-relative path with the configured base (e.g. /landingpage/).
export function withBase(path: string): string {
  if (/^([a-z]+:|\/\/|#)/i.test(path)) return path; // absolute URL, mailto:, anchor
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

// Relative luminance (WCAG) of a #RRGGBB colour.
export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

// Near-black text on light accents, off-white on dark ones.
export const inkFor = (hex: string): 'dark' | 'light' => (luminance(hex) < 0.18 ? 'light' : 'dark');
