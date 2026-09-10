import assert from 'node:assert/strict'
import test from 'node:test'
import { BLOW, BlowDetector, CartridgeBlowController } from './cartridgeBlow.ts'

function calibrate(level = 0.006, delta = 20) {
  const detector = new BlowDetector()
  for (let time = 0; time < BLOW.CALIBRATION_DURATION; time += delta) detector.update(level, delta)
  return detector
}

test('ambient sound and isolated loud peaks do not complete; sustained wind does across frame rates', () => {
  for (const delta of [10, 20, 40]) {
    const d = calibrate(0.006, delta)
    for (let n = 0; n < 50; n++) assert.equal(d.update(0.008, delta), false)
    assert.equal(d.update(0.9, delta), false)
    for (let n = 0; n < 50; n++) assert.equal(d.update(0.006, delta), false)
    let complete = false
    for (let time = 0; time < 250; time += delta) assert.equal(d.update(0.15, delta), false)
    for (let time = 0; time < 600; time += delta) complete ||= d.update(0.15, delta)
    assert.equal(complete, true)
    assert.ok(d.intensity >= 0 && d.intensity <= 1)
  }
})

test('calibration adapts to ambient noise, silence has a floor, stalled frames cannot accumulate a blow', () => {
  const quiet = calibrate(0), loud = calibrate(0.05)
  quiet.update(0, 20); loud.update(0.05, 20)
  assert.ok(quiet.baseline > 0)
  assert.ok(loud.threshold > quiet.threshold * 3)
  for (let n = 0; n < 30; n++) assert.equal(loud.update(0.06, 20), false)
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

test('lost eligibility, ended track and session timeout release the microphone', async t => {
  const { stats, track } = audioFixture(t)
  let eligible = true
  const c = new CartridgeBlowController(() => {}, () => eligible)
  c.begin(); t.mock.timers.tick(600); await flush()
  eligible = false; c.sample(performance.now())
  assert.equal(c.state, 'idle'); assert.equal(stats.stopped, 1)
  eligible = true; c.begin(); t.mock.timers.tick(600); await flush()
  track.dispatchEvent(new Event('ended'))
  assert.equal(c.state, 'idle'); assert.equal(stats.stopped, 2)
  c.begin(); t.mock.timers.tick(600); await flush(); t.mock.timers.tick(BLOW.SESSION_TIMEOUT)
  assert.equal(c.state, 'idle'); assert.equal(stats.stopped, 3)
})


test('slow rendering still detects sustained wind but never a single sparse spike', () => {
  const d = new BlowDetector()
  for (let n = 0; n < 30; n++) d.update(0.006, 250)
  assert.equal(d.update(0.9, 250), false)
  for (let n = 0; n < 10; n++) assert.equal(d.update(0.006, 250), false)
  let complete = false
  for (let n = 0; n < 8; n++) complete ||= d.update(0.25, 250)
  assert.equal(complete, true)
})

test('successful wind closes audio before the visual return and never samples again', async t => {
  const { stats } = audioFixture(t)
  const c = new CartridgeBlowController(() => {}, () => true)
  c.begin(); t.mock.timers.tick(600); await flush()
  let now = performance.now()
  for (let n = 0; n < 30; n++) c.sample(now += 20)
  assert.equal(c.state, 'listening')
  stats.amplitude = 0.25
  for (let n = 0; n < 30; n++) c.sample(now += 20)
  assert.equal(c.state, 'returning'); assert.equal(c.completed, true)
  assert.equal(stats.stopped, 1); assert.equal(stats.closed, 1)
  const energy = c.detector.energy
  stats.amplitude = 0; c.sample(now + 1000)
  assert.equal(c.detector.energy, energy)
  c.finish()
  assert.equal(c.state, 'idle'); assert.equal(stats.stopped, 1)
})
