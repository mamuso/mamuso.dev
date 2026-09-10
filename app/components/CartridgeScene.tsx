"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import CartridgeItem from "./CartridgeItem";
import ResponsiveCameraRig from "./ResponsiveCameraRig";
import { resolveCartridgePoses } from "./cartridgeLayout";
import { configureLabelTexture, uploadSceneTextures } from "./cartridgeMaterials";
import { TAP_MAX_MOVEMENT_PX, ENTRANCE_STAGGER_SEC, type CameraPreset, type CartridgeLayoutEntry } from "./cartridgeConfig";
import { swipeCartridgeIndex } from "./cartridgeSwipe";
import { CARTRIDGES } from "@/data/cartridges";

useGLTF.preload("/models/famicom_cartridge.glb");
useTexture.preload(CARTRIDGES.flatMap(c => c.applicationLabel ? [c.label, c.applicationLabel] : [c.label]));

function CartridgeSceneTextures({
  cameraPreset,
  layout,
  labelUrls,
  onOpenChange,
  stickerApplied,
  shadowOpacity = 0.17,
  shadowPlanePosition = [0, 0, -0.027] as [number, number, number],
  lightPosition = [-0.65, 1, 5] as [number, number, number],
}: {
  cameraPreset: CameraPreset;
  layout: CartridgeLayoutEntry[];
  labelUrls: string[];
  onOpenChange?: (isOpen: boolean) => void;
  stickerApplied?: RefObject<boolean>;
  shadowOpacity?: number;
  shadowPlanePosition?: [number, number, number];
  lightPosition?: [number, number, number];
}) {
  const { scene } = useGLTF("/models/famicom_cartridge.glb");
  const textures = useTexture(labelUrls);
  const {
    gl,
    invalidate,
    camera,
    size,
    scene: renderScene,
  } = useThree();
  const [compositionCamera, setCompositionCamera] = useState(() => camera.clone());
  const [cameraReady, setCameraReady] = useState(false);
  const handleCameraFrame = useCallback((framedCamera: THREE.PerspectiveCamera) => {
    setCompositionCamera(framedCamera);
    setCameraReady(true);
  }, []);
  const localStickerApplied = useRef(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [lastOpenIndex, setLastOpenIndex] = useState<number | null>(null);
  const desktopBlend = cameraPreset.desktopBlend ?? (cameraPreset.openInPlace ? 0 : 1);
  const [entranceReady, setEntranceReady] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    onOpenChange?.(openIndex !== null);
  }, [openIndex, onOpenChange]);

  const modelHalfSize = useMemo(
    () => new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()).multiplyScalar(0.5),
    [scene],
  );

  const { poses, openLabelY, mobileEntranceY } = useMemo(
    () => resolveCartridgePoses(layout, openIndex, compositionCamera, size, cameraPreset, modelHalfSize),
    [layout, openIndex, compositionCamera, size, cameraPreset, modelHalfSize],
  );
  const selectCartridge = (index: number) => {
    setLastOpenIndex(index);
    setOpenIndex((current) => current === index ? null : index);
  };
  const navigateCartridge = useCallback((direction: -1 | 1) => {
    if (openIndex === null) return;
    const next = swipeCartridgeIndex(openIndex, direction, layout.length);
    if (next === openIndex) return;
    setLastOpenIndex(next);
    setOpenIndex(next);
  }, [openIndex, layout.length]);
  const textureByLabel = useMemo(() => {
    const list = Array.isArray(textures) ? textures : [textures];
    const map = new Map<string, THREE.Texture>();
    labelUrls.forEach((url, i) => map.set(url, list[i]));
    return map;
  }, [textures, labelUrls]);

  useLayoutEffect(() => {
    let active = true;

    for (const texture of textureByLabel.values()) {
      configureLabelTexture(texture, gl);
    }
    uploadSceneTextures(renderScene, gl);
    invalidate();

    const warmScene = async () => {
      try {
        await gl.compileAsync(renderScene, camera);
      } catch {
        // Compilation is an optimization rather than a correctness
        // requirement. If a driver rejects the warm-up, continue through
        // Three.js's normal lazy path.
      }
      if (!active) return;
      setEntranceReady(true);
      invalidate();
    };

    void warmScene();
    return () => {
      active = false;
    };
  }, [textureByLabel, gl, invalidate, renderScene, camera]);

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight
        castShadow
        position={[
          THREE.MathUtils.lerp(-0.25, lightPosition[0], desktopBlend),
          THREE.MathUtils.lerp(0.3, lightPosition[1], desktopBlend),
          lightPosition[2],
        ]}
        intensity={0.8}
        shadow-bias={-0.0001}
        shadow-normalBias={0.00018}
        shadow-mapSize={[1024, 1024]}
        shadow-radius={THREE.MathUtils.lerp(15, 7, desktopBlend)}
        shadow-camera-left={-0.26}
        shadow-camera-right={0.26}
        shadow-camera-top={0.55}
        shadow-camera-bottom={-0.55}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
      />
      <mesh position={[
        shadowPlanePosition[0], shadowPlanePosition[1],
        THREE.MathUtils.lerp(-0.117, shadowPlanePosition[2], desktopBlend),
      ]} receiveShadow>
        <planeGeometry args={[0.8, 0.8]} />
        <shadowMaterial transparent opacity={THREE.MathUtils.lerp(shadowOpacity * 0.82, shadowOpacity, desktopBlend)} depthWrite={false} />
      </mesh>
      {/* Click-catcher behind everything: clicking empty canvas closes whichever
          cartridge is open. Cartridge hitboxes stopPropagation, so this only
          fires on genuine misses. */}
      <mesh position={[0, 0, -1]} onClick={(event) => {
        if (event.delta <= TAP_MAX_MOVEMENT_PX) setOpenIndex(null);
      }}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ResponsiveCameraRig preset={cameraPreset} onFrame={handleCameraFrame}>
        <group>
          {layout.map((c, i) => (
            <CartridgeItem
              key={i}
              scene={scene}
              position={poses[i].position}
              color={c.color}
              labelTexture={textureByLabel.get(c.label)!}
              stickerTexture={
                i === 0 && c.applicationLabel
                  ? textureByLabel.get(c.applicationLabel)
                  : undefined
              }
              stickerApplied={stickerApplied ?? localStickerApplied}
              restingYaw={poses[i].yaw}
              restingRoll={poses[i].roll}
              restingPitch={poses[i].pitch}
              openYaw={c.restingYaw}
              openRoll={c.restingRoll}
              desktopBlend={desktopBlend}
              cameraPose={c}
              shellOpacity={c.shellOpacity}
              renderOrderBase={i * 10}
              isOpen={i === openIndex}
              isRackOpen={openIndex !== null}
              onToggleOpen={() => selectCartridge(i)}
              onSwipe={navigateCartridge}
              entranceDelaySec={
                THREE.MathUtils.lerp(i * 0.018, (layout.length - 1 - i) * ENTRANCE_STAGGER_SEC, desktopBlend)
              }
              entranceReady={entranceReady && cameraReady}
              mobileEntranceY={mobileEntranceY}
              accessibleName={c.company}
              caption={i === openIndex || (desktopBlend < 1 && openIndex === null && i === lastOpenIndex) ? { company: c.company, period: c.period } : undefined}
              captionOffset={openLabelY - poses[i].position[1]}
              neighborDistance={Math.abs(i - (openIndex ?? lastOpenIndex ?? i))}
            />
          ))}

        </group>
      </ResponsiveCameraRig>
      <Environment environmentIntensity={0.7} resolution={128}>
        <Lightformer intensity={4} position={[-2, 4, 3]} rotation={[-0.5, -0.35, -0.2]} scale={[4, 2]} />
        <Lightformer intensity={2} position={[4, 1, 2]} rotation={[0, 0.9, 0]} scale={[0.7, 4]} />
        <Lightformer intensity={0.95} position={[-4, -1, 2]} rotation={[0, -0.8, 0]} scale={[3, 4]} />
      </Environment>
    </>
  );
}

export default function CartridgeScene({
  cameraPreset,
  layout,
  onOpenChange,
  stickerApplied,
  shadowOpacity = 0.17,
  shadowPlanePosition,
  lightPosition,
}: {
  cameraPreset: CameraPreset;
  layout: CartridgeLayoutEntry[];
  onOpenChange?: (isOpen: boolean) => void;
  stickerApplied?: RefObject<boolean>;
  shadowOpacity?: number;
  shadowPlanePosition?: [number, number, number];
  lightPosition?: [number, number, number];
}) {
  const labelUrls = useMemo(
    () => [...new Set(layout.flatMap((c, i) =>
      i === 0 && c.applicationLabel ? [c.label, c.applicationLabel] : [c.label]
    ))],
    [layout]
  );

  return (
    <CartridgeSceneTextures
      cameraPreset={cameraPreset}
      layout={layout}
      labelUrls={labelUrls}
      onOpenChange={onOpenChange}
      stickerApplied={stickerApplied}
      shadowOpacity={shadowOpacity}
      shadowPlanePosition={shadowPlanePosition}
      lightPosition={lightPosition}
    />
  );
}

