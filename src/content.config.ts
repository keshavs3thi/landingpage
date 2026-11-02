// Content collections. Workshop: one folder per mini project under workshop/, each with an index.md
// (frontmatter + case-study text) and its images. See workshop/03-your-project/index.md for the fields.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const REQUIRED = ['title', 'tagline', 'year', 'context', 'summary', 'hero', 'heroAlt'] as const;

const workshop = defineCollection({
  loader: glob({ base: './workshop', pattern: '*/index.md' }),
  schema: ({ image }) =>
    z
      .object({
        draft: z.boolean().default(false),
        title: text.nullish(),
        tagline: text.nullish(),
        year: z.coerce.number().int().nullish(),
        context: text.nullish(), // location or course
        summary: text.nullish(),
        hero: image().nullish(), // a still; with heroVideo it's the poster and share image
        heroVideo: z
          .string()
          .regex(/^\.\/[^/]+\.(mp4|webm)$/, 'heroVideo must be a file next to index.md, e.g. ./hero.mp4')
          .nullish(),
        heroAlt: text.nullish(),
        // optional 3D model; replaces the hero on the project page (the still becomes its poster)
        model: z
          .string()
          .regex(/^\.\/[^/]+\.glb$/, 'model must be a .glb next to index.md, e.g. ./model.glb')
          .refine((f) => !/-src\.glb$/.test(f), 'point model at the optimized file (npm run optimize-model), not the -src export')
          .nullish(),
        modelExplode: z.number().positive().default(1), // exploded-view distance; 2 = twice as far apart
        heroLink: z.url().nullish(), // clicking the hero opens this (new tab) instead of the project page
        order: z.number().default(Infinity),
        page: z.boolean().default(true),
        role: text.nullish(),
        tools: z.array(text).nullish(),
        team: text.nullish(),
        gallery: z.array(z.object({ src: image(), alt: text, caption: text.optional() })).nullish(),
      })
      // Drafts may be half-filled; everything else needs the fields the list and page show.
      .superRefine((d, ctx) => {
        if (d.draft) return;
        for (const k of REQUIRED)
          if (d[k] == null) ctx.addIssue({ code: 'custom', path: [k], message: `"${k}" is required (or set draft: true)` });
      }),
});

export const collections = { workshop };
