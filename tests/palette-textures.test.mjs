import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { PALETTE_VARIANT_COUNT, paletteVariants } from '../app/components/palette-variants.ts'
import { createPalettePigment } from '../scripts/palette-pigment.ts'

test('offline masks preserve every pigment alpha value at the original resolution', async () => {
  for (let variant = 0; variant < PALETTE_VARIANT_COUNT; variant++) {
    const { pixels, size } = createPalettePigment(variant)
    const { data, info } = await sharp(new URL(`../public/textures/palette/crayon-${variant}.png`, import.meta.url).pathname)
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, size)
    assert.equal(info.height, size)
    assert.deepEqual(data, Buffer.from(pixels), `variant ${variant} must remain lossless`)
  }
})


test('twenty-colour palettes get distinct, stable shapes with different photo orderings', () => {
  const first = paletteVariants(1234)
  assert.deepEqual(first, paletteVariants(1234))
  assert.equal(new Set(first.slice(0, 20)).size, 20)
  assert.notDeepEqual(first, paletteVariants(5678))
  assert.deepEqual([...first].sort((a, b) => a - b), Array.from({ length: PALETTE_VARIANT_COUNT }, (_, i) => i))
})
