import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { PALETTE_VARIANT_COUNT } from '../app/components/palette-variants.ts'
import { createPalettePigment } from './palette-pigment.ts'

const directory = new URL('../public/textures/palette/', import.meta.url)
await mkdir(directory, { recursive: true })
for (let variant = 0; variant < PALETTE_VARIANT_COUNT; variant++) {
  const { pixels, size } = createPalettePigment(variant)
  const result = await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 9 }).toFile(new URL(`crayon-${variant}.png`, directory).pathname)
  console.log(`crayon-${variant}.png: ${result.size} bytes`)
}
