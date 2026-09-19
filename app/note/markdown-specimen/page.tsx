import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import Post from '@/app/components/Post'
import type { PostDetail } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Markdown specimen – mamuso.dev',
  robots: { index: false, follow: false },
}

// Keep this fixture outside content/posts so it never enters archives or feeds.
const post: PostDetail = {
  title: 'A field guide to the Markdown template',
  slug: 'markdown-specimen',
  category: 'note',
  date: '2026-09-18',
  content: readFileSync(join(process.cwd(), 'app/note/markdown-specimen/specimen.md'), 'utf8'),
  summary: undefined,
  basename: undefined,
  width: undefined,
  height: undefined,
  camera: undefined,
  iso: undefined,
  fnumber: undefined,
  exposureBiasValue: undefined,
  exposureTime: undefined,
  GPSLatitude: undefined,
  GPSLongitude: undefined,
  colorPalette: undefined,
}

export default function MarkdownSpecimenPage() {
  return <Post post={post} />
}
