export type CompositionPhoto = { basename: string; width: number; height: number }

// Seven top-aligned prints distributed between the card edges.
export const homePhotoSlots = [
  { name: 'row-1', portrait: false, x: 0 / 6, y: 64, width: 140, height: 94, layer: 7 },
  { name: 'row-2', portrait: true, x: 1 / 6, y: 64, width: 80, height: 120, layer: 6 },
  { name: 'row-3', portrait: true, x: 2 / 6, y: 64, width: 80, height: 120, layer: 5 },
  { name: 'row-4', portrait: false, x: 3 / 6, y: 64, width: 140, height: 94, layer: 4 },
  { name: 'row-5', portrait: true, x: 4 / 6, y: 64, width: 80, height: 120, layer: 3 },
  { name: 'row-6', portrait: false, x: 5 / 6, y: 64, width: 140, height: 94, layer: 2 },
  { name: 'row-7', portrait: false, x: 6 / 6, y: 64, width: 140, height: 94, layer: 1 },
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
