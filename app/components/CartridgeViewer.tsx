"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Environment, Html, useBounds, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Object3D } from "three";

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
// Click flips a cartridge from resting on its spine (pitched 90deg on X)
// back to its natural, front-facing orientation.
const OPEN_PITCH_OFFSET = -Math.PI / 2;
// Small random roll each time a cartridge opens, as if it had just been set
// down — the closed spine stack stays perfectly aligned.
const OPEN_ROLL_JITTER_DEG = 3;
// However tall the open cartridge is, or which one it is, pin it to the
// same fixed pixel offset from the canvas top so it never grows past frame.
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
// right of center instead of dead center — without changing Bounds' zoom.
const CAMERA_PAN_FRACTION = 0.5;

// Fraction of the visible half-height to raise the camera by, so the stack
// sits a bit lower in frame — leaving headroom above for opened cartridges.
const CAMERA_VERTICAL_PAN_FRACTION = -0.15;

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
}) {
  const { gl, invalidate } = useThree();
  const isRock = motion === "rock";
  const isStatic = motion === "static";
  const isFrozen = motion === "frozen";
  const isIntro = motion === "intro";
  const isDetailPose = isRock || isStatic || isFrozen;

  const instance = useMemo(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
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
              prepareMaterial(m, color, maxAniso, labelTexture, shellOpacity)
            )
          : prepareMaterial(materials[0], color, maxAniso, labelTexture, shellOpacity);
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
  const pitchVelocity = useRef(0);
  const pitchAngle = useRef(isRock ? ROCK_PITCH_START : restingPitch);
  const pitchTarget = useRef(isRock ? ROCK_PITCH_START : restingPitch);
  const depthVelocity = useRef(0);
  const depthPosition = useRef(isDetailPose ? detailLift : 0);
  const depthTarget = useRef(isDetailPose ? detailLift : 0);
  const positionYVelocity = useRef(0);
  const positionY = useRef(position[1]);
  const positionYTarget = useRef(position[1]);
  const hovered = useRef(false);
  const hoverMotion = useRef(false);
  const restedRef = useRef(isStatic || !isRock);
  const staticFlipProgress = useRef(0);
  const staticFlipDirection = useRef<0 | 1 | -1>(0);
  const introStart = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!pivotRef.current || isRock) return;
    pivotRef.current.rotation.set(restingPitch, restingYaw, restingRoll);
    pivotRef.current.position.z = isDetailPose ? detailLift : 0;
    invalidate();
  }, [isRock, isDetailPose, detailLift, restingPitch, restingYaw, restingRoll, invalidate]);

  // Click flips this cartridge to its front-facing orientation in place —
  // no forward pop, it stays flush at the same depth as the rest of the
  // stack — with a small random roll, as if just set down. Every other
  // cartridge just springs its Y slot to make room.
  useEffect(() => {
    pitchTarget.current = isOpen ? restingPitch + OPEN_PITCH_OFFSET : restingPitch;
    rollTarget.current = isOpen
      ? restingRoll + (Math.random() * 2 - 1) * OPEN_ROLL_JITTER_DEG * DEG
      : restingRoll;
    depthTarget.current = isDetailPose ? detailLift : 0;
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
      position={[position[0], positionY.current, isDetailPose ? detailLift : 0]}
      rotation={[restingPitch, restingYaw, restingRoll]}
    >
      <primitive object={instance} position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]} />
      {(onHoverChange || onToggleOpen) && (
        <mesh
          geometry={CARTRIDGE_HITBOX_GEOMETRY}
          onPointerEnter={(event) => {
            event.stopPropagation();
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
  color: string;
  label: string;
  position: [number, number];
  restingYaw: number;
  restingRoll: number;
  restingPitch?: number;
  shellOpacity?: number;
};

/**
 * Runs once Bounds has computed its fit (same center/distance it would use
 * for `reset()`), then re-aims the camera at a point offset along world X —
 * a lateral dolly that keeps the same distance/zoom instead of Bounds'
 * default dead-center framing.
 */
function CartridgePan() {
  const bounds = useBounds();
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;

  // Mount-only: Bounds itself only fits once on mount (no `observe` prop), so
  // this only needs to run once too. Re-running on later renders would derive
  // `direction` from camera.position after it's already been offset by a
  // previous call, compounding the shift into a visible rotation each time —
  // e.g. on mobile, address-bar show/hide during scroll fires resize events.
  useEffect(() => {
    const { center, distance } = bounds.getSize();
    const direction = camera.position.clone().sub(center).normalize();
    const visibleHalfWidth = distance * Math.tan((camera.fov * DEG) / 2) * camera.aspect;
    const offset = visibleHalfWidth * CAMERA_PAN_FRACTION;
    const visibleHalfHeight = distance * Math.tan((camera.fov * DEG) / 2);
    const verticalOffset = visibleHalfHeight * CAMERA_VERTICAL_PAN_FRACTION;

    const camPos = center.clone().addScaledVector(direction, distance);
    camPos.x -= offset;
    camPos.y += verticalOffset;
    const target = center.clone();
    target.x -= offset;
    target.y += verticalOffset;

    bounds.moveTo(camPos).lookAt({ target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function CartridgeSceneTextures({
  margin,
  layout,
  labelUrls,
  shadowOpacity = 0.14,
  shadowPlanePosition = [0, 0, -0.027] as [number, number, number],
  lightPosition = [1, 1, 5] as [number, number, number],
  motion = "still",
  hoverLift = HOVER_LIFT,
  detailLift = DETAIL_LIFT,
}: {
  margin: number;
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
  // canvas top, however tall it is or wherever it sits in the stack.
  const yPositions = useMemo(() => {
    const heights = layout.map((_, i) => (i === openIndex ? OPEN_HEIGHT : ROW_PITCH));
    const total = heights.reduce((sum, h) => sum + h, 0);
    let cursor = total / 2;
    const centered = heights.map((h) => {
      const center = cursor - h / 2;
      cursor -= h;
      return center;
    });
    if (openIndex === null) return centered;
    const openWorldY = pixelYToWorldY(camera, OPEN_TOP_OFFSET_PX, size.height, 0);
    const shift = openWorldY - centered[openIndex];
    return centered.map((y) => y + shift);
  }, [layout, openIndex, camera, size.height]);

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
      <Bounds fit clip margin={margin} maxDuration={0.001}>
        <CartridgePan />
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
            />
          ))}
          {hoveredIndex !== null && (
            <Html
              position={[
                layout[hoveredIndex].position[0] - CARTRIDGE_WIDTH / 2 - HOVER_LABEL_GAP,
                yPositions[hoveredIndex],
                0,
              ]}
              style={{ pointerEvents: "none" }}
            >
              <div className="-translate-x-full -translate-y-1/2 whitespace-nowrap text-right text-sm font-medium leading-tight">
                Company
                <br />
                0000 - 0000
              </div>
            </Html>
          )}
        </group>
      </Bounds>
      <Environment preset="studio" environmentIntensity={0.6} resolution={128} />
    </>
  );
}

export function CartridgeScene({
  margin,
  layout,
  shadowOpacity = 0.14,
  shadowPlanePosition,
  lightPosition,
  motion = "still",
  hoverLift = HOVER_LIFT,
  detailLift = DETAIL_LIFT,
}: {
  margin: number;
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
      margin={margin}
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

function prepareMaterial(
  material: THREE.Material,
  color: string,
  maxAniso: number,
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
    return sharpenTextures(tinted, maxAniso);
  }
  if (material.name === "Label (Paper)") {
    const paper = material.clone() as THREE.MeshStandardMaterial;
    paper.transparent = true;
    paper.opacity = 0;
    paper.depthWrite = false;
    return sharpenTextures(paper, maxAniso);
  }
  if (isLabelArtworkMaterial(material)) {
    return new THREE.MeshBasicMaterial({
      map: labelTexture,
      toneMapped: false,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }
  return sharpenTextures(material.clone(), maxAniso);
}

function configureLabelTexture(texture: THREE.Texture, gl: THREE.WebGLRenderer) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
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
  margin = 1.15,
}: {
  margin?: number;
}) {
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const update = () => setDpr(Math.min(window.devicePixelRatio, 2));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
          restingPitch: Math.PI / 2,
        };
      }),
    []
  );

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen h-[580px] overflow-hidden border border-[magenta]">
      <Canvas
        camera={{ fov: 20 }}
        dpr={dpr}
        frameloop="demand"
        performance={{ min: 0.75, max: 1, debounce: 200 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <CartridgeScene margin={margin} layout={layout} />
        </Suspense>
      </Canvas>
    </div>
  );
}
