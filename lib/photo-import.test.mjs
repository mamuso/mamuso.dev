import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import matter from 'gray-matter'
import { ExifTool } from 'exiftool-vendored'
import { photoFields, preparePhoto, publishPhoto, renderPhoto, validDate, writeReview } from './photo-import.mjs'

async function temporary(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'photo-import-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  return dir
}
test('all eight EXIF orientations preserve the expected corner positions and bounded dimensions', async (t) => {
  const dir = await temporary(t)
  const width = 2400, height = 1200
  const pixels = Buffer.alloc(width * height * 3)
  const colors = [[240, 10, 10], [10, 240, 10], [10, 10, 240], [240, 240, 10]]
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const color = colors[(y >= height / 2 ? 2 : 0) + (x >= width / 2 ? 1 : 0)]
    pixels.set(color, (y * width + x) * 3)
  }
  const corners = [[0,1,2,3], [1,0,3,2], [3,2,1,0], [2,3,0,1], [0,2,1,3], [2,0,3,1], [3,1,2,0], [1,3,0,2]]
  for (let orientation = 1; orientation <= 8; orientation++) {
    const input = await sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg().withMetadata({ orientation }).toBuffer()
    const result = await renderPhoto(input, dir)
    assert.deepEqual([result.width, result.height], orientation >= 5 ? [1024,2048] : [2048,1024])
    const { data, info } = await sharp(path.join(dir, 'web.jpg')).raw().toBuffer({ resolveWithObject: true })
    const locations = [[.1,.1],[.9,.1],[.1,.9],[.9,.9]]
    locations.forEach(([x,y], corner) => {
      const offset = (Math.floor(y * info.height) * info.width + Math.floor(x * info.width)) * 3
      const expected = colors[corners[orientation - 1][corner]]
      expected.forEach((channel, i) => assert.ok(Math.abs(data[offset + i] - channel) < 20, `orientation ${orientation}, corner ${corner}`))
    })
    assert.equal((await sharp(path.join(dir, 'web.jpg')).metadata()).orientation, undefined)
  }
})
test('EXIF mapping retains zero bias, signed GPS, local date and long exposure without fabricated fields', () => {
  assert.deepEqual(photoFields({}), {})
  assert.deepEqual(photoFields({ Make:'Canon', Model:'Canon R5', DateTimeOriginal:{year:2026,month:9,day:6}, ExposureTime:2.5, ExposureCompensation:0, GPSLatitude:20, GPSLatitudeRef:'S', GPSLongitude:122, GPSLongitudeRef:'W' }), {date:'2026-09-06',camera:'Canon R5',exposureBiasValue:0,GPSLatitude:-20,GPSLongitude:-122,exposureTime:'2.5'})
  assert.equal(validDate('2026-02-30'), false)
  assert.equal(photoFields({ExposureTime:'1/125'}).exposureTime, '1/125')
})
test('real ExifTool reads an oriented image, including capture date and exposure', async (t) => {
  const dir = await temporary(t)
  const file = path.join(dir,'camera.jpg')
  await sharp({create:{width:40,height:20,channels:3,background:'white'}}).jpeg().withExif({IFD0:{Make:'Canon',Model:'EOS R5'},IFD2:{DateTimeOriginal:'2026:09:06 23:45:00',ExposureTime:'5/2',ISOSpeedRatings:'400'}}).toFile(file)
  const exif = new ExifTool()
  try {
    const result = photoFields(await exif.read(file))
    assert.equal(result.date,'2026-09-06')
    assert.equal(result.camera,'Canon EOS R5')
    assert.equal(result.exposureTime,'2.5')
  } finally { await exif.end() }
})
test('preparation, duplicate rename, repair, editorial preservation and interrupted publication recovery', async (t) => {
  const root = await temporary(t)
  const workspace = path.join(root,'drafts')
  const input = path.join(root,'white.jpg')
  await sharp({create:{width:80,height:120,channels:3,background:'white'}}).jpeg().toFile(input)
  const state = await preparePhoto(input,workspace,async () => ({}))
  assert.equal(state.status,'prepared')
  const directory = path.join(workspace,state.id)
  const draftFile = path.join(directory,'draft.md')
  const draft = matter(await fs.readFile(draftFile,'utf8'))
  assert.deepEqual(draft.data.colorPalette,['#ffffff'])
  assert.deepEqual([draft.data.width,draft.data.height],[80,120])
  await assert.rejects(publishPhoto(state.id,workspace,root), /title/)
  Object.assign(draft.data,{title:'White: "Study"',slug:'white-study',date:'2026-09-06'})
  await fs.writeFile(draftFile,matter.stringify('A caption.',draft.data))
  const renamed = path.join(root,'renamed.jpg')
  await fs.copyFile(input,renamed)
  assert.equal((await preparePhoto(renamed,workspace,async () => {throw new Error('should not read')})).duplicate,true)
  await fs.rm(path.join(directory,'gallery.jpg'))
  await preparePhoto(input,workspace,async () => ({}))
  assert.equal(matter(await fs.readFile(draftFile,'utf8')).data.title,'White: "Study"')
  const assets = path.join(root,'content/assets/feed')
  await fs.mkdir(assets,{recursive:true})
  await fs.copyFile(path.join(directory,'web.jpg'),path.join(assets,`photo-${state.id}.jpg`))
  assert.equal((await publishPhoto(state.id,workspace,root)).status,'published')
  // Simulate interruption after Markdown installation but before state update.
  await fs.writeFile(path.join(directory,'state.json'),JSON.stringify(state))
  assert.equal((await publishPhoto(state.id,workspace,root)).status,'published')
  await writeReview(workspace)
  assert.match(await fs.readFile(path.join(workspace,'review.html'),'utf8'),/White: &quot;Study&quot;/)
})
test('corrupt images fail individually and are retried; EXIF errors are visible warnings', async (t) => {
  const root = await temporary(t)
  const input = path.join(root,'bad.jpg')
  await fs.writeFile(input,'broken')
  const first = await preparePhoto(input,root,async () => ({}))
  assert.equal(first.status,'failed')
  assert.equal((await preparePhoto(input,root,async () => ({}))).status,'failed')
  await sharp({create:{width:10,height:10,channels:3,background:'red'}}).jpeg().toFile(input)
  const next = await preparePhoto(input,root,async () => {throw new Error('metadata unavailable')})
  assert.equal(next.status,'prepared')
  assert.match(next.warnings.join(' '), /metadata unavailable/)
})
test('publication refuses canonical/filename collisions and differing image files', async (t) => {
  const root = await temporary(t)
  const workspace = path.join(root,'drafts')
  const input = path.join(root,'photo.jpg')
  await sharp({create:{width:12,height:24,channels:3,background:'blue'}}).jpeg().toFile(input)
  const state = await preparePhoto(input,workspace,async () => ({}))
  const draftFile = path.join(workspace,state.id,'draft.md')
  const draft = matter(await fs.readFile(draftFile,'utf8'))
  Object.assign(draft.data,{title:'Blue',slug:'taken',date:'2026-09-06'})
  await fs.writeFile(draftFile,matter.stringify('',draft.data))
  const posts = path.join(root,'content/posts')
  await fs.mkdir(posts,{recursive:true})
  const old = matter.stringify('',{title:'Existing',slug:'taken',date:'2024-01-01'})
  await fs.writeFile(path.join(posts,'old.md'),old)
  await assert.rejects(publishPhoto(state.id,workspace,root),/owns URL/)
  draft.data.slug = 'old'
  await fs.writeFile(draftFile,matter.stringify('',draft.data))
  await assert.rejects(publishPhoto(state.id,workspace,root),/owns URL/)
  draft.data.slug = 'available'
  await fs.writeFile(draftFile,matter.stringify('',draft.data))
  const destination = path.join(root,'content/assets/feed',draft.data.basename)
  await fs.writeFile(destination,'other content')
  await assert.rejects(publishPhoto(state.id,workspace,root),/Refusing to overwrite/)
  assert.equal(await fs.readFile(destination,'utf8'),'other content')
  assert.equal(await fs.readFile(path.join(posts,'old.md'),'utf8'),old)
})
