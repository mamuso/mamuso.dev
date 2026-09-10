"use client";
import { Suspense, useLayoutEffect, useMemo, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import * as stylex from "@stylexjs/stylex";
import CartridgeBackdrop from "./CartridgeBackdrop";
import CartridgeQuality from "./CartridgeQuality";
import CartridgeScene from "./CartridgeScene";
import { CAMERA_PRESET_LARGE, CAMERA_FOV_DEGREES, type CameraPreset } from "./cartridgeConfig";
import { INITIAL_CARTRIDGE_RESTING_POSES, randomCartridgeRestingPoses, buildCartridgeLayout, type CartridgeRestingPose } from "./cartridgeLayout";
import { CARTRIDGES } from "@/data/cartridges";

export default function CartridgeViewer({
  cameraPreset = CAMERA_PRESET_LARGE,
  onOpenChange,
  stickerApplied,
}: {
  cameraPreset?: CameraPreset;
  onOpenChange?: (isOpen: boolean) => void;
  stickerApplied?: RefObject<boolean>;
}) {
  // Start sharp; CartridgeQuality adapts moving frames and restores 2x at rest.
  const dpr = 2;
  const [restingPoses, setRestingPoses] = useState<
    readonly CartridgeRestingPose[]
  >(INITIAL_CARTRIDGE_RESTING_POSES);

  useLayoutEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setRestingPoses(randomCartridgeRestingPoses(CARTRIDGES.length));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const layout = useMemo(() => buildCartridgeLayout(CARTRIDGES, restingPoses), [restingPoses]);

  return (
    <div data-cartridge-viewer {...stylex.props(styles.viewer)}>
      <CartridgeBackdrop />
      <Canvas
        camera={{ fov: CAMERA_FOV_DEGREES }}
        style={{ position: "relative", touchAction: "pan-y" }}
        dpr={dpr}
        frameloop="demand"
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <CartridgeQuality />
          <CartridgeScene
            cameraPreset={cameraPreset}
            layout={layout}
            onOpenChange={onOpenChange}
            stickerApplied={stickerApplied}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

const styles = stylex.create({
  viewer: {
    boxSizing: 'border-box',
    height: { default: 360, '@media (min-width: 880px)': 640 },
    insetInlineStart: '50%',
    marginInline: '-50vw',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    width: '100vw',
    zIndex: 1,
  },
});
