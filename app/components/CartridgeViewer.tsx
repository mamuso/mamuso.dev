"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Html,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import type { Group, Object3D } from "three";
import * as stylex from "@stylexjs/stylex";

import CartridgeBackdrop from "./CartridgeBackdrop";

// Matches the cartridge model's footprint in local space (X unaffected by
// the resting pitch, which only rotates around X) — used both as the
// pointer hit target and to offset the hover label clear of the shell.
const CARTRIDGE_WIDTH = 0.11;
const CARTRIDGE_HITBOX_GEOMETRY = new THREE.BoxGeometry(0.11, 0.072, 0.02);
const HOVER_LABEL_GAP = 0.02;

// Vertical room a cartridge needs once clicked open to show its front (its
// natural, unpitched height) instead of just its spine thickness, plus a
// little breathing room so it doesn't touch its neighbors.
const OPEN_HEIGHT = 0.072 + 0.02;
// Click flips a cartridge from its resting pitch back to its natural,
// front-facing orientation.
const OPEN_PITCH = 0;
// Small random roll each time a cartridge opens, as if it had just been set
// down — the closed spine stack stays perfectly aligned.
const OPEN_ROLL_JITTER_DEG = 3;
// However tall the open cartridge is, or which one it is, pin it to the
// same fixed pixel offset from the canvas top so it never grows past frame.
// Per-preset override lives on CameraPreset.openTopOffsetPx; this is the
// fallback when a preset doesn't set one.
const OPEN_TOP_OFFSET_PX = 140;

/** World Y, on the world-X=0/world-Z=planeZ plane, that projects to a given
 * pixel Y (measured from the canvas top) under the current (static) camera. */
function pixelYToWorldY(
  camera: THREE.Camera,
  pixelY: number,
  canvasHeightPx: number,
  planeZ: number
) {
  camera.updateMatrixWorld();
  if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
  const probe = new THREE.Vector3(0, 0, planeZ).project(camera);
  const ndcY = 1 - (pixelY / canvasHeightPx) * 2;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(probe.x, ndcY), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, point);
  return point.y;
}

const HOVER_LIFT = 0.1;
const DETAIL_LIFT = 0.19;
const DETAIL_HOVER_LIFT = 0.28;
const STATIC_FLIP_DURATION = 0.7;
const STATIC_RETURN_STIFFNESS = 100;
const STATIC_RETURN_DAMPING = 16;
const ROCK_YAW_START = -10 * (Math.PI / 180);
const ROCK_YAW_END = 10 * (Math.PI / 180);
const ROCK_PITCH_START = -15 * (Math.PI / 180);
const ROCK_PITCH_END = 15 * (Math.PI / 180);
const ROCK_PERIOD_SEC = 12;
const DEG = Math.PI / 180;
// Keep a hint of the cartridge face visible after it lands instead of resting
// at a perfectly edge-on 90-degree pitch.
const STACK_RESTING_PITCH = 85 * DEG;
// A long lens keeps the top-down stack close to orthographic while retaining
// enough perspective for the hover and opening motions to read as depth.
const CAMERA_FOV_DEGREES = 14;

// Hero entrance: build the stack from the bottom up so each falling cartridge
// lands above the previous one instead of passing through it.
const ENTRANCE_OFFSET_Y = 0.4;
const ENTRANCE_OFFSET_Z = 0.5;
const ENTRANCE_PITCH_OFFSET = -45 * DEG;
const ENTRANCE_DURATION_SEC = 1.15;
const ENTRANCE_STAGGER_SEC = 0.1;
const TAP_MAX_MOVEMENT_PX = 8;

// Intro reveal: hold, then gently lift + tilt into place.
const INTRO_DELAY_SEC = 3;
const INTRO_DURATION_SEC = 6;
const INTRO_END_PITCH = -10 * DEG;
const INTRO_LIFT = 0.05;

// Vertical pitch between cartridge centers. With cartridges pitched 90deg on X,
// the stacking axis is now the cartridge's thickness (~0.021) rather than its
// height, so they nearly touch but never overlap.
const ROW_PITCH = 0.016;

// Fraction of the visible half-width to pan the camera by, so the stack sits
// off-center instead of dead center — without changing the framing distance.
// Tunable per preset (see CAMERA_PRESET_LARGE/SMALL below). Since it's a
// fraction of the visible width AT THE REFERENCE ASPECT (not the real one),
// crop-safety at the reference aspect does NOT by itself guarantee safety at
// every wider real aspect when the reference aspect is <1 (width-dominant
// fit) — the required margin has to be solved for directly (see
// CAMERA_PRESET_LARGE's comment for the safe-panFraction formula at a given
// margin/reference aspect).
const CAMERA_PAN_FRACTION = 0.5;

// Fraction of the visible half-height to shift camera+target by (together,
// so the look direction doesn't change — a dolly, not a tilt). Since content
// stays fixed while the viewing window itself shifts, a NEGATIVE fraction
// (camera+target move down) makes content appear HIGHER/closer to the top;
// a POSITIVE fraction makes it appear lower.
// Tunable per preset since the same fraction reads as a much bigger gap on
// a taller canvas (world-space framing is unchanged, but it's stretched
// over more pixels) — see CartridgeViewer's h-[580px] lg:h-[760px].
const CAMERA_VERTICAL_PAN_FRACTION = -0.15;

// Camera framing is computed once from a fixed reference aspect ratio per
// breakpoint (not the live canvas size), so it never shifts as the window
// resizes — only when CartridgeStage swaps presets at the 720px breakpoint.
// Each reference aspect uses that breakpoint's *narrowest* expected width
// over that breakpoint's canvas height.
export type CameraPreset = {
  margin: number;
  aspect: number;
  panFraction?: number;
  verticalPanFraction?: number;
  openTopOffsetPx?: number;
  openBottomGapPx?: number;
  compactLabels?: boolean;
};
// The large composition deliberately prioritizes scale and its rightward pan
// over being fully crop-safe at the narrowest widths in this breakpoint.
// Lowering the margin moves the fixed camera closer and enlarges the stack.
export const CAMERA_PRESET_LARGE: CameraPreset = {
  margin: 1.35,
  aspect: 720 / 760,
  panFraction: 0.75,
  verticalPanFraction: -0.22,
  // 100px lower than the OPEN_TOP_OFFSET_PX default.
  openTopOffsetPx: 240,
};
export const CAMERA_PRESET_SMALL: CameraPreset = {
  margin: 1.3,
  aspect: 390 / 580,
  panFraction: 0,
  verticalPanFraction: 0.1,
  // Mobile's cartridges rest lower in frame than desktop's, so an opened
  // cartridge needs more headroom to land clear of the stack below it.
  openTopOffsetPx: 200,
  // Room below the opened cartridge, clear of the cartridges beneath it, to
  // later hold text — mobile only.
  openBottomGapPx: 50,
  // Mobile shows the company/years label under the open cartridge instead
  // of beside the hovered one — there's no room for a side label, and hover
  // isn't a mobile concept anyway.
  compactLabels: true,
};

import { CARTRIDGES } from "@/data/cartridges";

const LABEL_URLS = CARTRIDGES.map((c) => c.label);
export type CartridgeMotion = "still" | "hover" | "rock" | "static" | "frozen" | "intro";

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

function CartridgeInner({
  scene,
  position,
  color,
  labelTexture,
  restingYaw,
  restingRoll,
  restingPitch = 0,
  motion = "still",
  hoverLift = HOVER_LIFT,
  detailLift = DETAIL_LIFT,
  shellOpacity,
  renderOrderBase = 0,
  onHoverChange,
  isOpen = false,
  onToggleOpen,
  entranceDelaySec,
}: {
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
  entranceDelaySec?: number;
}) {
  const { gl, invalidate } = useThree();
  const isRock = motion === "rock";
  const isStatic = motion === "static";
  const isFrozen = motion === "frozen";
  const isIntro = motion === "intro";
  const isDetailPose = isRock || isStatic || isFrozen;

  const instance = useMemo(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    const pixelRatio = gl.getPixelRatio();
    const clone = scene.clone();
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.raycast = () => null;
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        const hasArtwork = materials.some(isLabelArtworkMaterial);
        const isShell = materials.some((m) => m.name === "Cartridge Shell");
        obj.material = Array.isArray(obj.material)
          ? materials.map((m) =>
              prepareMaterial(
                m,
                color,
                maxAniso,
                pixelRatio,
                labelTexture,
                shellOpacity
              )
            )
          : prepareMaterial(
              materials[0],
              color,
              maxAniso,
              pixelRatio,
              labelTexture,
              shellOpacity
            );
        if (hasArtwork) {
          obj.renderOrder = renderOrderBase + 1;
          obj.castShadow = false;
          obj.receiveShadow = false;
        } else if (isShell && shellOpacity != null && shellOpacity < 1) {
          obj.castShadow = false;
          obj.renderOrder = renderOrderBase;
        }
      }
    });
    return clone;
  }, [scene, color, gl, labelTexture, shellOpacity, renderOrderBase]);

  const modelCenter = useMemo(
    () => new THREE.Box3().setFromObject(instance).getCenter(new THREE.Vector3()),
    [instance]
  );

  const pivotRef = useRef<Group>(null);
  const yawVelocity = useRef(0);
  const yawAngle = useRef(isRock ? ROCK_YAW_START : restingYaw);
  const yawTarget = useRef(isRock ? ROCK_YAW_START : restingYaw);
  const rollVelocity = useRef(0);
  const rollAngle = useRef(restingRoll);
  const rollTarget = useRef(restingRoll);
  const openRollOffset = useRef(0);
  const wasOpen = useRef(false);
  const pitchVelocity = useRef(0);
  const pitchAngle = useRef(
    isRock
      ? ROCK_PITCH_START
      : restingPitch +
          (entranceDelaySec === undefined ? 0 : ENTRANCE_PITCH_OFFSET)
  );
  const pitchTarget = useRef(isRock ? ROCK_PITCH_START : restingPitch);
  const depthVelocity = useRef(0);
  const depthPosition = useRef(
    (isDetailPose ? detailLift : 0) +
      (entranceDelaySec === undefined ? 0 : ENTRANCE_OFFSET_Z)
  );
  const depthTarget = useRef(isDetailPose ? detailLift : 0);
  const positionYVelocity = useRef(0);
  const positionY = useRef(
    position[1] + (entranceDelaySec === undefined ? 0 : ENTRANCE_OFFSET_Y)
  );
  const positionYTarget = useRef(position[1]);
  const hovered = useRef(false);
  const hoverMotion = useRef(false);
  const entranceStart = useRef<number | null>(null);
  const entranceComplete = useRef(entranceDelaySec === undefined);
  const restedRef = useRef(
    entranceDelaySec === undefined && (isStatic || !isRock)
  );
  const staticFlipProgress = useRef(0);
  const staticFlipDirection = useRef<0 | 1 | -1>(0);
  const introStart = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!pivotRef.current || isRock) return;
    pivotRef.current.rotation.set(
      pitchAngle.current,
      restingYaw,
      restingRoll
    );
    pivotRef.current.position.z = depthPosition.current;
    invalidate();
  }, [isRock, isDetailPose, detailLift, restingPitch, restingYaw, restingRoll, invalidate]);

  // Click flips this cartridge to its front-facing orientation in place —
  // no forward pop, it stays flush at the same depth as the rest of the
  // stack — with a small random roll, as if just set down. Every other
  // cartridge just springs its Y slot to make room.
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      openRollOffset.current =
        (Math.random() * 2 - 1) * OPEN_ROLL_JITTER_DEG * DEG;
    } else if (!isOpen) {
      openRollOffset.current = 0;
    }
    pitchTarget.current = isOpen ? OPEN_PITCH : restingPitch;
    rollTarget.current = isOpen
      ? restingRoll + openRollOffset.current
      : restingRoll;
    depthTarget.current = isDetailPose ? detailLift : 0;
    wasOpen.current = isOpen;
    restedRef.current = false;
    invalidate();
  }, [isOpen, restingPitch, restingRoll, isDetailPose, detailLift, invalidate]);

  // Whichever cartridge is open makes the whole stack reflow — every
  // cartridge (open or not) springs to its newly assigned Y slot.
  useEffect(() => {
    positionYTarget.current = position[1];
    restedRef.current = false;
    invalidate();
  }, [position[1], invalidate]);

  useFrame((state, delta) => {
    if (!pivotRef.current) return;
    if (isFrozen) return;

    if (!entranceComplete.current) {
      if (entranceStart.current === null) {
        entranceStart.current = state.clock.elapsedTime;
      }
      const elapsed =
        state.clock.elapsedTime - entranceStart.current - (entranceDelaySec ?? 0);
      const progress = THREE.MathUtils.clamp(
        elapsed / ENTRANCE_DURATION_SEC,
        0,
        1
      );
      // Smootherstep has zero velocity and acceleration at both ends, avoiding
      // the abrupt launch of ease-out while still settling without a bounce.
      const eased =
        progress * progress * progress *
        (progress * (progress * 6 - 15) + 10);

      positionY.current =
        positionYTarget.current + ENTRANCE_OFFSET_Y * (1 - eased);
      pivotRef.current.position.y = positionY.current;
      depthPosition.current =
        depthTarget.current + ENTRANCE_OFFSET_Z * (1 - eased);
      pivotRef.current.position.z = depthPosition.current;
      pitchAngle.current =
        restingPitch + ENTRANCE_PITCH_OFFSET * (1 - eased);
      pivotRef.current.rotation.x = pitchAngle.current;

      if (progress < 1) {
        invalidate();
      } else {
        entranceComplete.current = true;
        positionY.current = positionYTarget.current;
        depthPosition.current = depthTarget.current;
        pitchAngle.current = restingPitch;
        pivotRef.current.position.y = positionY.current;
        pivotRef.current.position.z = depthPosition.current;
        pivotRef.current.rotation.x = pitchAngle.current;
        restedRef.current = true;
      }
      return;
    }

    if (isIntro) {
      if (introStart.current === null) introStart.current = state.clock.elapsedTime;
      const elapsed = state.clock.elapsedTime - introStart.current;
      const p = THREE.MathUtils.clamp(
        (elapsed - INTRO_DELAY_SEC) / INTRO_DURATION_SEC,
        0,
        1
      );
      // easeInOutCubic: gentle start and a soft, elegant settle.
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      pivotRef.current.rotation.x = THREE.MathUtils.lerp(
        restingPitch,
        INTRO_END_PITCH,
        eased
      );
      pivotRef.current.rotation.y = restingYaw;
      pivotRef.current.rotation.z = restingRoll;
      pivotRef.current.position.z = THREE.MathUtils.lerp(0, INTRO_LIFT, eased);

      if (p < 1) invalidate();
      return;
    }

    if (isRock) {
      // Cosine ease: soft pause near the extremes on both pitch and yaw.
      const t = 0.5 - 0.5 * Math.cos((state.clock.elapsedTime / ROCK_PERIOD_SEC) * Math.PI * 2);
      pitchAngle.current = THREE.MathUtils.lerp(ROCK_PITCH_START, ROCK_PITCH_END, t);
      yawAngle.current = THREE.MathUtils.lerp(ROCK_YAW_START, ROCK_YAW_END, t);
      pivotRef.current.rotation.x = pitchAngle.current;
      pivotRef.current.rotation.y = yawAngle.current;
      pivotRef.current.rotation.z = restingRoll;
      pivotRef.current.position.z = DETAIL_LIFT;
      invalidate();
      return;
    }

    if (isStatic) {
      const flipping = staticFlipDirection.current !== 0;
      const animating = flipping || hoverMotion.current || !restedRef.current;
      if (!animating) return;

      const dt = Math.min(delta, 1 / 30);

      if (flipping) {
        staticFlipProgress.current += staticFlipDirection.current * (dt / STATIC_FLIP_DURATION);
        staticFlipProgress.current = THREE.MathUtils.clamp(staticFlipProgress.current, 0, 1);

        if (staticFlipDirection.current === 1 && staticFlipProgress.current >= 1) {
          staticFlipDirection.current = 0;
        } else if (staticFlipDirection.current === -1 && staticFlipProgress.current <= 0) {
          staticFlipDirection.current = 0;
          staticFlipProgress.current = 0;
        }
      }

      const eased = 0.5 - 0.5 * Math.cos(staticFlipProgress.current * Math.PI);
      yawAngle.current = restingYaw + eased * Math.PI * 2;
      yawVelocity.current = 0;

      const motionStiffness = hoverMotion.current ? STATIC_RETURN_STIFFNESS : 90;
      const motionDamping = hoverMotion.current ? STATIC_RETURN_DAMPING : 14;

      const rollDisplacement = rollAngle.current - rollTarget.current;
      rollVelocity.current +=
        (-motionStiffness * rollDisplacement - motionDamping * rollVelocity.current) * dt;
      rollAngle.current += rollVelocity.current * dt;

      const pitchDisplacement = pitchAngle.current - pitchTarget.current;
      pitchVelocity.current +=
        (-motionStiffness * pitchDisplacement - motionDamping * pitchVelocity.current) * dt;
      pitchAngle.current += pitchVelocity.current * dt;

      const depthDisplacement = depthPosition.current - depthTarget.current;
      depthVelocity.current +=
        (-motionStiffness * depthDisplacement - motionDamping * depthVelocity.current) * dt;
      depthPosition.current += depthVelocity.current * dt;

      pivotRef.current.rotation.x = pitchAngle.current;
      pivotRef.current.rotation.y = yawAngle.current;
      pivotRef.current.rotation.z = rollAngle.current;
      pivotRef.current.position.z = depthPosition.current;

      const EPS_POS = 1e-5;
      const EPS_VEL = 1e-4;
      const settled =
        !flipping &&
        Math.abs(rollDisplacement) < EPS_POS &&
        Math.abs(rollVelocity.current) < EPS_VEL &&
        Math.abs(pitchDisplacement) < EPS_POS &&
        Math.abs(pitchVelocity.current) < EPS_VEL &&
        Math.abs(depthDisplacement) < EPS_POS &&
        Math.abs(depthVelocity.current) < EPS_VEL;

      if (settled && !restedRef.current) {
        rollAngle.current = rollTarget.current;
        pitchAngle.current = pitchTarget.current;
        depthPosition.current = depthTarget.current;
        pivotRef.current.rotation.z = rollAngle.current;
        pivotRef.current.rotation.x = pitchAngle.current;
        pivotRef.current.position.z = depthPosition.current;
        hoverMotion.current = false;
        restedRef.current = true;
      } else if (!settled || flipping) {
        restedRef.current = false;
      }

      invalidate();
      return;
    }

    if (restedRef.current && !hoverMotion.current) return;

    const dt = Math.min(delta, 1 / 30);
    const stiffness = 360;
    const damping = 28;
    const motionStiffness = hoverMotion.current ? 160 : stiffness;
    const motionDamping = hoverMotion.current ? 18 : damping;

    const yawDisplacement = yawAngle.current - yawTarget.current;
    yawVelocity.current +=
      (-motionStiffness * yawDisplacement - motionDamping * yawVelocity.current) * dt;
    yawAngle.current += yawVelocity.current * dt;
    pivotRef.current.rotation.y = yawAngle.current;

    const rollDisplacement = rollAngle.current - rollTarget.current;
    rollVelocity.current +=
      (-motionStiffness * rollDisplacement - motionDamping * rollVelocity.current) * dt;
    rollAngle.current += rollVelocity.current * dt;
    pivotRef.current.rotation.z = rollAngle.current;

    const pitchDisplacement = pitchAngle.current - pitchTarget.current;
    pitchVelocity.current +=
      (-motionStiffness * pitchDisplacement - motionDamping * pitchVelocity.current) * dt;
    pitchAngle.current += pitchVelocity.current * dt;
    pivotRef.current.rotation.x = pitchAngle.current;

    const depthDisplacement = depthPosition.current - depthTarget.current;
    depthVelocity.current +=
      (-motionStiffness * depthDisplacement - motionDamping * depthVelocity.current) * dt;
    depthPosition.current += depthVelocity.current * dt;
    pivotRef.current.position.z = depthPosition.current;

    const positionYDisplacement = positionY.current - positionYTarget.current;
    positionYVelocity.current +=
      (-motionStiffness * positionYDisplacement - motionDamping * positionYVelocity.current) * dt;
    positionY.current += positionYVelocity.current * dt;
    pivotRef.current.position.y = positionY.current;

    const EPS_POS = 1e-5;
    const EPS_VEL = 1e-4;
    const settled =
      Math.abs(yawDisplacement) < EPS_POS &&
      Math.abs(yawVelocity.current) < EPS_VEL &&
      Math.abs(rollDisplacement) < EPS_POS &&
      Math.abs(rollVelocity.current) < EPS_VEL &&
      Math.abs(pitchDisplacement) < EPS_POS &&
      Math.abs(pitchVelocity.current) < EPS_VEL &&
      Math.abs(depthDisplacement) < EPS_POS &&
      Math.abs(depthVelocity.current) < EPS_VEL &&
      Math.abs(positionYDisplacement) < EPS_POS &&
      Math.abs(positionYVelocity.current) < EPS_VEL;

    if (settled) {
      if (!restedRef.current) {
        yawAngle.current = yawTarget.current;
        rollAngle.current = rollTarget.current;
        pitchAngle.current = pitchTarget.current;
        depthPosition.current = depthTarget.current;
        positionY.current = positionYTarget.current;
        pivotRef.current.rotation.y = yawAngle.current;
        pivotRef.current.rotation.z = rollAngle.current;
        pivotRef.current.rotation.x = pitchAngle.current;
        pivotRef.current.position.z = depthPosition.current;
        pivotRef.current.position.y = positionY.current;
        hoverMotion.current = false;
        restedRef.current = true;
        invalidate();
      }
    } else {
      restedRef.current = false;
      invalidate();
    }
  });

  return (
    <group
      ref={pivotRef}
      position={[
        position[0],
        positionY.current,
        depthPosition.current,
      ]}
      rotation={[pitchAngle.current, yawAngle.current, rollAngle.current]}
      userData={{
        cameraPositionY: position[1],
        cameraPositionZ: isDetailPose ? detailLift : 0,
        cameraRotationX: restingPitch,
      }}
    >
      <primitive object={instance} position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]} />
      {(onHoverChange || onToggleOpen) && (
        <mesh
          geometry={CARTRIDGE_HITBOX_GEOMETRY}
          onPointerEnter={(event) => {
            event.stopPropagation();
            if (!entranceComplete.current) return;
            gl.domElement.style.cursor = "pointer";
            onHoverChange?.(true);
          }}
          onPointerLeave={(event) => {
            event.stopPropagation();
            gl.domElement.style.cursor = "auto";
            onHoverChange?.(false);
          }}
          onClick={(event) => {
            event.stopPropagation();
            if (
              event.delta > TAP_MAX_MOVEMENT_PX ||
              !entranceComplete.current
            ) return;
            onToggleOpen?.();
          }}
        >
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}

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

/**
 * Frames its children with a fixed camera transform, computed once from a
 * fixed reference aspect ratio (`preset.aspect`) rather than the live canvas
 * size — so the framing never depends on the actual pixel dimensions of the
 * container, only on the content's own bounding box and the chosen preset.
 * Mirrors drei's Bounds `fit` math, then applies the same lateral/vertical
 * dolly CartridgePan used to, so the stack sits right of center instead of
 * dead center.
 */
function FixedCameraRig({
  preset,
  children,
}: {
  preset: CameraPreset;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group>(null);
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((state) => state.invalidate);

  // Mount-only: content is static, and re-running this on later renders
  // (e.g. resize events) is exactly the size-dependent behavior this
  // component exists to avoid.
  useLayoutEffect(() => {
    if (!groupRef.current) return;

    // Entrance motion starts the cartridges above their resting slots. Frame
    // the settled layout so the camera remains fixed while they fall in.
    const animatedTransforms: Array<{
      object: Object3D;
      y: number;
      z: number;
      rotationX: number;
    }> = [];
    groupRef.current.traverse((object) => {
      const cameraPositionY = object.userData.cameraPositionY;
      const cameraPositionZ = object.userData.cameraPositionZ;
      const cameraRotationX = object.userData.cameraRotationX;
      if (
        typeof cameraPositionY !== "number" ||
        typeof cameraPositionZ !== "number" ||
        typeof cameraRotationX !== "number"
      ) return;
      animatedTransforms.push({
        object,
        y: object.position.y,
        z: object.position.z,
        rotationX: object.rotation.x,
      });
      object.position.y = cameraPositionY;
      object.position.z = cameraPositionZ;
      if (preset.compactLabels) object.rotation.x = cameraRotationX;
    });
    const box3 = new THREE.Box3().setFromObject(groupRef.current);
    for (const { object, y, z, rotationX } of animatedTransforms) {
      object.position.y = y;
      object.position.z = z;
      object.rotation.x = rotationX;
    }
    if (box3.isEmpty()) return;
    const center = box3.getCenter(new THREE.Vector3());
    const size = box3.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    const halfFov = (camera.fov * DEG) / 2;
    const fitHeightDistance = maxSize / (2 * Math.tan(halfFov));
    const fitWidthDistance = fitHeightDistance / preset.aspect;
    const distance = preset.margin * Math.max(fitHeightDistance, fitWidthDistance);

    const visibleHalfHeight = distance * Math.tan(halfFov);
    const visibleHalfWidth = visibleHalfHeight * preset.aspect;
    const offset = visibleHalfWidth * (preset.panFraction ?? CAMERA_PAN_FRACTION);
    const verticalOffset =
      visibleHalfHeight * (preset.verticalPanFraction ?? CAMERA_VERTICAL_PAN_FRACTION);

    const camPos = center.clone();
    camPos.z += distance;
    camPos.x -= offset;
    camPos.y += verticalOffset;
    const target = center.clone();
    target.x -= offset;
    target.y += verticalOffset;

    camera.position.copy(camPos);
    camera.near = Math.max(
      0.01,
      distance - maxSize - ENTRANCE_OFFSET_Z
    );
    camera.far = distance + maxSize * 4;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <group ref={groupRef}>{children}</group>;
}

function CartridgeSceneTextures({
  cameraPreset,
  layout,
  labelUrls,
  shadowOpacity = 0.14,
  shadowPlanePosition = [0, 0, -0.027] as [number, number, number],
  lightPosition = [1, 1, 5] as [number, number, number],
  motion = "still",
  hoverLift = HOVER_LIFT,
  detailLift = DETAIL_LIFT,
}: {
  cameraPreset: CameraPreset;
  layout: CartridgeLayoutEntry[];
  labelUrls: string[];
  shadowOpacity?: number;
  shadowPlanePosition?: [number, number, number];
  lightPosition?: [number, number, number];
  motion?: CartridgeMotion;
  hoverLift?: number;
  detailLift?: number;
}) {
  const { scene } = useGLTF("/models/famicom_cartridge.glb");
  const textures = useTexture(labelUrls);
  const { gl, invalidate, camera, size } = useThree();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Contiguous Y slots: everyone gets ROW_PITCH except the open cartridge,
  // which gets OPEN_HEIGHT — the rest spring apart to make room. Closed, the
  // whole stack is centered; open, the whole arrangement is shifted so the
  // open cartridge always lands at the same fixed pixel offset from the
  // canvas top, however tall it is or wherever it sits in the stack. On
  // presets with openBottomGapPx set, an extra gap is inserted right after
  // the open cartridge's slot (pushing only the cartridges below it further
  // down) to leave room for text under the open cartridge.
  const { yPositions, openLabelY } = useMemo(() => {
    const openTopOffsetPx = cameraPreset.openTopOffsetPx ?? OPEN_TOP_OFFSET_PX;
    const openBottomGapPx = cameraPreset.openBottomGapPx ?? 0;
    const extraBottomGap =
      openIndex !== null && openBottomGapPx > 0
        ? pixelYToWorldY(camera, openTopOffsetPx, size.height, 0) -
          pixelYToWorldY(camera, openTopOffsetPx + openBottomGapPx, size.height, 0)
        : 0;
    const heights = layout.map((_, i) => (i === openIndex ? OPEN_HEIGHT : ROW_PITCH));
    const total = heights.reduce((sum, h) => sum + h, 0) + extraBottomGap;
    let cursor = total / 2;
    const centered = heights.map((h, i) => {
      const center = cursor - h / 2;
      cursor -= h;
      if (i === openIndex) cursor -= extraBottomGap;
      return center;
    });
    if (openIndex === null) return { yPositions: centered, openLabelY: 0 };
    const openWorldY = pixelYToWorldY(camera, openTopOffsetPx, size.height, 0);
    const shift = openWorldY - centered[openIndex];
    // Keep the compact label close to the cartridge while leaving most of the
    // reserved gap available before the cartridges below it.
    const labelY = centered[openIndex] - OPEN_HEIGHT / 2 - extraBottomGap * 0.1 + shift;
    return { yPositions: centered.map((y) => y + shift), openLabelY: labelY };
  }, [
    layout,
    openIndex,
    camera,
    size.height,
    cameraPreset.openTopOffsetPx,
    cameraPreset.openBottomGapPx,
  ]);

  // On non-compact (larger) breakpoints, the side label sticks to whichever
  // cartridge is open even once the pointer leaves it — hover still takes
  // over for previewing a different cartridge in the meantime.
  const sideLabelIndex = hoveredIndex ?? openIndex;

  const textureByLabel = useMemo(() => {
    const list = Array.isArray(textures) ? textures : [textures];
    const map = new Map<string, THREE.Texture>();
    labelUrls.forEach((url, i) => map.set(url, list[i]));
    return map;
  }, [textures, labelUrls]);

  useLayoutEffect(() => {
    for (const texture of textureByLabel.values()) {
      configureLabelTexture(texture, gl);
    }
    invalidate();
  }, [textureByLabel, gl, invalidate]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={lightPosition}
        intensity={0.8}
        shadow-bias={-0.0001}
        shadow-normalBias={0.002}
        shadow-mapSize={[1024, 1024]}
        shadow-radius={16}
        shadow-camera-left={-0.35}
        shadow-camera-right={0.35}
        shadow-camera-top={0.4}
        shadow-camera-bottom={-0.4}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
      <mesh position={shadowPlanePosition} receiveShadow>
        <planeGeometry args={[0.8, 0.8]} />
        <shadowMaterial transparent opacity={shadowOpacity} depthWrite={false} />
      </mesh>
      {/* Click-catcher behind everything: clicking empty canvas closes whichever
          cartridge is open. Cartridge hitboxes stopPropagation, so this only
          fires on genuine misses. */}
      <mesh position={[0, 0, -1]} onClick={() => setOpenIndex(null)}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <FixedCameraRig preset={cameraPreset}>
        <group>
          {layout.map((c, i) => (
            <CartridgeInner
              key={i}
              scene={scene}
              position={[c.position[0], yPositions[i]]}
              color={c.color}
              labelTexture={textureByLabel.get(c.label)!}
              restingYaw={c.restingYaw}
              restingRoll={c.restingRoll}
              restingPitch={c.restingPitch}
              motion={motion}
              hoverLift={hoverLift}
              detailLift={detailLift}
              shellOpacity={c.shellOpacity}
              renderOrderBase={i * 10}
              onHoverChange={(hovered) => setHoveredIndex(hovered ? i : null)}
              isOpen={i === openIndex}
              onToggleOpen={() => setOpenIndex((cur) => (cur === i ? null : i))}
              entranceDelaySec={
                (layout.length - 1 - i) * ENTRANCE_STAGGER_SEC
              }
            />
          ))}
          {!cameraPreset.compactLabels && sideLabelIndex !== null && (
            <Html
              position={[
                layout[sideLabelIndex].position[0] - CARTRIDGE_WIDTH / 2 - HOVER_LABEL_GAP,
                yPositions[sideLabelIndex],
                0,
              ]}
              style={{ pointerEvents: "none" }}
            >
              <div {...stylex.props(styles.label, styles.sideLabel)}>
                {layout[sideLabelIndex].company}
                <span {...stylex.props(styles.period)}>
                  {layout[sideLabelIndex].period ?? "0000 - 0000"}
                </span>
              </div>
            </Html>
          )}
          {cameraPreset.compactLabels && openIndex !== null && (
            <Html
              position={[layout[openIndex].position[0], openLabelY, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div {...stylex.props(styles.label, styles.compactLabel)}>
                {layout[openIndex].company}
                <span {...stylex.props(styles.period)}>
                  {layout[openIndex].period ?? "0000 - 0000"}
                </span>
              </div>
            </Html>
          )}
        </group>
      </FixedCameraRig>
      <Environment environmentIntensity={0.6} resolution={128}>
        <Lightformer intensity={3} position={[0, 5, 2]} scale={[5, 5]} />
        <Lightformer intensity={1.5} position={[-5, 1, 1]} scale={[3, 5]} />
        <Lightformer intensity={1} position={[5, -1, 1]} scale={[3, 5]} />
      </Environment>
    </>
  );
}

export function CartridgeScene({
  cameraPreset,
  layout,
  shadowOpacity = 0.14,
  shadowPlanePosition,
  lightPosition,
  motion = "still",
  hoverLift = HOVER_LIFT,
  detailLift = DETAIL_LIFT,
}: {
  cameraPreset: CameraPreset;
  layout: CartridgeLayoutEntry[];
  shadowOpacity?: number;
  shadowPlanePosition?: [number, number, number];
  lightPosition?: [number, number, number];
  motion?: CartridgeMotion;
  hoverLift?: number;
  detailLift?: number;
}) {
  const labelUrls = useMemo(
    () => [...new Set(layout.map((c) => c.label))],
    [layout]
  );

  return (
    <CartridgeSceneTextures
      cameraPreset={cameraPreset}
      layout={layout}
      labelUrls={labelUrls}
      shadowOpacity={shadowOpacity}
      shadowPlanePosition={shadowPlanePosition}
      lightPosition={lightPosition}
      motion={motion}
      hoverLift={hoverLift}
      detailLift={detailLift}
    />
  );
}

function isLabelArtworkMaterial(material: THREE.Material) {
  return (
    material.name === "Label (Artwork)" ||
    (material as THREE.MeshStandardMaterial).map != null
  );
}

const CARTRIDGE_GRAIN_INTENSITY = 0.015;

function addCartridgeGrain(material: THREE.Material, pixelRatio: number) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        /* glsl */ `
          float cartridgeGrainRandom(vec2 coordinates) {
            vec3 value = fract(vec3(coordinates.xyx) * 0.1031);
            value += dot(value, value.yzx + 33.33);
            return fract((value.x + value.y) * value.z);
          }

          void main() {
        `
      )
      .replace(
        "#include <opaque_fragment>",
        /* glsl */ `
          #include <opaque_fragment>

          float cartridgeGrain =
            cartridgeGrainRandom(floor(gl_FragCoord.xy)) - 0.5;
          float cartridgeLuminance = dot(
            gl_FragColor.rgb,
            vec3(0.2126, 0.7152, 0.0722)
          );
          float cartridgeMidtone =
            1.0 - abs(cartridgeLuminance * 2.0 - 1.0);
          float cartridgeGrainResponse = mix(
            0.35,
            1.0,
            smoothstep(0.0, 1.0, cartridgeMidtone)
          );
          float cartridgeDprResponse = min(${pixelRatio.toFixed(2)}, 2.0) * 0.5;

          gl_FragColor.rgb +=
            cartridgeGrain *
            ${CARTRIDGE_GRAIN_INTENSITY.toFixed(3)} *
            cartridgeDprResponse *
            cartridgeGrainResponse *
            gl_FragColor.a;
        `
      );
  };
  material.customProgramCacheKey = () =>
    `cartridge-grain-v1-${pixelRatio.toFixed(2)}`;
  material.needsUpdate = true;
  return material;
}

function prepareMaterial(
  material: THREE.Material,
  color: string,
  maxAniso: number,
  pixelRatio: number,
  labelTexture: THREE.Texture,
  shellOpacity?: number
) {
  if (material.name === "Cartridge Shell") {
    const tinted = material.clone() as THREE.MeshStandardMaterial;
    tinted.color.set(color);
    if (shellOpacity != null && shellOpacity < 1) {
      tinted.transparent = true;
      tinted.opacity = shellOpacity;
      tinted.depthWrite = false;
    }
    return addCartridgeGrain(sharpenTextures(tinted, maxAniso), pixelRatio);
  }
  if (material.name === "Label (Paper)") {
    const paper = material.clone() as THREE.MeshStandardMaterial;
    paper.visible = false;
    return sharpenTextures(paper, maxAniso);
  }
  if (isLabelArtworkMaterial(material)) {
    // Let the label respond to scene lighting while bypassing tone mapping to
    // preserve fine typography, and retain the cartridge's procedural grain.
    return addCartridgeGrain(
      new THREE.MeshStandardMaterial({
        map: labelTexture,
        color: 0xffffff,
        metalness: 0,
        roughness: 0.85,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
      pixelRatio
    );
  }
  return addCartridgeGrain(
    sharpenTextures(material.clone(), maxAniso),
    pixelRatio
  );
}

function configureLabelTexture(texture: THREE.Texture, gl: THREE.WebGLRenderer) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = gl.capabilities.getMaxAnisotropy();
  // These labels are typography-heavy and shown almost head-on. Sampling the
  // full-resolution source into a guaranteed 2x canvas keeps small type much
  // sharper than selecting a softened intermediate mip level.
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  gl.initTexture(texture);
}

function sharpenTextures(material: THREE.Material, maxAniso: number) {
  const std = material as THREE.MeshStandardMaterial;
  for (const map of [std.map, std.normalMap, std.roughnessMap, std.metalnessMap]) {
    if (map) {
      map.anisotropy = maxAniso;
      map.needsUpdate = true;
    }
  }
  return material;
}

useGLTF.preload("/models/famicom_cartridge.glb");
useTexture.preload(LABEL_URLS);

export default function CartridgeViewer({
  cameraPreset = CAMERA_PRESET_LARGE,
}: {
  cameraPreset?: CameraPreset;
}) {
  // Fine label typography needs a 2x render target even on standard-DPI
  // displays. The grain now lives in cartridge materials, so this no longer
  // multiplies the cost of a full-canvas post-processing target.
  const dpr = 2;

  const layout = useMemo(
    () =>
      CARTRIDGES.map((c, i) => {
        return {
          ...c,
          position: [
            0,
            ((CARTRIDGES.length - 1) / 2 - i) * ROW_PITCH,
          ] as [number, number],
          restingYaw: 0,
          restingRoll: 0,
          restingPitch: STACK_RESTING_PITCH,
        };
      }),
    []
  );

  return (
    <div {...stylex.props(styles.viewer)}>
      <CartridgeBackdrop />
      <Canvas
        camera={{ fov: CAMERA_FOV_DEGREES }}
        style={{ position: "relative", touchAction: "pan-y" }}
        dpr={dpr}
        frameloop="demand"
        performance={{ min: 0.75, max: 1, debounce: 200 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <CartridgeScene cameraPreset={cameraPreset} layout={layout} />
        </Suspense>
      </Canvas>
    </div>
  );
}

const styles = stylex.create({
  viewer: {
    borderColor: 'magenta',
    borderStyle: 'solid',
    borderWidth: 1,
    height: {
      default: 580,
      '@media (min-width: 720px)': 760,
    },
    left: '50%',
    marginInline: '-50vw',
    overflow: 'hidden',
    position: 'relative',
    right: '50%',
    width: '100vw',
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
  },
  period: {
    display: 'block',
    fontVariantNumeric: 'tabular-nums',
  },
  sideLabel: {
    textAlign: 'right',
    transform: 'translate(-100%, -50%)',
  },
  compactLabel: {
    textAlign: 'center',
    transform: 'translate(-50%, -50%)',
  },
});
