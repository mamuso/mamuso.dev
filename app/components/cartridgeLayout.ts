import * as THREE from "three";
import type { CartridgeDefinition } from "../../data/cartridges";
import { CARTRIDGE_WIDTH, CARTRIDGE_HEIGHT, CARTRIDGE_DEPTH, CLOSED_CARTRIDGE_GAP, STACK_RESTING_PITCH, STACK_AXIS, DEG, OPEN_TOP_OFFSET_PX, OPEN_HEIGHT, OPEN_DEPTH, CAPTION_HEIGHT, type CameraPreset, type CartridgeLayoutEntry } from "./cartridgeConfig.ts";
import { pixelYToWorldY } from "./cartridgeCamera.ts";
import { mobileClosedPose, mobileRackSpacing, mobileOpenDisplacement, blendClosedPose, MOBILE_ROW_DEPTH } from "./cartridgeMobileLayout.ts";

export type CartridgeRestingPose = {
  x: number;
  pitchOffsetDeg: number;
  yawDeg: number;
  rollDeg: number;
};

// Hydration-safe fallback. A fresh randomized set replaces it before the
// browser paints, so every reload produces a genuinely different stack.
export const INITIAL_CARTRIDGE_RESTING_POSES: readonly CartridgeRestingPose[] = [
  { x: -0.005, pitchOffsetDeg: -0.8, yawDeg: -2.4, rollDeg: 0.8 },
  { x: -0.001, pitchOffsetDeg: 1, yawDeg: 1.8, rollDeg: -0.5 },
  { x: 0.004, pitchOffsetDeg: -1.2, yawDeg: -1.1, rollDeg: -0.9 },
  { x: 0.002, pitchOffsetDeg: 0.3, yawDeg: 2.8, rollDeg: 0.6 },
  { x: -0.003, pitchOffsetDeg: 1.1, yawDeg: 0.9, rollDeg: -1.1 },
  { x: 0.005, pitchOffsetDeg: -0.4, yawDeg: -2.1, rollDeg: 0.35 },
];

/** Resting pose jitter: tilt ranges in degrees, shift as max X offset. */
export type CartridgeTiltAndShift = {
  yawDeg: [number, number];
  rollDeg: [number, number];
  shift: number;
};

export const DEFAULT_CARTRIDGE_TILT: CartridgeTiltAndShift = {
  yawDeg: [4, 7],
  rollDeg: [1, 3.5],
  shift: 0.004,
};

function randomInRange([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

export function randomCartridgeTilt(
  params: Partial<CartridgeTiltAndShift> = {}
) {
  const { yawDeg, rollDeg, shift } = { ...DEFAULT_CARTRIDGE_TILT, ...params };
  const rollDirection = Math.random() < 0.5 ? -1 : 1;
  const yawDirection = Math.random() < 0.5 ? -1 : 1;
  return {
    restingYaw: yawDirection * randomInRange(yawDeg) * DEG,
    restingRoll: rollDirection * randomInRange(rollDeg) * DEG,
    xJitter: (Math.random() * 2 - 1) * shift,
  };
}

export function randomCartridgeRestingPoses(count: number): CartridgeRestingPose[] {
  return Array.from({ length: count }, () => {
    const pose = randomCartridgeTilt({
      yawDeg: [0.75, 3],
      rollDeg: [0.25, 1.25],
      shift: 0.006,
    });
    return {
      x: pose.xJitter,
      pitchOffsetDeg: randomInRange([-1.25, 1.25]),
      yawDeg: pose.restingYaw / DEG,
      rollDeg: pose.restingRoll / DEG,
    };
  });
}

export function cartridgeExtentAlongAxis(
  pitch: number,
  yaw: number,
  roll: number,
  axis: THREE.Vector3
) {
  const rotation = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(pitch, yaw, roll)
  );
  const elements = rotation.elements;
  return (
    Math.abs(
      axis.x * elements[0] + axis.y * elements[1] + axis.z * elements[2]
    ) * CARTRIDGE_WIDTH +
    Math.abs(
      axis.x * elements[4] + axis.y * elements[5] + axis.z * elements[6]
    ) * CARTRIDGE_HEIGHT +
    Math.abs(
      axis.x * elements[8] + axis.y * elements[9] + axis.z * elements[10]
    ) * CARTRIDGE_DEPTH
  );
}

export function buildCartridgeLayout(cartridges: readonly CartridgeDefinition[], restingPoses: readonly CartridgeRestingPose[]): CartridgeLayoutEntry[] {
    const entries = cartridges.map((c, i) => {
      const pose = restingPoses[i % restingPoses.length];
      const restingPitch = STACK_RESTING_PITCH + pose.pitchOffsetDeg * DEG;
      const restingYaw = pose.yawDeg * DEG;
      const restingRoll = pose.rollDeg * DEG;
      const stackSize =
        cartridgeExtentAlongAxis(
          restingPitch,
          restingYaw,
          restingRoll,
          STACK_AXIS
        ) + CLOSED_CARTRIDGE_GAP;
      return {
        ...c,
        position: [pose.x, 0, 0] as [number, number, number],
        restingYaw,
        restingRoll,
        restingPitch,
        stackSize,
        closedHeight: stackSize * Math.abs(STACK_AXIS.y),
      };
    });
    const totalStackSize = entries.reduce(
      (sum, entry) => sum + entry.stackSize,
      0
    );
    return entries.map((entry, index) => {
      const stackSizeBefore = entries
        .slice(0, index)
        .reduce((sum, preceding) => sum + preceding.stackSize, 0);
      const stackCoordinate =
        -totalStackSize / 2 + stackSizeBefore + entry.stackSize / 2;
      return {
        ...entry,
        position: [
          entry.position[0],
          STACK_AXIS.y * stackCoordinate,
          STACK_AXIS.z * stackCoordinate,
        ] as [number, number, number],
      };
    });
}
export function resolveCartridgePoses(layout: CartridgeLayoutEntry[], openIndex: number | null,
  compositionCamera: THREE.Camera, size: { width: number; height: number }, cameraPreset: CameraPreset,
  modelHalfSize: THREE.Vector3) {
  const desktopBlend = cameraPreset.desktopBlend ?? (cameraPreset.openInPlace ? 0 : 1);
  const rowY = pixelYToWorldY(compositionCamera, size.height * 0.43 + 20, size.height, MOBILE_ROW_DEPTH);
  const worldPerPixel = 2 * Math.abs(compositionCamera.position.z - MOBILE_ROW_DEPTH) *
    Math.tan((compositionCamera as THREE.PerspectiveCamera).fov * DEG / 2) / size.height;
  const slotSpacing = mobileRackSpacing(layout.length, Math.max(0, size.width - 48) * worldPerPixel);
  const { yPositions, openLabelY } = (() => {
    const camera = compositionCamera;
    const openTopOffsetPx = cameraPreset.openTopOffsetPx ?? OPEN_TOP_OFFSET_PX;
    const openBottomGapPx = cameraPreset.openBottomGapPx ?? 0;
    const openLabelInsetFraction = cameraPreset.openLabelInsetFraction ?? 0;
    const openInPlace = cameraPreset.openInPlace ?? false;
    const extraBottomGap =
      openIndex !== null && openBottomGapPx > 0
        ? pixelYToWorldY(camera, openTopOffsetPx, size.height, 0) -
          pixelYToWorldY(camera, openTopOffsetPx + openBottomGapPx, size.height, 0)
        : 0;
    const closedHeights = layout.map((entry) => entry.closedHeight);
    const stackCentered = (heights: number[], gapAfterOpen = 0) => {
      const total = heights.reduce((sum, h) => sum + h, 0) + gapAfterOpen;
      let cursor = total / 2;
      return heights.map((h, i) => {
        const center = cursor - h / 2;
        cursor -= h;
        if (openIndex !== null && i === openIndex) cursor -= gapAfterOpen;
        return center;
      });
    };

    if (openIndex === null) {
      return { yPositions: stackCentered(closedHeights), openLabelY: 0 };
    }

    const desktopBlend = cameraPreset.desktopBlend ?? (openInPlace ? 0 : 1);
    let mobileLayout: { yPositions: number[]; openLabelY: number } | undefined;
    if (desktopBlend < 1) {
      const closedPositions = stackCentered(closedHeights);
      // Align the year line with the rack's lower silhouette, accounting for
      // the model's local axes, perspective and the caption's fixed CSS size.
      const bottoms = layout.map((_, index) => {
        const pose = mobileClosedPose(index, layout.length, rowY, slotSpacing, camera.position);
        const rotation = new THREE.Euler(pose.pitch, pose.yaw, pose.roll);
        const position = new THREE.Vector3(...pose.position);
        let bottom = -Infinity;
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
          const corner = new THREE.Vector3(x * modelHalfSize.x, y * modelHalfSize.y, z * modelHalfSize.z)
            .applyEuler(rotation).add(position).project(camera);
          bottom = Math.max(bottom, (1 - corner.y) * size.height / 2);
        }
        return bottom;
      }).filter((_, index) => layout.length === 1 || index !== openIndex).sort((a, b) => a - b);
      const rackBottom = bottoms[Math.floor(bottoms.length / 2)];
      const labelOffset = -OPEN_HEIGHT / 2 + extraBottomGap * openLabelInsetFraction;
      const labelY = pixelYToWorldY(
        camera, rackBottom - CAPTION_HEIGHT / 2, size.height, layout[openIndex].position[2] + OPEN_DEPTH,
      );
      const focalY = labelY - labelOffset;
      mobileLayout = {
        yPositions: closedPositions.map((y, index) => index === openIndex ? focalY : y),
        openLabelY: labelY,
      };
      if (desktopBlend === 0) return mobileLayout;
    }

    const heights = layout.map((entry, i) =>
      i === openIndex ? OPEN_HEIGHT : entry.closedHeight
    );
    const centered = stackCentered(heights, extraBottomGap);
    const openWorldY = pixelYToWorldY(camera, openTopOffsetPx, size.height, 0);
    const shift = openWorldY - centered[openIndex];
    // Tuck the label toward the cartridge while leaving the reserved gap
    // available before the cartridges below it.
    const labelY =
      centered[openIndex] -
      OPEN_HEIGHT / 2 +
      extraBottomGap * openLabelInsetFraction +
      shift;
    return {
      yPositions: centered.map((y, i) => THREE.MathUtils.lerp(mobileLayout?.yPositions[i] ?? y + shift, y + shift, desktopBlend)),
      openLabelY: THREE.MathUtils.lerp(mobileLayout?.openLabelY ?? labelY, labelY, desktopBlend),
    };
  })();
  // Start with the entire mobile silhouette below the canvas, including its shadow.
  const mobileEntranceY = pixelYToWorldY(
    compositionCamera, size.height * 1.3, size.height, MOBILE_ROW_DEPTH,
  ) - rowY;
  const activePosition = openIndex === null ? null : layout[openIndex].position;
  const projectionRatio = activePosition === null ? 1 :
    (compositionCamera.position.z - MOBILE_ROW_DEPTH) /
    (compositionCamera.position.z - activePosition[2] - OPEN_DEPTH);
  const openCenterX = activePosition === null ? 0 : compositionCamera.position.x +
    (activePosition[0] - compositionCamera.position.x) * projectionRatio;
  const poses = layout.map((entry, index) => {
    const desktop = {
      position: [entry.position[0], yPositions[index], entry.position[2]] as [number, number, number],
      pitch: entry.restingPitch ?? 0,
      yaw: entry.restingYaw,
      roll: entry.restingRoll,
    };
    const mobile = mobileClosedPose(index, layout.length, rowY, slotSpacing, compositionCamera.position);
    mobile.position[0] += mobileOpenDisplacement(
      index, layout.length, slotSpacing, openIndex, openCenterX,
      CARTRIDGE_WIDTH * projectionRatio, size.width * worldPerPixel,
    );
    const closed = blendClosedPose(
      mobile,
      desktop,
      desktopBlend,
    );
    // Preserve the existing selected position, depth, yaw and roll exactly.
    // CartridgeInner supplies the shared open pitch and depth lift.
    return index === openIndex ? { ...closed, position: desktop.position } : closed;
  });
  return { poses, openLabelY, mobileEntranceY };
}
