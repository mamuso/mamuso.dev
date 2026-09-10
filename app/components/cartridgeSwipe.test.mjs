import assert from 'node:assert/strict'
import test from 'node:test'
import { CartridgeSwipeGesture, swipeCartridgeIndex } from './cartridgeSwipe.ts'

test('left/right drags navigate one neighboring cartridge without wrapping', () => {
  for (const [x, direction] of [[-80, 1], [80, -1]]) {
    const gesture = new CartridgeSwipeGesture()
    gesture.begin(1, 100, 100)
    assert.equal(gesture.move(1, 100 + x, 105), true)
    assert.equal(gesture.release(1), direction)
    assert.equal(gesture.suppressClick, true)
  }
  assert.equal(swipeCartridgeIndex(0, -1, 6), 0)
  assert.equal(swipeCartridgeIndex(5, 1, 6), 5)
  assert.equal(swipeCartridgeIndex(2, 1, 6), 3)
})

test('taps and vertical scrolling do not navigate; axis lock cannot flip midway', () => {
  const gesture = new CartridgeSwipeGesture()
  gesture.begin(1, 100, 100)
  gesture.move(1, 104, 101)
  assert.equal(gesture.release(1), 0)
  assert.equal(gesture.suppressClick, false)
  gesture.begin(2, 100, 100)
  assert.equal(gesture.move(2, 102, 130), false)
  gesture.move(2, 190, 135)
  assert.equal(gesture.state, 'vertical')
  assert.equal(gesture.release(2), 0)
})

test('a short or reversed horizontal drag suppresses the click without changing selection', () => {
  const gesture = new CartridgeSwipeGesture()
  gesture.begin(1, 100, 100)
  assert.equal(gesture.move(1, 130, 100), true)
  gesture.move(1, 100, 100)
  assert.equal(gesture.release(1), 0)
  assert.equal(gesture.suppressClick, true)
})

test('cancelled gestures and other pointers cannot navigate', () => {
  const gesture = new CartridgeSwipeGesture()
  gesture.begin(1, 100, 100)
  gesture.move(2, 200, 100)
  assert.equal(gesture.release(2), 0)
  assert.equal(gesture.state, 'pending')
  gesture.move(1, 200, 100)
  gesture.cancel()
  assert.equal(gesture.release(1), 0)
})
