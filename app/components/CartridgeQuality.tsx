'use client'

import { useEffect, useRef } from 'react'
import { addTail, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createCartridgeQuality, sampleCartridgeQuality } from './cartridgeQualityPolicy'

/** Lower resolution only while moving, then render one sharp resting frame.
 * This remains compatible with demand rendering; there is no idle RAF loop. */
export default function CartridgeQuality() {
  const { gl, scene, setDpr, invalidate } = useThree()
  const quality = useRef(createCartridgeQuality(2))
  const restoring = useRef(false)
  const warming = useRef(6)

  useEffect(() => {
    let disposed = false
    quality.current = createCartridgeQuality(window.devicePixelRatio || 1)
    const unsubscribe = addTail(() => {
      // A slow frame is still motion. Restore only when the demand loop stops,
      // rather than letting a wall-clock timer fight software rendering.
      quality.current.samples = 0
      quality.current.seconds = 0
      warming.current = 6
      if (gl.getPixelRatio() !== 2) {
        restoring.current = true
        updateResolution(gl, scene, setDpr, 2)
        // The tail runs before R3F marks its loop stopped; invalidate afterward.
        queueMicrotask(() => { if (!disposed) invalidate() })
      }
    })
    return () => { disposed = true; unsubscribe() }
  }, [gl, scene, setDpr, invalidate])

  useFrame((_, delta) => {
    if (restoring.current) {
      restoring.current = false
      return
    }
    // Ignore upload/compilation and the first frames of a fresh motion burst.
    let dpr = quality.current.dpr
    if (warming.current > 0) warming.current--
    else dpr = sampleCartridgeQuality(quality.current, delta, true)
    updateResolution(gl, scene, setDpr, dpr)
  }, -3)
  return null
}

function updateResolution(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  setDpr: (dpr: number) => void,
  dpr: number,
) {
  if (renderer.getPixelRatio() === dpr) return
  setDpr(dpr)
  // Keep the photographic grain the same apparent size as resolution changes.
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      const uniform = material.userData.cartridgeGrainDpr
      if (uniform) uniform.value = dpr
    }
  })
}
