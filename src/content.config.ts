import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tagline: z.string(),
    role: z.string(),
    timeline: z.string(),
    stack: z.array(z.string()),
    keyOutcome: z.string(),
    metrics: z.string(),
    liveUrl: z.string().url().nullable().optional(),
    repoUrl: z.string().url().nullable().optional(),
    featured: z.boolean().default(true),
    order: z.number(),
  }),
});

export const collections = { projects };
