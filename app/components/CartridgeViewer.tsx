"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { CARTRIDGES } from "@/data/cartridges";
import { CartridgeControls } from "./cartridge/CartridgeControls";
import { CartridgeFallback } from "./cartridge/CartridgeFallback";
import { CartridgeScene } from "./cartridge/CartridgeScene";
import {
  CAMERA_PRESET_LARGE,
  LABEL_URLS,
  ROW_PITCH,
} from "./cartridge/constants";
import type { CameraPreset, CartridgeLayoutEntry } from "./cartridge/types";
import { usePrefersReducedMotion } from "./cartridge/usePrefersReducedMotion";

export {
  CAMERA_PRESET_LARGE,
  CAMERA_PRESET_SMALL,
  DEFAULT_CARTRIDGE_TILT,
  randomCartridgeTilt,
} from "./cartridge/constants";
export { CartridgeScene } from "./cartridge/CartridgeScene";
export type {
  CameraPreset,
  CartridgeLayoutEntry,
  CartridgeMotion,
  CartridgeTiltAndShift,
} from "./cartridge/types";

useGLTF.preload("/models/famicom_cartridge.glb");
useTexture.preload(LABEL_URLS);

export default function CartridgeViewer({
  cameraPreset = CAMERA_PRESET_LARGE,
}: {
  cameraPreset?: CameraPreset;
}) {
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const updateDevicePixelRatio = () =>
      setDevicePixelRatio(Math.min(window.devicePixelRatio, 2));

    updateDevicePixelRatio();
    window.addEventListener("resize", updateDevicePixelRatio);
    return () => window.removeEventListener("resize", updateDevicePixelRatio);
  }, []);

  const layout = useMemo<CartridgeLayoutEntry[]>(
    () =>
      CARTRIDGES.map((cartridge, index) => ({
        ...cartridge,
        position: [
          0,
          ((CARTRIDGES.length - 1) / 2 - index) * ROW_PITCH,
        ],
        restingYaw: 0,
        restingRoll: 0,
        restingPitch: Math.PI / 2,
      })),
    []
  );

  return (
    <section
      className="relative left-1/2 right-1/2 -mx-[50vw] h-[580px] w-screen overflow-hidden min-[720px]:h-[760px]"
      aria-label="Interactive career cartridges"
      data-reduced-motion={prefersReducedMotion}
    >
      <Canvas
        role="img"
        aria-label="A 3D stack of career cartridges. Use the company controls to open each cartridge."
        camera={{ fov: 20 }}
        dpr={devicePixelRatio}
        frameloop="demand"
        fallback={<CartridgeFallback />}
        performance={{ min: 0.75, max: 1, debounce: 200 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          // GrainEffect already renders the scene into an up-to-4x multisampled
          // target. Multisampling the final full-screen pass again wastes
          // GPU memory without improving edge quality.
          antialias: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <CartridgeScene
            cameraPreset={cameraPreset}
            layout={layout}
            openIndex={openIndex}
            onOpenIndexChange={setOpenIndex}
            reducedMotion={prefersReducedMotion}
          />
        </Suspense>
      </Canvas>
      <CartridgeControls
        cartridges={CARTRIDGES}
        openIndex={openIndex}
        onOpenIndexChange={setOpenIndex}
      />
    </section>
  );
}
