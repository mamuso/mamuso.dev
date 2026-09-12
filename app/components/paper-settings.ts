/** Static paper recipe shared by every photo. Lengths are CSS pixels. */
export const PAPER_SETTINGS = {
  seed: 17,
  grain: 0.035,
  fibers: 0.018,
  textureScale: 1,
  cornerRadius: 4,
  // Mix fine creases, broad bulges, corner folds and edge buckles.
  foldCount: 4,
  foldSize: 112,
  foldStrength: 0.03,
  dents: 0.3,
} as const

export type PaperSettings = { [K in keyof typeof PAPER_SETTINGS]: number }

/** Stable per-photo variation; the shared grain seed remains unchanged. */
export function paperWearSeed(identity: string): number {
  let hash = 2166136261
  for (const character of identity) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  return hash >>> 0
}
