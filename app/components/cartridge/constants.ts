import * as THREE from "three";
import { CARTRIDGES } from "@/data/cartridges";
import type { CameraPreset, CartridgeTiltAndShift } from "./types";

// Matches the cartridge model's footprint in local space. The shared geometry
// keeps every cartridge from allocating an identical invisible hit target.
export const CARTRIDGE_HITBOX_GEOMETRY = new THREE.BoxGeometry(
  0.11,
  0.072,
  0.02
);
export const CARTRIDGE_WIDTH = 0.11;
export const HOVER_LABEL_GAP = 0.02;

// Vertical room an open cartridge needs to show its front without colliding
// with its neighbors.
export const OPEN_HEIGHT = 0.072 + 0.02;
export const OPEN_PITCH_OFFSET = -Math.PI / 2;
export const OPEN_ROLL_JITTER_DEG = 3;
export const OPEN_TOP_OFFSET_PX = 140;

export const HOVER_LIFT = 0.1;
export const DETAIL_LIFT = 0.19;
export const STATIC_FLIP_DURATION = 0.7;
export const STATIC_RETURN_STIFFNESS = 100;
export const STATIC_RETURN_DAMPING = 16;
export const DEG = Math.PI / 180;
export const ROCK_YAW_START = -10 * DEG;
export const ROCK_YAW_END = 10 * DEG;
export const ROCK_PITCH_START = -15 * DEG;
export const ROCK_PITCH_END = 15 * DEG;
export const ROCK_PERIOD_SEC = 12;

// Intro reveal: hold, then gently lift + tilt into place.
export const INTRO_DELAY_SEC = 3;
export const INTRO_DURATION_SEC = 6;
export const INTRO_END_PITCH = -10 * DEG;
export const INTRO_LIFT = 0.05;

// Hero entrance: the stack builds from the bottom up so each falling cartridge
// lands above the one before it instead of passing through it.
export const ENTRANCE_OFFSET_Y = 0.4;
export const ENTRANCE_OFFSET_Z = 0.5;
export const ENTRANCE_PITCH_OFFSET = -45 * DEG;
export const ENTRANCE_DURATION_SEC = 1.15;
export const ENTRANCE_STAGGER_SEC = 0.1;

// A pointer that travels farther than this between press and release is a
// scroll gesture, not a tap, so it must not toggle a cartridge open.
export const TAP_MAX_MOVEMENT_PX = 8;

// With cartridges pitched 90 degrees on X, the stacking axis is the shell's
// thickness rather than its height.
export const ROW_PITCH = 0.016;

export const CAMERA_PAN_FRACTION = 0.5;
export const CAMERA_VERTICAL_PAN_FRACTION = -0.15;

// Framing uses a fixed reference aspect per breakpoint so resizing within a
// breakpoint does not move the stack.
export const CAMERA_PRESET_LARGE: CameraPreset = {
  margin: 2,
  aspect: 720 / 760,
  panFraction: 0.75,
  verticalPanFraction: -0.22,
  openTopOffsetPx: 240,
};

export const CAMERA_PRESET_SMALL: CameraPreset = {
  margin: 1.5,
  aspect: 390 / 580,
  panFraction: 0,
  verticalPanFraction: 0.1,
  openTopOffsetPx: 200,
  openBottomGapPx: 50,
  compactLabels: true,
};

export const LABEL_URLS = CARTRIDGES.map((cartridge) => cartridge.label);

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
  const { yawDeg, rollDeg, shift } = {
    ...DEFAULT_CARTRIDGE_TILT,
    ...params,
  };
  const rollDirection = Math.random() < 0.5 ? -1 : 1;
  const yawDirection = Math.random() < 0.5 ? -1 : 1;

  return {
    restingYaw: yawDirection * randomInRange(yawDeg) * DEG,
    restingRoll: rollDirection * randomInRange(rollDeg) * DEG,
    xJitter: (Math.random() * 2 - 1) * shift,
  };
}
