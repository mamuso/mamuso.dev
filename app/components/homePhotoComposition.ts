export type CompositionPhoto = { basename: string; width: number; height: number }
export type HomePhotoPlacement = {
  photo: CompositionPhoto
  left: number
  width: number
  top: number
  height: number
  layer: number
  objectPosition: string
  background: boolean
}

// One silhouette: a large left anchor, a continuous band, and one raised photo.
export function selectHomePhotos(photos: CompositionPhoto[], pick: (length: number) => number): HomePhotoPlacement[] {
  if (!photos.length) return []
  const remaining = [...photos]
  const anchorWidth = 29 + pick(4)
  const weights = [15 + pick(3), 9 + pick(3), 14 + pick(3), 10 + pick(3), 13 + pick(3)]
  // Occasionally join two adjacent internal slots, never the anchor.
  if (pick(4) === 0) {
    const join = 1 + pick(3)
    weights.splice(join, 2, weights[join] + weights[join + 1])
  }
  const internalCount = Math.min(weights.length, Math.max(0, photos.length - 2))
  const rhythm = weights.slice(0, internalCount)
  const total = rhythm.reduce((sum, weight) => sum + weight, 0)
  const widths = internalCount ? [anchorWidth, ...rhythm.map(weight => weight / total * (100 - anchorWidth))] : [100]

  function choose(targetRatio: number) {
    // Prefer the least destructive crops, then randomize within that group.
    const score = (photo: CompositionPhoto) => Math.abs(Math.log((photo.width / photo.height) / targetRatio))
    const best = Math.min(...remaining.map(score))
    const candidates = remaining.filter(photo => score(photo) <= best + 0.12)
    const photo = candidates[pick(candidates.length)]
    remaining.splice(remaining.indexOf(photo), 1)
    return photo
  }
  function position() {
    // Small focal variations avoid arbitrary off-center crops when no focal metadata exists.
    return `${47 + pick(7)}% ${47 + pick(7)}%`
  }

  let left = 0
  const placements: HomePhotoPlacement[] = widths.map((width, index) => {
    const photo = choose(width * 4.7 / 76)
    const placement = { photo, left, width, top: 64, height: 76, layer: 10 - index, objectPosition: position(), background: false }
    left += width
    return placement
  })
  if (remaining.length) {
    placements.push({
      photo: choose(1.5), left: 64, width: 30, top: 64 - (20 + pick(9)), height: 94,
      layer: 1, objectPosition: position(), background: true,
    })
  }
  return placements
}
