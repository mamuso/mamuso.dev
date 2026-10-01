/**
 * Timeline for the homepage's pink takeover. A view transition reveals the
 * pink page through a mask of soft radial blobs gathered around the clicked
 * word. Each blob drifts, breathes and grows at its own pace, and the mask adds
 * them together, so the edge merges like ink blooming into paper: organic,
 * always changing, and feathered rather than cut. A faint violet bloom rides
 * just inside the edge. Per frame it only rewrites two CSS variables.
 */

const DURATION_MS = 800

// Blobs around the word: direction, how far out they sit, relative size, and
// how they breathe. The first is the core and always reaches the corners.
const BLOBS = [
  { angle: 0, distance: 0, size: 1, breathe: 0, phase: 0 },
  { angle: 0.3, distance: 0.34, size: 0.72, breathe: 0.08, phase: 0.5 },
  { angle: 1.4, distance: 0.42, size: 0.6, breathe: 0.1, phase: 2.1 },
  { angle: 2.5, distance: 0.3, size: 0.78, breathe: 0.07, phase: 4 },
  { angle: 3.4, distance: 0.46, size: 0.56, breathe: 0.12, phase: 1.2 },
  { angle: 4.4, distance: 0.36, size: 0.7, breathe: 0.09, phase: 3.3 },
  { angle: 5.4, distance: 0.4, size: 0.64, breathe: 0.1, phase: 5.1 },
]

export const pinkSky = { active: false }

let frameId: number | undefined

// Slow to leave the word, quick across the page, gentle as it settles.
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

function setFront(origin: { x: number, y: number }, radius: number, seconds: number) {
  const px = (n: number) => `${n.toFixed(1)}px`
  const layers = BLOBS.map(({ angle, distance, size, breathe, phase }) => {
    // Satellites drift around the word as the core grows.
    const turn = angle + (distance > 0 ? seconds * 0.9 : 0)
    const r = radius * size * (1 + breathe * Math.sin(seconds * 7 + phase))
    const x = origin.x + Math.cos(turn) * radius * distance
    const y = origin.y + Math.sin(turn) * radius * distance
    // The feather grows with the blob, so the edge stays soft at every size.
    const feather = Math.min(Math.max(r * 0.35, 18), 160)
    return `radial-gradient(circle at ${px(x)} ${px(y)}, #000 ${px(Math.max(r - feather, 0))}, transparent ${px(r)})`
  })
  const style = document.documentElement.style
  style.setProperty('--pink-mask', layers.join(', '))
  style.setProperty('--pink-r', px(radius))
}

function finish() {
  if (frameId !== undefined) cancelAnimationFrame(frameId)
  frameId = undefined
  const root = document.documentElement
  delete root.dataset.pinkReveal
  for (const name of ['--pink-mask', '--pink-r', '--pink-x', '--pink-y', '--pink-duration']) {
    root.style.removeProperty(name)
  }
}

/** Flip the page pink, blooming out of `origin` (viewport coordinates). */
export function revealPink(origin: { x: number, y: number }, flipTheme: () => void) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || typeof document.startViewTransition !== 'function') {
    pinkSky.active = true
    flipTheme()
    return
  }

  // The core blob alone covers the farthest corner, feather included.
  const corner = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
  const reach = corner + 170

  finish()
  const root = document.documentElement
  root.dataset.pinkReveal = ''
  root.style.setProperty('--pink-x', `${origin.x}px`)
  root.style.setProperty('--pink-y', `${origin.y}px`)
  // Hold the snapshots a little past the timeline, so its last frame lands.
  root.style.setProperty('--pink-duration', `${DURATION_MS + 80}ms`)
  setFront(origin, 0, 0)

  const transition = document.startViewTransition(flipTheme)
  transition.ready.then(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      setFront(origin, easeInOutCubic(t) * reach, (now - start) / 1000)
      frameId = t < 1 ? requestAnimationFrame(tick) : undefined
    }
    frameId = requestAnimationFrame(tick)
  }, finish)
  // Grain starts once the snapshots are gone: a WebGPU canvas that begins
  // presenting mid-transition can flash as the page is handed back.
  transition.finished.finally(() => {
    finish()
    pinkSky.active = true
  })
}

/** Forget the takeover, e.g. when the homepage goes away. */
export function resetPinkSky() {
  finish()
  pinkSky.active = false
}
