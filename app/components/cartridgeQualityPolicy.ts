/** Hysteresis is based on sustained frame times, never the gap while idle. */
export function createCartridgeQuality(nativeDpr: number) {
  const ceiling = Math.min(2, Math.max(1.5, nativeDpr));
  return { ceiling, dpr: ceiling, samples: 0, seconds: 0, fastWindows: 0 };
}

export function sampleCartridgeQuality(
  quality: ReturnType<typeof createCartridgeQuality>,
  delta: number,
) {
  if (delta <= 0 || delta > 0.25) {
    quality.samples = 0;
    quality.seconds = 0;
    quality.fastWindows = 0;
    return quality.dpr;
  }
  quality.samples++;
  quality.seconds += delta;
  if (quality.samples < 30) return quality.dpr;
  const mean = quality.seconds / quality.samples;
  quality.samples = 0;
  quality.seconds = 0;
  if (mean > 0.026) {
    quality.dpr = Math.max(1.25, quality.dpr - 0.25);
    quality.fastWindows = 0;
  } else if (mean < 0.018) {
    // Recover more slowly than we degrade to avoid resolution oscillation.
    if (++quality.fastWindows >= 4) {
      quality.dpr = Math.min(quality.ceiling, quality.dpr + 0.25);
      quality.fastWindows = 0;
    }
  } else {
    quality.fastWindows = 0;
  }
  return quality.dpr;
}
