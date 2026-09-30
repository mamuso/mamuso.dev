'use client'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group } from 'three'
import { stageDeparture } from './cartridgeStagePolicy'
import type { CameraPreset } from './cartridgeConfig'
import { frameCartridges } from './cartridgeCamera'

/** Retarget the existing camera; never include live opening/sticker bounds. */
export default function ResponsiveCameraRig({
  preset, onFrame, children,
}: {
  preset: CameraPreset;
  onFrame: (camera: THREE.PerspectiveCamera) => void;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group>(null)
  const { camera: sceneCamera, size, invalidate, gl } = useThree()
  const camera = sceneCamera as THREE.PerspectiveCamera
  const bounds = useRef<THREE.Box3 | undefined>(undefined)
  const target = useRef<THREE.PerspectiveCamera | null>(null)
  const reduced = useRef(false)
  const departure = useRef(0)
  const destination = useRef(new THREE.Vector3())

  useLayoutEffect(() => {
    if (!groupRef.current) return
    const next = camera.clone()
    bounds.current = frameCartridges(groupRef.current, next, size.height, preset, invalidate, bounds.current)
    const firstFrame = target.current === null
    target.current = next
    if (firstFrame) {
      camera.copy(next)
      camera.updateProjectionMatrix()
    }
    // Layout constraints use the destination, not a stale intermediate camera.
    onFrame(next)
    invalidate()
  }, [camera, size.width, size.height, preset, invalidate, onFrame])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced.current = media.matches
      const rect = gl.domElement.getBoundingClientRect()
      const next = media.matches ? 0 : stageDeparture(rect.top, rect.height)
      if (next !== departure.current || media.matches) {
        departure.current = next
        invalidate()
      }
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    media.addEventListener('change', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      media.removeEventListener('change', update)
    }
  }, [gl, invalidate])

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera
    const next = target.current
    if (!next) return
    destination.current.copy(next.position)
    destination.current.z += next.position.z * departure.current
    const response = reduced.current ? 1 : 1 - Math.exp(-12 * Math.min(delta, 0.05))
    camera.fov = THREE.MathUtils.lerp(camera.fov, next.fov, response)
    camera.position.lerp(destination.current, response)
    camera.quaternion.slerp(next.quaternion, response)
    camera.near = next.near
    camera.far = next.far + next.position.z * departure.current
    if (camera.position.distanceToSquared(destination.current) > 1e-12 || Math.abs(camera.fov - next.fov) > 0.0001) invalidate()
    else camera.position.copy(destination.current)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
  }, -4)

  return <group ref={groupRef}>{children}</group>
}

