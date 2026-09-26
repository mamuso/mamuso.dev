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


test('expanded gallery dragging follows the pointer, persists, and stays bounded', () => {
  const interaction = createPhotoInteraction({ maxShift: 160, dragScale: 1 })
  interaction.begin('pressed', 0, 0)
  assert.equal(interaction.move(120, -45).capture, true)
  assert.deepEqual(interaction.position, { x: 120, y: -45, angle: 2 })
  interaction.finish('release')
  interaction.begin('hover', 0, 0)
  interaction.move(30, 0)
  assert.equal(interaction.position.x, 121)
  interaction.finish('leave')
  interaction.begin('pressed', 0, 0)
  interaction.move(500, -500)
  assert.deepEqual(interaction.position, { x: 160, y: -160, angle: 2 })
  interaction.finish('cancel')
  assert.equal(interaction.position.x, 121)
})


test('hover restarting after pointer capture release does not turn a drag into a click', () => {
  const interaction = createPhotoInteraction({ maxShift: 40, dragScale: 1 })
  interaction.begin('pressed', 0, 0)
  interaction.move(100, 0)
  interaction.finish('release')
  interaction.finish('cancel')
  interaction.begin('hover', 100, 0)
  interaction.move(101, 0)
  assert.equal(interaction.consumeClick(1), true)
  interaction.begin('pressed', 101, 0)
  interaction.finish('release')
  assert.equal(interaction.consumeClick(1), false)
})

test('free dragging travels beyond the old limits with restrained rotation', () => {
  const interaction = createPhotoInteraction({ maxShift: Infinity, dragScale: 1, maxRotation: 5, dragRotation: 0.05 })
  interaction.begin('pressed', 0, 0)
  interaction.move(60, 20)
  assert.deepEqual(interaction.position, { x: 60, y: 20, angle: 3 })
  interaction.move(300, -200)
  interaction.finish('release')
  assert.deepEqual(interaction.position, { x: 300, y: -200, angle: 5 })
  assert.equal(interaction.consumeClick(1), true)
  interaction.begin('pressed', 300, -200)
  assert.equal(interaction.move(280, -180).capture, true)
  assert.deepEqual(interaction.position, { x: 280, y: -180, angle: 4 })
})

test('velocity tilt responds to speed and direction, not total drag distance', () => {
  const interaction = createPhotoInteraction({ maxShift: Infinity, dragScale: 1, maxRotation: 1.5, velocityRotation: 0.8 })
  interaction.begin('pressed', 0, 0, 0)
  interaction.move(20, 0, 200)
  const slow = interaction.position.angle
  interaction.move(40, 0, 220)
  assert.ok(interaction.position.angle > slow)
  interaction.move(200, 0, 230)
  assert.equal(interaction.position.angle, 1.5)
  interaction.move(100, 0, 240)
  assert.equal(interaction.position.angle, -1.5)
  interaction.move(100, 0, 500)
  assert.equal(interaction.position.angle, -1.5)
  assert.equal(interaction.position.x, 100)
  interaction.finish('release')
  assert.equal(interaction.consumeClick(1), true)
})

test('normal-speed drags show directional tilt even on high-frequency pointers', () => {
  for (const interval of [2, 8, 16]) {
    const interaction = createPhotoInteraction({ maxShift: Infinity, dragScale: 1, maxRotation: 1.5, velocityRotation: 3 })
    interaction.begin('pressed', 0, 0, 0)
    interaction.move(10, 0, 40)
    interaction.move(10 + 0.3 * interval, 0, 40 + interval)
    assert.ok(Math.abs(interaction.position.angle - 0.9) < 0.00001)
    interaction.move(10, 0, 40 + 2 * interval)
    assert.ok(Math.abs(interaction.position.angle + 0.9) < 0.00001)
  }
})


test('velocity tilt persists after release, hover, and a pause in the next drag', () => {
  const interaction = createPhotoInteraction({ maxShift: Infinity, dragScale: 1, maxRotation: 2, velocityRotation: 3 })
  interaction.begin('pressed', 0, 0, 0)
  interaction.move(30, 0, 30)
  assert.equal(interaction.position.angle, 2)
  interaction.finish('release')
  interaction.finish('cancel')
  interaction.begin('hover', 30, 0, 1000)
  interaction.move(32, 0, 1100)
  assert.equal(interaction.position.angle, 2)
  interaction.begin('pressed', 32, 0, 1200)
  interaction.move(32, 0, 1500)
  assert.equal(interaction.position.angle, 2)
  interaction.move(12, 0, 1520)
  assert.equal(interaction.position.angle, -2)
})
