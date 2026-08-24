"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Object3D, Vector3 } from "three";
import {
  CARTRIDGE_HITBOX_GEOMETRY,
  DETAIL_LIFT,
  TAP_MAX_MOVEMENT_PX,
} from "./constants";
import {
  createCartridgeInstance,
  disposeCartridgeInstance,
} from "./materials";
import { useCartridgeMotion } from "./useCartridgeMotion";
import type { CartridgeMotion } from "./types";

type CartridgeProps = {
  scene: Object3D;
  modelCenter: Vector3;
  position: [number, number];
  color: string;
  labelTexture: THREE.Texture;
  restingYaw: number;
  restingRoll: number;
  restingPitch?: number;
  motion?: CartridgeMotion;
  hoverLift?: number;
  detailLift?: number;
  reducedMotion?: boolean;
  shellOpacity?: number;
  renderOrderBase?: number;
  onHoverChange?: (hovered: boolean) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  entranceDelaySec?: number;
  entranceProgressRef?: { current: number };
};

export function Cartridge({
  scene,
  modelCenter,
  position,
  color,
  labelTexture,
  restingYaw,
  restingRoll,
  restingPitch = 0,
  motion = "still",
  detailLift = DETAIL_LIFT,
  reducedMotion = false,
  shellOpacity,
  renderOrderBase = 0,
  onHoverChange,
  isOpen = false,
  onToggleOpen,
  entranceDelaySec,
  entranceProgressRef,
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
  useEffect(
    () => () => disposeCartridgeInstance(instance),
    [instance]
  );
  const { pivotRef, entranceComplete, settledTransform } = useCartridgeMotion({
    position,
    restingYaw,
    restingRoll,
    restingPitch,
    motion,
    detailLift,
    isOpen,
    reducedMotion,
    entranceDelaySec,
    entranceProgressRef,
  });

  return (
    <group ref={pivotRef} userData={{ cartridgeSettled: settledTransform }}>
      <primitive
        object={instance}
        position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}
      />
      {(onHoverChange || onToggleOpen) && (
        <mesh
          geometry={CARTRIDGE_HITBOX_GEOMETRY}
          onPointerEnter={(event) => {
            event.stopPropagation();
            if (!entranceComplete.current) return;
            onHoverChange?.(true);
          }}
          onPointerLeave={(event) => {
            event.stopPropagation();
            onHoverChange?.(false);
          }}
          onClick={(event) => {
            event.stopPropagation();
            // Ignore drags: a moving pointer is a scroll, not a tap.
            if (
              event.delta > TAP_MAX_MOVEMENT_PX ||
              !entranceComplete.current
            ) {
              return;
            }
            onToggleOpen?.();
          }}
        >
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}
