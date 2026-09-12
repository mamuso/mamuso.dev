import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import matter from 'gray-matter'
import { readCheckedContent } from './content-check.ts'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'content-contract-'))
  const posts = join(root, 'posts'), assets = join(root, 'assets/feed')
  mkdirSync(posts); mkdirSync(assets, { recursive: true })
  writeFileSync(join(assets, 'photo.jpg'), 'image fixture')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { posts, write(name, data) { writeFileSync(join(posts, name), matter.stringify('Body', Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)))) } }
}
const note = { title: 'A note', date: '2024-02-29' }
const photo = { ...note, category: 'photo', basename: 'photo.jpg', width: 300, height: 200 }

test('valid notes, illustrated notes, photos and legacy GPS are normalized honestly', t => {
  const f = fixture(t)
  f.write('note.md', note)
  f.write('code.md', { ...note, category: 'code' })
  f.write('illustrated.md', { ...photo, category: 'note' })
  f.write('photo.md', { ...photo, iso: 100, fnumber: 2.8, exposureBiasValue: 0, GPSLatitude: 0, GPSLongitude: 0 })
  f.write('legacy.md', { ...photo, GPSLatitude: 'NaN', GPSLongitude: 'NaN' })
  const { bySlug } = readCheckedContent(f.posts)
  assert.equal(bySlug.get('note').data.category, 'note')
  assert.equal(bySlug.get('note').data.basename, undefined)
  assert.equal(bySlug.get('illustrated').data.width, 300)
  assert.equal(bySlug.get('photo').data.exposureBiasValue, 0)
  assert.equal(bySlug.get('photo').data.GPSLatitude, 0)
  assert.equal(bySlug.get('legacy').data.GPSLatitude, undefined)
})

test('invalid frontmatter and missing assets fail with filename and field', t => {
  const f = fixture(t)
  const cases = [
    [{ ...photo, title: '' }, 'title'], [{ ...photo, date: '2023-02-29' }, 'date'],
    [{ ...photo, basename: 'missing.jpg' }, 'missing image: missing.jpg'],
    [{ ...photo, basename: '../photo.jpg' }, 'basename'],
    [{ ...photo, width: 0 }, 'width'], [{ ...photo, height: 2.5 }, 'width/height'],
    [{ ...photo, width: '300' }, 'width'], [{ ...photo, width: undefined }, 'width/height'],
    [{ ...photo, iso: '100' }, 'iso'], [{ ...photo, fnumber: NaN }, 'fnumber'],
    [{ ...photo, exposureTime: '1/0' }, 'exposureTime'],
    [{ ...photo, GPSLatitude: 91, GPSLongitude: 0 }, 'GPSLatitude'],
    [{ ...photo, GPSLatitude: 0 }, 'GPSLatitude/GPSLongitude'],
    [{ ...photo, colorPalette: ['red'] }, 'colorPalette'],
    [{ ...photo, photoStack: 'Summer night' }, 'photoStack'],
    [{ ...photo, photoStack: 'summer' }, 'photoStackTitle'],
    [{ ...photo, photoStackTitle: 'Summer' }, 'photoStack'],
    [{ ...photo, photoStack: 'summer', photoStackTitle: 'Summer', photoStackOrder: 1.5 }, 'photoStackOrder'],
    [{ ...note, photoStack: 'summer', photoStackTitle: 'Summer' }, 'photoStack'],
  ]
  for (const [data, field] of cases) {
    f.write('broken.md', data)
    assert.throws(() => readCheckedContent(f.posts), error => error.message.includes('broken.md:') && error.message.includes(field), field)
  }
})

test('contradictory stack titles identify both files', t => {
  const f = fixture(t)
  f.write('first.md', { ...photo, photoStack: 'summer', photoStackTitle: 'Summer' })
  f.write('second.md', { ...photo, photoStack: 'summer', photoStackTitle: 'Winter' })
  assert.throws(() => readCheckedContent(f.posts), /second.md: conflicting photoStackTitle.*first.md/)
})

test('malformed YAML reports the source filename', t => {
  const f = fixture(t)
  writeFileSync(join(f.posts, 'syntax.md'), '---\ntitle: [\n---')
  assert.throws(() => readCheckedContent(f.posts), /syntax.md: invalid frontmatter/)
})
