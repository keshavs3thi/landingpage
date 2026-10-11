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
  date?: string; // "Mar 1, 2025"
}

export interface Photo {
  key: string; // path under photos/: "2025/harbor-walk/01-harbor.jpg", or "2025/01-harbor.jpg" if loose
  file: string; // "01-harbor.jpg"
  slug: string; // "harbor"
  year: string;
  // Project fields are unset for loose photos (placed straight in a year folder).
  projectSlug?: string;
  projectTitle?: string;
  projectDescription?: string;
  url: string; // site path without base: /photography/2025/harbor-walk/harbor/ or /photography/2025/harbor/
  projectUrl?: string;
  yearUrl: string;
  image: ImageMetadata; // never read `.src` directly: that would ship the original
  width: number;
  height: number;
  color: string; // dominant colour, shown while the image loads
  title?: string;
  alt: string;
  info: PhotoInfo;
}

export interface Project {
  slug: string;
  year: string;
  title: string;
  description?: string;
  url: string;
  photos: Photo[];
}

export interface Year {
  year: string;
  url: string;
  projects: Project[]; // only projects with photos
  loose: Photo[]; // photos placed straight in the year folder, in file order
  photos: Photo[]; // all of the year's photos: projects in order, then loose photos
}

export interface PhotoData {
  years: Year[]; // newest first
  selected: Photo[];
}
