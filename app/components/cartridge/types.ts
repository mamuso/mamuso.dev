export type CameraPreset = {
  margin: number;
  aspect: number;
  panFraction?: number;
  verticalPanFraction?: number;
  openTopOffsetPx?: number;
  openBottomGapPx?: number;
  compactLabels?: boolean;
};

export type CartridgeMotion =
  | "still"
  | "hover"
  | "rock"
  | "static"
  | "frozen"
  | "intro";

/** Resting pose jitter: tilt ranges in degrees, shift as max X offset. */
export type CartridgeTiltAndShift = {
  yawDeg: [number, number];
  rollDeg: [number, number];
  shift: number;
};

/**
 * Where a cartridge comes to rest once its entrance finishes. Cartridges mount
 * at an offset, so the camera rig reads this to frame the settled stack rather
 * than the pre-entrance pose.
 */
export type CartridgeSettledTransform = {
  y: number;
  z: number;
  rotationX: number;
};

export type CartridgeLayoutEntry = {
  name: string;
  company: string;
  period?: string;
  color: string;
  label: string;
  position: [number, number];
  restingYaw: number;
  restingRoll: number;
  restingPitch?: number;
  shellOpacity?: number;
};

export type CartridgeSceneProps = {
  cameraPreset: CameraPreset;
  layout: CartridgeLayoutEntry[];
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
  reducedMotion?: boolean;
  shadowOpacity?: number;
  shadowPlanePosition?: [number, number, number];
  lightPosition?: [number, number, number];
  motion?: CartridgeMotion;
  hoverLift?: number;
  detailLift?: number;
};
