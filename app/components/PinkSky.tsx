'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { pinkSky } from './pinkReveal'
import pinkSkyShader from './pink-sky.wgsl'

const GRAIN = 0.07
const GRAIN_FRAME_MS = 1000 / 24

/**
 * Animated film grain behind the pink page's content. It mounts one click
 * early to warm the GPU, and the page stays fully pink without it.
 */
export default function PinkSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !('gpu' in navigator)) return

    let disposed = false
    let frameId: number | undefined
    let cleanupGpu: (() => void) | undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const initialize = async () => {
      try {
        const { effect, frame, init, surface } = await import('vgpu')
        if (disposed) return

        const gpu = await init()
        let skySurface: ReturnType<typeof surface> | undefined
        let released = false
        cleanupGpu = () => {
          if (released) return
          released = true
          skySurface?.dispose()
          gpu.dispose()
        }
        if (disposed) return cleanupGpu()

        skySurface = surface(gpu, canvas, {
          alphaMode: 'premultiplied',
          clearColor: [0, 0, 0, 0],
          dpr: [1, 2],
          label: 'pink-sky',
        })
        const sky = effect(gpu, pinkSkyShader, { label: 'pink-sky' })
        // Warm the canvas signature; compiling against the surface needs a frame.
        await sky.compile({ colors: [navigator.gpu.getPreferredCanvasFormat()] })
        if (disposed) return cleanupGpu()

        const startedAt = performance.now()
        let lastDraw = -Infinity
        let drewStill = false

        const tick = (now: number) => {
          frameId = requestAnimationFrame(tick)
          if (!pinkSky.active || !skySurface) return
          // Grain only needs film rate, and one still frame for reduced motion.
          if (reduceMotion.matches && drewStill) return
          // Hold the grain still while the cartridges move: frozen grain is
          // invisible in motion, and on phones the scene needs the GPU.
          if (now < pinkSky.busyUntil) return
          if (now - lastDraw < GRAIN_FRAME_MS) return
          lastDraw = now
          drewStill = true
          canvas.style.opacity = '1'

          const surfaceRef = skySurface
          frame(gpu, (currentFrame) => {
            sky.set({
              params: {
                resolution: surfaceRef.size,
                time: reduceMotion.matches ? 0 : (now - startedAt) / 1000,
                grain: GRAIN,
              },
            })
            currentFrame.pass(surfaceRef, sky)
          })
        }
        frameId = requestAnimationFrame(tick)
      } catch {
        cleanupGpu?.()
        // WebGPU is progressive enhancement; the page is already pink.
      }
    }

    void initialize()

    return () => {
      disposed = true
      if (frameId !== undefined) cancelAnimationFrame(frameId)
      cleanupGpu?.()
    }
  }, [])

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        height: '100vh',
        inset: 0,
        // Fades in with its first frame of grain.
        opacity: 0,
        pointerEvents: 'none',
        position: 'fixed',
        transition: 'opacity 600ms ease-out',
        width: '100vw',
        // Above the page background, below all of its content.
        zIndex: -1,
      }}
    />,
    document.body,
  )
}
