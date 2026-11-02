// @ts-check
import { defineConfig } from 'astro/config';
import photoReport from './src/integrations/photo-report.ts';

// Served at https://keshavsethi.com/ from the keshavs3thi.github.io repo (see scripts/deploy.mjs).
// public/CNAME keeps the custom domain attached on every deploy.
export default defineConfig({
  site: 'https://keshavsethi.com',
  base: '/',
  output: 'static',
  integrations: [photoReport()],
});
