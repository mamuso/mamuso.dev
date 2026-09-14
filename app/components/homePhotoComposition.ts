export type CompositionPhoto = { basename: string; width: number; height: number }

// Six foreground prints with one print peeking above the row on the right.
// Foreground x distributes the row between the card edges; background x
// places its left edge directly within the right half of the card.
export const homePhotoSlots = [
  { name: 'row-1', portrait: false, x: 0, y: 64, width: 140, height: 94, layer: 7 },
  { name: 'row-2', portrait: true, x: 0.2, y: 64, width: 80, height: 120, layer: 6 },
  { name: 'row-3', portrait: true, x: 0.4, y: 64, width: 80, height: 120, layer: 5 },
  { name: 'row-4', portrait: false, x: 0.6, y: 64, width: 140, height: 94, layer: 4 },
  { name: 'row-5', portrait: true, x: 0.8, y: 64, width: 80, height: 120, layer: 3 },
  { name: 'row-6', portrait: false, x: 1, y: 64, width: 140, height: 94, layer: 2 },
  { name: 'back-peek', portrait: false, x: 0.64, y: 48, width: 140, height: 94, layer: 1 },
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
