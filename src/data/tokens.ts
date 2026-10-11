// Shared colour tokens for every page. Values follow the landing page; tokens.css mirrors them as
// fallbacks and the layouts inject these on <html>, so this file is the one place to change them.
import { SITE } from './site';
import { contrast } from '../lib/url';

export const COLORS = {
  bg: SITE.baseBg,
  text: '#F6F3EE',
  textMuted: '#908F8C', // ~55% text over bg; keeps the warm cast
  line: '#2F2F2E', // ~12% text over bg
} as const;

if (contrast(COLORS.textMuted, COLORS.bg) < 4.5) {
  throw new Error(`--text-muted ${COLORS.textMuted} is below 4.5:1 on ${COLORS.bg}`);
}

export const tokenStyle = [
  `--base-bg:${COLORS.bg}`,
  `--text:${COLORS.text}`,
  `--text-muted:${COLORS.textMuted}`,
  `--line:${COLORS.line}`,
].join(';');
