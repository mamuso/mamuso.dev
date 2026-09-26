'use client'

import { Suspense, useLayoutEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CARTRIDGES } from '@/data/cartridges'
import { configureLabelTexture, createCartridgeInstance, disposeCartridgeInstance } from '../components/cartridgeMaterials'

const github = CARTRIDGES.find(cartridge => cartridge.name === 'GitHub')!

function frameFront(camera: THREE.Camera, size: { width: number; height: number }, dimensions: THREE.Vector3) {
  if (!(camera instanceof THREE.OrthographicCamera)) return
  camera.zoom = 0.78 * Math.min(size.width / dimensions.x, size.height / dimensions.y)
  camera.updateProjectionMatrix()
}

function Model() {
  const { scene: model } = useGLTF('/models/famicom_cartridge.glb')
  const texture = useTexture(github.label)
  const { gl, scene, camera, size, invalidate } = useThree()

  // Each setup owns its materials, including Strict Mode's setup/cleanup replay.
  useLayoutEffect(() => {
    configureLabelTexture(texture, gl)
    const instance = createCartridgeInstance(model, {
      color: github.color,
      shellOpacity: github.shellOpacity,
      labelTexture: texture,
      maxAniso: gl.capabilities.getMaxAnisotropy(),
      pixelRatio: gl.getPixelRatio(),
      renderOrderBase: 0,
    })
    const bounds = new THREE.Box3().setFromObject(instance)
    const center = bounds.getCenter(new THREE.Vector3())
    const dimensions = bounds.getSize(new THREE.Vector3())
    instance.position.sub(center)
    scene.add(instance)

    // An orthographic camera keeps the front face square at every viewport size.
    frameFront(camera, size, dimensions)
    invalidate()

    return () => {
      scene.remove(instance)
      disposeCartridgeInstance(instance)
    }
  }, [model, texture, gl, scene, camera, size, invalidate])

  return null
}

export default function OgCartridgeScene() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], near: 0.01, far: 10 }}
      dpr={2}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      fallback={<p>The GitHub cartridge requires graphics support.</p>}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.42} />
        <directionalLight position={[-0.65, 1, 5]} intensity={0.8} />
        <Model />
        <Environment environmentIntensity={0.7} resolution={128}>
          <Lightformer intensity={4} position={[-2, 4, 3]} rotation={[-0.5, -0.35, -0.2]} scale={[4, 2]} />
          <Lightformer intensity={2} position={[4, 1, 2]} rotation={[0, 0.9, 0]} scale={[0.7, 4]} />
          <Lightformer intensity={0.95} position={[-4, -1, 2]} rotation={[0, -0.8, 0]} scale={[3, 4]} />
        </Environment>
      </Suspense>
    </Canvas>
  )
}
