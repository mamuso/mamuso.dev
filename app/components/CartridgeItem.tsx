'use client'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Object3D } from 'three'
import * as stylex from '@stylexjs/stylex'
import { type } from '../styles/tokens.stylex'
import CartridgePresentation from './CartridgePresentation'
import CartridgeSticker from './CartridgeSticker'
import { createCartridgeInstance, disposeCartridgeInstance } from './cartridgeMaterials'
import { useCartridgeSwipe } from './useCartridgeSwipe'
import { useCartridgeBlow } from './useCartridgeBlow'
import { useCartridgeMotion } from './useCartridgeMotion'
import { CARTRIDGE_WIDTH, CARTRIDGE_HEIGHT, CARTRIDGE_DEPTH, OPEN_HEIGHT, TAP_MAX_MOVEMENT_PX, type CartridgeLayoutEntry } from './cartridgeConfig'
const CARTRIDGE_HITBOX_GEOMETRY = new THREE.BoxGeometry(CARTRIDGE_WIDTH, CARTRIDGE_HEIGHT, CARTRIDGE_DEPTH)
function setCartridgeCursor(renderer: THREE.WebGLRenderer, cursor: string) { renderer.domElement.style.cursor = cursor }

export default function CartridgeItem({
  scene,
  position,
  color,
  labelTexture,
  stickerTexture,
  stickerApplied,
  restingYaw,
  restingRoll,
  restingPitch = 0,
  shellOpacity,
  renderOrderBase = 0,
  isOpen = false,
  onToggleOpen,
  onSwipe,
  entranceDelaySec,
  entranceReady = true,
  mobileEntranceY = 0,
  caption,
  captionOffset = -OPEN_HEIGHT / 2,
  neighborDistance = 0,
  accessibleName,
  desktopBlend = 1,
  cameraPose,
  openYaw = restingYaw,
  openRoll = restingRoll,
  isRackOpen = false,
}: {
  scene: Object3D;
  position: [number, number, number];
  color: string;
  labelTexture: THREE.Texture;
  stickerTexture?: THREE.Texture;
  stickerApplied?: RefObject<boolean>;
  restingYaw: number;
  restingRoll: number;
  restingPitch?: number;
  shellOpacity?: number;
  renderOrderBase?: number;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onSwipe?: (direction: -1 | 1) => void;
  entranceDelaySec?: number;
  entranceReady?: boolean;
  mobileEntranceY?: number;
  caption?: { company: string; period?: string };
  captionOffset?: number;
  neighborDistance?: number;
  accessibleName?: string;
  desktopBlend?: number;
  cameraPose?: CartridgeLayoutEntry;
  openYaw?: number;
  openRoll?: number;
  isRackOpen?: boolean;
}) {
  const { gl, invalidate } = useThree()
  const [restingX, restingY, restingZ] = position
  const { pivotRef, entranceComplete, entranceFinished, settled } = useCartridgeMotion({
    position, restingPitch, restingYaw, restingRoll, openYaw, openRoll, isOpen,
    isRackOpen, neighborDistance, desktopBlend, entranceDelaySec, entranceReady,
    mobileEntranceY, renderOrderBase,
  })
  const hovered = useRef(false)
  const pointerPosition = useRef({ x: 0, y: 0 })
  const stickerBusy = useRef(false)
  const { offset: blowOffsetRef, pointerDown: blowPointerDown, consumeClick: consumeBlowClick, cancelForNavigation } = useCartridgeBlow(isOpen, settled, stickerBusy)
  const { offset: swipeOffsetRef, pointerDown: swipePointerDown, consumeClick: consumeSwipeClick } = useCartridgeSwipe(isOpen && desktopBlend < 1, onSwipe, cancelForNavigation)
  const instance = useMemo(() => createCartridgeInstance(scene, {
    color, maxAniso: gl.capabilities.getMaxAnisotropy(), pixelRatio: gl.getPixelRatio(),
    labelTexture, shellOpacity, renderOrderBase,
  }), [scene, color, gl, labelTexture, shellOpacity, renderOrderBase])
  useEffect(() => () => disposeCartridgeInstance(instance), [instance])
  const modelCenter = useMemo(
    () => new THREE.Box3().setFromObject(instance).getCenter(new THREE.Vector3()),
    [instance]
  )

  return (
    <group
      ref={pivotRef}
      visible={desktopBlend === 1 || entranceReady}
      userData={{
        cameraPositionX: cameraPose?.position[0] ?? restingX,
        cameraPositionY: cameraPose?.position[1] ?? restingY,
        cameraPositionZ: cameraPose?.position[2] ?? restingZ,
        cameraRotationX: cameraPose?.restingPitch ?? restingPitch,
        cameraRotationY: cameraPose?.restingYaw ?? restingYaw,
        cameraRotationZ: cameraPose?.restingRoll ?? restingRoll,
      }}
    >
      <CartridgePresentation
        pivot={pivotRef}
        hovered={hovered}
        pointerPosition={pointerPosition}
        stickerBusy={stickerBusy}
        isOpen={isOpen}
        caption={caption}
        captionOffset={captionOffset}
        openYaw={openYaw}
        desktopBlend={desktopBlend}
      >
      <group ref={swipeOffsetRef}>
      <group ref={blowOffsetRef}>
      <primitive object={instance} position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]} />
      {stickerTexture && stickerApplied && (
        <CartridgeSticker
          scene={scene}
          center={modelCenter}
          texture={stickerTexture}
          isOpen={isOpen}
          appliedRef={stickerApplied}
          busyRef={stickerBusy}
          renderOrder={renderOrderBase + 2}
          desktopBlend={desktopBlend}
        />
      )}
      </group>
      </group>
      </CartridgePresentation>
      {onToggleOpen && <Html center>
        <button
          type="button"
          {...stylex.props(styles.keyboardControl)}
          aria-label={`View ${accessibleName} cartridge`}
          aria-expanded={isOpen}
          disabled={!entranceFinished}
          onFocus={() => { hovered.current = true; invalidate() }}
          onBlur={() => { hovered.current = false; invalidate() }}
          onClick={() => { if (entranceComplete.current) onToggleOpen() }}
        >
          {isOpen ? 'Close' : 'View'} {accessibleName}
        </button>
      </Html>}
      {onToggleOpen && (
        <mesh
          geometry={CARTRIDGE_HITBOX_GEOMETRY}
          dispose={null}
          onPointerDown={(event) => { swipePointerDown(event); blowPointerDown(event) }}
          onPointerEnter={(event) => {
            event.stopPropagation()
            if (!entranceComplete.current) return
            setCartridgeCursor(gl, 'pointer')
            hovered.current = event.pointerType !== 'touch'
            invalidate()
          }}
          onPointerLeave={(event) => {
            event.stopPropagation()
            setCartridgeCursor(gl, 'auto')
            hovered.current = false
            pointerPosition.current = { x: 0, y: 0 }
            invalidate()
          }}
          onPointerMove={(event) => {
            if (event.pointerType === 'touch') return
            const local = pivotRef.current?.worldToLocal(event.point.clone())
            if (!local) return
            pointerPosition.current = {
              x: THREE.MathUtils.clamp(local.x / (CARTRIDGE_WIDTH / 2), -1, 1),
              y: THREE.MathUtils.clamp(local.y / (CARTRIDGE_HEIGHT / 2), -1, 1),
            }
            invalidate()
          }}
          onClick={(event) => {
            event.stopPropagation()
            if (
              event.delta > TAP_MAX_MOVEMENT_PX ||
              !entranceComplete.current
            ) return
            if (consumeSwipeClick() || consumeBlowClick()) return
            onToggleOpen?.()
          }}
        >
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  )
}

const styles = stylex.create({
  keyboardControl: {
    position: 'absolute',
    width: { default: 1, ':focus-visible': 'max-content' },
    height: { default: 1, ':focus-visible': 'auto' },
    overflow: 'hidden',
    clipPath: { default: 'inset(50%)', ':focus-visible': 'none' },
    pointerEvents: { default: 'none', ':focus-visible': 'auto' },
    transform: 'translate(-50%, -50%)',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#555',
    padding: { default: 0, ':focus-visible': '8px 12px' },
    backgroundColor: '#f5f5f5',
    color: '#222',
    fontSize: type.sizeSmall,
    whiteSpace: 'nowrap',
  },
})
