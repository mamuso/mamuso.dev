import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import matter from 'gray-matter'
import { ExifTool } from 'exiftool-vendored'
import { atomicWrite, listPhotos, preparePhoto, publishPhoto, slugify, writeReview } from '../lib/photo-import.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const inbox = path.join(root, 'photo-inbox')
const workspace = path.join(root, '.photo-import')
const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log('pnpm photos [--review | --publish ID|all]\nDrop photos in photo-inbox/. Drafts, EXIF and review.html live in .photo-import/.\n--review asks for title, slug and date. --publish copies reviewed drafts into content and refreshes assets/feed. No commits or deployment.')
  process.exit(0)
}
if (args.length && !(args.length === 1 && args[0] === '--review') && !(args.length === 2 && args[0] === '--publish')) throw new Error('Unknown arguments. Use --help.')
await fs.mkdir(inbox, { recursive: true })
await fs.mkdir(workspace, { recursive: true })
const lock = path.join(workspace, 'lock')
try { await fs.writeFile(lock, String(process.pid), { flag: 'wx' }) } catch (error) {
  if (error.code !== 'EEXIST') throw error
  const pid = Number(await fs.readFile(lock, 'utf8'))
  let alive = true
  try { process.kill(pid, 0) } catch (failure) { if (failure.code === 'ESRCH') alive = false; else throw failure }
  if (alive) throw new Error('Another photo import is running.')
  await fs.rm(lock)
  await fs.writeFile(lock, String(process.pid), { flag: 'wx' })
}
let exiftool
try {
  if (args[0] === '--publish') {
    const states = await listPhotos(workspace)
    const ids = args[1] === 'all' ? states.filter((s) => s.status === 'prepared').map((s) => s.id) : [args[1]]
    for (const id of ids) {
      try { await publishPhoto(id, workspace, root); console.log(`Published ${id}`) } catch (error) { console.error(`${id}: ${error.message}`); process.exitCode = 1 }
    }
    // Also refresh on a retry after publishing succeeded but a refresh was interrupted.
    for (const script of ['assets', 'rss']) {
      const result = spawnSync('pnpm', ['run', script], { cwd: root, stdio: 'inherit' })
      if (result.error || result.status !== 0) { process.exitCode = 1; console.error(`Refresh failed: pnpm run ${script}`); break }
    }
  } else if (args[0] === '--review') {
    if (!process.stdin.isTTY) throw new Error('--review requires an interactive terminal. You can also edit .photo-import/<ID>/draft.md.')
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    try {
      for (const state of await listPhotos(workspace)) {
        if (state.status !== 'prepared') continue
        const file = path.join(workspace, state.id, 'draft.md')
        const draft = matter(await fs.readFile(file, 'utf8'))
        console.log(`\n${state.source} (${state.id})`)
        draft.data.title = (await rl.question(`Title [${draft.data.title}]: `)).trim() || draft.data.title
        const suggested = draft.data.slug || slugify(draft.data.title)
        draft.data.slug = (await rl.question(`Slug [${suggested}]: `)).trim() || suggested
        draft.data.date = (await rl.question(`Date YYYY-MM-DD [${draft.data.date}]: `)).trim() || draft.data.date
        await atomicWrite(file, matter.stringify(draft.content, draft.data))
      }
    } finally { rl.close() }
  } else {
    exiftool = new ExifTool()
    const counts = { prepared: 0, duplicates: 0, failed: 0, skipped: 0 }
    for (const entry of (await fs.readdir(inbox, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || entry.name.startsWith('.')) continue
      if (!/\.(jpe?g|png|webp|avif|tiff?|heic|heif)$/i.test(entry.name)) { counts.skipped++; console.log(`Unsupported: ${entry.name}`); continue }
      try {
        const result = await preparePhoto(path.join(inbox, entry.name), workspace, (file) => exiftool.read(file))
        counts[result.duplicate ? 'duplicates' : result.status === 'failed' ? 'failed' : 'prepared']++
        console.log(`${entry.name}: ${result.duplicate ? 'already imported' : result.status}${result.error ? ` — ${result.error}` : ''}`)
      } catch (error) { counts.failed++; console.error(`${entry.name}: ${error.message}`) }
    }
    console.log(counts)
    if (counts.failed) process.exitCode = 1
  }
  await writeReview(workspace)
  console.log(`Review: ${path.join(workspace, 'review.html')}`)
} finally {
  try { if (exiftool) await exiftool.end() } finally { await fs.rm(lock, { force: true }) }
}
