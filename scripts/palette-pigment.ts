// Static raster pigment: overlapping strokes catch the high points of paper grain.
export function createPalettePigment(variant: number) {
  const size = 160
  const pixels = new Uint8ClampedArray(size * size * 4)
  let seed = (variant + 1) * 1729
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const aspect = [1, 1.06, 0.94, 1.03, 0.97][variant % 5]
  const roundness = [3.2, 5.5, 2.6, 4.2, 3.7][variant % 5]
  const phase = random() * Math.PI * 2
  const leftDrift = Array.from({ length: 7 }, () => (random() - 0.5) * 5)
  const rightDrift = Array.from({ length: 7 }, () => (random() - 0.5) * 5)
  const drift = (points: number[], t: number) => {
    const position = Math.max(0, Math.min(5.999, t * 6))
    const index = Math.floor(position)
    const blend = position - index
    return points[index] * (1 - blend) + points[index + 1] * blend
  }
  // Two back-and-forth passes: the second revisits only part of the first.
  // Slowly drifting endpoints give neighbouring strokes a shared hand gesture.
  const strokes = Array.from({ length: 76 }, (_, i) => {
    const revisit = i >= 48
    const t = revisit ? 0.18 + (i - 48) / 28 * 0.64 : i / 47
    const y = -4 + t * 48 + (random() - 0.5) * 0.45
    const slope = -0.82 + Math.sin(t * 4 + phase) * 0.11 + (random() - 0.5) * 0.035
    let left = Math.max(20 - 13 * aspect, 20 + (33 - y) / slope)
    let right = Math.min(20 + 13 * aspect, 20 + (7 - y) / slope)
    const outside = (x: number) => (
      Math.abs((x - 20) / (13 * aspect)) ** roundness
      + Math.abs((y + (x - 20) * slope - 20) / 13) ** roundness > 1
    )
    while (left < right && outside(left)) left += 0.2
    while (right > left && outside(right)) right -= 0.2
    left += drift(leftDrift, t) + (random() - 0.5) * 1.2
    right += drift(rightDrift, t) + (random() - 0.5) * 1.2
    if (revisit) { left += random() * 4; right -= random() * 3 }
    return { y, left, right, slope, reverse: i % 2 === 0,
      bend: Math.sin(t * 5 + phase) * 0.007, phase: phase + t * 3,
      pressure: (revisit ? 0.9 : 0.65) + random() * 0.55,
      radius: (revisit ? 0.38 : 0.55) + random() * 0.4 }
  }).filter(stroke => stroke.right - stroke.left > 1)
  // Occasional light overruns follow the same movement as the coloured patch.
  for (const index of [10 + variant * 2, 31 + variant]) {
    const escaped = strokes[index % strokes.length]
    strokes.push({ ...escaped, left: escaped.left - 1 - random() * 2,
      right: escaped.right + 1 + random() * 2, y: escaped.y + 0.45,
      radius: 0.18 + random() * 0.1, pressure: 0.45 })
  }
  // Shared grain cells make gaps look like paper tooth rather than digital noise.
  const grainSize = 80
  const grain = Array.from({ length: grainSize * grainSize }, random)
  const paperPatches = Array.from({ length: 121 }, random)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = px / 4
      const y = py / 4
      let pigment = 0
      for (const stroke of strokes) {
        const dx = Math.max(stroke.left - x, 0, x - stroke.right)
        const curve = (x - 20) ** 2 * stroke.bend + Math.sin(x * 0.45 + stroke.phase) * 0.13
        const dy = (y - stroke.y - (x - 20) * stroke.slope - curve) / Math.sqrt(1 + stroke.slope ** 2)
        const progress = Math.max(0, Math.min(1, (x - stroke.left) / (stroke.right - stroke.left)))
        const travel = stroke.reverse ? 1 - progress : progress
        const pressure = stroke.pressure * (0.45 + 0.65 * Math.sin(travel * 2.4 + 0.2))
          * (0.85 + 0.15 * Math.sin(x * 0.3 + stroke.phase))
        pigment += Math.exp(-(dy * dy + dx * dx) / (stroke.radius * stroke.radius)) * pressure
      }
      const tooth = grain[Math.floor(py / 2) * grainSize + Math.floor(px / 2)]
      const centerPressure = Math.exp(-((x - 20) ** 2 + (y - 20) ** 2) / 140)
      const patchX = Math.floor(x / 4)
      const patchY = Math.floor(y / 4)
      const fx = x / 4 - patchX
      const fy = y / 4 - patchY
      const patch = (paperPatches[patchY * 11 + patchX] * (1 - fx) + paperPatches[patchY * 11 + patchX + 1] * fx) * (1 - fy)
        + (paperPatches[(patchY + 1) * 11 + patchX] * (1 - fx) + paperPatches[(patchY + 1) * 11 + patchX + 1] * fx) * fy
      const catchAmount = tooth < 0.045 + patch * 0.085
        ? 0.06 + centerPressure * 0.12
        : 0.3 + Math.pow(tooth, 1.2) * 2.4
      const alpha = (1 - Math.exp(-pigment * catchAmount * (1.3 + centerPressure * 2.2 + patch))) * (0.94 + random() * 0.06)
      const offset = (py * size + px) * 4
      pixels[offset] = 255
      pixels[offset + 1] = 255
      pixels[offset + 2] = 255
      pixels[offset + 3] = Math.round(alpha * 255)
    }
  }
  return { pixels, size }
}
