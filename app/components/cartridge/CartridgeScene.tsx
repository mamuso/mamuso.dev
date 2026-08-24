"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Html,
  useCursor,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { Cartridge } from "./Cartridge";
import { GrainEffect } from "./GrainEffect";
import {
  CARTRIDGE_WIDTH,
  DETAIL_LIFT,
  ENTRANCE_STAGGER_SEC,
  HOVER_LABEL_GAP,
  HOVER_LIFT,
} from "./constants";
import { configureLabelTexture } from "./materials";
import { useCartridgeStackLayout } from "./useCartridgeStackLayout";
import type { CartridgeSceneProps } from "./types";

export function CartridgeScene({
  cameraPreset,
  layout,
  shadowOpacity = 0.14,
  shadowPlanePosition = [0, 0, -0.027],
  lightPosition = [1, 1, 5],
  motion = "still",
  hoverLift = HOVER_LIFT,
  detailLift = DETAIL_LIFT,
  openIndex,
  onOpenIndexChange,
  reducedMotion = false,
}: CartridgeSceneProps) {
  const labelUrls = useMemo(
    () => [...new Set(layout.map((cartridge) => cartridge.label))],
    [layout]
  );

  return (
    <CartridgeSceneAssets
      cameraPreset={cameraPreset}
      layout={layout}
      labelUrls={labelUrls}
      shadowOpacity={shadowOpacity}
      shadowPlanePosition={shadowPlanePosition}
      lightPosition={lightPosition}
      motion={motion}
      hoverLift={hoverLift}
      detailLift={detailLift}
      openIndex={openIndex}
      onOpenIndexChange={onOpenIndexChange}
      reducedMotion={reducedMotion}
    />
  );
}

function CartridgeSceneAssets({
  cameraPreset,
  layout,
  labelUrls,
  shadowOpacity,
  shadowPlanePosition,
  lightPosition,
  motion,
  hoverLift,
  detailLift,
  openIndex,
  onOpenIndexChange,
  reducedMotion,
}: Required<CartridgeSceneProps> & { labelUrls: string[] }) {
  const { scene } = useGLTF("/models/famicom_cartridge.glb");
  const textures = useTexture(labelUrls);
  const { gl, invalidate, camera, size } = useThree();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const shadowMaterialRef = useRef<THREE.ShadowMaterial>(null);
  const entranceProgressRef = useRef(reducedMotion ? 1 : 0);
  const stageEntranceShadow =
    cameraPreset.compactLabels === true && !reducedMotion;
  useCursor(hoveredIndex !== null);

  useFrame(() => {
    if (!stageEntranceShadow || !shadowMaterialRef.current) return;

    // The bottom cartridge lands first. Keep its shadow out of view while it
    // is high above the stack, then ease the shadow in as it reaches the
    // surface so compact layouts do not show a disconnected shadow.
    const fade = THREE.MathUtils.smootherstep(
      entranceProgressRef.current,
      0.7,
      1
    );
    shadowMaterialRef.current.visible = fade > 0;
    shadowMaterialRef.current.opacity = shadowOpacity * fade;
  });

  const { yPositions, openLabelY } = useCartridgeStackLayout({
    camera,
    cameraPreset,
    canvasHeight: size.height,
    layout,
    openIndex,
  });
  const sideLabelIndex = hoveredIndex ?? openIndex;
  const modelCenter = useMemo(
    () => new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3()),
    [scene]
  );
  const textureByLabel = useMemo(() => {
    const textureList = Array.isArray(textures) ? textures : [textures];
    return new Map(
      labelUrls.map((labelUrl, index) => [labelUrl, textureList[index]])
    );
  }, [labelUrls, textures]);

  useLayoutEffect(() => {
    for (const texture of textureByLabel.values()) {
      configureLabelTexture(texture, gl);
    }
    invalidate();
  }, [gl, invalidate, textureByLabel]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={lightPosition}
        intensity={0.8}
        shadow-bias={-0.0001}
        shadow-normalBias={0.002}
        shadow-mapSize={[1024, 1024]}
        shadow-radius={16}
        shadow-camera-left={-0.35}
        shadow-camera-right={0.35}
        shadow-camera-top={0.4}
        shadow-camera-bottom={-0.4}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
      <mesh position={shadowPlanePosition} receiveShadow>
        <planeGeometry args={[0.8, 0.8]} />
        <shadowMaterial
          ref={shadowMaterialRef}
          transparent
          visible={!stageEntranceShadow}
          opacity={stageEntranceShadow ? 0 : shadowOpacity}
          depthWrite={false}
        />
      </mesh>
      <CameraRig preset={cameraPreset}>
        <group>
          {layout.map((cartridge, index) => (
            <Cartridge
              key={cartridge.label}
              scene={scene}
              modelCenter={modelCenter}
              position={[cartridge.position[0], yPositions[index]]}
              color={cartridge.color}
              labelTexture={textureByLabel.get(cartridge.label)!}
              restingYaw={cartridge.restingYaw}
              restingRoll={cartridge.restingRoll}
              restingPitch={cartridge.restingPitch}
              motion={motion}
              hoverLift={hoverLift}
              detailLift={detailLift}
              reducedMotion={reducedMotion}
              shellOpacity={cartridge.shellOpacity}
              renderOrderBase={index * 10}
              onHoverChange={(hovered) =>
                setHoveredIndex(hovered ? index : null)
              }
              isOpen={index === openIndex}
              onToggleOpen={() =>
                onOpenIndexChange(openIndex === index ? null : index)
              }
              entranceDelaySec={
                reducedMotion
                  ? undefined
                  : (layout.length - 1 - index) * ENTRANCE_STAGGER_SEC
              }
              entranceProgressRef={
                stageEntranceShadow && index === layout.length - 1
                  ? entranceProgressRef
                  : undefined
              }
            />
          ))}
          {!cameraPreset.compactLabels && sideLabelIndex !== null && (
            <Html
              position={[
                layout[sideLabelIndex].position[0] -
                  CARTRIDGE_WIDTH / 2 -
                  HOVER_LABEL_GAP,
                yPositions[sideLabelIndex],
                0,
              ]}
              style={{ pointerEvents: "none" }}
            >
              <div className="-translate-x-full -translate-y-1/2 whitespace-nowrap text-right text-sm font-medium leading-tight">
                {layout[sideLabelIndex].company}
                <span className="block font-mono">
                  {layout[sideLabelIndex].period ?? "0000 - 0000"}
                </span>
              </div>
            </Html>
          )}
          {cameraPreset.compactLabels && openIndex !== null && (
            <Html
              position={[layout[openIndex].position[0], openLabelY, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-sm font-medium leading-tight">
                {layout[openIndex].company}
                <span className="block font-mono">
                  {layout[openIndex].period ?? "0000 - 0000"}
                </span>
              </div>
            </Html>
          )}
        </group>
      </CameraRig>
      <Environment
        files="/environments/studio_small_03_1k.hdr"
        environmentIntensity={0.6}
        resolution={128}
      />
      <GrainEffect />
    </>
  );
}
