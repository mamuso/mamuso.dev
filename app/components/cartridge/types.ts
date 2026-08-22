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

export type CartridgeLayoutEntry = {
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
  shadowOpacity?: number;
  shadowPlanePosition?: [number, number, number];
  lightPosition?: [number, number, number];
  motion?: CartridgeMotion;
  hoverLift?: number;
  detailLift?: number;
};
