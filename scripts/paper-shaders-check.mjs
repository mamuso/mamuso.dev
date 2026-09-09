import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { init, effect, frame, target, sampler } from 'vgpu/node'
import sharp from 'sharp'

const textureSource = await readFile(new URL('../app/components/paper-texture.wgsl', import.meta.url), 'utf8')
const edgesSource = await readFile(new URL('../app/components/paper-imperfections.wgsl', import.meta.url), 'utf8')
const { PAPER_SETTINGS: settings, paperWearSeed } = await import('../app/components/paper-settings.ts')
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
    params: { resolution: [width, height], seed: paperWearSeed('photo-a'), foldCount: settings.foldCount,
      foldSize: settings.foldSize, foldStrength: settings.foldStrength, dents: settings.dents },
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
  assert.equal(pixels[pixel(width - 1, 0) + 3], 0, 'Rounded corner remains transparent')
  assert.equal(pixels[pixel(width / 2, height / 2) + 3], 255, 'Center remains opaque')
  let min = 255, max = 0
  for (let y = 24; y < height - 24; y++) {
    for (let x = 24; x < width - 24; x++) {
      const i = pixel(x, y)
      assert.equal(pixels[i + 3], 255, 'Damage must not enter the text area')
      for (let c = 0; c < 3; c++) assert.ok(Math.abs(pixels[i + c] - base[i + c]) <= 9, 'Creases stay subtle across the text')
      min = Math.min(min, pixels[i]); max = Math.max(max, pixels[i])
    }
  }
  assert.ok(max - min >= 5, 'Texture contains visible tonal variation')
  edges.set({ params: { seed: paperWearSeed('photo-b') } })
  render()
  assert.notDeepEqual(await output.read(), pixels, 'Different photos have different wear')
  assert.deepEqual(await paper.read(), base, 'Photo variation does not change the shared texture')
  edges.set({ params: { seed: paperWearSeed('photo-a'), foldStrength: 0, dents: 0 } })
  render()
  const smooth = await output.read()
  let affected = 0
  for (let y = 24; y < height - 24; y++) {
    for (let x = 24; x < width - 24; x++) {
      const i = pixel(x, y)
      assert.ok(Math.abs(smooth[i] - base[i]) <= 1, 'Zero strength removes fold shading')
      if (Math.abs(smooth[i] - pixels[i]) >= 1) affected++
    }
  }
  assert.ok(affected > 1000, 'Folds cover a broad area rather than a tiny notch')
  edges.set({ params: { foldStrength: settings.foldStrength } })
  render()
  const fourFolds = await output.read()
  edges.set({ params: { foldCount: 1 } })
  render()
  assert.notDeepEqual(await output.read(), fourFolds, 'Fold count changes the result')
  edges.set({ params: { foldCount: settings.foldCount, foldSize: 56 } })
  render()
  assert.notDeepEqual(await output.read(), fourFolds, 'Fold size changes the result')
  // The texture is anchored in paper pixels, so resizing preserves existing fibers.
  paper.resize([width + 24, height])
  texture.set({ params: { resolution: [width + 24, height] } })
  texture.draw(paper)
  const wider = await paper.read()
  for (let y = 24; y < height - 24; y++) {
    for (let x = 24; x < width - 24; x++) {
      assert.equal(wider[(y * (width + 24) + x) * 4], base[pixel(x, y)], 'Resize preserves spatial texture')
    }
  }
  const directory = new URL('../output/paper/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(new URL('shader.png', directory).pathname)
  console.log('Paper shaders: deterministic texture, per-photo variation, broad subtle folds, adjustable count — passed.')
} finally {
  gpu.dispose()
}
