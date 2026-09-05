"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/** Small, interruptible handling offsets, independent of the main stack springs.
 * The hitbox stays on the parent so the response cannot chase its own pointer. */
export default function CartridgePresentation({
  children, pivot, hovered, pointerPosition, stickerBusy, isOpen, caption, captionOffset,
}: {
  children: ReactNode;
  pivot: RefObject<THREE.Group | null>;
  hovered: RefObject<boolean>;
  pointerPosition: RefObject<{ x: number; y: number }>;
  stickerBusy: RefObject<boolean>;
  isOpen: boolean;
  caption?: { company: string; period?: string };
  captionOffset: number;
}) {
  const handling = useRef<THREE.Group>(null);
  const captionAnchor = useRef<THREE.Group>(null);
  const captionElement = useRef<HTMLDivElement>(null);
  const canHover = useRef(false);
  const reduceMotion = useRef(false);
  const inverse = useRef(new THREE.Quaternion());
  const lift = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      canHover.current = fine.matches;
      reduceMotion.current = reduced.matches;
      invalidate();
    };
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    const object = handling.current;
    if (!object || !pivot.current) return;
    const active = canHover.current && hovered.current && !reduceMotion.current && !stickerBusy.current;
    // Wait until the open face is readable before responding to examination.
    const available = THREE.MathUtils.smoothstep(1 - Math.abs(pivot.current.rotation.x) / 1.4, 0.85, 1);
    const targetX = active ? (isOpen ? -pointerPosition.current.y * 0.022 * available : -0.028) : 0;
    const targetY = active && isOpen ? pointerPosition.current.x * 0.032 * available : 0;
    const targetLift = active && !isOpen ? 0.0015 : 0;
    const response = reduceMotion.current ? 1 : 1 - Math.exp(-12 * Math.min(delta, 0.05));
    object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, targetX, response);
    object.rotation.y = THREE.MathUtils.lerp(object.rotation.y, targetY, response);
    lift.current = THREE.MathUtils.lerp(lift.current, targetLift, response);
    const unsettled = Math.abs(object.rotation.x - targetX) + Math.abs(object.rotation.y - targetY) + Math.abs(lift.current - targetLift) > 0.00001;
    if (!unsettled) {
      object.rotation.x = targetX;
      object.rotation.y = targetY;
      lift.current = targetLift;
    }
    inverse.current.copy(pivot.current.quaternion).invert();
    object.position.set(0, 0, lift.current).applyQuaternion(inverse.current);
    if (captionAnchor.current && captionElement.current) {
      // Cancel the cartridge rotation for the offset: text stays below it in
      // screen space while tracking its actual, animated position.
      captionAnchor.current.position.set(0, captionOffset, 0).applyQuaternion(inverse.current);
      const opacity = reduceMotion.current ? 1 : THREE.MathUtils.smoothstep(available, 0.05, 0.95);
      captionElement.current.style.opacity = String(opacity);
      captionElement.current.style.transform = `translateY(${(1 - opacity) * 4}px)`;
    }
    if (unsettled) invalidate();
  }, -1);

  return <>
    <group ref={handling}>{children}</group>
    {caption && <group ref={captionAnchor}>
      <Html center style={{ pointerEvents: "none" }}>
        <div ref={captionElement} style={{ opacity: 0, textAlign: "center", whiteSpace: "nowrap", fontSize: 14, fontWeight: 500, lineHeight: 1.25 }}>
          {caption.company}
          <span style={{ display: "block", opacity: 0.65, fontVariantNumeric: "tabular-nums" }}>{caption.period}</span>
        </div>
      </Html>
    </group>}
  </>;
}
