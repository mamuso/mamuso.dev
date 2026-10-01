'use client'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import * as stylex from '@stylexjs/stylex'
import CartridgeBackdrop from './CartridgeBackdrop'
import CartridgePinkPass from './CartridgePinkPass'
import CartridgeScene from './CartridgeScene'
import { CAMERA_PRESET_LARGE, CAMERA_FOV_DEGREES, type CameraPreset } from './cartridgeConfig'
import { INITIAL_CARTRIDGE_RESTING_POSES, randomCartridgeRestingPoses, buildCartridgeLayout, type CartridgeRestingPose } from './cartridgeLayout'
import { CARTRIDGES } from '@/data/cartridges'

export default function CartridgeViewer({
  cameraPreset = CAMERA_PRESET_LARGE,
  onOpenChange,
  stickerApplied,
}: {
  cameraPreset?: CameraPreset;
  onOpenChange?: (isOpen: boolean) => void;
  stickerApplied?: RefObject<boolean>;
}) {
  // Keep the drawing buffer stable during motion and at rest. Changing DPR
  // clears the canvas and can race with Canvas reconfiguration on scroll.
  const dpr = 2
  const [restingPoses, setRestingPoses] = useState<
    readonly CartridgeRestingPose[]
  >(INITIAL_CARTRIDGE_RESTING_POSES)

  useLayoutEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) {
        setRestingPoses(randomCartridgeRestingPoses(CARTRIDGES.length))
      }
    })
    return () => {
      active = false
    }
  }, [])

  // The router keeps visited pages in a hidden <Activity>, which runs effect
  // cleanups without removing the DOM. R3F's cleanup disposes the renderer and
  // forces context loss on its canvas, so a revealed page needs a new canvas.
  // The stale canvas leaves the hidden tree: any R3F commit during the reveal
  // can unmount a drei <Html> root, a synchronous flush that makes React skip
  // the navigation's view transition. The new canvas mounts once it finishes.
  const [canvasGeneration, setCanvasGeneration] = useState(0)
  const [canvasMounted, setCanvasMounted] = useState(true)
  const canvasReleased = useRef(false)
  useEffect(() => {
    let active = true
    if (canvasReleased.current) {
      canvasReleased.current = false
      const remount = () => {
        if (!active) return
        setCanvasGeneration((generation) => generation + 1)
        setCanvasMounted(true)
      }
      const transition = activeViewTransition()
      if (transition) transition.finished.then(remount, remount)
      else remount()
    }
    return () => {
      active = false
      canvasReleased.current = true
      setCanvasMounted(false)
    }
  }, [])

  const layout = useMemo(() => buildCartridgeLayout(CARTRIDGES, restingPoses), [restingPoses])

  return (
    <div data-cartridge-viewer {...stylex.props(styles.viewer)}>
      <CartridgeBackdrop />
      {canvasMounted && <Canvas
        key={canvasGeneration}
        camera={{ fov: CAMERA_FOV_DEGREES }}
        style={{ position: 'relative', touchAction: 'pan-y' }}
        dpr={dpr}
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <CartridgePinkPass />
        <Suspense fallback={null}>
          <CartridgeScene
            cameraPreset={cameraPreset}
            layout={layout}
            onOpenChange={onOpenChange}
            stickerApplied={stickerApplied}
          />
        </Suspense>
      </Canvas>}
    </div>
  )
}

// `activeViewTransition` is recent; React's own handle covers older browsers.
function activeViewTransition(): ViewTransition | null {
  const doc = document as Document & {
    activeViewTransition?: ViewTransition | null
    __reactViewTransition?: ViewTransition | null
  }
  return doc.activeViewTransition ?? doc.__reactViewTransition ?? null
}

const styles = stylex.create({
  viewer: {
    boxSizing: 'border-box',
    height: { default: 360, '@media (min-width: 880px)': 640 },
    insetInlineStart: '50%',
    marginInline: '-50vw',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    width: '100vw',
    zIndex: 1,
  },
})
