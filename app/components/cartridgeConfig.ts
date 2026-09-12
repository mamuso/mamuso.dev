import * as THREE from 'three'

export const CARTRIDGE_WIDTH = 0.11
export const CARTRIDGE_HEIGHT = 0.072
export const CARTRIDGE_DEPTH = 0.02
// Vertical room a cartridge needs once clicked open to show its front (its
// natural, unpitched height) instead of just its spine thickness, plus a
// little breathing room so it doesn't touch its neighbors.
export const OPEN_HEIGHT = CARTRIDGE_HEIGHT + 0.03
// Click flips a cartridge from its resting pitch back to its natural,
// front-facing orientation.
export const OPEN_PITCH = 0
export const OPEN_DEPTH = 0.006
// Small random roll each time a cartridge opens, as if it had just been set
// down — the closed spine stack stays perfectly aligned.
export const OPEN_ROLL_JITTER_DEG = 1.25
// However tall the open cartridge is, or which one it is, pin it to the
// same fixed pixel offset from the canvas top so it never grows past frame.
// Per-preset override lives on CameraPreset.openTopOffsetPx; this is the
// fallback when a preset doesn't set one.
export const OPEN_TOP_OFFSET_PX = 140

export const DEG = Math.PI / 180
// Keep enough of each cartridge face visible to identify the artwork while
// preserving the compact, mostly edge-on stack.
export const STACK_RESTING_PITCH = 80 * DEG
// From the far/top cartridge toward the near/bottom cartridge. Separating
// along this rotated thickness axis keeps the shells physically disjoint
// without spreading their screen-space silhouettes into isolated rows.
export const STACK_AXIS = new THREE.Vector3(
  0,
  -Math.sin(STACK_RESTING_PITCH),
  Math.cos(STACK_RESTING_PITCH)
)
// A long lens keeps the top-down stack close to orthographic while retaining
// enough perspective for the hover and opening motions to read as depth.
export const CAMERA_FOV_DEGREES = 14

// Hero entrance: begin above the settled stack and drop directly into each
// cartridge's final resting position without moving through depth.
export const ENTRANCE_OFFSET_Y = 0.28
export const ENTRANCE_OFFSET_Z = 0
export const ENTRANCE_PITCH_OFFSET = -60 * DEG
export const ENTRANCE_DURATION_SEC = 0.85
export const ENTRANCE_STAGGER_SEC = 0.12
export const TAP_MAX_MOVEMENT_PX = 8

// Physical clearance between adjacent transformed cartridge bounds.
export const CLOSED_CARTRIDGE_GAP = 0.0001

// Fraction of the visible half-width to pan the camera by, so the stack sits
// off-center instead of dead center — without changing the framing distance.
// Tunable per preset (see CAMERA_PRESET_LARGE/SMALL below). Since it's a
// fraction of the visible width AT THE REFERENCE ASPECT (not the real one),
// crop-safety at the reference aspect does NOT by itself guarantee safety at
// every wider real aspect when the reference aspect is <1 (width-dominant
// fit) — the required margin has to be solved for directly (see
// CAMERA_PRESET_LARGE's comment for the safe-panFraction formula at a given
// margin/reference aspect).
export const CAMERA_PAN_FRACTION = 0.5

// Fraction of the visible half-height to shift camera+target by (together,
// so the look direction doesn't change — a dolly, not a tilt). Since content
// stays fixed while the viewing window itself shifts, a NEGATIVE fraction
// (camera+target move down) makes content appear HIGHER/closer to the top;
// a POSITIVE fraction makes it appear lower.
// Tunable per preset since the same fraction reads as a much bigger gap on
// a taller canvas (world-space framing is unchanged, but it's stretched
// over more pixels) — see CartridgeViewer's responsive canvas heights.
export const CAMERA_VERTICAL_PAN_FRACTION = -0.15

// Reference compositions blend without replacing the canvas or interaction state.
export type CameraPreset = {
  margin: number;
  aspect: number;
  panFraction?: number;
  verticalPanFraction?: number;
  verticalPanPx?: number;
  openTopOffsetPx?: number;
  openBottomGapPx?: number;
  openLabelInsetFraction?: number;
  openInPlace?: boolean;
  desktopBlend?: number;
}
/** The two reference compositions must define every blended field. */
export type ReferenceCameraPreset = CameraPreset &
  Required<Pick<CameraPreset, 'panFraction' | 'verticalPanFraction' | 'verticalPanPx' | 'openLabelInsetFraction'>>
// Give the desktop stack breathing room with a slight upward resting offset.
export const CAMERA_PRESET_LARGE: ReferenceCameraPreset = {
  margin: 1.02,
  // Keep the reference aspect stable across desktop viewport sizes.
  aspect: 720 / 920,
  panFraction: 1.05,
  verticalPanFraction: 0,
  verticalPanPx: 4,
  // 134px lower than the OPEN_TOP_OFFSET_PX default.
  openTopOffsetPx: 274,
  // Reserve room for the company/years label below the open cartridge.
  openBottomGapPx: 28,
  openLabelInsetFraction: 0.53,
}
export const CAMERA_PRESET_SMALL: ReferenceCameraPreset = {
  margin: 1.0,
  aspect: 390 / 640,
  panFraction: 0,
  verticalPanFraction: 0,
  verticalPanPx: 24,
  openInPlace: true,
  // Room below the opened cartridge, clear of the cartridges beneath it, for
  // the company/years label.
  openBottomGapPx: 28,
  // Keep a little more breathing room below the cartridge on small screens.
  openLabelInsetFraction: 0.33,
}

export const STICKER_APPROACH_DISTANCE = 0.55
export const CAPTION_FONT_SIZE = 14
export const CAPTION_LINE_HEIGHT = 1.25
export const CAPTION_HEIGHT = CAPTION_FONT_SIZE * CAPTION_LINE_HEIGHT * 2
export type CartridgeLayoutEntry = {
  name: string;
  company: string;
  period?: string;
  color: string;
  label: string;
  applicationLabel?: string;
  position: [number, number, number];
  restingYaw: number;
  restingRoll: number;
  restingPitch?: number;
  closedHeight: number;
  shellOpacity?: number;
}

