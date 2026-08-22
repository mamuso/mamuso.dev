import * as THREE from "three";

/**
 * Returns the world-space Y coordinate that projects to a pixel Y on a plane
 * perpendicular to the current camera.
 */
export function pixelYToWorldY(
  camera: THREE.Camera,
  pixelY: number,
  canvasHeight: number,
  planeZ: number
) {
  camera.updateMatrixWorld();
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.updateProjectionMatrix();
  }

  const probe = new THREE.Vector3(0, 0, planeZ).project(camera);
  const normalizedY = 1 - (pixelY / canvasHeight) * 2;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(probe.x, normalizedY), camera);

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, point);
  return point.y;
}
