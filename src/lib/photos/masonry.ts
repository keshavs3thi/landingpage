// Build-time masonry. Verticals and squares take one column; horizontals span two, so they aren't
// dwarfed by the verticals. For each column count, each photo goes where it sits highest with the
// least empty space under it; a photo may swap with one of the next two to fill a gap. Positions
// are CSS custom properties; photography.css turns them into absolute positions. No runtime JS, no
// layout shift, and the DOM stays in curated order.
//
// Heights mix column widths and gaps (a two-column photo is 2 columns + 1 gap wide), so tops are
// kept as k columns + m gaps, which photography.css evaluates exactly at any grid width.

export const COLUMN_COUNTS = [2, 3, 4] as const; // phones, mid-width grids, desktop
const LOOKAHEAD = 3;
const WIDE = 1.2; // aspect ratio at which a photo spans two columns

// Gap as a fraction of a column, at a typical grid width, for comparing heights while packing.
const gapRatio = (n: number) => (14 * n) / 980;

export interface Masonry {
  tiles: string[]; // per-photo style: --c{n} column, --s{n} span, --k{n}/--m{n} top
  grid: string; // --h{n}/--g{n}: the tallest column, in columns and gaps
  firstRow: boolean[]; // at the top in any layout: load eagerly
  wide: boolean[]; // spans two columns (for the image's `sizes`)
}

export function masonry(sizes: { width: number; height: number }[]): Masonry {
  const tiles = sizes.map(() => [] as string[]);
  const grid: string[] = [];
  const firstRow = sizes.map(() => false);
  const wide = sizes.map((s) => s.width / s.height >= WIDE);

  for (const n of COLUMN_COUNTS) {
    const g = gapRatio(n);
    const k = new Array(n).fill(0); // column tops: k columns + m gaps
    const m = new Array(n).fill(0);
    const val = (c: number) => k[c] + m[c] * g;
    const queue = sizes.map((_, i) => i);

    while (queue.length) {
      let best: { q: number; x: number; s: number; top: number; score: number } | undefined;
      queue.slice(0, LOOKAHEAD).forEach((i, q) => {
        const s = wide[i] ? 2 : 1;
        for (let x = 0; x + s <= n; x++) {
          let top = x;
          for (let c = x; c < x + s; c++) if (val(c) > val(top)) top = c;
          let waste = 0;
          for (let c = x; c < x + s; c++) waste += val(top) - val(c);
          const score = val(top) + waste * 2 + q * 0.5;
          if (!best || score < best.score - 1e-9) best = { q, x, s, top, score };
        }
      });

      const { q, x, s, top } = best!;
      const i = queue.splice(q, 1)[0];
      const [tk, tm] = [k[top], m[top]];
      tiles[i].push(`--c${n}:${x}`, `--s${n}:${s}`, `--k${n}:${+tk.toFixed(5)}`, `--m${n}:${+tm.toFixed(5)}`);
      if (tk === 0 && tm === 0) firstRow[i] = true;
      // Height is width / aspect, where width = s columns + (s - 1) gaps; then one gap below.
      const a = sizes[i].width / sizes[i].height;
      for (let c = x; c < x + s; c++) {
        k[c] = tk + s / a;
        m[c] = tm + (s - 1) / a + 1;
      }
    }

    let tallest = 0;
    for (let c = 1; c < n; c++) if (val(c) > val(tallest)) tallest = c;
    grid.push(`--h${n}:${+k[tallest].toFixed(5)}`, `--g${n}:${+m[tallest].toFixed(5)}`);
  }

  return { tiles: tiles.map((t) => t.join(';')), grid: grid.join(';'), firstRow, wide };
}
