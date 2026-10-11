# Portfolio Landing Page: Build Spec

Reference doc for Claude Code. Build exactly what is described here. Anything marked **TBD** is a placeholder: make it a clearly labeled constant or data field so it is a one-line change, and do not invent real content for it.

## 1. Purpose

A landing page for **Keshav Sethi**, designer (splitting time between Atlanta and the SF Bay Area; also takes photographs). A prospective hiring manager should understand the range of his work at a glance and click into whatever intrigues them.

He is not a web designer, but a well-crafted landing page is an entry point to being taken seriously as a designer. Craft and restraint matter more than feature count.

The finished landing page doubles as a "coming soon" page while the process books are completed. There is **no separate coming-soon page.**

## 2. Concept

The hero is a cluster of featured projects **floating** on a neutral backdrop, like product-photography still lifes:

- Objects are transparent-background renders, each tilted at its own angle, overlapping slightly and varying in scale, with a soft shadow beneath.
- Each object has a slow, subtle "breathing" float animation.
- Hovering an object makes it react, reveals a short label and one-liner, and shifts the page background toward that project's accent color.
- It must be obvious that the objects are clickable.
- Clicking an object goes to that project's process book.

**Reference images are in `docs/reference/`. View them before building.** They are inspiration only. Never copy them into `public/` or ship them on the site.

- `ref-01-squeeze-bottles`: floating squeeze bottles on a saturated, grainy orange background. Take: tilted objects at mixed scales, overlap, edge cropping, grain, bold flat background color.
- `ref-02-milk-bottles`: two floating bottles on a soft neutral studio backdrop. Take: the calm neutral base state, soft shadow, restrained lighting.
- `ref-03-cosmetics-still-life`: products floating among geometric plinths on a grey gradient. Take: depth and composition; objects at different heights and angles.

Overall: tilted objects, mixed depth, soft shadows, some cropping at the viewport edge.

## 3. Featured items (5)

| # | Object | Represents | Links to | Status |
|---|--------|------------|----------|--------|
| 1 | Camera | Photography portfolio | `/photography/`: a grid page of photos with a **category sidebar** (page not built yet; for now link to a stub or treat as `soon`) | `soon` |
| 2 | Laptop (screen shows the UX project) | UX project; later links to a grid of all UX projects | process book PDF page | `soon` |
| 3 | Physical model A | **TBD name** | process book PDF page | `soon` |
| 4 | Physical model B | **TBD name** | process book PDF page | `soon` |
| 5 | Physical model C | **TBD name** | process book PDF page | `soon` |

All items start as `status: "soon"`. Flipping one to `"live"` must be a one-line data change.

### Data model

Drive the page from a single data file (e.g. `src/data/projects.json` or `.ts`). Example shape:

```json
{
  "id": "model-a",
  "title": "TBD",
  "oneLiner": "TBD",
  "type": "physical",
  "image": "/renders/model-a.webp",
  "alt": "TBD descriptive alt text",
  "href": "/work/model-a/",
  "status": "soon",
  "accent": "#TBD",
  "layout": {
    "desktop": { "x": 22, "y": 40, "scale": 1.0, "rotate": -14, "z": 2, "floatPhase": 0.0 },
    "mobile":  { "order": 1, "scale": 1.0, "rotate": -8 }
  }
}
```

- `layout.desktop.x` / `y` are percentages of the hero stage; objects are positioned absolutely within it. `rotate` is degrees.
- `floatPhase` offsets each object's animation so they never move in sync.
- `accent` is the hover background color for that project. Choose accents that **contrast** with the object (a matching accent makes the object vanish).

## 4. Status behavior

- `live`: hover shows title + one-liner; click navigates to `href`.
- `soon`: hover shows title + one-liner + a small "Process book coming soon" chip; click does **not** navigate (no dead links, no 404s). It should still feel intentional: same hover reaction, cursor remains a pointer, and a click gives a small acknowledgement (brief label pulse).

## 5. Page structure

1. **Under-construction banner:** thin strip at the very top, small type, e.g. "Site under construction: process books are being added." Controlled by one flag (`SITE.underConstruction`). Removing it must not shift the layout awkwardly. Not dismissible is fine.
2. **Nav bar:** wordmark "Keshav Sethi" left; **About, Resume, Contact** right.
   - Resume: link to a PDF at `/resume.pdf` (**TBD**: file to be supplied).
   - Contact: `mailto:me@keshavsethi.com`. A simple mailto link is fine; no form.
   - About: **TBD**: route to a stub page, or hide until written (`SITE.showAbout`).
3. **Hero stage:** the floating cluster, full viewport height minus nav.
4. **Name + one-liner:** placed in the lower-left of the stage in the primary typeface, sitting *behind* the objects in z-order so objects may overlap it. Text: "Keshav Sethi" as the large line, then the one-liner: "Designer. Splitting my time between Atlanta & the SF Bay Area. I also take pictures." Keep this as a single constant (`SITE.oneLiner`) so it is easy to change. Must stay legible against every accent background state (check contrast, or let text color adapt).
5. No footer needed on the landing page. A tiny line with location ("Atlanta / SF Bay Area") is optional.

## 6. Interaction spec (starting values: tune by feel)

### Idle
- Each object floats on a slow loop: vertical drift about 6-12px, rotation drift about +/-1.5 degrees, period about 5-8s, eased, with a per-object phase offset.
- Soft drop shadow under each object (CSS filter or separate element) that subtly scales/fades with the float height.

### Hover (desktop, pointer devices)
- Hovered object: scales up about 1.06-1.10, lifts slightly, and tilts toward the cursor (max about 8 degrees, smoothed with easing). The float loop continues underneath or eases out.
- Other objects: dim to about 0.5 opacity and scale about 0.98.
- **Background:** transitions from the dark base to a deep tint of the hovered project's `accent` (about 35% accent mixed into near-black) over about 400-600ms. Returns to the base when hover ends. Base is a dark grey, starting value `#141414`.
- **Spotlight:** a soft, warm pool of light rests over the product cluster and trails the cursor across the stage (pointer devices only; fixed under touch and reduced motion). While an object is active, the light takes on that project's accent.
- **Label:** title + one-liner (+ "coming soon" chip when applicable) fades/slides in near the object, not covering it.
- Cursor: pointer.

### Keyboard
- Every object is a focusable element (link or button semantics). **Focus triggers the same state as hover**, with a visible focus ring.

### Touch devices (no hover)
- Detect via `@media (hover: none)`.
- Labels (title, short one-liner) are **always visible** beneath/near each object.
- Layout switches to a staggered vertical scroll: objects alternate left/right at varied sizes and tilts, still floating gently.
- Tap on a `live` object navigates. Tap on a `soon` object shifts the background to its accent and shows the "Process book coming soon" chip; it does not navigate.
- The background returns to neutral when the user scrolls the object out of view or taps elsewhere.

### Reduced motion
- Under `prefers-reduced-motion: reduce`: disable the float loop and cursor tilt; keep simple opacity/color transitions only.

## 7. Visual design language

- **Minimal.** The objects are the point; everything else recedes.
- **Palette:** dark grey/near-black base with a subtle spotlight, off-white text, a single accent per project (hover only, as a deep tint). No other decorative color.
- **Hierarchy:** product design is the main work. The three physical models sit together in the center of the stage; the laptop (UX) and camera (photography) sit smaller, to either side.
- **Type:** a clean grotesque **sans-serif**. Preferred: Helvetica/system stack with Inter or Geist as the free web-font fallback (Soehne if the user supplies a license). Few sizes, generous letter-spacing discipline, small nav text, a larger name/one-liner.
- **Grain (optional, subtle):** a light film-grain overlay on the background, as in the orange reference. Keep it behind a flag.
- **Future project pages** follow the language of https://www.edquilang.design/design/lunet : big hero image; title with category and year; small metadata block (disciplines, role); alternating full-width images and short headed text blocks; quiet minimal footer. The landing page should feel like it belongs to that family, not copy it.

## 8. Asset requirements (renders)

All objects are delivered as **transparent WebP (with PNG fallback if needed)**:

- Long edge about 1400-1600px, with transparent padding so rotation never clips.
- No baked-in floor, shadow, reflection, or backdrop. The site draws shadows.
- Consistent camera and lighting across all objects: mild perspective (about 50-85mm equivalent), soft key light from upper left, three-quarter view from slightly above (about 20-35 degrees elevation, object turned about 30-45 degrees).
- Clean alpha edges with no halo.
- Silhouette must read at about 200px wide.
- Laptop: open about 100-110 degrees, screen legible, showing the UX project.
- Files live in `public/renders/`, named by project id. Generate responsive sizes (`srcset`) at build time if easy; otherwise ship one size and lazy-load.
- **Placeholders (build these first):** until final renders exist, generate placeholder cutouts as transparent SVGs at `public/renders/<id>.svg`, with the same aspect ratios and padding as the final renders. Make them recognizable, not blank boxes: a soft-shaded silhouette (gradient fill, light highlight) with the project id as a small label. Suggested shapes: camera = rounded body with lens circle; laptop = open-screen trapezoid; models = a sphere, a rounded cube, and a capsule, each in a different muted tone. Each project's `image` field points at its placeholder. Swapping in a real render is a one-line change to that field (`.svg` to `.webp`), with no code changes. Layout, tilt, float, and color-shift must all be tuned against these placeholders so the final renders drop in cleanly.

## 9. Tech and hosting

- **Hosting:** GitHub Pages (static). Must work as a static build. If the site is a *project* site (not `username.github.io`), configure the `base` path correctly so asset URLs don't break.
- **Recommended stack:** Astro (static output) with TypeScript and plain CSS (CSS variables for the accent/background transition), minimal vanilla JS for the pointer-tilt and touch handling. No heavy 3D library. No React unless a real need appears. Deploy via a GitHub Actions workflow to Pages.
- The agent may choose a different stack if it is clearly simpler, but must keep it static and dependency-light.
- **Process books v1:** each project's `href` points to a web-optimized PDF viewing page (or the PDF itself) under `/work/<id>/`. Keep PDFs compressed (target under about 15MB each for mobile). A Lunet-style HTML case-study template is a **later** phase, not part of this build.

## 10. Quality bar

- **Performance:** hero images lazy-loaded below the fold and eagerly loaded for the first view; animate only `transform` and `opacity`; no layout thrash. Target Lighthouse performance 90+ on mobile.
- **Accessibility:** meaningful `alt` text on each render; labels readable by screen readers; keyboard parity with hover; sufficient text contrast in all background states; respects reduced motion.
- **SEO/share:** page title and description, plus an Open Graph/Twitter image (a screenshot of the hero; may be a placeholder until final renders). Recruiters will receive this as a link.
- **Responsive:** verify at 375px, 768px, 1280px, and 1920px widths.

## 11. Acceptance checklist

- [ ] Five floating objects render from the data file, each with its own tilt, scale, and float phase.
- [ ] Hover (desktop) tilts/scales the object, dims the others, shifts the background to the project accent, and reveals the label.
- [ ] `soon` items show "Process book coming soon" and do not navigate; `live` items navigate.
- [ ] Touch layout shows labels at all times and uses the tap behavior described above.
- [ ] Under-construction banner can be removed with a single flag.
- [ ] Nav shows About, Resume, Contact.
- [ ] Keyboard focus mirrors hover; reduced-motion respected.
- [ ] Builds statically and deploys to GitHub Pages.

## 12. Open items (TBD, do not guess)

- Photography grid page (`/photography/`): not built yet; link to a stub or treat as `soon`. Design (sidebar categories) is a later phase.
- Names, one-liners, and accent colors for the three physical models
- Laptop project name and one-liner
- Resume PDF (`/resume.pdf`)
- About page: stub or hidden
- Final renders (use placeholders until supplied)
