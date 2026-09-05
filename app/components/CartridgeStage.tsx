"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CartridgeViewer, {
  CAMERA_PRESET_LARGE,
  CAMERA_PRESET_SMALL,
} from "./CartridgeViewer";
import { stageBlend } from "./cartridgeStagePolicy";

export default function CartridgeStage({
  onOpenChange,
}: {
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const stickerApplied = useRef(false);
  // This component is client-only; use the correct composition on first paint.
  const [blend, setBlend] = useState(() => stageBlend(window.innerWidth));
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setBlend(stageBlend(window.innerWidth)));
    };
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  const cameraPreset = useMemo(() => {
    const small = CAMERA_PRESET_SMALL;
    const large = CAMERA_PRESET_LARGE;
    const mix = (a: number, b: number) => a + (b - a) * blend;
    return {
      ...small,
      margin: mix(small.margin, large.margin),
      aspect: mix(small.aspect, large.aspect),
      panFraction: mix(small.panFraction!, large.panFraction!),
      verticalPanFraction: mix(small.verticalPanFraction!, large.verticalPanFraction!),
      verticalPanPx: mix(small.verticalPanPx!, large.verticalPanPx!),
      openTopOffsetPx: large.openTopOffsetPx,
      openLabelInsetFraction: mix(small.openLabelInsetFraction!, large.openLabelInsetFraction!),
      desktopBlend: blend,
    };
  }, [blend]);

  return (
    <CartridgeViewer
      cameraPreset={cameraPreset}
      onOpenChange={onOpenChange}
      stickerApplied={stickerApplied}
    />
  );
}
