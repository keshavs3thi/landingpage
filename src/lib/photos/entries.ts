// Build-time: turn photos into viewer entries (image sets + display-ready info).
import { SITE } from '../../data/site';
import { withBase } from '../url';
import { viewerSet } from './images';
import type { ViewerEntry } from './render';
import type { Photo, PhotoInfo } from './types';

const LABELS: [keyof PhotoInfo, string][] = [
  ['location', 'Location'],
  ['subject', 'Subject'],
  ['camera', 'Camera'],
  ['lens', 'Lens'],
  ['film', 'Film'],
  ['aperture', 'Aperture'],
  ['shutter', 'Shutter'],
  ['iso', 'ISO'],
  ['date', 'Date'],
];

// "Morning Tide — Savannah, GA, 2025 — Keshav Sethi"
export const pageTitle = (p: Photo) =>
  `${p.title ?? p.projectTitle ?? 'Photograph'} — ${[p.info.location, p.year].filter(Boolean).join(', ')} — ${SITE.name}`;

export const pageDescription = (p: Photo) =>
  `${[p.title ?? p.projectTitle ?? 'Photograph', p.info.location, p.year].filter(Boolean).join(', ')}. Photograph by ${SITE.name}.`;

export async function toEntry(p: Photo): Promise<ViewerEntry> {
  return {
    url: withBase(p.url),
    heading: p.title ?? p.projectTitle ?? 'Photograph',
    title: p.title,
    pageTitle: pageTitle(p),
    alt: p.alt,
    w: p.width,
    h: p.height,
    color: p.color,
    set: await viewerSet(p),
    project: p.projectTitle && p.projectUrl ? { title: p.projectTitle, url: withBase(p.projectUrl) } : undefined,
    year: { label: p.year, url: withBase(p.yearUrl) },
    description: p.projectDescription,
    info: LABELS.filter(([k]) => p.info[k]).map(([k, label]) => [label, p.info[k]!]),
  };
}
