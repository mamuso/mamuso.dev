import { effect, frame, init, sampler, surface, target } from 'vgpu'
import type { Gpu } from 'vgpu'
import textureShader from './paper-texture.wgsl'
import edgeShader from './paper-imperfections.wgsl'
import type { PaperSettings } from './paper-settings'

// A stack shares one device; the last card releases it, including Strict Mode replay.
let shared: { promise: Promise<Gpu>; users: number } | undefined

export async function mountPaper(canvas: HTMLCanvasElement, settings: PaperSettings, wearSeed: number, signal: AbortSignal) {
  if (signal.aborted) return
  const lease = shared ??= { promise: init(), users: 0 }
  lease.users++
  let gpu: Gpu | undefined
  let output: ReturnType<typeof surface> | undefined
  let paper: ReturnType<typeof target> | undefined
  let warmup: ReturnType<typeof target> | undefined
  let texture: ReturnType<typeof effect> | undefined
  let edges: ReturnType<typeof effect> | undefined
  let observer: ResizeObserver | undefined
  let released = false
  const release = () => {
    if (released) return
    released = true
    observer?.disconnect()
    delete canvas.dataset.ready
    paper?.color.destroy()
    warmup?.color.destroy()
    output?.dispose()
    if (--lease.users === 0) {
      if (shared === lease) shared = undefined
      void lease.promise.then((device) => device.dispose(), () => {})
    }
    signal.removeEventListener('abort', release)
  }
  signal.addEventListener('abort', release, { once: true })
  try {
    gpu = await lease.promise
    if (signal.aborted) { release(); return }
    output = surface(gpu, canvas, { dpr: 1, autoResize: false, alphaMode: 'premultiplied' })
    paper = target(gpu, { size: output.size })
    texture = effect(gpu, textureShader, { set: { params: {
      resolution: output.size, scale: settings.textureScale, seed: settings.seed,
      grain: settings.grain, fibers: settings.fibers,
    } } })
    edges = effect(gpu, edgeShader, { set: {
      params: { resolution: output.size, seed: wearSeed, foldCount: settings.foldCount,
        foldSize: settings.foldSize, foldStrength: settings.foldStrength, dents: settings.dents,
        cornerRadius: settings.cornerRadius },
      paper, paperSampler: sampler(gpu, { minFilter: 'linear', magFilter: 'linear' }),
    } })
    // This vgpu build only acquires swapchain textures inside frame().
    warmup = target(gpu, { size: [1, 1], format: output.format })
    await Promise.all([texture.compile(paper), edges.compile(warmup)])
    warmup.color.destroy()
    warmup = undefined
    if (signal.aborted) { release(); return }
    let renderedWidth = 0, renderedHeight = 0
    const render = () => {
      if (released || !gpu || !output || !paper || !texture || !edges) return
      try {
        // Use layout dimensions: the card's rotation changes its screen bounds.
        const width = Math.max(1, Math.round(canvas.clientWidth))
        const height = Math.max(1, Math.round(canvas.clientHeight))
        if (width === renderedWidth && height === renderedHeight) return
        output.resize([width, height])
        paper.resize(output.size)
        texture.set({ params: { resolution: output.size } })
        edges.set({ params: { resolution: output.size } })
        frame(gpu, (f) => { f.pass(paper!, texture!); f.pass(output!, edges!) })
        renderedWidth = width
        renderedHeight = height
        canvas.dataset.ready = 'true'
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.warn('Paper render unavailable', error)
        delete canvas.dataset.ready
        release()
      }
    }
    observer = new ResizeObserver(render)
    observer.observe(canvas)
    render()
    void gpu.device.gpu.lost.then(() => { if (!released) release() })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.warn('Paper renderer unavailable', error)
    release()
    // The CSS paper and real HTML metadata remain usable without a GPU.
  }
}
