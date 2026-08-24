"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import {
  DETAIL_LIFT,
  ENTRANCE_DURATION_SEC,
  ENTRANCE_OFFSET_Y,
  ENTRANCE_OFFSET_Z,
  ENTRANCE_PITCH_OFFSET,
  INTRO_DELAY_SEC,
  INTRO_DURATION_SEC,
  INTRO_END_PITCH,
  INTRO_LIFT,
  OPEN_PITCH_OFFSET,
  OPEN_ROLL_JITTER_DEG,
  ROCK_PERIOD_SEC,
  ROCK_PITCH_END,
  ROCK_PITCH_START,
  ROCK_YAW_END,
  ROCK_YAW_START,
  STATIC_FLIP_DURATION,
  STATIC_RETURN_DAMPING,
  STATIC_RETURN_STIFFNESS,
  DEG,
} from "./constants";
import type { CartridgeMotion, CartridgeSettledTransform } from "./types";

type MotionOptions = {
  position: [number, number];
  restingYaw: number;
  restingRoll: number;
  restingPitch: number;
  motion: CartridgeMotion;
  detailLift: number;
  isOpen: boolean;
  reducedMotion: boolean;
  /**
   * Seconds to wait before this cartridge drops in. Omit to skip the entrance
   * and mount already settled.
   */
  entranceDelaySec?: number;
};

/**
 * Owns the imperative animation state for one cartridge. React controls the
 * targets; React Three Fiber's frame loop applies spring motion to the group.
 */
export function useCartridgeMotion({
  position,
  restingYaw,
  restingRoll,
  restingPitch,
  motion,
  detailLift,
  isOpen,
  reducedMotion,
  entranceDelaySec,
}: MotionOptions) {
  const invalidate = useThree((state) => state.invalidate);
  const isRock = motion === "rock";
  const isStatic = motion === "static";
  const isFrozen = motion === "frozen";
  const isIntro = motion === "intro";
  const isDetailPose = isRock || isStatic || isFrozen;
  const positionX = position[0];
  const targetPositionY = position[1];
  // Reduced motion skips the drop entirely and mounts the stack settled.
  const hasEntrance = entranceDelaySec !== undefined && !reducedMotion;
  const settledDepth = isDetailPose ? detailLift : 0;

  const pivotRef = useRef<Group>(null);
  const yawVelocity = useRef(0);
  const yawAngle = useRef(isRock ? ROCK_YAW_START : restingYaw);
  const yawTarget = useRef(isRock ? ROCK_YAW_START : restingYaw);
  const rollVelocity = useRef(0);
  const rollAngle = useRef(restingRoll);
  const rollTarget = useRef(restingRoll);
  const pitchVelocity = useRef(0);
  const pitchAngle = useRef(
    isRock
      ? ROCK_PITCH_START
      : restingPitch + (hasEntrance ? ENTRANCE_PITCH_OFFSET : 0)
  );
  const pitchTarget = useRef(isRock ? ROCK_PITCH_START : restingPitch);
  const depthVelocity = useRef(0);
  const depthPosition = useRef(
    settledDepth + (hasEntrance ? ENTRANCE_OFFSET_Z : 0)
  );
  const depthTarget = useRef(settledDepth);
  const positionYVelocity = useRef(0);
  const positionY = useRef(
    targetPositionY + (hasEntrance ? ENTRANCE_OFFSET_Y : 0)
  );
  const positionYTarget = useRef(targetPositionY);
  const hoverMotion = useRef(false);
  const entranceStart = useRef<number | null>(null);
  const entranceComplete = useRef(!hasEntrance);
  const restedRef = useRef(!hasEntrance && (isStatic || !isRock));
  const staticFlipProgress = useRef(0);
  const staticFlipDirection = useRef<0 | 1 | -1>(0);
  const introStart = useRef<number | null>(null);
  const previousIsOpen = useRef(isOpen);
  const openRollOffset = useRef(0);

  useLayoutEffect(() => {
    if (!pivotRef.current) return;

    pivotRef.current.rotation.set(
      pitchAngle.current,
      yawAngle.current,
      rollAngle.current
    );
    pivotRef.current.position.set(
      positionX,
      positionY.current,
      depthPosition.current
    );
    invalidate();
  }, [detailLift, invalidate, isDetailPose, positionX]);

  // Opening flips the cartridge face-up with a small natural roll. Closing
  // returns it to its resting pitch and roll.
  useEffect(() => {
    if (isOpen && !previousIsOpen.current) {
      openRollOffset.current =
        (Math.random() * 2 - 1) * OPEN_ROLL_JITTER_DEG * DEG;
    } else if (!isOpen) {
      openRollOffset.current = 0;
    }
    previousIsOpen.current = isOpen;

    pitchTarget.current = isOpen
      ? restingPitch + OPEN_PITCH_OFFSET
      : restingPitch;
    rollTarget.current = isOpen
      ? restingRoll + openRollOffset.current
      : restingRoll;
    depthTarget.current = isDetailPose ? detailLift : 0;

    if (reducedMotion && pivotRef.current) {
      pitchAngle.current = isIntro ? INTRO_END_PITCH : pitchTarget.current;
      yawAngle.current = restingYaw;
      rollAngle.current = rollTarget.current;
      depthPosition.current = isIntro ? INTRO_LIFT : depthTarget.current;
      pitchVelocity.current = 0;
      yawVelocity.current = 0;
      rollVelocity.current = 0;
      depthVelocity.current = 0;
      pivotRef.current.rotation.set(
        pitchAngle.current,
        yawAngle.current,
        rollAngle.current
      );
      pivotRef.current.position.z = depthPosition.current;
    }

    restedRef.current = false;
    invalidate();
  }, [
    detailLift,
    invalidate,
    isDetailPose,
    isOpen,
    restingPitch,
    restingRoll,
    restingYaw,
    reducedMotion,
    isIntro,
  ]);

  // Reflow every cartridge toward its new stack slot when one opens.
  useEffect(() => {
    positionYTarget.current = targetPositionY;

    if (reducedMotion && pivotRef.current) {
      positionY.current = targetPositionY;
      positionYVelocity.current = 0;
      pivotRef.current.position.y = targetPositionY;
    }

    restedRef.current = false;
    invalidate();
  }, [invalidate, reducedMotion, targetPositionY]);

  useFrame((state, delta) => {
    const pivot = pivotRef.current;
    if (!pivot || isFrozen || reducedMotion) return;

    if (!entranceComplete.current) {
      if (entranceStart.current === null) {
        entranceStart.current = state.clock.elapsedTime;
      }
      const elapsed =
        state.clock.elapsedTime -
        entranceStart.current -
        (entranceDelaySec ?? 0);
      const progress = THREE.MathUtils.clamp(
        elapsed / ENTRANCE_DURATION_SEC,
        0,
        1
      );
      // Smootherstep has zero velocity and acceleration at both ends, avoiding
      // the abrupt launch of an ease-out while still settling without a bounce.
      const eased =
        progress *
        progress *
        progress *
        (progress * (progress * 6 - 15) + 10);
      const remaining = 1 - eased;

      positionY.current =
        positionYTarget.current + ENTRANCE_OFFSET_Y * remaining;
      depthPosition.current = depthTarget.current + ENTRANCE_OFFSET_Z * remaining;
      pitchAngle.current = restingPitch + ENTRANCE_PITCH_OFFSET * remaining;
      pivot.position.y = positionY.current;
      pivot.position.z = depthPosition.current;
      pivot.rotation.x = pitchAngle.current;

      if (progress < 1) {
        invalidate();
        return;
      }

      // Snap to the exact resting pose so the spring below starts at rest.
      entranceComplete.current = true;
      positionY.current = positionYTarget.current;
      depthPosition.current = depthTarget.current;
      pitchAngle.current = restingPitch;
      pivot.position.y = positionY.current;
      pivot.position.z = depthPosition.current;
      pivot.rotation.x = pitchAngle.current;
      restedRef.current = true;
      return;
    }

    if (isIntro) {
      if (introStart.current === null) {
        introStart.current = state.clock.elapsedTime;
      }
      const elapsed = state.clock.elapsedTime - introStart.current;
      const progress = THREE.MathUtils.clamp(
        (elapsed - INTRO_DELAY_SEC) / INTRO_DURATION_SEC,
        0,
        1
      );
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      pivot.rotation.x = THREE.MathUtils.lerp(
        restingPitch,
        INTRO_END_PITCH,
        eased
      );
      pivot.rotation.y = restingYaw;
      pivot.rotation.z = restingRoll;
      pivot.position.z = THREE.MathUtils.lerp(0, INTRO_LIFT, eased);

      if (progress < 1) invalidate();
      return;
    }

    if (isRock) {
      const progress =
        0.5 -
        0.5 *
          Math.cos(
            (state.clock.elapsedTime / ROCK_PERIOD_SEC) * Math.PI * 2
          );
      pitchAngle.current = THREE.MathUtils.lerp(
        ROCK_PITCH_START,
        ROCK_PITCH_END,
        progress
      );
      yawAngle.current = THREE.MathUtils.lerp(
        ROCK_YAW_START,
        ROCK_YAW_END,
        progress
      );
      pivot.rotation.x = pitchAngle.current;
      pivot.rotation.y = yawAngle.current;
      pivot.rotation.z = restingRoll;
      pivot.position.z = DETAIL_LIFT;
      invalidate();
      return;
    }

    if (isStatic) {
      const flipping = staticFlipDirection.current !== 0;
      const animating =
        flipping || hoverMotion.current || !restedRef.current;
      if (!animating) return;

      const timeStep = Math.min(delta, 1 / 30);

      if (flipping) {
        staticFlipProgress.current +=
          staticFlipDirection.current * (timeStep / STATIC_FLIP_DURATION);
        staticFlipProgress.current = THREE.MathUtils.clamp(
          staticFlipProgress.current,
          0,
          1
        );

        if (
          staticFlipDirection.current === 1 &&
          staticFlipProgress.current >= 1
        ) {
          staticFlipDirection.current = 0;
        } else if (
          staticFlipDirection.current === -1 &&
          staticFlipProgress.current <= 0
        ) {
          staticFlipDirection.current = 0;
          staticFlipProgress.current = 0;
        }
      }

      const eased =
        0.5 - 0.5 * Math.cos(staticFlipProgress.current * Math.PI);
      yawAngle.current = restingYaw + eased * Math.PI * 2;
      yawVelocity.current = 0;

      const stiffness = hoverMotion.current
        ? STATIC_RETURN_STIFFNESS
        : 90;
      const damping = hoverMotion.current ? STATIC_RETURN_DAMPING : 14;
      const rollDisplacement = rollAngle.current - rollTarget.current;
      const pitchDisplacement = pitchAngle.current - pitchTarget.current;
      const depthDisplacement = depthPosition.current - depthTarget.current;

      rollVelocity.current +=
        (-stiffness * rollDisplacement - damping * rollVelocity.current) *
        timeStep;
      rollAngle.current += rollVelocity.current * timeStep;
      pitchVelocity.current +=
        (-stiffness * pitchDisplacement - damping * pitchVelocity.current) *
        timeStep;
      pitchAngle.current += pitchVelocity.current * timeStep;
      depthVelocity.current +=
        (-stiffness * depthDisplacement - damping * depthVelocity.current) *
        timeStep;
      depthPosition.current += depthVelocity.current * timeStep;

      pivot.rotation.x = pitchAngle.current;
      pivot.rotation.y = yawAngle.current;
      pivot.rotation.z = rollAngle.current;
      pivot.position.z = depthPosition.current;

      const settled =
        !flipping &&
        isSpringSettled(rollDisplacement, rollVelocity.current) &&
        isSpringSettled(pitchDisplacement, pitchVelocity.current) &&
        isSpringSettled(depthDisplacement, depthVelocity.current);

      if (settled && !restedRef.current) {
        rollAngle.current = rollTarget.current;
        pitchAngle.current = pitchTarget.current;
        depthPosition.current = depthTarget.current;
        pivot.rotation.z = rollAngle.current;
        pivot.rotation.x = pitchAngle.current;
        pivot.position.z = depthPosition.current;
        hoverMotion.current = false;
        restedRef.current = true;
      } else if (!settled || flipping) {
        restedRef.current = false;
      }

      invalidate();
      return;
    }

    if (restedRef.current && !hoverMotion.current) return;

    const timeStep = Math.min(delta, 1 / 30);
    const stiffness = hoverMotion.current ? 160 : 360;
    const damping = hoverMotion.current ? 18 : 28;
    const yawDisplacement = yawAngle.current - yawTarget.current;
    const rollDisplacement = rollAngle.current - rollTarget.current;
    const pitchDisplacement = pitchAngle.current - pitchTarget.current;
    const depthDisplacement = depthPosition.current - depthTarget.current;
    const positionYDisplacement =
      positionY.current - positionYTarget.current;

    yawVelocity.current +=
      (-stiffness * yawDisplacement - damping * yawVelocity.current) *
      timeStep;
    yawAngle.current += yawVelocity.current * timeStep;
    rollVelocity.current +=
      (-stiffness * rollDisplacement - damping * rollVelocity.current) *
      timeStep;
    rollAngle.current += rollVelocity.current * timeStep;
    pitchVelocity.current +=
      (-stiffness * pitchDisplacement - damping * pitchVelocity.current) *
      timeStep;
    pitchAngle.current += pitchVelocity.current * timeStep;
    depthVelocity.current +=
      (-stiffness * depthDisplacement - damping * depthVelocity.current) *
      timeStep;
    depthPosition.current += depthVelocity.current * timeStep;
    positionYVelocity.current +=
      (-stiffness * positionYDisplacement -
        damping * positionYVelocity.current) *
      timeStep;
    positionY.current += positionYVelocity.current * timeStep;

    pivot.rotation.y = yawAngle.current;
    pivot.rotation.z = rollAngle.current;
    pivot.rotation.x = pitchAngle.current;
    pivot.position.z = depthPosition.current;
    pivot.position.y = positionY.current;

    const settled =
      isSpringSettled(yawDisplacement, yawVelocity.current) &&
      isSpringSettled(rollDisplacement, rollVelocity.current) &&
      isSpringSettled(pitchDisplacement, pitchVelocity.current) &&
      isSpringSettled(depthDisplacement, depthVelocity.current) &&
      isSpringSettled(positionYDisplacement, positionYVelocity.current);

    if (settled) {
      if (!restedRef.current) {
        yawAngle.current = yawTarget.current;
        rollAngle.current = rollTarget.current;
        pitchAngle.current = pitchTarget.current;
        depthPosition.current = depthTarget.current;
        positionY.current = positionYTarget.current;
        pivot.rotation.y = yawAngle.current;
        pivot.rotation.z = rollAngle.current;
        pivot.rotation.x = pitchAngle.current;
        pivot.position.z = depthPosition.current;
        pivot.position.y = positionY.current;
        hoverMotion.current = false;
        restedRef.current = true;
        invalidate();
      }
    } else {
      restedRef.current = false;
      invalidate();
    }
  });

  const settledTransform: CartridgeSettledTransform = {
    y: targetPositionY,
    z: settledDepth,
    rotationX: restingPitch,
  };

  return { pivotRef, entranceComplete, settledTransform };
}

function isSpringSettled(displacement: number, velocity: number) {
  return Math.abs(displacement) < 1e-5 && Math.abs(velocity) < 1e-4;
}
