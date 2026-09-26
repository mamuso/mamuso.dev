import fs from 'node:fs'
import { join } from 'node:path'
import { readPostIndex } from './post-index.ts'

/** Build/import tooling only: server functions must not trace image binaries. */
export function readCheckedContent(directory = join(process.cwd(), 'content/posts'), assetsDirectory = join(directory, '../assets/feed')) {
  const index = readPostIndex(directory)
  for (const post of index.posts) {
    const { basename } = post.data
    if (!basename) continue
    const image = join(assetsDirectory, basename)
    if (!fs.existsSync(image) || !fs.statSync(image).isFile()) {
      throw new Error(`${post.fileSlug}.md: basename references a missing image: ${basename}`)
    }
  }
  return index
}
