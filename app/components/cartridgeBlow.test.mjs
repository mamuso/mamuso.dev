import assert from 'node:assert/strict'
import test from 'node:test'
import { BLOW, BlowDetector, CartridgeBlowController } from './cartridgeBlow.ts'

function calibrate(level = 0.006, delta = 20) {
  const detector = new BlowDetector()
  for (let time = 0; time < BLOW.CALIBRATION_DURATION; time += delta) detector.update(level, delta)
  return detector
}

test('wind intensity follows energy smoothly at different frame rates', () => {
  for (const delta of [10, 20, 40]) {
    const d = calibrate(0.006, delta)
    for (let n = 0; n < 50; n++) d.update(0.008, delta)
    assert.ok(d.intensity < 0.1)
    d.update(0.9, delta)
    assert.ok(d.energy < d.rms)
    for (let n = 0; n < 50; n++) d.update(0.006, delta)
    assert.ok(d.intensity < 0.01)
    for (let time = 0; time < 500; time += delta) d.update(0.15, delta)
    assert.equal(d.intensity, 1)
  }
})

test('calibration adapts to ambient noise, silence has a floor, stalled frames cannot accumulate a blow', () => {
  const quiet = calibrate(0), loud = calibrate(0.05)
  quiet.update(0, 20); loud.update(0.05, 20)
  assert.ok(quiet.baseline > 0)
  assert.ok(loud.threshold > quiet.threshold * 3)
  for (let n = 0; n < 30; n++) loud.update(0.06, 20)
  assert.ok(loud.energy < loud.threshold)
  loud.update(0.9, 2000)
  assert.equal(loud.sustained, 0)
})

function audioFixture(t, getStream) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const stats = { requested: 0, created: 0, closed: 0, stopped: 0, disconnected: 0, amplitude: 0.006 }
  const track = new EventTarget()
  track.stop = () => stats.stopped++
  const stream = { getTracks: () => [track] }
  class Audio {
    state = 'running'
    constructor() { stats.created++ }
    resume() { return Promise.resolve() }
    close() { this.state = 'closed'; stats.closed++; return Promise.resolve() }
    createMediaStreamSource() { return { connect() {}, disconnect() { stats.disconnected++ } } }
    createAnalyser() { return { getFloatTimeDomainData(buffer) { buffer.fill(stats.amplitude) }, disconnect() { stats.disconnected++ } } }
  }
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { AudioContext: Audio } })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia() { stats.requested++; return getStream ? getStream(stream) : Promise.resolve(stream) } } } })
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete globalThis.window
    Object.defineProperty(globalThis, 'navigator', oldNavigator)
  })
  return { stats, track }
}

const flush = async () => { await Promise.resolve(); await Promise.resolve() }

test('tap and cancelled hold never request audio; duplicate holds create one stream; cleanup releases all resources', async t => {
  const { stats } = audioFixture(t)
  const c = new CartridgeBlowController(() => {}, () => true)
  c.begin(); t.mock.timers.tick(599); c.release(); t.mock.timers.tick(1000)
  assert.equal(stats.requested, 0)
  assert.equal(c.suppressClick, false)
  c.begin(); c.cancel(); t.mock.timers.tick(1000)
  assert.equal(stats.created, 0)
  c.begin(); c.begin(); t.mock.timers.tick(600); await flush()
  assert.equal(c.state, 'calibrating'); assert.equal(c.suppressClick, true)
  assert.equal(stats.requested, 1); assert.equal(stats.created, 1)
  c.cancel(); c.cancel()
  assert.equal(stats.closed, 1); assert.equal(stats.stopped, 1); assert.equal(stats.disconnected, 2)
  assert.equal(c.state, 'idle')
})

test('late permission after unmount stops tracks and blocks concurrent requests until resolved', async t => {
  let resolve
  const { stats } = audioFixture(t, stream => new Promise(done => { resolve = () => done(stream) }))
  const old = new CartridgeBlowController(() => {}, () => true)
  const next = new CartridgeBlowController(() => {}, () => true)
  old.begin(); t.mock.timers.tick(600); old.cancel()
  next.begin(); t.mock.timers.tick(600)
  assert.equal(next.state, 'idle'); assert.equal(stats.requested, 1)
  resolve(); await flush()
  assert.equal(stats.stopped, 1); assert.equal(old.state, 'idle')
  next.begin(); t.mock.timers.tick(600); resolve(); await flush(); next.cancel()
  assert.equal(stats.requested, 2); assert.equal(stats.closed, 2)
})

test('denied permission is quiet and a later attempt is possible', async t => {
  const { stats } = audioFixture(t, () => Promise.reject(new Error('denied')))
  const c = new CartridgeBlowController(() => {}, () => true)
  c.begin(); t.mock.timers.tick(600); await flush()
  assert.equal(c.state, 'idle'); assert.equal(stats.closed, 1)
  c.begin(); t.mock.timers.tick(600); await flush()
  assert.equal(stats.requested, 2); assert.equal(c.state, 'idle')
})

test('lost eligibility and ended tracks release audio; active sessions have no timeout', async t => {
  const { stats, track } = audioFixture(t)
  let eligible = true
  const c = new CartridgeBlowController(() => {}, () => eligible)
  c.begin(); t.mock.timers.tick(600); await flush()
  eligible = false; c.sample(performance.now())
  assert.equal(c.state, 'idle'); assert.equal(stats.stopped, 1)
  eligible = true; c.begin(); t.mock.timers.tick(600); await flush()
  track.dispatchEvent(new Event('ended'))
  assert.equal(c.state, 'idle'); assert.equal(stats.stopped, 2)
  c.begin(); t.mock.timers.tick(600); await flush(); t.mock.timers.tick(BLOW.PERMISSION_TIMEOUT)
  assert.equal(c.state, 'calibrating'); assert.equal(stats.stopped, 2)
  c.cancel(); assert.equal(stats.stopped, 3)
})


test('blowing and silence never exit the mode; a second tap closes audio and returns', async t => {
  const { stats } = audioFixture(t)
  const c = new CartridgeBlowController(() => {}, () => true)
  c.begin(); t.mock.timers.tick(600); await flush()
  c.release()
  assert.equal(c.tap(performance.now()), true) // Consume the activation gesture's click.
  assert.equal(c.state, 'calibrating')
  let now = performance.now()
  for (let n = 0; n < 30; n++) c.sample(now += 20)
  stats.amplitude = 0.25
  for (let n = 0; n < 1600; n++) c.sample(now += 20)
  assert.equal(c.state, 'blowing'); assert.equal(stats.stopped, 0)
  stats.amplitude = 0.006
  for (let n = 0; n < 100; n++) c.sample(now += 20)
  assert.equal(c.state, 'listening'); assert.equal(stats.stopped, 0)
  assert.equal(c.tap(now), true)
  assert.equal(c.state, 'returning')
  assert.equal(stats.stopped, 1); assert.equal(stats.closed, 1)
  assert.equal(c.tap(now + 10), true)
  assert.equal(c.state, 'returning')
  const energy = c.detector.energy
  stats.amplitude = 0; c.sample(now + 1000)
  assert.equal(c.detector.energy, energy)
  c.finish()
  assert.equal(c.state, 'idle'); assert.equal(c.tap(now + 3000), false)
})

test('a hold during opening arms at 600ms and activates as soon as the spring is ready', async t => {
  const { stats } = audioFixture(t)
  let ready = false
  const c = new CartridgeBlowController(() => {}, () => true, () => ready)
  c.begin(); t.mock.timers.tick(600)
  assert.equal(c.state, 'armed'); assert.equal(stats.requested, 0)
  c.advance(); assert.equal(stats.requested, 0)
  ready = true; c.advance(); c.advance(); await flush()
  assert.equal(c.state, 'calibrating'); assert.equal(stats.requested, 1)
  c.cancel()
  ready = false; c.begin(); t.mock.timers.tick(600); c.release()
  ready = true; c.advance(); await flush()
  assert.equal(c.state, 'idle'); assert.equal(stats.requested, 1)
})
