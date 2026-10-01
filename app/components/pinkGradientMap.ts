/**
 * Gradient map for imagery on the pink page: luminance to plum shadows, pink
 * mid-tones, and blush-to-white highlights. RandomFact renders it as an SVG
 * filter for photos and album art; the cartridge scene applies the same table
 * in WebGL, since WebKit ignores SVG filters on a WebGL canvas.
 */
export const PINK_GRADIENT_MAP = {
  r: [0.14, 0.62, 1, 1, 1],
  g: [0, 0, 0.42, 0.84, 1],
  b: [0.08, 0.36, 0.72, 0.92, 1],
} as const
