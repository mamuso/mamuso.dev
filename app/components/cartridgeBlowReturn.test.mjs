import assert from 'node:assert/strict'
import test from 'node:test'
import { CartridgeBlowReturn } from './cartridgeBlowReturn.ts'
import { BLOW } from './cartridgeBlow.ts'

const degree = Math.PI / 180

test('return closes quickly, barely overshoots and finishes at identity across frame rates', () => {
  for (const fps of [30, 60, 120]) {
    const motion = new CartridgeBlowReturn()
    motion.observe(BLOW.TILT, 0, 0, 0, 0, 0, BLOW.TILT, 0)
    motion.start(0, false)
    assert.equal(motion.advance(0), false)
    assert.equal(motion.pose[0], BLOW.TILT)
    let peak = 0
    for (let time = 1000 / fps; time < BLOW.RETURN_DURATION; time += 1000 / fps) {
      motion.advance(time)
      peak = Math.max(peak, motion.pose[0])
      if (time >= 250) assert.ok(Math.abs(motion.pose[0]) < degree * 1.5)
    }
    assert.ok(peak > degree * 0.2 && peak < degree)
    assert.equal(motion.advance(BLOW.RETURN_DURATION), true)
    assert.deepEqual([...motion.pose], [0, 0, 0, 0, 0, 0])
  }
})

test('wind preserves position and velocity on release, then dissipates in 80ms', () => {
  const motion = new CartridgeBlowReturn()
  motion.observe(BLOW.TILT, 0.01, 0, 0.001, 0, 0, BLOW.TILT, 0)
  motion.observe(BLOW.TILT, 0.02, 0, 0.002, 0, 0, BLOW.TILT, 20)
  motion.start(20, false)
  motion.advance(20)
  assert.equal(motion.pose[1], 0.02)
  motion.advance(20.001)
  assert.ok(Math.abs((motion.pose[1] - 0.02) / 0.000001 - 0.5) < 0.001)
  motion.advance(20 + BLOW.RETURN_WIND_DURATION)
  assert.deepEqual([...motion.pose.slice(1)], [0, 0, 0, 0, 0])
})

test('interrupted entry retains momentum and reduced motion never rebounds', () => {
  const motion = new CartridgeBlowReturn()
  motion.observe(-0.1, 0, 0, 0, 0, 0, -0.1, 0)
  motion.observe(-0.15, 0, 0, 0, 0, 0, -0.15, 20)
  motion.start(20, false)
  motion.advance(20)
  assert.equal(motion.pose[0], -0.15)
  motion.advance(21)
  assert.ok(motion.pose[0] < -0.15)
  motion.advance(20 + BLOW.RETURN_DURATION)
  assert.equal(motion.pose[0], 0)
  motion.reset()
  motion.observe(BLOW.TILT, 0, 0, 0, 0, 0, BLOW.TILT, 1000)
  motion.start(1000, true)
  for (let time = 1000; time <= 1450; time += 10) {
    motion.advance(time)
    assert.ok(motion.pose[0] <= 0)
  }
})
