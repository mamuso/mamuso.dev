/** Finish moving right before the desktop copy enters beside the stage. */
export function stageBlend(width: number) {
  const t = Math.max(0, Math.min(1, (width - 880) / 144));
  return t * t * (3 - 2 * t);
}

/** A small departure only as the canvas leaves the viewport. */
export function stageDeparture(top: number, height: number) {
  const t = Math.max(0, Math.min(1, -top / Math.max(1, height)));
  return t * t * (3 - 2 * t) * 0.025;
}
