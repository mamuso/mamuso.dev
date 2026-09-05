"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export const CAPTION_FONT_SIZE = 14;
export const CAPTION_LINE_HEIGHT = 1.25;
export const CAPTION_HEIGHT = CAPTION_FONT_SIZE * CAPTION_LINE_HEIGHT * 2;

/** Small, interruptible handling offsets, independent of the main stack springs.
 * The hitbox stays on the parent so the response cannot chase its own pointer. */
export default function CartridgePresentation({
  children, pivot, hovered, pointerPosition, stickerBusy, isOpen, caption, captionOffset, openYaw = 0, desktopBlend = 1,
}: {
  children: ReactNode;
  pivot: RefObject<THREE.Group | null>;
  hovered: RefObject<boolean>;
  pointerPosition: RefObject<{ x: number; y: number }>;
  stickerBusy: RefObject<boolean>;
  isOpen: boolean;
  caption?: { company: string; period?: string };
  captionOffset: number;
  openYaw?: number;
  desktopBlend?: number;
}) {
  const handling = useRef<THREE.Group>(null);
  const captionAnchor = useRef<THREE.Group>(null);
  const captionElement = useRef<HTMLDivElement>(null);
  const canHover = useRef(false);
  const reduceMotion = useRef(false);
  const inverse = useRef(new THREE.Quaternion());
  const lift = useRef(0);
  const captionOpacity = useRef(0);
  const lastCaptionOffset = useRef(captionOffset);
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
    const turnRemaining = Math.max(Math.abs(pivot.current.rotation.x), Math.abs(pivot.current.rotation.y - openYaw));
    const available = THREE.MathUtils.smoothstep(1 - turnRemaining / 1.4, 0.85, 1);
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
      if (isOpen || desktopBlend === 1) lastCaptionOffset.current = captionOffset;
      captionAnchor.current.position.set(0, lastCaptionOffset.current, 0).applyQuaternion(inverse.current);
      const readable = THREE.MathUtils.smoothstep(available, 0.05, 0.95);
      const targetOpacity = isOpen ? readable : 0;
      captionOpacity.current = reduceMotion.current ? targetOpacity : THREE.MathUtils.lerp(
        captionOpacity.current, targetOpacity, 1 - Math.exp(-22 * Math.min(delta, 0.05)),
      );
      if (Math.abs(captionOpacity.current - targetOpacity) < 0.001) captionOpacity.current = targetOpacity;
      else if (desktopBlend < 1) invalidate();
      const opacity = desktopBlend === 1 ? (reduceMotion.current ? 1 : readable) : captionOpacity.current;
      captionElement.current.setAttribute('aria-hidden', opacity < 0.01 ? 'true' : 'false');
      captionElement.current.style.opacity = String(opacity);
      captionElement.current.style.transform = `translateY(${(1 - opacity) * 4}px)`;
    }
    if (unsettled) invalidate();
  }, -1);

  return <>
    <group ref={handling}>{children}</group>
    {caption && <group ref={captionAnchor}>
      <Html center style={{ pointerEvents: "none" }}>
        <div ref={captionElement} style={{ opacity: 0, textAlign: "center", whiteSpace: "nowrap", fontSize: CAPTION_FONT_SIZE, fontWeight: 500, lineHeight: CAPTION_LINE_HEIGHT }}>
          {caption.company}
          <span style={{ display: "block", opacity: 0.65, fontVariantNumeric: "tabular-nums" }}>{caption.period}</span>
        </div>
      </Html>
    </group>}
  </>;
}
