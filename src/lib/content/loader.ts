import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { ZodType } from 'zod'
import { pageFrontmatter, type PageFrontmatter } from '@/lib/content/schemas'

export type Entry<T> = { slug: string; frontmatter: T; body: string }

const defaultRoot = () => path.join(process.cwd(), 'content')

function parseFile<T>(filePath: string, label: string, schema: ZodType<T>): { frontmatter: T; body: string } {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in ${label}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`)
  }
  return { frontmatter: parsed.data, body: content.trim() }
}

export function loadCollection<T extends { date: Date; draft: boolean }>(
  dir: string,
  schema: ZodType<T>,
  root: string = defaultRoot(),
): Entry<T>[] {
  const collectionDir = path.join(root, dir)
  if (!fs.existsSync(collectionDir)) return []
  return fs
    .readdirSync(collectionDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ''),
      ...parseFile(path.join(collectionDir, file), `${dir}/${file}`, schema),
    }))
    .filter((e) => !e.frontmatter.draft)
    .sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime())
}

export function loadPage(name: string, root: string = defaultRoot()): { frontmatter: PageFrontmatter; body: string } {
  return parseFile(path.join(root, `${name}.mdx`), `${name}.mdx`, pageFrontmatter)
}
