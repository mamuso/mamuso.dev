"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Object3D } from "three";
import { CARTRIDGE_HITBOX_GEOMETRY, DETAIL_LIFT } from "./constants";
import { createCartridgeInstance } from "./materials";
import { useCartridgeMotion } from "./useCartridgeMotion";
import type { CartridgeMotion } from "./types";

type CartridgeProps = {
  scene: Object3D;
  position: [number, number];
  color: string;
  labelTexture: THREE.Texture;
  restingYaw: number;
  restingRoll: number;
  restingPitch?: number;
  motion?: CartridgeMotion;
  hoverLift?: number;
  detailLift?: number;
  shellOpacity?: number;
  renderOrderBase?: number;
  onHoverChange?: (hovered: boolean) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
};

export function Cartridge({
  scene,
  position,
  color,
  labelTexture,
  restingYaw,
  restingRoll,
  restingPitch = 0,
  motion = "still",
  detailLift = DETAIL_LIFT,
  shellOpacity,
  renderOrderBase = 0,
  onHoverChange,
  isOpen = false,
  onToggleOpen,
}: CartridgeProps) {
  const renderer = useThree((state) => state.gl);
  const instance = useMemo(
    () =>
      createCartridgeInstance({
        scene,
        color,
        labelTexture,
        maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
        shellOpacity,
        renderOrderBase,
      }),
    [
      color,
      labelTexture,
      renderOrderBase,
      renderer,
      scene,
      shellOpacity,
    ]
  );
  const modelCenter = useMemo(
    () =>
      new THREE.Box3().setFromObject(instance).getCenter(new THREE.Vector3()),
    [instance]
  );
  const pivotRef = useCartridgeMotion({
    position,
    restingYaw,
    restingRoll,
    restingPitch,
    motion,
    detailLift,
    isOpen,
  });

  return (
    <group ref={pivotRef}>
      <primitive
        object={instance}
        position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}
      />
      {(onHoverChange || onToggleOpen) && (
        <mesh
          geometry={CARTRIDGE_HITBOX_GEOMETRY}
          onPointerEnter={(event) => {
            event.stopPropagation();
            onHoverChange?.(true);
          }}
          onPointerLeave={(event) => {
            event.stopPropagation();
            onHoverChange?.(false);
          }}
          onClick={(event) => {
            event.stopPropagation();
            onToggleOpen?.();
          }}
        >
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}
