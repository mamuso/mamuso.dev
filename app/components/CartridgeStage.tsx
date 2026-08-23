"use client";

import { useEffect, useState } from "react";
import CartridgeViewer, {
  CAMERA_PRESET_LARGE,
  CAMERA_PRESET_SMALL,
} from "./CartridgeViewer";

// Camera framing is fixed per preset (computed from a fixed reference aspect
// ratio, not the live canvas size) — tighter on large screens, roomier on
// small ones, but never recalculated as the window resizes within a
// breakpoint. Only crossing the 720px breakpoint swaps the preset (matches
// CartridgeViewer's min-[720px]:h-[760px] and CAMERA_PRESET_LARGE's aspect).
export default function CartridgeStage() {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 720px)");
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Remount on breakpoint change so the camera rig re-applies the new preset.
  return (
    <CartridgeViewer
      key={isLarge ? "lg" : "sm"}
      cameraPreset={isLarge ? CAMERA_PRESET_LARGE : CAMERA_PRESET_SMALL}
    />
  );
}
