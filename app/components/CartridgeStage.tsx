"use client";

import { useEffect, useRef, useState } from "react";
import CartridgeViewer, {
  CAMERA_PRESET_LARGE,
  CAMERA_PRESET_SMALL,
} from "./CartridgeViewer";

const LARGE_STAGE_QUERY = "(min-width: 720px)";

// Camera framing is fixed per preset (computed from a fixed reference aspect
// ratio, not the live canvas size) — tighter on large screens, roomier on
// small ones, but never recalculated as the window resizes within a
// breakpoint. Only crossing the 720px breakpoint swaps the preset (matches
// CartridgeViewer's 720px StyleX media query and CAMERA_PRESET_LARGE's aspect).
export default function CartridgeStage({
  onOpenChange,
}: {
  onOpenChange?: (isOpen: boolean) => void;
}) {
  // Keep the applied sticker when the responsive camera remounts its canvas.
  const stickerApplied = useRef(false);
  // This stage is loaded with `ssr: false`, so the real viewport is available
  // on the first render. Starting with the correct preset avoids mounting the
  // small canvas and immediately replacing it with a fresh large canvas.
  const [isLarge, setIsLarge] = useState(() =>
    window.matchMedia(LARGE_STAGE_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(LARGE_STAGE_QUERY);
    const update = (event: MediaQueryListEvent) => setIsLarge(event.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Remount on breakpoint change so the camera rig re-applies the new preset.
  return (
    <CartridgeViewer
      key={isLarge ? "lg" : "sm"}
      cameraPreset={isLarge ? CAMERA_PRESET_LARGE : CAMERA_PRESET_SMALL}
      onOpenChange={onOpenChange}
      stickerApplied={stickerApplied}
    />
  );
}
