import { z } from 'zod'

export const baseFrontmatter = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
})

export const blogFrontmatter = baseFrontmatter.extend({
  topic: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'topic must be a url-safe slug (lowercase letters, digits, dashes)'),
})

export const workFrontmatter = baseFrontmatter.extend({
  org: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
})

export const projectFrontmatter = baseFrontmatter.extend({
  links: z.record(z.string(), z.string().url()).default({}),
})

export const hobbyFrontmatter = baseFrontmatter.extend({
  marker: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
})

export const pageFrontmatter = z.object({
  title: z.string().min(1),
})

export type BaseFrontmatter = z.infer<typeof baseFrontmatter>
export type BlogFrontmatter = z.infer<typeof blogFrontmatter>
export type WorkFrontmatter = z.infer<typeof workFrontmatter>
export type ProjectFrontmatter = z.infer<typeof projectFrontmatter>
export type HobbyFrontmatter = z.infer<typeof hobbyFrontmatter>
export type PageFrontmatter = z.infer<typeof pageFrontmatter>
