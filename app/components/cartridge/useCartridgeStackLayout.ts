"use client";

import { useMemo } from "react";
import type { Camera } from "three";
import { OPEN_HEIGHT, OPEN_TOP_OFFSET_PX, ROW_PITCH } from "./constants";
import { pixelYToWorldY } from "./cameraMath";
import type { CameraPreset, CartridgeLayoutEntry } from "./types";

export function useCartridgeStackLayout({
  camera,
  cameraPreset,
  canvasHeight,
  layout,
  openIndex,
}: {
  camera: Camera;
  cameraPreset: CameraPreset;
  canvasHeight: number;
  layout: CartridgeLayoutEntry[];
  openIndex: number | null;
}) {
  return useMemo(() => {
    const openTopOffset =
      cameraPreset.openTopOffsetPx ?? OPEN_TOP_OFFSET_PX;
    const openBottomGap = cameraPreset.openBottomGapPx ?? 0;
    const extraBottomGap =
      openIndex !== null && openBottomGap > 0
        ? pixelYToWorldY(camera, openTopOffset, canvasHeight, 0) -
          pixelYToWorldY(
            camera,
            openTopOffset + openBottomGap,
            canvasHeight,
            0
          )
        : 0;
    const heights = layout.map((_, index) =>
      index === openIndex ? OPEN_HEIGHT : ROW_PITCH
    );
    const totalHeight =
      heights.reduce((sum, height) => sum + height, 0) + extraBottomGap;
    let cursor = totalHeight / 2;
    const centeredPositions = heights.map((height, index) => {
      const center = cursor - height / 2;
      cursor -= height;
      if (index === openIndex) cursor -= extraBottomGap;
      return center;
    });

    if (openIndex === null) {
      return { yPositions: centeredPositions, openLabelY: 0 };
    }

    const openWorldY = pixelYToWorldY(
      camera,
      openTopOffset,
      canvasHeight,
      0
    );
    const shift = openWorldY - centeredPositions[openIndex];
    const openLabelY =
      centeredPositions[openIndex] -
      OPEN_HEIGHT / 2 -
      extraBottomGap * 0.3 +
      shift;

    return {
      yPositions: centeredPositions.map((position) => position + shift),
      openLabelY,
    };
  }, [
    camera,
    cameraPreset.openBottomGapPx,
    cameraPreset.openTopOffsetPx,
    canvasHeight,
    layout,
    openIndex,
  ]);
}
