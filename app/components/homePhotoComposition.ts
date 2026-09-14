export type CompositionPhoto = { basename: string; width: number; height: number }

// Five straight foreground prints, followed by two raised prints behind the row.
// Foreground x values distribute the row between the card edges; background x
// values place their left edges directly within the right half of the card.
export const homePhotoSlots = [
  { name: 'row-1', portrait: false, x: 0, y: 72, width: 140, height: 94, angle: 0, layer: 7 },
  { name: 'row-2', portrait: true, x: 0.25, y: 72, width: 80, height: 120, angle: 0, layer: 6 },
  { name: 'row-3', portrait: true, x: 0.5, y: 72, width: 80, height: 120, angle: 0, layer: 5 },
  { name: 'row-4', portrait: false, x: 0.75, y: 72, width: 140, height: 94, angle: 0, layer: 4 },
  { name: 'row-5', portrait: true, x: 1, y: 72, width: 80, height: 120, angle: 0, layer: 3 },
  { name: 'back-left', portrait: false, x: 0.52, y: 20, width: 140, height: 94, angle: -2, layer: 1 },
  { name: 'back-right', portrait: false, x: 0.74, y: 32, width: 140, height: 94, angle: 2, layer: 2 },
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
