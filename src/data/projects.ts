// Single source of truth for the hero. Flip `status` to "live" to make an item navigate.
// Swap a placeholder for a final render by changing `image` (.svg -> .webp) and `width`/`height`.

export type Status = 'live' | 'soon';

export interface Project {
  id: string;
  title: string; // "TBD" until named; UI falls back to `fallbackTitle`
  fallbackTitle: string; // generic label from the spec table, shown only while title is TBD
  oneLiner: string; // "TBD" is hidden in the UI
  type: 'photography' | 'ux' | 'physical';
  image: string; // path under public/, base path added at render time
  width: number; // intrinsic size of the image file
  height: number;
  alt: string;
  href: string;
  status: Status;
  accent: string; // hover background; must contrast with the object
  layout: {
    // x/y: % of hero stage (object centre). scale: relative to base object width. rotate: degrees.
    // floatPhase: 0..1, fraction of the float cycle to offset by.
    desktop: { x: number; y: number; scale: number; rotate: number; z: number; floatPhase: number };
    mobile: { order: number; scale: number; rotate: number };
  };
}

export const PROJECTS: Project[] = [
  {
    id: 'camera',
    title: 'Photography',
    fallbackTitle: 'Photography',
    oneLiner: 'TBD',
    type: 'photography',
    image: '/renders/camera.svg',
    width: 1500,
    height: 1200,
    alt: 'Placeholder render of a camera', // TBD: describe the final render
    href: '/photography/',
    status: 'soon',
    accent: '#D9653B', // TBD provisional
    layout: {
      desktop: { x: 23, y: 33, scale: 0.9, rotate: -14, z: 3, floatPhase: 0.0 },
      mobile: { order: 2, scale: 0.85, rotate: -10 },
    },
  },
  {
    id: 'laptop',
    title: 'TBD',
    fallbackTitle: 'UX project',
    oneLiner: 'TBD',
    type: 'ux',
    image: '/renders/laptop.svg',
    width: 1500,
    height: 1100,
    alt: 'Placeholder render of an open laptop showing a UX project', // TBD
    href: '/work/laptop/',
    status: 'soon',
    accent: '#3E5BA9', // TBD provisional
    layout: {
      desktop: { x: 50, y: 46, scale: 1.3, rotate: 6, z: 2, floatPhase: 0.35 },
      mobile: { order: 1, scale: 1.0, rotate: 5 },
    },
  },
  {
    id: 'model-a',
    title: 'TBD',
    fallbackTitle: 'Model A',
    oneLiner: 'TBD',
    type: 'physical',
    image: '/renders/model-a.svg',
    width: 1400,
    height: 1400,
    alt: 'Placeholder render of physical model A, a sphere', // TBD
    href: '/work/model-a/',
    status: 'soon',
    accent: '#8FA37E', // TBD provisional
    layout: {
      desktop: { x: 76, y: 22, scale: 0.62, rotate: 18, z: 4, floatPhase: 0.6 },
      mobile: { order: 3, scale: 0.6, rotate: 12 },
    },
  },
  {
    id: 'model-b',
    title: 'TBD',
    fallbackTitle: 'Model B',
    oneLiner: 'TBD',
    type: 'physical',
    image: '/renders/model-b.svg',
    width: 1400,
    height: 1400,
    alt: 'Placeholder render of physical model B, a rounded cube', // TBD
    href: '/work/model-b/',
    status: 'soon',
    accent: '#D6A73C', // TBD provisional
    layout: {
      desktop: { x: 69, y: 75, scale: 0.8, rotate: -16, z: 5, floatPhase: 0.15 },
      mobile: { order: 4, scale: 0.7, rotate: -14 },
    },
  },
  {
    id: 'model-c',
    title: 'TBD',
    fallbackTitle: 'Model C',
    oneLiner: 'TBD',
    type: 'physical',
    image: '/renders/model-c.svg',
    width: 1500,
    height: 1000,
    alt: 'Placeholder render of physical model C, a capsule', // TBD
    href: '/work/model-c/',
    status: 'soon',
    accent: '#7A4E6E', // TBD provisional
    layout: {
      desktop: { x: 96, y: 50, scale: 1.05, rotate: 58, z: 1, floatPhase: 0.8 },
      mobile: { order: 5, scale: 0.9, rotate: 32 },
    },
  },
];

export const displayTitle = (p: Project) => (p.title === 'TBD' ? p.fallbackTitle : p.title);
export const displayOneLiner = (p: Project) => (p.oneLiner === 'TBD' ? '' : p.oneLiner);
