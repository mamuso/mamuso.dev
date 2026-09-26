import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { PAPER_SETTINGS } from './paper-settings.ts'

const source = ts.transpileModule(readFileSync(new URL('./paper-renderer.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function fixture() {
  const devices = [], outputs = [], targets = [], observers = []
  let frames = 0
  const api = {
    init() {
      let lose
      const device = { disposed: false, dispose() { this.disposed = true },
        device: { gpu: { lost: new Promise(resolve => { lose = resolve }) } }, lose: () => lose() }
      devices.push(device)
      return Promise.resolve(device)
    },
    surface() {
      const output = { size: [300, 150], format: 'rgba8unorm', disposed: false,
        resize(size) { this.size = size }, dispose() { this.disposed = true } }
      outputs.push(output)
      return output
    },
    target(_, options) {
      const texture = { destroyed: false, destroy() { this.destroyed = true } }
      const result = { size: options.size, color: texture, resize(size) { this.size = size } }
      targets.push(result)
      return result
    },
    effect() { return { compile: async () => {}, set() {} } },
    sampler() { return {} },
    frame(_, callback) { frames++; callback({ pass() {} }) },
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() {}
    disconnect() { this.disconnected = true }
  }
  const exports = {}
  vm.runInNewContext(source, { exports, require: name => name === 'vgpu' ? api : { default: '' },
    ResizeObserver, process: { env: { NODE_ENV: 'test' } }, console })
  return { mount: exports.mountPaper, devices, outputs, targets, observers, get frames() { return frames } }
}
const canvas = () => ({ clientWidth: 432, clientHeight: 456, dataset: {} })

test('paper draws once per size, and releases its resources on exit', async () => {
  const f = fixture(), element = canvas(), controller = new AbortController()
  await f.mount(element, PAPER_SETTINGS, 17, controller.signal)
  assert.equal(f.frames, 1)
  f.observers[0].callback(); f.observers[0].callback()
  assert.equal(f.frames, 1, 'initial ResizeObserver delivery must not redraw')
  element.clientHeight = 480
  f.observers[0].callback()
  assert.equal(f.frames, 2)
  controller.abort()
  await Promise.resolve()
  assert.equal(element.dataset.ready, undefined)
  assert.ok(f.outputs.every(output => output.disposed))
  assert.ok(f.targets.every(target => target.color.destroyed))
  assert.ok(f.observers.every(observer => observer.disconnected))
  assert.ok(f.devices[0].disposed)
})

test('visible cards share a device until the final card leaves', async () => {
  const f = fixture(), a = new AbortController(), b = new AbortController()
  await Promise.all([f.mount(canvas(), PAPER_SETTINGS, 1, a.signal), f.mount(canvas(), PAPER_SETTINGS, 2, b.signal)])
  assert.equal(f.devices.length, 1)
  a.abort(); await Promise.resolve()
  assert.equal(f.devices[0].disposed, false)
  b.abort(); await Promise.resolve()
  assert.equal(f.devices[0].disposed, true)
})

test('an old device loss cannot hide a newly activated paper surface', async () => {
  const f = fixture(), element = canvas(), a = new AbortController(), b = new AbortController()
  await f.mount(element, PAPER_SETTINGS, 1, a.signal)
  a.abort()
  await f.mount(element, PAPER_SETTINGS, 1, b.signal)
  f.devices[0].lose(); await Promise.resolve()
  assert.equal(element.dataset.ready, 'true')
  f.devices[1].lose(); await Promise.resolve()
  assert.equal(element.dataset.ready, undefined)
  b.abort()
})

test('aborted startup does not allocate surfaces or retain a device', async () => {
  const f = fixture(), controller = new AbortController()
  const pending = f.mount(canvas(), PAPER_SETTINGS, 1, controller.signal)
  controller.abort()
  await pending
  await Promise.resolve()
  assert.equal(f.outputs.length, 0)
  assert.ok(f.devices[0].disposed)
  await f.mount(canvas(), PAPER_SETTINGS, 1, controller.signal)
  assert.equal(f.devices.length, 1, 'already aborted activation must not initialize a device')
})
