import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import { extractColorPalette } from '../lib/photos'

test('photo palettes are extracted deterministically without Canvas', async () => {
  const pixels = Buffer.from([
    255, 0, 0,
    0, 255, 0,
    0, 0, 255,
    255, 255, 0,
  ])
  const image = await sharp(pixels, {
    raw: { width: 4, height: 1, channels: 3 },
  }).png().toBuffer()

  const first = await extractColorPalette(image, 4)
  const second = await extractColorPalette(image, 4)

  assert.deepEqual(first, second)
  assert.deepEqual(new Set(first), new Set(['#ff0000', '#00ff00', '#0000ff', '#ffff00']))
})

test('photo palettes reject invalid color counts', async () => {
  await assert.rejects(() => extractColorPalette(Buffer.alloc(0), 0), /positive integer/)
})
