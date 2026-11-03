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
| `/photography/` | **Featured:** a curated set (the default landing view). About 4 photos at launch. |
| `/photography/<category>/` | One of **People, Places, Cars**: its loose photos, then a section per project (anchor `#<project>`). |
| `/photography/<category>/<photo>/` | Same page as its category, with the viewer **open on that photo**. This is the shareable link. |

- The three categories are fixed, in that order. Projects are optional subdivisions of a category (e.g. a commission) and have no page of their own.
- Expect roughly 4 photos in Featured at launch and up to about 20 per project, but design for 1-40 per project without breaking.
- Photo slugs come from the filename title (section 8): `01-harbor__portra-400.jpg` → `harbor`. The build must fail with a clear message on duplicate slugs within a category.

## 4. Sidebar

Fixed on the left on desktop (about 220-260px wide). **Only** this, with no bio, no info text:

1. **Back**: a link to the landing page (`/`).
2. **Featured**: link to `/photography/`.
3. **People, Places, Cars**, always listed (an empty one shows "No photos yet"). A category with projects is expandable to reveal them, linking to the project's section on the category page. The current category is expanded and shown as active; others are collapsed. Expand/collapse is instant or at most 150ms.

Active state: full-brightness text versus muted text for inactive items. No accent color needed. Projects come from the folder structure: adding a project folder adds a nav item automatically. A project with zero photos is hidden from the nav.

**Project sections** on a category page: a faint hairline above and below, a small title and short description (e.g. "Commissioned by ...") in a narrow column on the left, the project's grid beside it. On phones the text sits above the grid.

## 5. Grid (masonry)

- **Masonry that preserves every photo's true aspect ratio. Never crop.**
- Because dimensions are known at build time, reserve exact space for every image so nothing shifts as images load.
- Keep reading order roughly left-to-right across columns so the curated order still reads sensibly (do not use plain CSS `columns`, which orders top-to-bottom per column). Assign photos to the currently shortest column, computed from known aspect ratios, at each breakpoint.
- Gap about 12-16px on desktop, 8-10px on mobile.
- Columns: **4 on desktop** (grid at least about 880px wide), 3 on mid-width grids (from about 560px, including narrower project sections), 2 on phones. **Horizontals (aspect 1.2:1 or wider) span two columns** so they aren't dwarfed by verticals; verticals and squares take one. Each photo goes where it sits highest with the least empty space below it, and may swap with one of the next two to close a gap, so small uneven gaps can still appear occasionally.
- Cap the content width so a small set doesn't look stretched.
- **Hover:** subtle and fast (about 120ms), for example a slight brightness lift on the hovered photo or a 1px outline. No scale, no zoom, no overlays, no captions on hover. Cursor: pointer.

## 6. Photo viewer (expand in place)

Clicking a photo expands it **from its position in the grid**:

- **Animation:** a FLIP-style transition (Web Animations API or the View Transitions API with a fallback), 200-260ms, snappy ease-out. The rest of the page dims to near-black behind it.
- **Desktop layout:** the photo large on the left/center, preserving its aspect ratio and fitting the available space, with an **info panel beside it on the right** (about 280-320px).
- **Info panel**, showing only fields that exist (no empty labels):
  - Heading: the photo's title, else its project's title, else "Photograph"
  - Project (when the photo has its own title), category
  - Location
  - Subject
  - Camera, lens
  - **Film stock** (for film photos)
  - Aperture, shutter speed, ISO, and date, when known
  - Project details (a short description from the project)
  - A "copy link" control
- **Navigation:** left/right arrow keys, on-screen prev/next arrows, and **swipe** left/right on touch (the photo follows the finger). Show a small counter ("3 / 12"). Navigation stays within the current page (Featured, or a whole category including its projects) and wraps around from last to first and first to last. Moving between photos is a quick crossfade (about 120ms) on keyboard and arrows.
- **Close:** `Esc`, the close button, or clicking the dimmed backdrop. Closing returns to the grid with scroll position preserved and focus returned to the originating tile. On touch, swipe down also closes.
- **Shareable URL:** opening a photo updates the URL to its photo URL with `pushState`. Moving between photos uses `replaceState`, so the browser Back button closes the viewer in one step. Visiting a photo URL directly renders the category page with the viewer already open (no expand animation).
- **Mobile layout:** the photo fills the width, with the info **always visible** below it as you scroll (no toggle). The heading is larger (about 18px, full-strength text) to draw the eye without competing with the photo. Same swipe navigation.
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
  people/                              # people, places, cars: the only folders read
    category.yml                       # optional defaults/overrides for the loose photos
    01-redlight.jpg                    # loose photo
    wedding-for-x/                     # optional project
      project.yml
      01-first-look__portra-400__2025.jpg
      02-vows__hp5__2025__pentax-k1000.jpg
  places/
  cars/
```

**Filenames carry the photo's info:** `[NN-]title-words[__part][__part]...jpg`

| Filename | Reads as |
|----------|----------|
| `01-morning-tide__portra-400__2023.jpg` | #1, "Morning Tide", film: Portra 400, 2023 |
| `02-anele__hp5__2024__pentax-k1000.jpg` | "Anele", film: HP5, 2024, camera: Pentax K1000 |
| `03-walk-in-the-park.jpg` | "Walk in the Park", digital (camera, lens, exposure, date from EXIF) |
| `KESH1234.jpg` | untitled (camera default name), digital |

- `NN-` (optional) sets the order and is not part of the title or URL.
- The title is the words between, dashes as spaces, in Title Case.
- After `__`: a 4-digit number is the year; the first other part is the **film stock**, which makes the photo **film**; the next is the film camera. Order of parts doesn't matter except film before camera.
- **Film photos ignore EXIF entirely** (it's the scanner's): camera, lens, exposure and date come only from the filename or yml. A film photo without a year gets a build warning. Digital photos show the EXIF date.
- Stock names are cased from a small table (`tri-x-400` → Tri-X 400, `cinestill-800t` → CineStill 800T); others are guessed (`portra-400` → Portra 400, `hp5` → HP5). Anything unusual can be set in yml.
- Camera, phone and scanner default names (`KESH…`, `IMAG…`, `R1-…`, `scan-…`, all digits) have no title; the viewer shows the project title or "Photograph".
- The URL is `/photography/<category>/<title-slug>/` (`kesh1234` for untitled names).
- `npm run photo-names` prints what every file will read as (title, film, year, camera, URL) and flags problems, to check renames without a full build.

`project.yml` (and `category.yml`, minus title/order/description):

```yaml
title: Wedding for X
order: 1                  # optional; sorts projects within a category (else alphabetical)
description: Commissioned by the couple. Shown beside the project's photos and in the info panel.
location: Atlanta, GA     # defaults for every photo in the folder
subject: Portrait
photos:                   # optional per-photo overrides, keyed by filename; these win over the filename
  01-first-look__portra-400__2025.jpg:
    title: First Look
    lens: 50mm f/1.8
    alt: Short description for screen readers
```

`photos/selected.yml` is the curated set, **in display order**:

```yaml
- people/wedding-for-x/01-first-look__portra-400__2025.jpg
- places/03-walk-in-the-park.jpg
```

Rules:
- Precedence for every field: per-photo yml override > filename > folder yml defaults > EXIF.
- Loose photos come first on a category page, then projects in `order`.
- Warn at build (do not crash) when a photo in `selected.yml` doesn't exist, when a project has no `project.yml`, when a filename part isn't understood, or when a folder other than people/places/cars exists under `photos/`.
- Source files: **JPEG, sRGB, about 2400-3000px on the long edge, quality 85-90.** Never full-resolution originals. The build should warn on files above about 8MB or about 3200px. In Lightroom, export metadata as "All Except Person & Location Info" (keeps camera/lens, drops GPS).
- Source JPEGs are **gitignored and never committed**; they live only in the local `photos/` folder. The `.yml` files are committed.

**Publishing:** commit any code/yml changes, then run `npm run deploy`. It builds locally and pushes only `dist/` (resized, EXIF-stripped images) to the `main` branch of the `keshavs3thi.github.io` repo, which serves https://keshavsethi.com/. There is no CI build, since CI has no access to the photos. Document this routine in the README, including how to add a photo and a project, and how to edit `selected.yml`.

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

- The sidebar collapses into a slim sticky top bar: **Back** on the left, and **Featured · People · Places · Cars** as small links on the right (current one brighter; scrolls sideways if it ever overflows). Projects appear as sections on the category page.
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

1. **Phase 1:** data loading from folders, image pipeline, sidebar, masonry grid, Featured / year / project routes, mobile top bar and sheet.
2. **Phase 2:** the viewer: expand animation, info panel, arrows, swipe, shareable URLs, preloading.
3. **Phase 3:** polish: performance and quality tuning against real photos, accessibility pass, README, social previews.

## 14. Relationship to the landing page

- The camera object on the landing page links to `/photography/`. Flip its `status` from `soon` to `live` when this page ships.
- The camera's hover accent color applies only on the landing page. This page stays monochrome.
- Shared: palette tokens, typeface, Astro project, build and deploy workflow.

## 15. Acceptance checklist

- [ ] `/photography/` shows the curated Featured set in the order of `selected.yml`.
- [ ] The sidebar contains only Back, Featured, and years/projects, generated from folders.
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
