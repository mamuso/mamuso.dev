import * as THREE from "three";
import type { Object3D } from "three";

export function createCartridgeInstance({
  scene,
  color,
  labelTexture,
  maxAnisotropy,
  shellOpacity,
  renderOrderBase,
}: {
  scene: Object3D;
  color: string;
  labelTexture: THREE.Texture;
  maxAnisotropy: number;
  shellOpacity?: number;
  renderOrderBase: number;
}) {
  const instance = scene.clone();

  instance.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.castShadow = true;
    object.receiveShadow = true;
    object.raycast = () => null;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const hasArtwork = materials.some(isLabelArtworkMaterial);
    const isShell = materials.some(
      (material) => material.name === "Cartridge Shell"
    );

    object.material = Array.isArray(object.material)
      ? materials.map((material) =>
          prepareMaterial(
            material,
            color,
            maxAnisotropy,
            labelTexture,
            shellOpacity
          )
        )
      : prepareMaterial(
          materials[0],
          color,
          maxAnisotropy,
          labelTexture,
          shellOpacity
        );

    if (hasArtwork) {
      object.renderOrder = renderOrderBase + 1;
      object.castShadow = false;
      object.receiveShadow = false;
    } else if (isShell && shellOpacity != null && shellOpacity < 1) {
      object.castShadow = false;
      object.renderOrder = renderOrderBase;
    }
  });

  return instance;
}

export function configureLabelTexture(
  texture: THREE.Texture,
  renderer: THREE.WebGLRenderer
) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  renderer.initTexture(texture);
}

/**
 * Cloned cartridge materials are owned by their instance. The model geometry
 * and textures remain shared, so only release the per-instance materials when
 * a viewer unmounts.
 */
export function disposeCartridgeInstance(instance: Object3D) {
  instance.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) material.dispose();
  });
}

function isLabelArtworkMaterial(material: THREE.Material) {
  return (
    material.name === "Label (Artwork)" ||
    (material as THREE.MeshStandardMaterial).map != null
  );
}

function prepareMaterial(
  material: THREE.Material,
  color: string,
  maxAnisotropy: number,
  labelTexture: THREE.Texture,
  shellOpacity?: number
) {
  if (material.name === "Cartridge Shell") {
    const tinted = material.clone() as THREE.MeshStandardMaterial;
    tinted.color.set(color);
    if (shellOpacity != null && shellOpacity < 1) {
      tinted.transparent = true;
      tinted.opacity = shellOpacity;
      tinted.depthWrite = false;
    }
    return sharpenTextures(tinted, maxAnisotropy);
  }

  if (material.name === "Label (Paper)") {
    const paper = material.clone() as THREE.MeshStandardMaterial;
    paper.transparent = true;
    paper.opacity = 0;
    paper.depthWrite = false;
    return sharpenTextures(paper, maxAnisotropy);
  }

  if (isLabelArtworkMaterial(material)) {
    return new THREE.MeshBasicMaterial({
      map: labelTexture,
      toneMapped: false,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  return sharpenTextures(material.clone(), maxAnisotropy);
}

function sharpenTextures(material: THREE.Material, maxAnisotropy: number) {
  const standardMaterial = material as THREE.MeshStandardMaterial;
  const textures = [
    standardMaterial.map,
    standardMaterial.normalMap,
    standardMaterial.roughnessMap,
    standardMaterial.metalnessMap,
  ];

  for (const texture of textures) {
    if (!texture) continue;
    texture.anisotropy = maxAnisotropy;
    texture.needsUpdate = true;
  }

  return material;
}
