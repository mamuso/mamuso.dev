/**
 * A few sparks flicked off the word when it starts to glow. Each one leaves
 * hot, slows in the air, arcs under gravity and cools from near-white to pink
 * before it dies. It is drawn as a short streak along its velocity, the way a
 * camera smears a spark, on a throwaway canvas that removes itself.
 */

const GRAVITY = 1400 // px/s², heavy enough that sparks arc rather than float
const DRAG = 3.2 // 1/s, tiny embers lose speed quickly
const STREAK_S = 1 / 45 // exposure time for the motion smear

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  age: number
  width: number
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

// White-hot, then blush, then the word's hot pink as it cools.
function sparkColor(heat: number, alpha: number) {
  const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)
  const t = Math.min(Math.max(1 - heat, 0), 1)
  const r = mix(255, 254, t)
  const g = mix(246, 1, t ** 0.7)
  const b = mix(250, 154, t)
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}

/** Throw a handful of sparks off `rect` (viewport coordinates). */
export function burstSparks(rect: DOMRect) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    height: '100vh',
    inset: '0',
    pointerEvents: 'none',
    position: 'fixed',
    width: '100vw',
    zIndex: '2147483646',
  })
  canvas.width = Math.round(window.innerWidth * dpr)
  canvas.height = Math.round(window.innerHeight * dpr)
  const context = canvas.getContext('2d')
  if (!context) return
  document.body.append(canvas)
  context.scale(dpr, dpr)
  context.lineCap = 'round'

  const sparks: Spark[] = Array.from({ length: Math.round(random(7, 10)) }, () => {
    // Mostly up and out, a couple flicked sideways.
    const angle = -Math.PI / 2 + random(-1.15, 1.15)
    const speed = random(220, 480)
    return {
      x: rect.left + random(0.15, 0.85) * rect.width,
      y: rect.top + random(0.2, 0.55) * rect.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: random(0.32, 0.7),
      age: 0,
      width: random(1.1, 1.8),
    }
  })

  let last = performance.now()
  const tick = (now: number) => {
    // Clamp long frames so a hitch doesn't teleport sparks.
    const dt = Math.min((now - last) / 1000, 1 / 30)
    last = now
    context.clearRect(0, 0, window.innerWidth, window.innerHeight)

    let alive = 0
    for (const spark of sparks) {
      spark.age += dt
      if (spark.age >= spark.life) continue
      alive++
      const damping = Math.exp(-DRAG * dt)
      spark.vx *= damping
      spark.vy = spark.vy * damping + GRAVITY * dt
      spark.x += spark.vx * dt
      spark.y += spark.vy * dt

      const remaining = 1 - spark.age / spark.life
      // Cools fast at first, then lingers as a pink ember before winking out.
      const heat = remaining ** 2.2
      const alpha = Math.min(1, remaining * 2.4)
      context.shadowBlur = 4 + 4 * heat
      context.shadowColor = `rgba(254, 1, 154, ${(0.75 * alpha).toFixed(3)})`
      context.strokeStyle = sparkColor(heat, alpha)
      context.lineWidth = spark.width * (0.6 + 0.4 * remaining)
      context.beginPath()
      context.moveTo(spark.x - spark.vx * STREAK_S, spark.y - spark.vy * STREAK_S)
      context.lineTo(spark.x, spark.y)
      context.stroke()
    }

    if (alive) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}
