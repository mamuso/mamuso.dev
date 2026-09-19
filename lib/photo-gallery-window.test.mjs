import assert from 'node:assert/strict'
import test from 'node:test'
import { photoGalleryWindow } from './photo-gallery-window.ts'

test('initial and subsequent loads remain bounded as the library grows', () => {
  for (const count of [286, 2860, 28600]) {
    assert.equal(photoGalleryWindow(undefined, count).visibleCount, 24)
    assert.equal(photoGalleryWindow('2', count).visibleCount, 48)
    const last = photoGalleryWindow(undefined, count).totalPages
    assert.equal(photoGalleryWindow(String(last), count).visibleCount, count)
    assert.equal(photoGalleryWindow(String(last + 1), count), null)
  }
})

test('small and empty galleries terminate without extra requests', () => {
  assert.deepEqual(photoGalleryWindow(undefined, 0), { page: 1, totalPages: 1, visibleCount: 0 })
  assert.deepEqual(photoGalleryWindow(undefined, 5), { page: 1, totalPages: 1, visibleCount: 5 })
  assert.equal(photoGalleryWindow('2', 24), null)
})

test('only canonical positive integer page values are accepted', () => {
  for (const value of ['0', '-1', '1.0', '1e0', '01', 'NaN', 'Infinity', '1/2', ['1', '2']]) {
    assert.equal(photoGalleryWindow(value, 286), null, String(value))
  }
})
