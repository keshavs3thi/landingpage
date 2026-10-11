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

// Deep tint for the dark stage: mix `amount` of the accent into near-black. Returns #RRGGBB.
export function tint(hex: string, amount = 0.35, base = 0x0b0b0b): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (shift: number) =>
    Math.round(((n >> shift) & 255) * amount + ((base >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((s) => mix(s).toString(16).padStart(2, '0')).join('')}`;
}

// WCAG contrast ratio between two #RRGGBB colours.
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
