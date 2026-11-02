// Compresses a 3D model exported from CAD into the web-sized model.glb a workshop project points at
// with `model: ./model.glb`. CAD exports are often 20-50MB; this usually brings them to 1-5MB.
//
//   npm run optimize-model -- workshop/05-key-fob/model-src.glb             writes workshop/05-key-fob/model.glb
//   npm run optimize-model -- workshop/05-key-fob/model-src.glb --out x.glb  pick the output name
//
// Name the raw export *-src.glb (or .gltf): those are gitignored and never published. Parts are kept
// as separate objects (no join/flatten) so the exploded view can pull them apart.

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import sharp from 'sharp';

const TEXTURE_MAX = 2048;
const WARN_BYTES = 5 * 1024 * 1024;

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const input = args.find((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1));
if (!input || !/\.(glb|gltf)$/i.test(input)) {
  console.error('Usage: npm run optimize-model -- workshop/<folder>/model-src.glb [--out model.glb]');
  process.exit(1);
}
const output = outIdx >= 0 ? join(dirname(input), args[outIdx + 1]) : join(dirname(input), 'model.glb');
if (relative(input, output) === '') {
  console.error('Output would overwrite the input; name the export *-src.glb or pass --out.');
  process.exit(1);
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const doc = await io.read(input);
const parts = doc.getRoot().listNodes().filter((n) => n.getMesh()).length;

await doc.transform(
  dedup(),
  prune(),
  weld(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEXTURE_MAX, TEXTURE_MAX] }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(output, doc);

const mb = (b) => `${(b / 1024 / 1024).toFixed(1)}MB`;
const [before, after] = [(await stat(input)).size, (await stat(output)).size];
console.log(`${input} (${mb(before)}) -> ${output} (${mb(after)}), ${parts} part${parts === 1 ? '' : 's'}`);
if (parts < 2) console.warn('Only one part: the exploded view needs bodies/components exported as separate objects.');
if (after > WARN_BYTES) console.warn(`Over ${mb(WARN_BYTES)}; slow on phones. Simplify the mesh before exporting.`);
