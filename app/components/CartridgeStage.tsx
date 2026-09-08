"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CartridgeViewer from "./CartridgeViewer";
import { CAMERA_PRESET_LARGE, CAMERA_PRESET_SMALL } from "./cartridgeConfig";
import { stageBlend } from "./cartridgeStagePolicy";

export default function CartridgeStage({
  onOpenChange,
}: {
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const stickerApplied = useRef(false);
  // This component is client-only; use the correct composition on first paint.
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  const cameraPreset = useMemo(() => {
    const blend = stageBlend(width);
    const small = CAMERA_PRESET_SMALL;
    const large = CAMERA_PRESET_LARGE;
    // Pull the compact desktop stack toward its copy, easing back to the
    // original horizontal framing as the full desktop layout has room.
    const compactInset = 0.3 * Math.max(0, Math.min(1, (1024 - width) / 144));
    const mix = (a: number, b: number) => a + (b - a) * blend;
    return {
      ...small,
      margin: mix(small.margin, large.margin),
      aspect: mix(small.aspect, large.aspect),
      panFraction: mix(small.panFraction!, large.panFraction! - compactInset),
      verticalPanFraction: mix(small.verticalPanFraction!, large.verticalPanFraction!),
      verticalPanPx: mix(small.verticalPanPx!, large.verticalPanPx!),
      openTopOffsetPx: large.openTopOffsetPx,
      openLabelInsetFraction: mix(small.openLabelInsetFraction!, large.openLabelInsetFraction!),
      desktopBlend: blend,
    };
  }, [width]);

  return (
    <CartridgeViewer
      cameraPreset={cameraPreset}
      onOpenChange={onOpenChange}
      stickerApplied={stickerApplied}
    />
  );
}
