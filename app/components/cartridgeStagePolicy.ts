/** Match the home layout breakpoint: never leave the rack in a hybrid pose. */
export function stageBlend(width: number) {
  return width >= 880 ? 1 : 0
}

/** A small departure only as the canvas leaves the viewport. */
export function stageDeparture(top: number, height: number) {
  const t = Math.max(0, Math.min(1, -top / Math.max(1, height)))
  return t * t * (3 - 2 * t) * 0.025
}
