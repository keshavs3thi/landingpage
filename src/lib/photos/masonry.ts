// Build-time masonry. For each column count, place photos in order into the currently shortest
// column (heights in column-width units, so a photo adds 1/aspect). The result is CSS custom
// properties; photography.css turns them into absolute positions. No runtime JS, no layout shift,
// and the DOM stays in curated order.

export const COLUMN_COUNTS = [1, 2, 3] as const;
const GAP_RATIO = 14 / 380; // gap as a fraction of a typical column width, for comparing columns

export interface Masonry {
  tiles: string[]; // per-photo style: --c{n} column, --k{n} sum of 1/aspect above, --m{n} photos above
  grid: string; // --h{n} tallest column (aspect units), --g{n} photos in that column
  firstRow: boolean[]; // top of a column in any layout: load eagerly
}

export function masonry(sizes: { width: number; height: number }[]): Masonry {
  const tiles = sizes.map(() => [] as string[]);
  const grid: string[] = [];
  const firstRow = sizes.map(() => false);

  for (const n of COLUMN_COUNTS) {
    const k = new Array(n).fill(0);
    const m = new Array(n).fill(0);
    sizes.forEach((s, i) => {
      let c = 0;
      for (let j = 1; j < n; j++) if (k[j] + m[j] * GAP_RATIO < k[c] + m[c] * GAP_RATIO - 1e-9) c = j;
      tiles[i].push(`--c${n}:${c}`, `--k${n}:${+k[c].toFixed(5)}`, `--m${n}:${m[c]}`);
      if (m[c] === 0 && n > 1) firstRow[i] = true;
      k[c] += s.height / s.width;
      m[c] += 1;
    });
    let tallest = 0;
    for (let j = 1; j < n; j++) if (k[j] + m[j] * GAP_RATIO > k[tallest] + m[tallest] * GAP_RATIO) tallest = j;
    grid.push(`--h${n}:${+k[tallest].toFixed(5)}`, `--g${n}:${m[tallest]}`);
  }
  if (sizes.length) firstRow[0] = true;

  return { tiles: tiles.map((t) => t.join(';')), grid: grid.join(';'), firstRow };
}
