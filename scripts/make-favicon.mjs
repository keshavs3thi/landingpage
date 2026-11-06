// Builds the favicons from the Emotiballs render, so a new render only needs a re-run.
//
//   npm run favicon     reads public/renders/ball.webp, writes public/favicon.png
//                       and public/apple-touch-icon.png

import sharp from 'sharp';

const SOURCE = 'public/renders/ball.webp';
const FAVICON_SIZE = 96; // browsers downscale this for the tab; 96 stays sharp on high-density screens
const TOUCH_SIZE = 180;
const TOUCH_BG = '#141414'; // iOS fills transparency with black, so give it the site's base colour
const TOUCH_INSET = 0.14; // margin on each side of the touch icon, as a fraction of its size
// The ball's shadow side is near-black and disappears on a dark tab bar at 16px. Lifting the
// midtones keeps the whole circle readable; the render itself stays untouched.
const LIFT = 0.5; // exponent on each colour channel; lower is brighter

const trimmed = await sharp(SOURCE).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
const side = Math.max(trimmed.info.width, trimmed.info.height);

const { data, info } = await sharp(trimmed.data)
  .resize(side, side, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const curve = Uint8Array.from({ length: 256 }, (_, v) => Math.round(255 * (v / 255) ** LIFT));
for (let i = 0; i < data.length; i += 4) {
  data[i] = curve[data[i]];
  data[i + 1] = curve[data[i + 1]];
  data[i + 2] = curve[data[i + 2]];
}

const ball = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

await sharp(ball).resize(FAVICON_SIZE, FAVICON_SIZE).png({ compressionLevel: 9 }).toFile('public/favicon.png');

const inner = Math.round(TOUCH_SIZE * (1 - TOUCH_INSET * 2));
await sharp({ create: { width: TOUCH_SIZE, height: TOUCH_SIZE, channels: 3, background: TOUCH_BG } })
  .composite([{ input: await sharp(ball).resize(inner, inner).toBuffer(), gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile('public/apple-touch-icon.png');

console.log('Wrote public/favicon.png and public/apple-touch-icon.png');
