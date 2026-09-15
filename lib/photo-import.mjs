import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import quantize from 'quantize'
import matter from 'gray-matter'
import { readPostIndex } from './post-index.ts'

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
export const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
export const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export async function atomicWrite(file, contents) {
  const temporary = `${file}.tmp`
  await fs.writeFile(temporary, contents)
  await fs.rename(temporary, file)
}
export function photoFields(tags) {
  const fields = {}
  const date = tags.DateTimeOriginal ?? tags.CreateDate
  // Keep the camera's calendar date; do not shift it through the host time zone.
  const calendar = typeof date === 'string' ? date.slice(0, 10).replaceAll(':', '-') : date && `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  if (validDate(calendar)) fields.date = calendar
  const make = String(tags.Make ?? '').trim()
  const model = String(tags.Model ?? '').trim()
  const camera = model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`.trim()
  if (camera) fields.camera = camera
  for (const [key, tag] of Object.entries({ iso: 'ISO', fnumber: 'FNumber', exposureBiasValue: 'ExposureCompensation', GPSLatitude: 'GPSLatitude', GPSLongitude: 'GPSLongitude' })) {
    if (typeof tags[tag] === 'number' && Number.isFinite(tags[tag])) fields[key] = tags[tag]
  }
  if (tags.GPSLatitudeRef === 'S' && fields.GPSLatitude !== undefined) fields.GPSLatitude = -Math.abs(fields.GPSLatitude)
  if (tags.GPSLongitudeRef === 'W' && fields.GPSLongitude !== undefined) fields.GPSLongitude = -Math.abs(fields.GPSLongitude)
  const exposure = tags.ExposureTime
  if (typeof exposure === 'number' && exposure > 0) fields.exposureTime = exposure < 1 ? `1/${Math.round(1 / exposure)}` : String(exposure)
  else if (typeof exposure === 'string' && /^(?:\d+(?:\.\d+)?|1\/\d+(?:\.\d+)?)$/.test(exposure)) fields.exposureTime = exposure
  return fields
}
export async function renderPhoto(input, directory) {
  const web = await sharp(input, { failOn: 'error' }).autoOrient().toColourspace('srgb')
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).jpeg({ mozjpeg: true }).toBuffer({ resolveWithObject: true })
  await atomicWrite(path.join(directory, 'web.jpg'), web.data)
  const gallery = await sharp(web.data).resize({ height: 640, withoutEnlargement: true }).jpeg({ mozjpeg: true }).toBuffer()
  await atomicWrite(path.join(directory, 'gallery.jpg'), gallery)
  const { data } = await sharp(web.data).resize({ width: 128, height: 128, fit: 'inside', withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixels = []
  for (let i = 0; i < data.length; i += 3) pixels.push([data[i], data[i + 1], data[i + 2]])
  const unique = [...new Map(pixels.map((pixel) => [pixel.join(','), pixel])).values()]
  const palette = unique.length <= 8 ? unique : quantize(pixels, 8).palette()
  return { width: web.info.width, height: web.info.height, colorPalette: [...new Set(palette.map((rgb) => '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('')))] }
}
export async function preparePhoto(input, workspace, readExif) {
  const bytes = await fs.readFile(input)
  const id = sha256(bytes)
  const directory = path.join(workspace, id)
  await fs.mkdir(directory, { recursive: true })
  const stateFile = path.join(directory, 'state.json')
  let previous
  try { previous = JSON.parse(await fs.readFile(stateFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (previous?.status === 'published') return { ...previous, duplicate: true }
  if (previous?.status === 'prepared') {
    try {
      await Promise.all(['web.jpg', 'gallery.jpg', 'draft.md', 'exif.json'].map((file) => fs.access(path.join(directory, file))))
      return { ...previous, duplicate: true }
    } catch { /* Repair an interrupted/incomplete preparation, preserving editorial edits. */ }
  }
  const state = { id, source: path.basename(input), status: 'processing' }
  await atomicWrite(stateFile, JSON.stringify(state, null, 2))
  try {
    let tags = {}
    const warnings = []
    try { tags = await readExif(input) } catch (error) { warnings.push(`EXIF: ${error.message}`) }
    const fields = photoFields(tags)
    const rendered = await renderPhoto(bytes, directory)
    await atomicWrite(path.join(directory, 'exif.json'), JSON.stringify(tags, null, 2))
    const draft = { title: '', slug: '', date: fields.date ?? '', category: 'photo', basename: `photo-${id}.jpg`, ...fields, ...rendered }
    if (!fields.date) warnings.push('Missing capture date: set date in draft.md.')
    // Never replace a person's title, slug, caption or chosen date when retrying.
    const draftFile = path.join(directory, 'draft.md')
    try { await fs.writeFile(draftFile, matter.stringify('', draft), { flag: 'wx' }) } catch (error) { if (error.code !== 'EEXIST') throw error }
    Object.assign(state, { status: 'prepared', warnings })
  } catch (error) {
    Object.assign(state, { status: 'failed', error: error.message })
  }
  await atomicWrite(stateFile, JSON.stringify(state, null, 2))
  return state
}
export async function listPhotos(workspace) {
  await fs.mkdir(workspace, { recursive: true })
  const entries = await fs.readdir(workspace)
  const states = await Promise.all(entries.filter((name) => /^[a-f0-9]{64}$/.test(name)).sort().map(async (id) => {
    try { return JSON.parse(await fs.readFile(path.join(workspace, id, 'state.json'), 'utf8')) } catch (error) {
      if (error.code === 'ENOENT') return null // Interrupted before the first state write; the next import repairs it.
      throw error
    }
  }))
  return states.filter(Boolean)
}
export async function publishPhoto(id, workspace, root) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid photo ID')
  const directory = path.join(workspace, id)
  const state = JSON.parse(await fs.readFile(path.join(directory, 'state.json'), 'utf8'))
  if (state.status === 'published') return state
  if (state.status !== 'prepared') throw new Error('Photo is not prepared')
  const markdown = await fs.readFile(path.join(directory, 'draft.md'), 'utf8')
  const { data } = matter(markdown)
  if (typeof data.title !== 'string' || !data.title.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug ?? '') || !validDate(data.date)) throw new Error('Set a title, descriptive slug and valid YYYY-MM-DD date in draft.md')
  const basename = `photo-${id}`
  if (data.category !== 'photo' || data.basename !== `${basename}.jpg`) throw new Error('Do not change category or basename')
  const image = await sharp(path.join(directory, 'web.jpg')).metadata()
  if (data.width !== image.width || data.height !== image.height) throw new Error('Draft dimensions do not match the rendered image')
  if (!Array.isArray(data.colorPalette) || !data.colorPalette.length || data.colorPalette.some((color) => !/^#[a-f0-9]{6}$/i.test(color))) throw new Error('Invalid color palette')
  const posts = path.join(root, 'content/posts')
  const feed = path.join(root, 'content/assets/feed')
  await fs.mkdir(posts, { recursive: true })
  await fs.mkdir(feed, { recursive: true })
  const index = readPostIndex(posts)
  for (const key of new Set([basename, data.slug])) {
    const existing = index.bySlug.get(key)
    if (existing && (existing.fileSlug !== basename || await fs.readFile(path.join(posts, `${basename}.md`), 'utf8') !== markdown)) throw new Error(`Existing publication owns URL ${key}`)
  }
  // Complete assets first, Markdown last. Identical files allow recovery after interruption.
  for (const [source, destination] of [['web.jpg', `${basename}.jpg`], ['gallery.jpg', `gallery-${basename}.jpg`]]) {
    await installFile(await fs.readFile(path.join(directory, source)), path.join(feed, destination))
  }
  await installFile(Buffer.from(markdown), path.join(posts, `${basename}.md`))
  state.status = 'published'
  await atomicWrite(path.join(directory, 'state.json'), JSON.stringify(state, null, 2))
  return state
}
async function installFile(bytes, destination) {
  const temporary = `${destination}.importing`
  await fs.writeFile(temporary, bytes)
  try { await fs.link(temporary, destination) } catch (error) {
    if (error.code !== 'EEXIST' || sha256(await fs.readFile(destination)) !== sha256(bytes)) throw new Error(`Refusing to overwrite ${destination}`, { cause: error })
  } finally { await fs.rm(temporary, { force: true }) }
}
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
export async function writeReview(workspace) {
  const photos = await listPhotos(workspace)
  const cards = await Promise.all(photos.map(async (state) => {
    if (state.status === 'failed' || state.status === 'processing') return `<article><h2>${escape(state.source)}</h2><p>${escape(state.error ?? 'Interrupted; rerun import')}</p></article>`
    const { data } = matter(await fs.readFile(path.join(workspace, state.id, 'draft.md'), 'utf8'))
    return `<article><h2>${escape(data.title || state.source)}</h2><img style="max-width:100%;max-height:480px" src="${state.id}/gallery.jpg" alt="${escape(data.title || state.source)}"><p>${escape(state.status)} · ${escape(data.date || 'Date needed')} · ${escape(data.width)} × ${escape(data.height)}</p><p>${(data.colorPalette ?? []).filter((c) => /^#[a-f0-9]{6}$/i.test(c)).map((c) => `<span style="display:inline-block;border:1px solid #aaa;padding:12px;background:${c}" title="${c}"></span>`).join('')}</p><p>${escape((state.warnings ?? []).join(' '))}</p><a href="${state.id}/draft.md">Markdown</a> · <a href="${state.id}/exif.json">EXIF</a><p><code>${state.id}</code></p></article>`
  }))
  await atomicWrite(path.join(workspace, 'review.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Photo inbox</title><body style="font-family:system-ui;max-width:900px;margin:32px auto;padding:16px"><h1>Photo inbox</h1><p>Edit each draft or run pnpm photos --review. Publish with pnpm photos --publish ID.</p>${cards.join('\n')}</body></html>`)
}
