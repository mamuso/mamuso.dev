"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Object3D } from "three";
import {
  CAMERA_PAN_FRACTION,
  CAMERA_VERTICAL_PAN_FRACTION,
  DEG,
} from "./constants";
import type { CameraPreset, CartridgeSettledTransform } from "./types";

/**
 * Frames its children once from a fixed reference aspect ratio. This keeps the
 * composition stable while the canvas resizes within the same breakpoint.
 */
export function CameraRig({
  preset,
  children,
}: {
  preset: CameraPreset;
  children: ReactNode;
}) {
  const groupRef = useRef<Group>(null);
  const activeCamera = useThree(
    (state) => state.camera
  ) as THREE.PerspectiveCamera;
  const cameraRef = useRef(activeCamera);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    if (!groupRef.current) return;

    const camera = cameraRef.current;
    const bounds = measureSettledBounds(
      groupRef.current,
      preset.compactLabels ?? false
    );
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const halfFov = (camera.fov * DEG) / 2;
    const fitHeightDistance = maxSize / (2 * Math.tan(halfFov));
    const fitWidthDistance = fitHeightDistance / preset.aspect;
    const distance =
      preset.margin * Math.max(fitHeightDistance, fitWidthDistance);
    const visibleHalfHeight = distance * Math.tan(halfFov);
    const visibleHalfWidth = visibleHalfHeight * preset.aspect;
    const horizontalOffset =
      visibleHalfWidth * (preset.panFraction ?? CAMERA_PAN_FRACTION);
    const verticalOffset =
      visibleHalfHeight *
      (preset.verticalPanFraction ?? CAMERA_VERTICAL_PAN_FRACTION);

    const cameraPosition = center.clone();
    cameraPosition.z += distance;
    cameraPosition.x -= horizontalOffset;
    cameraPosition.y += verticalOffset;

    const target = center.clone();
    target.x -= horizontalOffset;
    target.y += verticalOffset;

    camera.position.copy(cameraPosition);
    camera.near = Math.max(0.01, distance - maxSize);
    camera.far = distance + maxSize * 4;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    invalidate();
    // The camera is intentionally configured only when this rig mounts. The
    // stage remounts at breakpoint changes with a new preset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <group ref={groupRef}>{children}</group>;
}

/**
 * Cartridges mount at their entrance offsets, so measuring the group as-is
 * would frame the pre-entrance pose and leave the camera drifting as they
 * fall. Move each cartridge to its settled transform, measure, then restore.
 *
 * Only the small-screen preset also unwinds the entrance pitch: its tighter
 * framing is sensitive to the tilted bounding box, while the large preset is
 * framed wide enough that including the tilt makes no visible difference.
 */
function measureSettledBounds(group: Group, unwindPitch: boolean) {
  const moved: Array<{
    object: Object3D;
    y: number;
    z: number;
    rotationX: number;
  }> = [];

  group.traverse((object) => {
    const settled = object.userData.cartridgeSettled as
      | CartridgeSettledTransform
      | undefined;
    if (!settled) return;

    moved.push({
      object,
      y: object.position.y,
      z: object.position.z,
      rotationX: object.rotation.x,
    });
    object.position.y = settled.y;
    object.position.z = settled.z;
    if (unwindPitch) object.rotation.x = settled.rotationX;
  });

  const bounds = new THREE.Box3().setFromObject(group);

  for (const { object, y, z, rotationX } of moved) {
    object.position.y = y;
    object.position.z = z;
    object.rotation.x = rotationX;
  }

  return bounds;
}
