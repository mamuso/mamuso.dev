import test from 'node:test'
import assert from 'node:assert/strict'
import { selectHomePhotos } from './homePhotoComposition.ts'

const photos = Array.from({ length: 60 }, (_, i) => ({
  basename: `${i}.jpg`, width: i % 2 ? 800 : 1200, height: i % 2 ? 1200 : 800,
}))
const random = seed => length => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return Math.floor(seed / 4294967296 * length)
}

test('varied selections preserve one continuous band and one subtle background photo', () => {
  const original = structuredClone(photos)
  const counts = new Set()
  const anchors = new Set()
  for (let seed = 0; seed < 500; seed++) {
    const selection = selectHomePhotos(photos, random(seed))
    const band = selection.filter(slot => !slot.background)
    const back = selection.filter(slot => slot.background)
    counts.add(band.length)
    anchors.add(band[0].photo.basename)
    assert.ok(band.length === 5 || band.length === 6)
    assert.equal(back.length, 1)
    assert.equal(new Set(selection.map(slot => slot.photo.basename)).size, selection.length)
    assert.ok(band[0].width >= 29 && band[0].width <= 32)
    let edge = 0
    for (const slot of band) {
      assert.ok(Math.abs(slot.left - edge) < 0.000001)
      assert.equal(slot.top, 64)
      assert.equal(slot.height, 76)
      assert.ok(slot.layer > back[0].layer)
      assert.ok(slot.width > 0)
      edge += slot.width
      const focal = slot.objectPosition.match(/[\d.]+/g).map(Number)
      assert.ok(focal.every(value => value >= 47 && value <= 53))
    }
    assert.ok(Math.abs(edge - 100) < 0.000001)
    assert.ok(back[0].top >= 36 && back[0].top <= 44)
    assert.equal(back[0].left, 64)
  }
  assert.deepEqual(counts, new Set([5, 6]))
  assert.ok(anchors.size > 1)
  assert.deepEqual(photos, original)
})

test('small archives remain usable and do not repeat photos', () => {
  assert.deepEqual(selectHomePhotos([], random(1)), [])
  for (let count = 1; count <= 7; count++) {
    const selection = selectHomePhotos(photos.slice(0, count), random(3))
    assert.ok(selection.length <= count)
    assert.equal(new Set(selection.map(slot => slot.photo.basename)).size, selection.length)
    const total = selection.filter(slot => !slot.background).reduce((sum, slot) => sum + slot.width, 0)
    assert.ok(Math.abs(total - 100) < 0.000001)
  }
})
