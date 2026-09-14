export type CompositionPhoto = { basename: string; width: number; height: number }

// An authored composition, back to front. Coordinates are independent of image dimensions.
// x distributes each print within the available width; values over 1 peek past the right edge.
export const homePhotoSlots = [
  { name: 'top-peek', portrait: false, x: 0.46, y: -58, width: 140, height: 94, angle: 2, layer: 1 },
  { name: 'right-peek', portrait: true, x: 1.08, y: -12, width: 80, height: 120, angle: -2, layer: 2 },
  { name: 'upper-right', portrait: false, x: 0.78, y: -20, width: 140, height: 94, angle: 1.5, layer: 3 },
  { name: 'lower-right', portrait: false, x: 1.03, y: 100, width: 140, height: 94, angle: -2, layer: 4 },
  { name: 'right-support', portrait: true, x: 0.7, y: 66, width: 80, height: 120, angle: 2, layer: 5 },
  { name: 'hero', portrait: true, x: 0.34, y: 14, width: 80, height: 120, angle: -2, layer: 6 },
  { name: 'foreground', portrait: false, x: 0.02, y: 78, width: 140, height: 94, angle: 2, layer: 7 },
] as const

export function selectHomePhotos<T extends CompositionPhoto>(photos: T[], pick: (length: number) => number) {
  const remaining = [...photos]
  return homePhotoSlots.flatMap(slot => {
    if (!remaining.length) return []
    // Prefer a matching aspect ratio so framing needs only a small crop.
    const matching = remaining.filter(photo => slot.portrait === (photo.height > photo.width))
    const closeRatio = matching.filter(photo => Math.abs((photo.width / photo.height) / (slot.width / slot.height) - 1) < 0.15)
    const pool = closeRatio.length ? closeRatio : matching.length ? matching : remaining
    const photo = pool[pick(pool.length)]
    remaining.splice(remaining.indexOf(photo), 1)
    return [photo]
  })
}
