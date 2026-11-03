import type { ImageMetadata } from 'astro';

// Merged, display-ready metadata for one photo. Only fields that exist are set.
export interface PhotoInfo {
  location?: string;
  subject?: string;
  camera?: string;
  lens?: string;
  film?: string; // only for medium: film
  aperture?: string; // "f/2.8"
  shutter?: string; // "1/250 s"
  iso?: string;
  date?: string; // "Mar 1, 2025" from EXIF, or "2023" from the filename/yml
}

export interface Photo {
  key: string; // path under photos/: "people/weddings/01-vows.jpg", or "people/01-anele.jpg" if loose
  file: string; // "01-anele__hp5__2024.jpg"
  slug: string; // "anele"
  category: string; // "people"
  categoryTitle: string; // "People"
  categoryUrl: string;
  // Project fields are unset for loose photos (placed straight in a category folder).
  projectSlug?: string;
  projectTitle?: string;
  projectDescription?: string;
  url: string; // site path without base: /photography/people/anele/
  projectUrl?: string; // section anchor on the category page: /photography/people/#weddings
  image: ImageMetadata; // never read `.src` directly: that would ship the original
  width: number;
  height: number;
  color: string; // dominant colour, shown while the image loads
  title?: string;
  year?: string;
  alt: string;
  info: PhotoInfo;
}

export interface Project {
  slug: string;
  category: string;
  title: string;
  description?: string;
  url: string; // anchor on the category page
  photos: Photo[];
}

export interface Category {
  slug: string; // "people"
  title: string; // "People"
  url: string;
  loose: Photo[]; // photos placed straight in the category folder, in file order
  projects: Project[]; // only projects with photos
  photos: Photo[]; // the page's display order: loose photos, then projects in order
}

export interface PhotoData {
  categories: Category[]; // always all three, in CATEGORIES order (some may be empty)
  selected: Photo[];
}
