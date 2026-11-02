// Workshop (mini projects): published entries from the workshop/ folders, in list order.
// A folder's numeric prefix only sorts it on disk; "03-desk-organizer" is served at /workshop/desk-organizer/.

import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

type Data = CollectionEntry<'workshop'>['data'];
// Non-draft entries passed the schema's required-field check.
export type WorkshopItem = Omit<Data, 'title' | 'tagline' | 'year' | 'context' | 'summary' | 'hero' | 'heroAlt'> & {
  entry: CollectionEntry<'workshop'>;
  slug: string;
  url?: string; // set only when the project has its own page
  video?: string; // built URL of heroVideo
  modelUrl?: string; // built URL of model
  title: string;
  tagline: string;
  year: number;
  context: string;
  summary: string;
  hero: ImageMetadata;
  heroAlt: string;
};

const slugOf = (id: string) => id.replace(/^\d+[-_ ]*/, '');

// Hero videos ship as hashed build assets. Only files a project references end up on the site.
const VIDEOS = import.meta.glob<string>('/workshop/*/*.{mp4,webm}', { query: '?url', import: 'default', eager: true });

function videoUrl(folder: string, file: string) {
  const url = VIDEOS[`/workshop/${folder}/${file.replace(/^\.\//, '')}`];
  if (!url) throw new Error(`[workshop] ${folder}: heroVideo ${file} not found next to index.md`);
  return url;
}

// 3D models, same idea. Raw *-src.glb exports are left out so they can never ship.
const MODELS = import.meta.glob<string>(['/workshop/*/*.glb', '!/workshop/*/*-src.glb'], {
  query: '?url',
  import: 'default',
  eager: true,
});

function modelUrl(folder: string, file: string) {
  const url = MODELS[`/workshop/${folder}/${file.replace(/^\.\//, '')}`];
  if (!url) throw new Error(`[workshop] ${folder}: model ${file} not found next to index.md`);
  return url;
}

let cached: Promise<WorkshopItem[]> | undefined;

async function load(): Promise<WorkshopItem[]> {
  const entries = await getCollection('workshop', (e) => !e.data.draft);
  const items = entries
    .map((entry) => {
      const slug = slugOf(entry.id);
      return {
        ...(entry.data as WorkshopItem),
        entry,
        slug,
        url: entry.data.page ? `/workshop/${slug}/` : undefined,
        video: entry.data.heroVideo ? videoUrl(entry.id, entry.data.heroVideo) : undefined,
        modelUrl: entry.data.model ? modelUrl(entry.id, entry.data.model) : undefined,
      };
    })
    .sort((a, b) => a.order - b.order || b.year - a.year || a.title.localeCompare(b.title));

  const seen = new Map<string, string>();
  for (const it of items) {
    if (!/^[a-z0-9-]+$/.test(it.slug))
      throw new Error(`[workshop] ${it.entry.id}: folder names become URLs; use lowercase letters, digits and dashes`);
    const prev = seen.get(it.slug);
    if (prev) throw new Error(`[workshop] "${prev}" and "${it.entry.id}" both map to /workshop/${it.slug}/. Rename one of them.`);
    seen.set(it.slug, it.entry.id);
  }
  return items;
}

export const getWorkshop = () => (cached ??= load());
