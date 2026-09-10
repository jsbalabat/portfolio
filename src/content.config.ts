import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    role: z.string(),
    timeline: z.string(),
    stack: z.array(z.string()),
    liveUrl: z.string().url().nullable().optional(),
    demoVideo: z.string().nullable().optional(),
    repoUrl: z.string().url().nullable().optional(),
    featured: z.boolean().default(false),
    order: z.number(),
  }),
});

export const collections = { work };
