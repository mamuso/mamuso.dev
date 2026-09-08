import * as THREE from "three";
import type { Group, Object3D } from "three";
import { CAMERA_FOV_DEGREES, DEG, CAMERA_PAN_FRACTION, CAMERA_VERTICAL_PAN_FRACTION, ENTRANCE_OFFSET_Z, STICKER_APPROACH_DISTANCE, type CameraPreset } from "./cartridgeConfig.ts";

/** World Y, on the world-X=0/world-Z=planeZ plane, that projects to a given
 * pixel Y (measured from the canvas top) under the current (static) camera. */
export function pixelYToWorldY(
  camera: THREE.Camera,
  pixelY: number,
  canvasHeightPx: number,
  planeZ: number
) {
  camera.updateMatrixWorld();
  if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
  const probe = new THREE.Vector3(0, 0, planeZ).project(camera);
  const ndcY = 1 - (pixelY / canvasHeightPx) * 2;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(probe.x, ndcY), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, point);
  return point.y;
}

/** Frame the settled model using a reference composition. Cached bounds keep
 * later resize targets independent of opening, hover, and sticker deformation. */
export function frameCartridges(
  group: Group,
  camera: THREE.PerspectiveCamera,
  canvasHeight: number,
  preset: CameraPreset,
  invalidate: () => void,
  settledBounds?: THREE.Box3,
) {
  // Entrance motion starts the cartridges above their resting slots. Frame
  // the settled layout so the camera remains fixed while they fall in.
  const animatedTransforms: Array<{
    object: Object3D;
    position: THREE.Vector3;
    rotation: THREE.Euler;
  }> = [];
  group.traverse((object) => {
    const cameraPositionY = object.userData.cameraPositionY;
    const cameraPositionZ = object.userData.cameraPositionZ;
    const cameraRotationX = object.userData.cameraRotationX;
    if (
      typeof cameraPositionY !== "number" ||
      typeof cameraPositionZ !== "number" ||
      typeof cameraRotationX !== "number"
    ) return;
    animatedTransforms.push({
      object,
      position: object.position.clone(),
      rotation: object.rotation.clone(),
    });
    object.position.x = object.userData.cameraPositionX;
    object.rotation.y = object.userData.cameraRotationY;
    object.rotation.z = object.userData.cameraRotationZ;
    object.position.y = cameraPositionY;
    object.position.z = cameraPositionZ;
    object.rotation.x = cameraRotationX;
  });
  const box3 = settledBounds ?? new THREE.Box3().setFromObject(group);
  for (const { object, position, rotation } of animatedTransforms) {
    object.position.copy(position);
    object.rotation.copy(rotation);
  }
  if (box3.isEmpty()) return;
  const center = box3.getCenter(new THREE.Vector3());
  const boxSize = box3.getSize(new THREE.Vector3());
  const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);

  const halfFov = (CAMERA_FOV_DEGREES * DEG) / 2;
  // A shorter mobile viewport crops empty space instead of shrinking objects.
  // Keep camera distance/perspective, narrowing the vertical viewing angle.
  const desktopBlend = preset.desktopBlend ?? (preset.openInPlace ? 0 : 1);
  const heightScale = THREE.MathUtils.lerp(canvasHeight / 640, 1, desktopBlend);
  camera.fov = 2 * Math.atan(Math.tan(halfFov) * heightScale) / DEG;
  const fitHeightDistance = maxSize / (2 * Math.tan(halfFov));
  const fitWidthDistance = fitHeightDistance / preset.aspect;
  const distance = preset.margin * Math.max(fitHeightDistance, fitWidthDistance);

  const visibleHalfHeight = distance * Math.tan(halfFov);
  const visibleHalfWidth = visibleHalfHeight * preset.aspect;
  const offset = visibleHalfWidth * (preset.panFraction ?? CAMERA_PAN_FRACTION);
  const verticalOffset =
    visibleHalfHeight * (preset.verticalPanFraction ?? CAMERA_VERTICAL_PAN_FRACTION);

  const camPos = center.clone();
  camPos.z += distance;
  camPos.x -= offset;
  camPos.y += verticalOffset;
  const target = center.clone();
  target.x -= offset;
  target.y += verticalOffset;

  camera.position.copy(camPos);
  // Include the sticker's high-Z approach without changing the framing.
  camera.near = Math.max(
    0.01,
    distance - maxSize - Math.abs(ENTRANCE_OFFSET_Z) - STICKER_APPROACH_DISTANCE
  );
  camera.far = distance + maxSize * 4 + Math.abs(ENTRANCE_OFFSET_Z);
  camera.updateProjectionMatrix();
  camera.lookAt(target);

  const verticalPanPx = preset.verticalPanPx ?? 0;
  if (verticalPanPx !== 0) {
    const canvasHeightPx = canvasHeight;
    const planeZ = center.z;
    const worldAtTop = pixelYToWorldY(camera, 0, canvasHeightPx, planeZ);
    const worldAtOffset = pixelYToWorldY(
      camera,
      verticalPanPx,
      canvasHeightPx,
      planeZ
    );
    const worldDelta = worldAtOffset - worldAtTop;
    camera.position.y += worldDelta;
    target.y += worldDelta;
    camera.lookAt(target);
  }

  group.updateMatrixWorld(true);
  invalidate();
  return box3;
}

