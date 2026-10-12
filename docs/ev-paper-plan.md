# Plan: host the EV research paper at /ev-paper/

**Status: waiting on files.** Drop `ev-paper.docx` and `ev-paper.pdf` in the repo root, then ask Claude to execute this plan.

Decisions made: URL `/ev-paper/`; download offers the PDF only; not linked from the nav.

## Context
Keshav wants his IB research paper ("The ubiquitization of Electric Vehicles in North America: a blessing or a curse?") on the site as its own page at `/ev-paper/`, in the same dark, minimal style as `/resume/`, with the original PDF downloadable at the top. It is not linked from the nav; a future page will link to it. He has it as a Word doc and as a PDF.

## What Keshav provides
- `ev-paper.docx` (the source for the HTML conversion: it keeps headings, italics, footnotes and images far more faithfully than a PDF does) and `ev-paper.pdf` (the download). Drop both in the repo root; the PDF moves to `public/ev-paper.pdf`. The .docx stays out of `public/`, so it isn't shipped.

## Approach
Convert the .docx to clean semantic HTML once with **mammoth** (a small Node library built for docx → semantic HTML), then commit the result. The site renders that committed HTML, so the build doesn't depend on the .docx, and typos can be fixed directly in the HTML.

## Changes
1. **`scripts/convert-docx.mjs` (new)** + `mammoth` as a devDependency, `npm run convert-paper` script (same pattern as `placeholders` / `resize-photos` in `package.json`).
   - Input: a .docx path. Output: `src/content/ev-paper.html` (body fragment only).
   - Style map: Title → dropped (the page renders the title itself), Heading 1/2 → `h2`/`h3`, Quote → `blockquote`.
   - Images (if any) written to `public/ev-paper/` and referenced by path, not inlined as base64.
   - Footnotes/endnotes come through as mammoth's linked `<ol>`. The script prints mammoth's conversion warnings so nothing is silently lost.
2. **`src/pages/ev-paper.astro` (new):** `Base` layout (banner, nav, grain) with:
   - Header: title, small metadata line (e.g. "IB Extended Essay · 2023 · 4,000 words"; exact wording taken from the doc itself, not invented), and the **Download PDF ↓** pill (`download="Keshav-Sethi-EV-Paper.pdf"`), shown only if `public/ev-paper.pdf` exists.
   - Body: `<article class="paper" set:html={html}>`, where `html` is the committed fragment imported with `?raw`.
   - `<title>`/description for sharing.
3. **Shared download button:** move `.resume-download` from `src/styles/resume.css` to a shared `.download-pill` in `src/styles/global.css` and use it on both pages (sticky behavior included). Generalize `inPublic` in `src/lib/resume.ts` into a small exported `inPublic(path)` helper, reused by the new page.
4. **`src/styles/paper.css` (new):** reading typography in site tokens. ~68ch measure, 17–18px body, 1.65 line height, `--text-muted` for captions and footnotes, `h2`/`h3` styled like the resume's section headings, ruled blockquotes, footnote list in small muted type, and images full measure with captions.
5. **Not in the nav.** Add `/ev-paper/` to `src/pages/sitemap.xml.ts` so search engines can find it (one-line removal if it should stay unlisted).
6. **Resume tie-in (optional, later):** the `src/data/resume.ts` "Secondary Research Paper" entry could link to `/ev-paper/`. Not done now, since the link will come from a future page.

## Verification
- `npm run convert-paper -- ev-paper.docx` runs; review the warnings and diff the HTML against the PDF section by section (headings, footnote numbering, italics, quotes, bibliography).
- `npm run build` clean; `dist/ev-paper/index.html` and `dist/ev-paper.pdf` exist; links use the `/landingpage/` base; the page is absent from the nav.
- Screenshot at 1280 and 375 (iframe method). Download pill visible and sticky; footnote links jump and return correctly.
- `/resume/` still looks identical after the download-pill refactor.
