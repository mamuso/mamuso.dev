import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../app/components/cartridgeQualityPolicy.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, { module: ts.ModuleKind.ESNext })
const { createCartridgeQuality, sampleCartridgeQuality } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)
const frames = (quality, count, delta) => {
  for (let i = 0; i < count; i++) sampleCartridgeQuality(quality, delta)
}

test('sustained slow frames lower resolution, with a readability floor', () => {
  const quality = createCartridgeQuality(2)
  frames(quality, 29, 1 / 30)
  assert.equal(quality.dpr, 2)
  frames(quality, 1, 1 / 30)
  assert.equal(quality.dpr, 1.75)
  frames(quality, 300, 1 / 30)
  assert.equal(quality.dpr, 1.25)
})

test('recovery requires sustained headroom and respects the display ceiling', () => {
  const quality = createCartridgeQuality(1)
  frames(quality, 30, 1 / 30)
  assert.equal(quality.dpr, 1.25)
  frames(quality, 119, 1 / 60)
  assert.equal(quality.dpr, 1.25)
  frames(quality, 1, 1 / 60)
  assert.equal(quality.dpr, 1.5)
  frames(quality, 500, 1 / 60)
  assert.equal(quality.dpr, 1.5)
})

test('idle gaps and isolated stalls do not cause a quality downgrade', () => {
  const quality = createCartridgeQuality(2)
  frames(quality, 29, 1 / 30)
  sampleCartridgeQuality(quality, 2)
  frames(quality, 29, 1 / 60)
  sampleCartridgeQuality(quality, 0.1)
  assert.equal(quality.dpr, 2)
})

test('sustained software rendering lowers quality even when frames exceed 250ms', () => {
  const quality = createCartridgeQuality(2)
  for (let frame = 0; frame < 90; frame++) sampleCartridgeQuality(quality, 0.7, true)
  assert.equal(quality.dpr, 1.25)
  for (let frame = 0; frame < 30; frame++) sampleCartridgeQuality(quality, 1 / 60)
  assert.equal(quality.dpr, 1.25, 'one fast window must not undo the reduction')
  for (let frame = 0; frame < 90; frame++) sampleCartridgeQuality(quality, 1 / 60)
  assert.equal(quality.dpr, 1.5, 'recovery requires four fast windows')
})

test('invalid frame samples cannot poison adaptive quality', () => {
  const quality = createCartridgeQuality(1)
  for (const delta of [NaN, Infinity, 0, -1]) sampleCartridgeQuality(quality, delta)
  assert.equal(quality.seconds, 0)
  assert.equal(quality.samples, 0)
  assert.equal(quality.dpr, 1.5)
})
