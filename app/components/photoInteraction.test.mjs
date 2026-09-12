import test from 'node:test'
import assert from 'node:assert/strict'
import { createPhotoInteraction } from './photoInteraction.ts'

test('entry stays still; subsequent movement follows the pointer and persists', () => {
  const interaction = createPhotoInteraction()
  interaction.begin('hover', 100, 100)
  assert.deepEqual(interaction.position, { x: 0, y: 0, angle: 0 })
  assert.equal(interaction.move(100, 100).scatter, false)
  interaction.move(130, 115)
  assert.deepEqual(interaction.position, { x: 1, y: 0.5, angle: 0.15 })
  interaction.finish('leave')
  interaction.begin('hover', 500, 500)
  assert.deepEqual(interaction.position, { x: 1, y: 0.5, angle: 0.15 })
  interaction.move(470, 485)
  assert.deepEqual(interaction.position, { x: 0, y: 0, angle: 0 })
})

test('composition is generated only once across hovers and drags', () => {
  const interaction = createPhotoInteraction()
  interaction.begin('hover', 0, 0)
  assert.equal(interaction.move(10, 5).scatter, true)
  interaction.finish('leave')
  interaction.begin('hover', 0, 0)
  assert.equal(interaction.move(10, 5).scatter, false)
  interaction.finish('leave')
  interaction.begin('pressed', 0, 0)
  assert.equal(interaction.move(30, 20).scatter, false)
})

test('taps open normally; dragging captures once and suppresses only its click', () => {
  const interaction = createPhotoInteraction()
  interaction.begin('pressed', 0, 0)
  assert.equal(interaction.move(3, 2).capture, false)
  interaction.finish('release')
  assert.equal(interaction.consumeClick(1), false)
  interaction.begin('pressed', 0, 0)
  assert.equal(interaction.move(30, 20).capture, true)
  assert.equal(interaction.move(40, 20).capture, false)
  const position = interaction.position
  interaction.finish('leave')
  assert.equal(interaction.phase, 'dragging')
  interaction.finish('release')
  interaction.finish('cancel') // Browser releases pointer capture after pointerup.
  assert.deepEqual(interaction.position, position)
  assert.equal(interaction.consumeClick(1), true)
  assert.equal(interaction.consumeClick(1), false)
})

test('cancelled touch drag restores the last resting position', () => {
  const interaction = createPhotoInteraction()
  interaction.begin('hover', 0, 0)
  interaction.move(30, 0)
  interaction.finish('leave')
  const resting = interaction.position
  interaction.begin('pressed', 0, 0)
  interaction.move(50, 50)
  interaction.finish('cancel')
  assert.deepEqual(interaction.position, resting)
  assert.equal(interaction.consumeClick(1), false)
})

test('repeated gestures stay bounded and keyboard activation is never suppressed', () => {
  const interaction = createPhotoInteraction()
  for (let i = 0; i < 20; i++) {
    interaction.begin('hover', 0, 0)
    interaction.move(1000, -1000)
    interaction.finish('leave')
  }
  assert.deepEqual(interaction.position, { x: 18, y: -18, angle: 2 })
  interaction.begin('pressed', 0, 0)
  interaction.move(-1000, 1000)
  interaction.finish('release')
  assert.deepEqual(interaction.position, { x: -18, y: 18, angle: -2 })
  assert.equal(interaction.consumeClick(0), false)
})
