"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { addCartridgeGrain } from "./cartridgeGrain";
import { CARTRIDGE_LABEL_FINISH } from "./cartridgeLabelFinish";

const WIDTH_SEGMENTS = 64;
const HEIGHT_SEGMENTS = 24;
// Let the opening settle and leave time to read the original artwork.
const OPEN_DELAY = 0.9;
export const STICKER_APPROACH_DISTANCE = 0.55;
const DURATION = 2.4;
const FIRST_CONTACT_PROGRESS = 0.2;
const MOBILE_FIRST_CONTACT_PROGRESS = 0.34;
const PEEL_DIRECTION = -16 * Math.PI / 180;
const PAPER_CLEARANCE = 0.000065;
const BACK_LABEL_URL = "/labels/spacexaiback.webp";
useTexture.preload(BACK_LABEL_URL);
type StickerMotion = { lean: number; sway: number; twist: number };
const NEUTRAL_MOTION: StickerMotion = { lean: 0, sway: 0, twist: 0 };
type StickerPlacement = { rotation: number; x: number; y: number; motion?: StickerMotion };
// The stage owns this ref across responsive canvas remounts. Cache the pose by
// that identity so resizing never changes the placement of an applied sticker.
const placements = new WeakMap<RefObject<boolean>, StickerPlacement>();

function stickerPlacement(appliedRef: RefObject<boolean>) {
  let placement = placements.get(appliedRef);
  if (!placement) {
    placement = {
      rotation: (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.25) * Math.PI / 180,
      x: (Math.random() - 0.5) * 0.003,
      y: (Math.random() - 0.5) * 0.003,
      // Pick a restrained choreography once; never add frame-by-frame noise.
      motion: {
        lean: Math.random() * 2 - 1,
        sway: Math.random() * 2 - 1,
        twist: Math.random() * 2 - 1,
      },
    };
    placements.set(appliedRef, placement);
  }
  return placement;
}

/** Sample the existing artwork, including its model transform, rather than
 * assuming the GLB's origin, scale, or surface depth. */
function createStickerSurface(
  scene: THREE.Object3D,
  center: THREE.Vector3,
  placement: StickerPlacement,
) {
  scene.updateMatrixWorld(true);
  let artwork: THREE.Mesh | undefined;
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.name === "Label (Artwork)")) artwork = object;
  });
  if (!artwork) throw new Error("Cartridge GLB is missing its artwork surface");

  const surfaceGeometry = artwork.geometry.clone().applyMatrix4(artwork.matrixWorld);
  const surfaceMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  const bounds = new THREE.Box3().setFromObject(surface);
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  const midpoint = bounds.getCenter(new THREE.Vector3());
  midpoint.x += placement.x * width;
  midpoint.y += placement.y * height;
  const { rotation } = placement;
  const geometry = new THREE.PlaneGeometry(width, height, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  const ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
  const intersections: THREE.Intersection[] = [];

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation) + midpoint.x;
    const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation) + midpoint.y;
    ray.ray.origin.set(rotatedX, rotatedY, bounds.max.z + 0.1);
    intersections.length = 0;
    ray.intersectObject(surface, false, intersections);
    const z = intersections[0]?.point.z ?? bounds.max.z;
    positions.setXYZ(i, rotatedX - center.x, rotatedY - center.y, z - center.z + PAPER_CLEARANCE);
    // The shared label loader uses glTF's top-left texture convention.
    uv.setY(i, 1 - uv.getY(i));
  }
  surfaceGeometry.dispose();
  surfaceMaterial.dispose();
  geometry.computeVertexNormals();
  // Retain the seated bounds so this addition cannot change the camera fit.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  positions.setUsage(THREE.DynamicDrawUsage);
  return { geometry, seated: new Float32Array(positions.array), width, rotation };
}

const PEEL_SAMPLES = 160;
const peelBuffers = new WeakMap<THREE.BufferGeometry, { x: Float64Array; z: Float64Array }>();

/** A restrained damped response, evaluated analytically for frame-rate
 * independence. It guides the sheet as a whole rather than individual fibers. */
function elasticResponse(time: number, frequency: number, damping: number) {
  const age = Math.max(0, time);
  return Math.exp(-damping * age) * Math.sin(frequency * age);
}

/** Arc-length-preserving paper flex: a pinned section, one smooth peel zone,
 * and a mostly planar free section with a gentle tip curl. The zone travels
 * with contact; twist remains broad and coherent, never independent ripples. */
export function deformSticker(
  geometry: THREE.BufferGeometry,
  seated: Float32Array,
  width: number,
  elapsed: number,
  rotation = 0,
  motion: StickerMotion = NEUTRAL_MOTION,
  approachDistance = STICKER_APPROACH_DISTANCE,
  mobilePlacement = 0,
) {
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  const progress = THREE.MathUtils.clamp(elapsed / DURATION, 0, 1);
  if (progress === 1) {
    positions.array.set(seated);
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return;
  }
  let buffers = peelBuffers.get(geometry);
  if (!buffers) {
    buffers = { x: new Float64Array(PEEL_SAMPLES + 1), z: new Float64Array(PEEL_SAMPLES + 1) };
    peelBuffers.set(geometry, buffers);
  }

  const bottomLeft = HEIGHT_SEGMENTS * (WIDTH_SEGMENTS + 1) * 3;
  const height = Math.hypot(seated[bottomLeft] - seated[0], seated[bottomLeft + 1] - seated[1]);
  const peelDirection = THREE.MathUtils.lerp(PEEL_DIRECTION, -8 * Math.PI / 180, mobilePlacement);
  const directionX = Math.cos(peelDirection);
  const directionY = Math.sin(peelDirection);
  const travelSpan = width * directionX + height * Math.abs(directionY);
  // The hand advances continuously through first contact, independent of the
  // sheet's angular response. The last few millimeters catch up gently.
  const travel = THREE.MathUtils.smoothstep(progress, 0, 1);
  const firstContact = THREE.MathUtils.lerp(FIRST_CONTACT_PROGRESS, MOBILE_FIRST_CONTACT_PROGRESS, mobilePlacement);
  const firstContactTravel = THREE.MathUtils.smoothstep(firstContact, 0, 1);
  const contact = travelSpan * (travel - firstContactTravel) / (1 - firstContactTravel);
  const landing = THREE.MathUtils.smootherstep(progress, 0, firstContact);
  const airborne = 1 - landing;
  const liftZ = approachDistance * airborne;
  // Start close to the surface, slightly below-left. Most of the motion
  // belongs to smoothing the paper, with only a short hand-placement approach.
  const entryX = -width * 0.08 * mobilePlacement * airborne;
  const entryY = -height * 0.12 * mobilePlacement * airborne;
  // Separate angular responses instead of driving all rotation with landing.
  // The airborne envelope only enforces the leading corner's contact constraint.
  const pitch = (-6 + 3 * motion.lean + 2 * elasticResponse(elapsed, 5.2, 3)) * Math.PI / 180 * airborne;
  const yaw = (-8 + 3 * motion.sway) * Math.exp(-elapsed * 2.8) * Math.PI / 180 * airborne;
  const roll = (2 + 3 * motion.twist - 1.5 * elasticResponse(elapsed, 4.1, 3)) * Math.PI / 180 * airborne;
  const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
  const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
  const cosRoll = Math.cos(roll), sinRoll = Math.sin(roll);
  const cosRotation = Math.cos(rotation + peelDirection);
  const sinRotation = Math.sin(rotation + peelDirection);
  const step = travelSpan / PEEL_SAMPLES;

  // One angle for the free sheet, with a modest, quickly damped follow-through.
  // Flex evolves during descent; there is no separate peel-start transition.
  const desktopPeelAngle = (84 + 42 * Math.sin(progress * Math.PI * 0.9)
    - 28 * progress + 3 * motion.lean * (1 - progress)
    + 3 * elasticResponse(elapsed - 0.25, 5, 3)) * Math.PI / 180;
  // Let the free sheet lag as the hand decelerates, then relax through
  // contact. A broad bend keeps this reading as paper rather than a hinge.
  const bendAge = elapsed - firstContact * DURATION + 0.12;
  const paperResponse = elasticResponse(bendAge, 8, 3.2)
    * THREE.MathUtils.smootherstep(bendAge, 0, 0.12);
  // Use one bend profile from flight through adhesion. Switching from a
  // shallow approach to a tighter peel at contact made the free edge whip.
  const mobilePeelAngle = (80 + 34 * Math.sin(progress * Math.PI * 0.9)
    - 24 * progress + 2 * motion.lean * (1 - progress)
    + 2 * paperResponse) * Math.PI / 180;
  const peelAngle = THREE.MathUtils.lerp(desktopPeelAngle, mobilePeelAngle, mobilePlacement);
  const desktopBendSpan = 0.34 + 0.035 * travel;
  const mobileBendSpan = 0.38 + 0.035 * travel;
  const bendSpan = width * THREE.MathUtils.lerp(desktopBendSpan, mobileBendSpan, mobilePlacement);
  const freeLength = travelSpan - Math.max(0, contact);
  const tipStart = Math.max(bendSpan, freeLength * 0.72);
  const tipEnd = Math.max(tipStart + width * 0.001, freeLength);
  const tipAngle = THREE.MathUtils.lerp(7, 6 + 3 * paperResponse, mobilePlacement) * Math.PI / 180 * (1 - travel * 0.5);
  const twist = ((3 + 1.5 * motion.twist) * Math.exp(-elapsed * 1.1)
    + 2 * elasticResponse(elapsed - 0.25, 4.6, 2.7)) * Math.PI / 180
      * THREE.MathUtils.lerp(1, 0.65, mobilePlacement);
  const sinTwist = Math.sin(twist), cosTwist = Math.cos(twist);
  buffers.x[0] = 0;
  buffers.z[0] = 0;
  // Integrate one shared profile for every row. Beyond the peel zone the
  // tangent is nearly constant, with one gentle curl at the free edge.
  for (let sample = 1; sample <= PEEL_SAMPLES; sample++) {
    const distance = (sample - 0.5) * step;
    const loose = Math.max(0, distance - contact);
    const angle = peelAngle * THREE.MathUtils.smootherstep(loose, 0, bendSpan)
      + tipAngle * THREE.MathUtils.smootherstep(loose, tipStart, tipEnd);
    buffers.x[sample] = buffers.x[sample - 1] + (Math.cos(angle) - 1) * step;
    buffers.z[sample] = buffers.z[sample - 1] + Math.sin(angle) * step;
  }

  for (let row = 0; row <= HEIGHT_SEGMENTS; row++) {
    for (let column = 0; column <= WIDTH_SEGMENTS; column++) {
      const distance = width * column / WIDTH_SEGMENTS * directionX
        - height * row / HEIGHT_SEGMENTS * directionY;
      const i = row * (WIDTH_SEGMENTS + 1) + column;
      if (distance <= contact) {
        positions.setXYZ(i, seated[i * 3], seated[i * 3 + 1], seated[i * 3 + 2]);
        continue;
      }
      const coordinate = Math.min(PEEL_SAMPLES, distance / step);
      const lower = Math.min(PEEL_SAMPLES - 1, Math.floor(coordinate));
      const fraction = coordinate - lower;
      const curl = THREE.MathUtils.lerp(buffers.x[lower], buffers.x[lower + 1], fraction);
      const curlZ = THREE.MathUtils.lerp(buffers.z[lower], buffers.z[lower + 1], fraction);
      // Rotate the coherent flex displacement, not the pinned surface. Since
      // the broad tail stays nearly planar, torsion moves it as a coherent sheet.
      const lateral = curlZ * sinTwist;
      const x = seated[i * 3] - seated[0] + curl * cosRotation - lateral * sinRotation;
      const y = seated[i * 3 + 1] - seated[1] + curl * sinRotation + lateral * cosRotation;
      const z = curlZ * cosTwist;
      const pitchedY = y * cosPitch - z * sinPitch;
      const pitchedZ = y * sinPitch + z * cosPitch;
      const yawedX = x * cosYaw + pitchedZ * sinYaw;
      const yawedZ = -x * sinYaw + pitchedZ * cosYaw;
      positions.setXYZ(
        i,
        seated[0] + yawedX * cosRoll - pitchedY * sinRoll
          + motion.sway * (width * THREE.MathUtils.lerp(0.09, 0.02, mobilePlacement) * airborne + curlZ * 0.1 * (1 - progress)) + entryX,
        seated[1] + yawedX * sinRoll + pitchedY * cosRoll + entryY,
        seated[i * 3 + 2] + yawedZ + liftZ,
      );
    }
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** Put the whole deformed sheet below the mobile viewport, using its actual
 * camera projection rather than a fixed local-Y distance. */
function belowFrameOffset(mesh: THREE.Mesh, camera: THREE.Camera, canvasHeight: number) {
  mesh.updateWorldMatrix(true, false);
  const bounds = new THREE.Box3().setFromBufferAttribute(
    mesh.geometry.getAttribute("position") as THREE.BufferAttribute,
  );
  let shiftY = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld);
        const target = corner.clone().project(camera);
        target.y = -1 - 48 / canvasHeight;
        target.unproject(camera);
        shiftY = Math.min(shiftY, target.y - corner.y);
      }
    }
  }
  const offset = new THREE.Vector3(0, shiftY, 0);
  if (mesh.parent) {
    offset.applyMatrix3(new THREE.Matrix3().setFromMatrix4(mesh.parent.matrixWorld).invert());
  }
  return offset;
}

/** A shared cutout rounds both physical faces without stretching their artwork
 * or changing the deformation grid. Coverage antialiasing softens the cut edge. */
function createCornerMask() {
  const width = 512, height = 256, radius = 8;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = Math.max(0, Math.abs(x + 0.5 - width / 2) - (width / 2 - radius));
      const dy = Math.max(0, Math.abs(y + 0.5 - height / 2) - (height / 2 - radius));
      const coverage = Math.round(255 * THREE.MathUtils.clamp(radius + 0.5 - Math.hypot(dx, dy), 0, 1));
      pixels.fill(coverage, (y * width + x) * 4, (y * width + x) * 4 + 4);
    }
  }
  const mask = new THREE.DataTexture(pixels, width, height);
  mask.minFilter = THREE.LinearFilter;
  mask.magFilter = THREE.LinearFilter;
  mask.needsUpdate = true;
  return mask;
}

export default function CartridgeSticker({
  scene,
  center,
  texture,
  isOpen,
  appliedRef,
  busyRef,
  renderOrder,
  desktopBlend = 1,
}: {
  scene: THREE.Object3D;
  center: THREE.Vector3;
  texture: THREE.Texture;
  isOpen: boolean;
  appliedRef: RefObject<boolean>;
  busyRef?: RefObject<boolean>;
  renderOrder: number;
  desktopBlend?: number;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const backSource = useTexture(BACK_LABEL_URL);
  const backTexture = useMemo(() => {
    const map = backSource.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.flipY = false;
    // Front UVs already run top-to-bottom. Reverse U for the opposite face
    // so its artwork reads correctly when looking directly at the back.
    map.repeat.set(-1, 1);
    map.offset.set(1, 0);
    map.generateMipmaps = true;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.anisotropy = gl.capabilities.getMaxAnisotropy();
    map.needsUpdate = true;
    return map;
  }, [backSource, gl]);
  const mesh = useRef<THREE.Mesh>(null);
  const frontMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const backMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useLayoutEffect(() => {
    for (const material of [frontMaterialRef.current, backMaterialRef.current]) {
      if (material) addCartridgeGrain(material, gl.getPixelRatio());
    }
    invalidate();
  }, [gl, invalidate]);
  const elapsed = useRef<number | null>(null);
  const flightOffset = useRef(new THREE.Vector3());
  const flightPrepared = useRef(false);
  const settings = useRef({ rate: 1, delay: OPEN_DELAY, approach: STICKER_APPROACH_DISTANCE, mobilePlacement: 0 });
  const activeSettings = useRef({ rate: 1, delay: OPEN_DELAY, approach: STICKER_APPROACH_DISTANCE, mobilePlacement: 0 });
  useLayoutEffect(() => {
    settings.current = {
      rate: DURATION / THREE.MathUtils.lerp(1.65, DURATION, desktopBlend),
      delay: THREE.MathUtils.lerp(0.55, OPEN_DELAY, desktopBlend),
      approach: THREE.MathUtils.lerp(0.008, STICKER_APPROACH_DISTANCE, desktopBlend),
      mobilePlacement: 1 - desktopBlend,
    };
  }, [desktopBlend]);
  const reducedMotion = useRef(false);
  const rotationRef = useRef(0);
  const motionRef = useRef(NEUTRAL_MOTION);
  const cornerMask = useMemo(() => createCornerMask(), []);
  const { geometry, seated, width } = useMemo(
    () => createStickerSurface(scene, center, { rotation: 0, x: 0, y: 0 }),
    [scene, center]
  );

  useLayoutEffect(() => {
    const placement = stickerPlacement(appliedRef);
    const placed = createStickerSurface(scene, center, placement);
    motionRef.current = placement.motion ?? NEUTRAL_MOTION;
    geometry.copy(placed.geometry);
    seated.set(placed.seated);
    rotationRef.current = placed.rotation;
    placed.geometry.dispose();
    invalidate();
  }, [scene, center, appliedRef, geometry, seated, invalidate]);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = media.matches;
      invalidate();
    };
    update();
    media.addEventListener("change", update);
    if (mesh.current) mesh.current.visible = appliedRef.current;
    return () => media.removeEventListener("change", update);
  }, [appliedRef, invalidate]);

  useLayoutEffect(() => {
    if (busyRef) busyRef.current = isOpen && !appliedRef.current;
    flightPrepared.current = false;
    flightOffset.current.set(0, 0, 0);
    if (mesh.current) mesh.current.position.set(0, 0, 0);
    if (!isOpen) {
      // Closing during the wait cancels it without consuming the one-shot.
      // Once application has begun, finish flush immediately on close rather
      // than continuing an invisible animation behind the closed cartridge.
      elapsed.current = null;
      if (appliedRef.current) {
        deformSticker(geometry, seated, width, DURATION, rotationRef.current);
      }
      if (mesh.current) mesh.current.visible = appliedRef.current;
    } else if (!appliedRef.current) {
      activeSettings.current = settings.current;
      elapsed.current = -activeSettings.current.delay * activeSettings.current.rate;
    }
    invalidate();
    return () => { elapsed.current = null; if (busyRef) busyRef.current = false; };
  }, [isOpen, appliedRef, busyRef, geometry, seated, width, invalidate]);

  useLayoutEffect(() => {
    gl.initTexture(backTexture);
    return () => backTexture.dispose();
  }, [backTexture, gl]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => () => cornerMask.dispose(), [cornerMask]);

  useFrame((state, delta) => {
    if (!isOpen || elapsed.current === null || !mesh.current) return;
    const mobilePlacement = activeSettings.current.mobilePlacement;
    const contact = THREE.MathUtils.lerp(FIRST_CONTACT_PROGRESS, MOBILE_FIRST_CONTACT_PROGRESS, mobilePlacement);
    // Preserve the rise-in speed, easing into desktop's slower adhesion pace.
    const adhesionPace = THREE.MathUtils.smootherstep(elapsed.current / DURATION, contact - 0.12, contact + 0.18);
    const playbackRate = THREE.MathUtils.lerp(activeSettings.current.rate, 1, adhesionPace * mobilePlacement);
    elapsed.current += Math.min(delta, 1 / 30) * playbackRate;
    if (elapsed.current >= 0) {
      appliedRef.current = true;
      if (reducedMotion.current) elapsed.current = DURATION;
      const mobile = activeSettings.current.mobilePlacement;
      if (!flightPrepared.current) {
        if (mobile > 0 && !reducedMotion.current) {
          deformSticker(geometry, seated, width, 0, rotationRef.current, motionRef.current, activeSettings.current.approach, mobile);
          flightOffset.current.copy(belowFrameOffset(mesh.current, state.camera, state.size.height)).multiplyScalar(mobile);
        }
        flightPrepared.current = true;
      }
      const contactProgress = THREE.MathUtils.lerp(FIRST_CONTACT_PROGRESS, MOBILE_FIRST_CONTACT_PROGRESS, mobile);
      const flight = 1 - THREE.MathUtils.smootherstep(elapsed.current / DURATION, 0, contactProgress);
      mesh.current.position.copy(flightOffset.current).multiplyScalar(flight);
      mesh.current.visible = true;
      deformSticker(geometry, seated, width, elapsed.current, rotationRef.current, motionRef.current, activeSettings.current.approach, mobile);
    }
    if (elapsed.current >= DURATION) {
      elapsed.current = null;
      if (busyRef) busyRef.current = false;
      invalidate();
    }
    else invalidate();
  });

  return (
    <mesh
      ref={mesh}
      name="Applied cartridge sticker"
      geometry={geometry}
      visible={false}
      frustumCulled={false}
      receiveShadow
      castShadow
      renderOrder={renderOrder}
      raycast={() => null}
    >
      <meshPhysicalMaterial
        {...CARTRIDGE_LABEL_FINISH}
        ref={frontMaterialRef}
        map={texture}
        alphaMap={cornerMask}
        alphaTest={0.5}
        alphaToCoverage
        color="white"
        side={THREE.FrontSide}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-3}
        polygonOffsetUnits={-3}
      />
      {/* Share the deformed surface so the opaque backing follows every curl.
          Opposite face culling keeps the front artwork exactly as before. */}
      <mesh
        name="Sticker coated artwork backing"
        geometry={geometry}
        frustumCulled={false}
        receiveShadow
        renderOrder={renderOrder}
        raycast={() => null}
      >
        <meshPhysicalMaterial
          ref={backMaterialRef}
          map={backTexture}
          alphaMap={cornerMask}
          alphaTest={0.5}
          alphaToCoverage
          color="white"
          metalness={0}
          roughness={0.35}
          ior={1.5}
          clearcoat={0.18}
          clearcoatRoughness={0.3}
          envMapIntensity={1}
          side={THREE.BackSide}
          transparent={false}
          opacity={1}
          depthWrite
        />
      </mesh>
    </mesh>
  );
}
