/** Static paper recipe shared by every photo. Lengths are CSS pixels. */
export const PAPER_SETTINGS = {
  seed: 17,
  grain: 0.035,
  fibers: 0.018,
  textureScale: 1,
  // Keep damage inside the 12px unprinted margin to preserve whole grid cells.
  fold: 8,
  dents: 1.5,
} as const

export type PaperSettings = { [K in keyof typeof PAPER_SETTINGS]: number }
