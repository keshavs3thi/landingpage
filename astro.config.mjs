// @ts-check
import { defineConfig } from 'astro/config';
import photoReport from './src/integrations/photo-report.ts';

// GitHub Pages project site: served at https://keshavs3thi.github.io/landingpage/
// Moving to a custom domain: set `base: '/'`, update `site`, add public/CNAME.
export default defineConfig({
  site: 'https://keshavs3thi.github.io',
  base: '/landingpage/',
  output: 'static',
  integrations: [photoReport()],
});
