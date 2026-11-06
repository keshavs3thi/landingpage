// Single source of truth for the hero. Flip `status` to "live" to make an item navigate.
// Swap a placeholder for a final render: save it as renders-src/<id>.png, run
// `npm run optimize-render -- <id>`, then paste the printed `image`, `width` and `height` here.

export type Status = 'live' | 'soon';

export interface Project {
  id: string;
  title: string; // "TBD" until named; UI falls back to `fallbackTitle`
  fallbackTitle: string; // generic label from the spec table, shown only while title is TBD
  oneLiner: string; // "TBD" is hidden in the UI
  year?: string; // shown in the label after the one-liner
  type: 'photography' | 'ux' | 'physical';
  image: string; // path under public/, base path added at render time
  width: number; // intrinsic size of the image file
  height: number;
  alt: string;
  hit?: string; // CSS inset of the hover area inside the image; defaults to .hit in hero.css
  href: string;
  status: Status;
  accent: string; // hover background; must contrast with the object
  tintMix?: number; // share of accent in the hover background, 0..1; defaults to tint()'s 0.35
  layout: {
    // x/y: % of hero stage (object centre). scale: relative to base object width. rotate: degrees.
    // floatPhase: 0..1, fraction of the float cycle to offset by. label: hover label side; defaults by x.
    desktop: { x: number; y: number; scale: number; rotate: number; z: number; floatPhase: number; label?: 'left' | 'right' };
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
    image: '/renders/camera.webp',
    width: 1500,
    height: 1342,
    alt: 'Black and silver Fujifilm X-T3 mirrorless camera with an 18-55mm lens, seen from the front at a three-quarter angle',
    href: '/photography/',
    status: 'live',
    accent: '#17B8B0', // teal: furthest hue from the other accents
    layout: {
      desktop: { x: 88, y: 40, scale: 0.88, rotate: -14, z: 2, floatPhase: 0.0 },
      mobile: { order: 5, scale: 0.9, rotate: -10 },
    },
  },
  {
    id: 'laptop',
    title: 'Learning Experience Platform',
    fallbackTitle: 'UX project',
    oneLiner: 'TBD',
    year: '2024',
    type: 'ux',
    image: '/renders/laptop.webp',
    width: 1500,
    height: 1368,
    alt: 'Open silver laptop showing the Learning Experience Platform dashboard, with a Your Progress bubble chart and a metrics and badges panel',
    hit: '10% 7%',
    href: '/work/laptop/',
    status: 'soon',
    accent: '#4442E3', // Method logo blue (public/logos/method.svg)
    layout: {
      desktop: { x: 13, y: 42, scale: 0.85, rotate: 8, z: 2, floatPhase: 0.35 },
      mobile: { order: 4, scale: 0.85, rotate: 5 },
    },
  },
  {
    id: 'ball',
    title: 'Emotiballs',
    fallbackTitle: 'Emotiballs',
    oneLiner: 'TBD',
    year: '2025',
    type: 'physical',
    image: '/renders/ball.webp',
    width: 1500,
    height: 1493,
    alt: 'Deep green textured ball with raised, flowing contours across its surface, lit from the upper left',
    href: '/work/ball/',
    status: 'soon',
    accent: '#78AF43', // rim light on the render; the ball's body greens would hide its shadow side
    layout: {
      desktop: { x: 44, y: 30, scale: 0.65, rotate: 14, z: 4, floatPhase: 0.6 },
      mobile: { order: 1, scale: 0.71, rotate: 12 },
    },
  },
  {
    id: 'speaker',
    title: 'Lotusbox',
    fallbackTitle: 'Lotusbox',
    oneLiner: 'TBD',
    year: '2024',
    type: 'physical',
    image: '/renders/speaker.webp',
    width: 969,
    height: 928,
    alt: 'Black tetrahedral speaker with a glossy face and thin wooden edges catching warm orange light',
    href: '/work/speaker/',
    status: 'soon',
    accent: '#FF7A1A', // the bottom-right highlight's orange, pushed to full saturation
    tintMix: 0.5, // orange turns brown at the default mix
    layout: {
      desktop: { x: 58, y: 62, scale: 1.0, rotate: -12, z: 5, floatPhase: 0.15 },
      mobile: { order: 2, scale: 0.95, rotate: -14 },
    },
  },
  {
    id: 'notquitebrick',
    title: 'notquitebrick',
    fallbackTitle: 'notquitebrick',
    oneLiner: 'TBD',
    year: '2026',
    type: 'physical',
    image: '/renders/notquitebrick.webp',
    width: 1354,
    height: 1500,
    alt: 'Translucent pink rounded-square puck with the word brick raised in script on a circular disc at its centre',
    href: '/work/notquitebrick/',
    status: 'soon',
    accent: '#BF72A5', // most saturated pink in the render's lit edges
    layout: {
      desktop: { x: 40, y: 62, scale: 0.78, rotate: -6, z: 3, floatPhase: 0.8, label: 'left' },
      mobile: { order: 3, scale: 0.95, rotate: -6 },
    },
  },
];

export const displayTitle = (p: Project) => (p.title === 'TBD' ? p.fallbackTitle : p.title);
export const displayOneLiner = (p: Project) => (p.oneLiner === 'TBD' ? '' : p.oneLiner);
