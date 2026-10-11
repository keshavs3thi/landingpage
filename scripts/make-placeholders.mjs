// Generates labelled grey placeholder photos under photos/ so the gallery can be built and tuned
// before real photos exist. Real photos drop into the same folders; delete the sample-* folders then.
// Each JPEG carries fake EXIF, including a fake GPS block, to prove the build reads EXIF and strips it.
//
//   npm run placeholders   (overwrites photos/<year>/sample-*, the NN-loose-NN.jpg files, sample year.yml
//                           files and photos/selected.yml)

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = 'photos';
const LONG = 2400;
const RATIOS = { '2:3': 2 / 3, '3:2': 3 / 2, '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9, '3:1': 3, '9:16': 9 / 16 };
const CYCLE = ['3:2', '2:3', '1:1', '4:5', '16:9', '2:3', '3:1', '3:2', '9:16', '4:5'];

const PROJECTS = [
  {
    dir: '2025/sample-a',
    count: 12,
    yml: `title: Sample A
order: 1
description: Placeholder project description.
location: Sample location
subject: Sample subject
medium: digital
`,
  },
  {
    dir: '2025/sample-b',
    count: 4,
    yml: `title: Sample B
order: 2
description: Placeholder film project. Exercises film stock, manual camera/lens and a title.
location: Sample location
subject: Sample subject
medium: film
film: Sample film stock
camera: Sample film camera
lens: Sample lens
photos:
  01-photo-01.jpg:
    title: Sample title
    alt: Placeholder photo with a title
    date: 2025-03-01
  03-photo-03.jpg:
    film: Second sample film stock
`,
  },
  { dir: '2024/sample-c', count: 40, yml: `title: Sample C\ndescription: Forty placeholders to stress the grid and the viewer counter.\nmedium: digital\n` },
  { dir: '2023/sample-d', count: 1, yml: `title: Sample D\ndescription: A single placeholder photo.\nlocation: Sample location\n` },
  { dir: '2023/sample-empty', count: 0, yml: `title: Sample Empty\ndescription: No photos; must be hidden from the nav.\n` },
  { dir: '2023/sample-noyml', count: 2, yml: null },
];

// Loose photos: straight in a year folder, no project. Kept to a sample-only year (2022) so they
// never mix with real photos placed loose in other years.
const LOOSE = [
  {
    year: '2022',
    count: 3,
    yml: `# Optional: defaults and per-photo overrides for photos placed straight in this year folder.
location: Sample location
photos:
  01-loose-01.jpg:
    title: Sample loose title
    alt: Placeholder loose photo with a title
`,
  },
];

const SELECTED = `# Curated set for /photography/, in display order. Paths are relative to photos/.
- 2025/sample-a/02-photo-02.jpg
- 2024/sample-c/07-photo-07.jpg
- 2025/sample-b/01-photo-01.jpg
- 2022/02-loose-02.jpg
- 2025/sample-a/99-photo-99.jpg   # deliberately missing: the build should warn about it
`;

function label(w, h, text, grey) {
  const ink = grey > 128 ? '#1a1a1a' : '#e8e8e8';
  const size = Math.round(Math.min(w, h) / 14);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect x="${size}" y="${size}" width="${w - 2 * size}" height="${h - 2 * size}" fill="none" stroke="${ink}" stroke-opacity="0.25" stroke-width="4"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-size="${size}" fill="${ink}" fill-opacity="0.75">${text}</text>
    </svg>`,
  );
}

async function photo(path, ratioKey, text, seed) {
  const r = RATIOS[ratioKey];
  const w = r >= 1 ? LONG : Math.round(LONG * r);
  const h = r >= 1 ? Math.round(LONG / r) : LONG;
  const grey = 70 + ((seed * 37) % 120); // varied greys so dominant colours and tiles differ
  const tint = (seed * 13) % 18; // a faint warm/cool shift
  await sharp({ create: { width: w, height: h, channels: 3, background: { r: grey + tint, g: grey, b: grey - tint / 2 } } })
    .composite([{ input: label(w, h, `${text} · ${ratioKey}`, grey) }])
    .withExif({
      IFD0: { Make: 'Placeholder', Model: 'Placeholder Cam' },
      IFD2: {
        LensModel: 'Placeholder 50mm',
        FNumber: `${28 + (seed % 5) * 10}/10`,
        ExposureTime: `1/${[60, 125, 250, 500, 1000][seed % 5]}`,
        ISOSpeedRatings: String([100, 200, 400, 800][seed % 4]),
        DateTimeOriginal: `20${23 + (seed % 3)}:0${1 + (seed % 9)}:1${seed % 9} 10:00:00`,
      },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '32/1 4/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '81/1 5/1 0/1' },
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path);
}

let seed = 1;
for (const p of PROJECTS) {
  const dir = join(ROOT, p.dir);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  if (p.yml) await writeFile(join(dir, 'project.yml'), p.yml);
  if (p.count === 0) await writeFile(join(dir, '.gitkeep'), '');
  for (let i = 1; i <= p.count; i++) {
    const nn = String(i).padStart(2, "0");
    const name = `${nn}-photo-${nn}.jpg`;
    const ratio = CYCLE[(i - 1 + seed) % CYCLE.length];
    await photo(join(dir, name), ratio, `${p.dir.split('/')[1]} / ${name.replace('.jpg', '')}`, seed++);
  }
  console.log(`${p.dir}: ${p.count} photo(s)`);
}
for (const l of LOOSE) {
  const dir = join(ROOT, l.year);
  await mkdir(dir, { recursive: true });
  for (const f of await readdir(dir)) if (/^\d+-loose-\d+\.jpg$/.test(f)) await rm(join(dir, f));
  if (l.yml) await writeFile(join(dir, 'year.yml'), l.yml);
  for (let i = 1; i <= l.count; i++) {
    const nn = String(i).padStart(2, '0');
    const name = `${nn}-loose-${nn}.jpg`;
    const ratio = CYCLE[(i - 1 + seed) % CYCLE.length];
    await photo(join(dir, name), ratio, `${l.year} (no project) / ${name.replace('.jpg', '')}`, seed++);
  }
  console.log(`${l.year}: ${l.count} loose photo(s)`);
}
await writeFile(join(ROOT, 'selected.yml'), SELECTED);
console.log('photos/selected.yml written');
