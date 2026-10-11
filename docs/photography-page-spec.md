# Photography Page: Build Spec

Companion to `portfolio-landing-spec.md`. Same site, same stack (static Astro on GitHub Pages), same dark palette and type. Read that spec first. Anything marked **TBD** is a placeholder: make it an obvious constant or data field and do not invent content.

## 1. Purpose and tone

A gallery for Keshav Sethi's photography, reached from the camera object on the landing page. The landing page is playful. This page is the opposite: **crisp, quiet, fast.** The photos are the entire point.

- Sharp, quick animations (about 120-260ms). No bounces, springs, parallax, scroll-jacking, custom cursors, or decorative effects.
- No zoom/magnifying-glass cursor on photos (explicitly disliked).
- Nothing tints, overlays, rounds, borders, or shadows a photograph. Photos are shown as they are, with square corners.

## 2. Reference

https://sambitbiswas.com/photo : **layout inspiration only.** Take: a fixed left sidebar with a nested year → project nav, next to a clean image grid. Do not take: its bio/info block, its animations, or its visual styling. Do not copy any of its content.

## 3. Information architecture

| Route | Shows |
|-------|-------|
| `/photography/` | **Selected:** a curated set (the default landing view). About 4 photos at launch. |
| `/photography/<year>/` | All photos from that year in one grid, without project headings (project order, then file order). |
| `/photography/<year>/<project>/` | All photos from one project. |
| `/photography/<year>/<project>/<photo>/` | Same page as its project, with the viewer **open on that photo**. This is the shareable link. |

- Years are listed newest first. Each year contains one or more projects.
- Expect roughly 4 photos in Selected at launch and up to about 20 per project, but design for 1-40 per project without breaking.
- Photo slugs come from the filename with the number prefix and extension removed (`01-harbor.jpg` → `harbor`). The build must fail with a clear message on duplicate slugs within a project.

## 4. Sidebar

Fixed on the left on desktop (about 220-260px wide). **Only** this, with no bio, no info text:

1. **Back**: a link to the landing page (`/`).
2. **Selected**: link to `/photography/`.
3. **Years**, newest first. Each year is expandable to reveal its projects. The year/project for the current page is expanded and shown as active; others are collapsed. Expand/collapse is instant or at most 150ms.

Active state: full-brightness text versus muted text for inactive items. No accent color needed. The sidebar is generated entirely from the folder structure. Adding a folder adds a nav item automatically. A project with zero photos is hidden from the nav.

## 5. Grid (masonry)

- **Masonry that preserves every photo's true aspect ratio. Never crop.**
- Because dimensions are known at build time, reserve exact space for every image so nothing shifts as images load.
- Keep reading order roughly left-to-right across columns so the curated order still reads sensibly (do not use plain CSS `columns`, which orders top-to-bottom per column). Assign photos to the currently shortest column, computed from known aspect ratios, at each breakpoint.
- Gap about 12-16px on desktop, 8-10px on mobile.
- Columns: 3 on wide desktop, 2 on tablet, and on phones 2 columns from about 420px up and 1 column below. Tune by eye.
- Cap the content width so a small set (like 4 photos at launch) looks deliberate, not stretched or sparse. This must be checked with exactly 4 photos.
- **Hover:** subtle and fast (about 120ms), for example a slight brightness lift on the hovered photo or a 1px outline. No scale, no zoom, no overlays, no captions on hover. Cursor: pointer.

## 6. Photo viewer (expand in place)

Clicking a photo expands it **from its position in the grid**:

- **Animation:** a FLIP-style transition (Web Animations API or the View Transitions API with a fallback), 200-260ms, snappy ease-out. The rest of the page dims to near-black behind it.
- **Desktop layout:** the photo large on the left/center, preserving its aspect ratio and fitting the available space, with an **info panel beside it on the right** (about 280-320px).
- **Info panel**, showing only fields that exist (no empty labels):
  - Title (only if the photo has one; many won't)
  - Project, year
  - Location
  - Subject
  - Camera, lens
  - **Film stock** (for film photos)
  - Aperture, shutter speed, ISO, and date, when known
  - Project details (a short description from the project)
  - A "copy link" control
- **Navigation:** left/right arrow keys, on-screen prev/next arrows, and **swipe** left/right on touch (the photo follows the finger). Show a small counter ("3 / 12"). Navigation stays within the current list (Selected, a year, or a project) and wraps around from last to first and first to last. Moving between photos is a quick crossfade (about 120ms) on keyboard and arrows.
- **Close:** `Esc`, the close button, or clicking the dimmed backdrop. Closing returns to the grid with scroll position preserved and focus returned to the originating tile. On touch, swipe down also closes.
- **Shareable URL:** opening a photo updates the URL to its photo URL with `pushState`. Moving between photos uses `replaceState`, so the browser Back button closes the viewer in one step. Visiting a photo URL directly renders the project page with the viewer already open (no expand animation).
- **Mobile layout:** the photo fills the width, with the info panel below it (collapsible), same swipe navigation.
- Preload the next and previous photos' large versions while the viewer is open, and begin loading the large version of a photo on tile hover/focus so the expand feels instant.

## 7. Visual design (dark mode, shared with the landing page)

Use the same CSS variables defined for the landing page (one shared tokens file), starting values:

- Colour values are the landing page's current ones (decided; the earlier `#121212` / `#EDEDED` values are dropped): `--bg-base` = `SITE.baseBg` (`#141414`), `--text` `#F6F3EE`, plus `--text-muted` and `--line` derived from them. All live in `src/data/tokens.ts`.
- Muted text on the background must keep at least 4.5:1 contrast.
- No grain, no gradients, no accent color on this page. Monochrome UI so the photos carry all the color.
- Type: the same grotesque sans-serif as the landing page, small and quiet (sidebar and info text about 13-14px). Use tabular figures for metadata values. Metadata labels in muted text, values in `--text`.
- Hairline dividers only where they help.

## 8. Data and content workflow

All content is folders and files in the repo. No database, no CMS (a git-based CMS can be added later).

```
photos/
  selected.yml
  2025/
    harbor-walk/
      project.yml
      01-harbor.jpg
      02-market.jpg
```

`project.yml`:

```yaml
title: Harbor Walk
order: 1                  # optional; sorts projects within a year (else alphabetical)
description: Short project details shown in the info panel.
location: Savannah, GA    # default for every photo in the project
subject: Street
medium: film              # film | digital (default for the project)
film: Kodak Portra 400    # default film stock for the project (if film)
photos:                   # optional per-photo overrides, keyed by filename
  01-harbor.jpg:
    title: Morning Tide   # optional; most photos won't have one
    location: Tybee Island, GA
    subject: Landscape
    film: Ilford HP5
    camera: Pentax 67     # film scans usually have no camera EXIF, so allow manual camera/lens
    lens: 105mm f/2.4
    alt: Short description for screen readers
```

`photos/selected.yml` is the curated set, **in display order**:

```yaml
- 2025/harbor-walk/01-harbor.jpg
- 2024/another-project/04-portrait.jpg
```

Rules:
- Years and projects come from folder names. Years sort newest first.
- **Projects are optional.** A photo placed straight in a year folder (`photos/2025/03-harbor.jpg`) shows on that year's page after the year's projects, can be listed in `selected.yml` (`- 2025/03-harbor.jpg`), and gets the URL `/photography/2025/harbor/`; its info panel shows just the year. An optional `photos/<year>/year.yml` takes the same defaults and `photos:` overrides as `project.yml`. A loose photo's slug may not match a project folder name in the same year (the build fails with a clear message). A year with only loose photos has no expand toggle in the sidebar.
- Photo order within a project comes from the filename number prefix.
- EXIF (camera, lens, aperture, shutter, ISO, date) is read from each file automatically at build when present. Values in `project.yml` override or fill in anything missing (essential for film scans).
- `camera`, `lens`, and an optional `date` (`YYYY-MM-DD`) may be set per project or per photo. For `medium: film`, the EXIF date is hidden (it is usually the scan date) unless `date` is set.
- Warn at build (do not crash) when a photo in `selected.yml` doesn't exist, when a project has no `project.yml`, or when a field is missing.
- Source files committed to the repo: **JPEG, sRGB, about 2400-3000px on the long edge, quality 85-90.** Never full-resolution originals. The build should warn on files above about 8MB or about 3200px.

**Publishing:** commit and push (VS Code, GitHub Desktop, or GitHub's "Upload files" in the browser). A GitHub Actions workflow builds and deploys to Pages. Document this routine in the README, including how to add a photo, a project, and a year, and how to edit `selected.yml`.

## 9. Image pipeline (performance without visible quality loss)

Generate everything at **build time** from the committed source files. Do not commit generated images.

- **Sizes:** grid thumbnails at about 600 / 1000 / 1400px wide; viewer images at about 1600 / 2400px wide. Use `srcset` and `sizes` so the browser picks the smallest sufficient file.
- **Formats:** AVIF and WebP with a JPEG fallback (`<picture>`). Starting quality: AVIF about 55-60, WebP about 78-82, JPEG about 82. **Compare against real photos before locking these in**, especially dark scenes and film grain, because heavy compression smooths grain and crushes shadows.
- **No layout shift:** explicit `width`/`height` (or `aspect-ratio`) on every image, plus a tiny blurred preview or dominant-color placeholder while loading.
- **Loading:** the first visible row loads eagerly (with high fetch priority for the first image); everything below is `loading="lazy"`.
- **Color:** convert to sRGB and keep colors accurate. No filters, no CSS blend effects on photos.
- **Privacy:** read EXIF for the info panel, then **strip EXIF from all published files, especially GPS.**
- **Budget:** the first screen of the grid should transfer under about 1MB on mobile. Lighthouse performance 90+ on mobile.
- **Hosting limits:** GitHub Pages sites have a size limit of about 1GB (check GitHub's current docs). Print the total built image size at the end of every build and warn above about 500MB. Cache generated images between CI runs if practical.
- No right-click blocking or similar. It doesn't work, and it hurts usability. Full-resolution originals never ship.

## 10. Mobile

- The sidebar collapses into a slim top bar: **Back** on the left, **Index** on the right. Index opens a full-screen sheet with the same Selected / year / project accordion (quick open, about 150ms).
- Grid as in section 5. Viewer as in section 6.
- Touch targets at least 44px.

## 11. Accessibility

- Every image has `alt`: use the `alt` field, else fall back to "Title or Project, location, year".
- The viewer is a labeled dialog (`aria-modal`), traps focus, closes on `Esc`, and returns focus to the tile.
- Arrow-key navigation works only while the viewer is open. All controls are keyboard reachable with visible focus rings.
- `prefers-reduced-motion`: replace the expand animation with a simple fade (or none) and disable swipe-follow animation.

## 12. SEO and sharing

- Each photo URL gets its own `<title>`, description (title/location/year), and an Open Graph image (the 1600px version, or a generated social-size crop) so shared links preview correctly.
- Generate a sitemap that includes all project and photo URLs.

## 13. Placeholders and phasing

Build with generated **placeholder photos** before real ones exist: a script that creates a neutral grey image set in assorted aspect ratios (portrait, landscape, square, panorama) with labels, in a few sample years and projects, plus a sample `selected.yml`. Real photos then drop into the same folders.

1. **Phase 1:** data loading from folders, image pipeline, sidebar, masonry grid, Selected / year / project routes, mobile top bar and sheet.
2. **Phase 2:** the viewer: expand animation, info panel, arrows, swipe, shareable URLs, preloading.
3. **Phase 3:** polish: performance and quality tuning against real photos, accessibility pass, README, social previews.

## 14. Relationship to the landing page

- The camera object on the landing page links to `/photography/`. Flip its `status` from `soon` to `live` when this page ships.
- The camera's hover accent color applies only on the landing page. This page stays monochrome.
- Shared: palette tokens, typeface, Astro project, build and deploy workflow.

## 15. Acceptance checklist

- [ ] `/photography/` shows the curated Selected set in the order of `selected.yml`.
- [ ] The sidebar contains only Back, Selected, and years/projects, generated from folders.
- [ ] Masonry preserves aspect ratios, causes no layout shift, and looks balanced with exactly 4 photos.
- [ ] Clicking a photo expands it in place with the info panel beside it (stacked on mobile).
- [ ] Arrow keys, on-screen arrows, and swipe all navigate; `Esc`, close, and backdrop click all close.
- [ ] Every photo has a working shareable URL; Back closes the viewer; a direct visit opens it.
- [ ] Info panel hides empty fields and shows film stock for film photos.
- [ ] Published images have EXIF/GPS stripped; no full-resolution originals ship.
- [ ] Lighthouse performance 90+ on mobile; the first grid screen is under about 1MB.
- [ ] Reduced-motion and keyboard behavior work.

## 16. Open items (TBD, do not guess)

- ~~Year pages~~: decided: one grid, no project headings.
- Real project folders, names, and the actual `selected.yml` photos.
- Whether any photos need titles beyond the few that have them (title is optional everywhere).
- Final typeface (shared decision with the landing page).
