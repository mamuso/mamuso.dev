export const photoMotion = {
  hoverShift: 2, hoverRotation: 0.3, hoverDistance: 60,
  maxShift: 18, maxRotation: 2, dragThreshold: 6, dragScale: 0.3, dragRotation: 0.025,
  scatter: { x: 20, y: 16, angle: 10 },
  initial: { x: 36, y: 24, yOffset: -4, angle: 15 },
} as const

/** Keep successive prints on opposite sides of the stack. */
export function alternatePhotoOffset(index: number, offset: number) {
  return index === 0 ? offset : (index % 2 === 1 ? -1 : 1) * Math.max(2, Math.abs(offset)) * 1.25
}

export type Position = { x: number; y: number; angle: number }
type Phase = 'idle' | 'hover' | 'pressed' | 'dragging'
const clamp = (value: number, limit = 1) => Math.max(-limit, Math.min(limit, value))

/** Gesture state only; rendering, pointer capture and animation scheduling stay in React. */
export function createPhotoInteraction() {
  let phase: Phase = 'idle'
  let resting: Position = { x: 0, y: 0, angle: 0 }
  let position = resting
  let origin = resting
  let start = { x: 0, y: 0 }
  let opened = false
  let suppressClick = false

  function finish(reason: 'leave' | 'release' | 'cancel') {
    if (reason === 'leave' && (phase === 'pressed' || phase === 'dragging')) return
    if (phase === 'idle') return
    if (reason !== 'cancel') {
      resting = position
      if (phase === 'dragging') suppressClick = true
    }
    position = resting
    phase = 'idle'
  }

  return {
    get phase() { return phase },
    get position() { return position },
    begin(mode: 'hover' | 'pressed', x: number, y: number) {
      finish('leave')
      phase = mode
      origin = resting
      start = { x, y }
      suppressClick = false
    },
    move(x: number, y: number) {
      let scatter = false
      let capture = false
      if (phase === 'idle') return { scatter, capture }
      const dx = x - start.x
      const dy = y - start.y
      if (!opened && (dx !== 0 || dy !== 0)) {
        opened = true
        scatter = true
      }
      if (phase === 'pressed') {
        if (dx * dx + dy * dy <= photoMotion.dragThreshold ** 2) return { scatter, capture }
        phase = 'dragging'
        capture = true
      }
      const hoverX = clamp(dx / photoMotion.hoverDistance)
      const hoverY = clamp(dy / photoMotion.hoverDistance)
      position = {
        x: clamp(origin.x + (phase === 'dragging' ? dx * photoMotion.dragScale : hoverX * photoMotion.hoverShift), photoMotion.maxShift),
        y: clamp(origin.y + (phase === 'dragging' ? dy * photoMotion.dragScale : hoverY * photoMotion.hoverShift), photoMotion.maxShift),
        angle: clamp(origin.angle + (phase === 'dragging' ? dx * photoMotion.dragRotation : hoverX * photoMotion.hoverRotation), photoMotion.maxRotation),
      }
      return { scatter, capture }
    },
    finish,
    consumeClick(detail: number) {
      const suppress = suppressClick && detail !== 0
      suppressClick = false
      finish('leave')
      return suppress
    },
  }
}
