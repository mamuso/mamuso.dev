export const PALETTE_VARIANT_COUNT = 25

// A per-photo shuffle keeps up to 25 colours distinct without repeating a sequence.
export function paletteVariants(seed: number): number[] {
  const variants = Array.from({ length: PALETTE_VARIANT_COUNT }, (_, index) => index)
  for (let index = variants.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const swap = Math.floor((seed / 0x100000000) * (index + 1))
    ;[variants[index], variants[swap]] = [variants[swap], variants[index]]
  }
  return variants
}
