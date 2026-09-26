import test from 'node:test'
import assert from 'node:assert/strict'
import { homePhotoSlots, selectHomePhotos } from './homePhotoComposition.ts'

const photos = Array.from({ length: 30 }, (_, i) => ({
  basename: `${i}.jpg`, width: i % 2 ? 800 : 1200, height: i % 2 ? 1200 : 800,
}))

test('random selections preserve slot orientation without repeating or mutating photos', () => {
  const original = structuredClone(photos)
  for (let seed = 0; seed < 100; seed++) {
    let state = seed
    const selection = selectHomePhotos(photos, length => (state = (state * 1664525 + 1013904223) >>> 0) % length)
    assert.equal(selection.length, 7)
    assert.equal(new Set(selection.map(photo => photo.basename)).size, 7)
    selection.forEach((photo, index) => {
      assert.equal(photo.height > photo.width, homePhotoSlots[index].portrait)
    })
  }
  assert.deepEqual(photos, original)
})

test('small or single-orientation archives fall back without missing or duplicate images', () => {
  assert.deepEqual(selectHomePhotos([], () => 0), [])
  const landscapes = photos.filter(photo => photo.width > photo.height).slice(0, 4)
  const selection = selectHomePhotos(landscapes, () => 0)
  assert.equal(selection.length, 4)
  assert.equal(new Set(selection.map(photo => photo.basename)).size, 4)
})
