"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { advanceCartridgeSpring } from "./cartridgeSpring";
import { ENTRANCE_OFFSET_Y, ENTRANCE_PITCH_OFFSET, ENTRANCE_OFFSET_Z, ENTRANCE_DURATION_SEC, OPEN_ROLL_JITTER_DEG, OPEN_PITCH, OPEN_DEPTH, DEG } from "./cartridgeConfig";

export function useCartridgeMotion({
  position, restingPitch, restingYaw, restingRoll, openYaw, openRoll,
  isOpen, isRackOpen, neighborDistance, desktopBlend, entranceDelaySec,
  entranceReady, mobileEntranceY, renderOrderBase,
}: {
  position: [number, number, number]; restingPitch: number; restingYaw: number; restingRoll: number;
  openYaw: number; openRoll: number; isOpen: boolean; isRackOpen: boolean;
  neighborDistance: number; desktopBlend: number; entranceDelaySec?: number;
  entranceReady: boolean; mobileEntranceY: number; renderOrderBase: number;
}) {
  const { invalidate } = useThree();
  const [restingX, restingY, restingZ] = position;
  const entranceY = THREE.MathUtils.lerp(mobileEntranceY, ENTRANCE_OFFSET_Y, desktopBlend);
  const entrancePitch = THREE.MathUtils.lerp(8 * DEG, ENTRANCE_PITCH_OFFSET, desktopBlend);
  const entranceDepth = THREE.MathUtils.lerp(-0.006, ENTRANCE_OFFSET_Z, desktopBlend);

  const pivotRef = useRef<Group>(null);
  const reducedMotion = useRef(false);
  const reflowWait = useRef(0);
  const reflowElapsed = useRef(0);
  const returning = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reducedMotion.current = media.matches; invalidate(); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [invalidate]);
  const yawVelocity = useRef(0);
  const yawAngle = useRef(restingYaw);
  const yawTarget = useRef(restingYaw);
  const rollVelocity = useRef(0);
  const rollAngle = useRef(restingRoll);
  const rollTarget = useRef(restingRoll);
  const openRollOffset = useRef(0);
  const wasOpen = useRef(false);
  const pitchVelocity = useRef(0);
  const pitchAngle = useRef(
    restingPitch +
          (entranceDelaySec === undefined ? 0 : entrancePitch)
  );
  const pitchTarget = useRef(restingPitch);
  const depthVelocity = useRef(0);
  const depthPosition = useRef(
    restingZ +
      (entranceDelaySec === undefined ? 0 : entranceDepth)
  );
  const depthTarget = useRef(
    restingZ
  );
  const positionXVelocity = useRef(0);
  const positionX = useRef(restingX);
  const positionXTarget = useRef(restingX);
  const positionYVelocity = useRef(0);
  const positionY = useRef(
    restingY + (entranceDelaySec === undefined ? 0 : entranceY)
  );
  const positionYTarget = useRef(restingY);
  const entranceStart = useRef<number | null>(null);
  const entranceDelay = useRef(entranceDelaySec);
  const entranceComplete = useRef(entranceDelaySec === undefined);
  const restedRef = useRef(
    entranceDelaySec === undefined
  );

  useLayoutEffect(() => {
    if (!pivotRef.current) return;
    pivotRef.current.rotation.set(
      pitchAngle.current,
      yawAngle.current,
      rollAngle.current
    );
    pivotRef.current.position.x = positionX.current;
    pivotRef.current.position.z = depthPosition.current;
    pivotRef.current.position.y = positionY.current;
    invalidate();
  }, [invalidate]);

  // The selected cartridge gains a little clearance while it turns. Keep
  // velocities on interruption; neighboring slots yield with a short lag.
  useEffect(() => {
    if (isOpen) returning.current = false;
    else if (wasOpen.current) returning.current = true;
    if (isOpen && !wasOpen.current) {
      openRollOffset.current =
        (Math.random() * 2 - 1) * OPEN_ROLL_JITTER_DEG * DEG;
    } else if (!isOpen) {
      openRollOffset.current = 0;
    }
    yawTarget.current = isOpen ? openYaw : restingYaw;
    pitchTarget.current = isOpen ? OPEN_PITCH : restingPitch;
    rollTarget.current = isOpen
      ? openRoll + openRollOffset.current
      : restingRoll;
    depthTarget.current = restingZ + (isOpen ? OPEN_DEPTH : 0);
    wasOpen.current = isOpen;
    restedRef.current = false;
    invalidate();
  }, [
    isOpen,
    restingYaw,
    openYaw,
    openRoll,
    restingPitch,
    restingRoll,
    restingZ,
    invalidate,
  ]);

  // Retarget every slot together, preserving velocity during selection and
  // responsive changes. X and Y use the same spring as the existing reflow.
  useEffect(() => {
    const mobileLag = isRackOpen ? 0.018 + Math.max(0, Math.min(neighborDistance - 1, 3)) * 0.007 : 0;
    reflowWait.current = isOpen ? 0 : THREE.MathUtils.lerp(
      returning.current ? 0 : mobileLag, 0.025 + (isRackOpen ? Math.min(neighborDistance, 3) * 0.012 : 0), desktopBlend,
    );
    reflowElapsed.current = 0;
    positionXTarget.current = restingX;
    positionYTarget.current = restingY;
    depthTarget.current = restingZ + (isOpen ? OPEN_DEPTH : 0);
    restedRef.current = false;
    invalidate();
  }, [restingX, restingY, restingZ, isOpen, isRackOpen, neighborDistance, desktopBlend, invalidate]);

  useFrame((state, delta) => {
    if (!pivotRef.current) return;

    if (!entranceComplete.current) {
      // Keep the starting pose parked until texture uploads and asynchronous
      // shader compilation finish. The animation clock starts on the first
      // frame after warm-up, so cold-load work cannot consume its duration.
      if (!entranceReady) return;
      if (entranceStart.current === null) {
        entranceStart.current = state.clock.elapsedTime;
      }
      const elapsed =
        state.clock.elapsedTime - entranceStart.current - (entranceDelay.current ?? 0);
      const entranceDuration = THREE.MathUtils.lerp(0.56, ENTRANCE_DURATION_SEC, desktopBlend) + Math.sin(renderOrderBase * 0.7) * 0.025;
      const progress = reducedMotion.current ? 1 : THREE.MathUtils.clamp(
        elapsed / entranceDuration,
        0,
        1
      );
      // Move immediately, then settle softly. An ease-in curve makes a cold
      // entrance look stalled even after the renderer is ready.
      const eased = 1 - Math.pow(1 - progress, 3);

      positionX.current = positionXTarget.current;
      pivotRef.current.position.x = positionX.current;
      positionY.current =
        positionYTarget.current + entranceY * (1 - eased);
      pivotRef.current.position.y = positionY.current;
      depthPosition.current =
        depthTarget.current + entranceDepth * (1 - eased);
      pivotRef.current.position.z = depthPosition.current;
      // Translation leads; the final rotation softly catches up without bounce.
      const angularProgress = THREE.MathUtils.clamp(progress / THREE.MathUtils.lerp(1, 1.36, desktopBlend), 0, 1);
      const angularEase = 1 - Math.pow(1 - angularProgress, 3);
      pitchAngle.current = pitchTarget.current + entrancePitch * (1 - angularEase);
      yawAngle.current = yawTarget.current;
      rollAngle.current = rollTarget.current;
      pivotRef.current.rotation.y = yawAngle.current;
      pivotRef.current.rotation.z = rollAngle.current;
      pivotRef.current.rotation.x = pitchAngle.current;

      if (progress < 1) {
        invalidate();
      } else {
        entranceComplete.current = true;
        positionY.current = positionYTarget.current;
        depthPosition.current = depthTarget.current;
        if (reducedMotion.current) pitchAngle.current = restingPitch;
        pitchVelocity.current = 0;
        pivotRef.current.position.y = positionY.current;
        pivotRef.current.position.z = depthPosition.current;
        pivotRef.current.rotation.x = pitchAngle.current;
        restedRef.current = false;
        invalidate();
      }
      return;
    }

    if (restedRef.current) return;

    if (reducedMotion.current) {
      yawAngle.current = yawTarget.current;
      rollAngle.current = rollTarget.current;
      pitchAngle.current = pitchTarget.current;
      depthPosition.current = depthTarget.current;
      positionX.current = positionXTarget.current;
      positionY.current = positionYTarget.current;
      yawVelocity.current = rollVelocity.current = pitchVelocity.current = 0;
      depthVelocity.current = positionXVelocity.current = positionYVelocity.current = 0;
      pivotRef.current.rotation.set(pitchAngle.current, yawAngle.current, rollAngle.current);
      pivotRef.current.position.set(positionX.current, positionY.current, depthPosition.current);
      returning.current = false;
      restedRef.current = true;
      return;
    }
    const dt = Math.min(delta, 1 / 30);
    reflowWait.current = Math.max(0, reflowWait.current - dt);
    reflowElapsed.current += dt;
    const stiffness = THREE.MathUtils.lerp(isOpen ? 205 : returning.current ? 310 : 260, isOpen ? 230 : 280, desktopBlend);
    const damping = THREE.MathUtils.lerp(isOpen ? 27 : returning.current ? 34 : 30, isOpen ? 26 : 29, desktopBlend);


    const yawDisplacement = advanceCartridgeSpring(
      yawAngle, yawVelocity, yawTarget.current, stiffness, damping, dt,
    );
    pivotRef.current.rotation.y = yawAngle.current;


    const rollDisplacement = advanceCartridgeSpring(
      rollAngle, rollVelocity, rollTarget.current, stiffness, damping, dt,
    );
    pivotRef.current.rotation.z = rollAngle.current;


    const pitchDisplacement = advanceCartridgeSpring(
      pitchAngle, pitchVelocity, pitchTarget.current, stiffness, damping, dt,
    );
    pivotRef.current.rotation.x = pitchAngle.current;


    const depthStiffness = THREE.MathUtils.lerp(isOpen ? 410 : returning.current ? 210 : 300, 330, desktopBlend);
    const depthDamping = THREE.MathUtils.lerp(isOpen ? 38 : 31, 32, desktopBlend);
    const depthDisplacement = advanceCartridgeSpring(
      depthPosition, depthVelocity, depthTarget.current, depthStiffness, depthDamping, dt,
    );
    pivotRef.current.position.z = depthPosition.current;

    const mobilePositionStiffness = isOpen ? 275 : returning.current ? 240 : isRackOpen
      ? 215 - Math.min(neighborDistance - 1, 3) * 14
      : THREE.MathUtils.lerp(105, 260, THREE.MathUtils.smoothstep(reflowElapsed.current, 0.03, 0.24));
    const positionStiffness = THREE.MathUtils.lerp(mobilePositionStiffness, isOpen ? 290 : 220, desktopBlend);
    const positionXDisplacement = positionX.current - positionXTarget.current;
    if (reflowWait.current === 0) {
      advanceCartridgeSpring(positionX, positionXVelocity, positionXTarget.current, positionStiffness, 29, dt);
    }
    pivotRef.current.position.x = positionX.current;

    const positionYDisplacement = positionY.current - positionYTarget.current;
    if (reflowWait.current === 0) {
      advanceCartridgeSpring(positionY, positionYVelocity, positionYTarget.current, positionStiffness, 29, dt);
    }
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
      Math.abs(positionXDisplacement) < EPS_POS &&
      Math.abs(positionXVelocity.current) < EPS_VEL &&
      Math.abs(positionYDisplacement) < EPS_POS &&
      Math.abs(positionYVelocity.current) < EPS_VEL;

    if (settled) {
      if (!restedRef.current) {
        yawAngle.current = yawTarget.current;
        rollAngle.current = rollTarget.current;
        pitchAngle.current = pitchTarget.current;
        depthPosition.current = depthTarget.current;
        positionX.current = positionXTarget.current;
        positionY.current = positionYTarget.current;
        pivotRef.current.position.x = positionX.current;
        pivotRef.current.rotation.y = yawAngle.current;
        pivotRef.current.rotation.z = rollAngle.current;
        pivotRef.current.rotation.x = pitchAngle.current;
        pivotRef.current.position.z = depthPosition.current;
        pivotRef.current.position.y = positionY.current;
        restedRef.current = true;
        returning.current = false;
        invalidate();
      }
    } else {
      restedRef.current = false;
      invalidate();
    }
  }, -2);

  return { pivotRef, entranceComplete };
}
