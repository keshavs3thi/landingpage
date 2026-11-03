// HTML for photos and the info panel. Pure and browser-safe: Astro renders it at build time and
// the viewer script renders the same markup on the client, so there is one source of truth.

// `sizes` for the grid and viewer; the viewer script needs them too, so they live here.
export const GRID_SIZES = '(max-width: 760px) calc(50vw - 20px), (max-width: 1640px) 25vw, 300px';
export const GRID_SIZES_WIDE = '(max-width: 760px) calc(100vw - 32px), (max-width: 1640px) 50vw, 600px'; // two-column photos
export const VIEWER_SIZES = '(max-width: 760px) 100vw, calc(100vw - 380px)';

export interface ImageSetLike {
  avif: string;
  webp: string;
  jpeg: string;
  fallback: string;
}

// One photo as the viewer needs it (serialised into the page as JSON).
export interface ViewerEntry {
  url: string; // with base
  heading: string; // title, else project title, else 'Photograph'
  title?: string;
  pageTitle: string;
  alt: string;
  w: number;
  h: number;
  color: string;
  set: ImageSetLike;
  project?: { title: string; url: string }; // unset for loose photos
  category: { label: string; url: string };
  description?: string;
  info: [string, string][]; // only fields that exist, in display order
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function pictureHtml(
  set: ImageSetLike,
  o: { sizes: string; alt: string; w: number; h: number; loading?: 'eager' | 'lazy'; priority?: boolean },
): string {
  const img = [
    `src="${esc(set.fallback)}"`,
    `srcset="${esc(set.jpeg)}"`,
    `sizes="${esc(o.sizes)}"`,
    `alt="${esc(o.alt)}"`,
    `width="${o.w}"`,
    `height="${o.h}"`,
    `loading="${o.loading ?? 'lazy'}"`,
    `decoding="async"`,
    o.priority ? `fetchpriority="high"` : '',
    `draggable="false"`,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    `<picture>` +
    `<source type="image/avif" srcset="${esc(set.avif)}" sizes="${esc(o.sizes)}">` +
    `<source type="image/webp" srcset="${esc(set.webp)}" sizes="${esc(o.sizes)}">` +
    `<img ${img}>` +
    `</picture>`
  );
}

export function infoHtml(e: ViewerEntry): string {
  const rows = e.info
    .map(([k, v]) => `<div class="v-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join('');
  return (
    `<p class="v-title">${esc(e.heading)}</p>` +
    `<p class="v-where">` +
    // Untitled photos already use the project as their heading.
    (e.project && e.title ? `<a href="${esc(e.project.url)}">${esc(e.project.title)}</a>, ` : '') +
    `<a href="${esc(e.category.url)}">${esc(e.category.label)}</a></p>` +
    (rows ? `<dl class="v-meta">${rows}</dl>` : '') +
    (e.description ? `<p class="v-desc">${esc(e.description)}</p>` : '')
  );
}
