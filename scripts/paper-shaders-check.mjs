import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { init, effect, frame, target, sampler } from 'vgpu/node'
import sharp from 'sharp'

const textureSource = await readFile(new URL('../app/components/paper-texture.wgsl', import.meta.url), 'utf8')
const edgesSource = await readFile(new URL('../app/components/paper-imperfections.wgsl', import.meta.url), 'utf8')
const { PAPER_SETTINGS: settings } = await import('../app/components/paper-settings.ts')
const gpu = await init()
try {
  const width = 432, height = 456
  const paper = target(gpu, { size: [width, height] })
  const output = target(gpu, { size: [width, height] })
  const texture = effect(gpu, textureSource, { set: { params: {
    resolution: [width, height], scale: settings.textureScale, seed: settings.seed,
    grain: settings.grain, fibers: settings.fibers,
  } } })
  const edges = effect(gpu, edgesSource, { set: {
    params: { resolution: [width, height], fold: settings.fold, dents: settings.dents },
    paper, paperSampler: sampler(gpu, { minFilter: 'linear', magFilter: 'linear' }),
  } })
  await Promise.all([texture.compile(paper), edges.compile(output)])
  const render = () => frame(gpu, f => { f.pass(paper, texture); f.pass(output, edges) })
  render()
  const pixels = await output.read()
  render()
  assert.deepEqual(await output.read(), pixels, 'Repeated renders must be identical')
  const base = await paper.read()
  const pixel = (x, y) => (y * width + x) * 4
  assert.equal(pixels[pixel(width - 1, 0) + 3], 0, 'Fold removes the corner')
  assert.equal(pixels[pixel(width / 2, height / 2) + 3], 255, 'Center remains opaque')
  let min = 255, max = 0
  for (let y = 12; y < height - 12; y++) {
    for (let x = 12; x < width - 12; x++) {
      const i = pixel(x, y)
      assert.equal(pixels[i + 3], 255, 'Damage must not enter the grid')
      for (let c = 0; c < 3; c++) assert.ok(Math.abs(pixels[i + c] - base[i + c]) <= 1, 'Composite preserves interior texture')
      min = Math.min(min, pixels[i]); max = Math.max(max, pixels[i])
    }
  }
  assert.ok(max - min >= 5, 'Texture contains visible tonal variation')
  edges.set({ params: { fold: 0, dents: 0 } })
  render()
  const smooth = await output.read()
  assert.ok(smooth[pixel(width - 1, 0) + 3] > pixels[pixel(width - 1, 0) + 3], 'Fold control changes the silhouette')
  // The texture is anchored in paper pixels, so resizing preserves existing fibers.
  paper.resize([width + 24, height])
  texture.set({ params: { resolution: [width + 24, height] } })
  texture.draw(paper)
  const wider = await paper.read()
  for (let y = 12; y < height - 12; y++) {
    for (let x = 12; x < width - 12; x++) {
      assert.equal(wider[(y * (width + 24) + x) * 4], base[pixel(x, y)], 'Resize preserves spatial texture')
    }
  }
  const directory = new URL('../output/paper/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(new URL('shader.png', directory).pathname)
  console.log('Paper shaders: deterministic texture, preserved interior, transparent fold, adjustable silhouette — passed.')
} finally {
  gpu.dispose()
}
