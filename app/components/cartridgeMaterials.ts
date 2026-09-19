import * as THREE from 'three'
import { addCartridgeGrain } from './cartridgeGrain.ts'
import { CARTRIDGE_LABEL_FINISH } from './cartridgeLabelFinish.ts'

function isLabelArtworkMaterial(material: THREE.Material) {
  return (
    material.name === 'Label (Artwork)' ||
    (material as THREE.MeshStandardMaterial).map != null
  )
}

const CARTRIDGE_SHELL_ROUGHNESS = 0.6
const CARTRIDGE_SHELL_ENV_MAP_INTENSITY = 0.85
// Keep translucent shells visibly frosted without turning them milky. The
// transmission amount comes from each cartridge's shellOpacity; these values
// only control how softly the scene is blurred through the plastic.
const FROSTED_SHELL_ROUGHNESS = 0.32
const FROSTED_SHELL_THICKNESS = 0.0025
const FROSTED_SHELL_IOR = 1.46
// Preserve the requested shell hue in the frost while lifting it enough for
// dark plastics to continue transmitting the scene behind them.
const FROSTED_SHELL_TINT_LIFT = 0.02


export function prepareMaterial(
  material: THREE.Material,
  color: string,
  maxAniso: number,
  pixelRatio: number,
  labelTexture: THREE.Texture,
  shellOpacity?: number
) {
  if (material.name === 'Cartridge Shell') {
    const isFrosted = shellOpacity != null && shellOpacity < 1
    const shellColor = new THREE.Color(color)
    const frostedTransmissionColor = shellColor
      .clone()
      .lerp(new THREE.Color(0xffffff), FROSTED_SHELL_TINT_LIFT)
    const tinted = isFrosted
      ? new THREE.MeshPhysicalMaterial({
          // Three multiplies transmitted light by the base color. Lift dark
          // shell colors so black plastic can transmit instead of canceling
          // the framebuffer sample entirely.
          color: frostedTransmissionColor,
          metalness: 0,
          roughness: FROSTED_SHELL_ROUGHNESS,
          envMapIntensity: CARTRIDGE_SHELL_ENV_MAP_INTENSITY,
          transmission: 1 - shellOpacity,
          thickness: FROSTED_SHELL_THICKNESS,
          ior: FROSTED_SHELL_IOR,
          side: THREE.FrontSide,
        })
      : (material.clone() as THREE.MeshStandardMaterial)
    tinted.name = material.name
    if (!isFrosted) tinted.color.copy(shellColor)
    // Molded ABS plastic: broad, restrained highlights with no metallic
    // response. Keep this explicit instead of inheriting Blender defaults.
    tinted.metalness = 0
    if (!isFrosted) tinted.roughness = CARTRIDGE_SHELL_ROUGHNESS
    tinted.envMapIntensity = CARTRIDGE_SHELL_ENV_MAP_INTENSITY
    return addCartridgeGrain(sharpenTextures(tinted, maxAniso), pixelRatio)
  }
  if (material.name === 'Label (Paper)') {
    const paper = material.clone() as THREE.MeshStandardMaterial
    paper.visible = false
    return sharpenTextures(paper, maxAniso)
  }
  if (isLabelArtworkMaterial(material)) {
    // Match the applied sticker's matte coated-paper finish and retain grain.
    return addCartridgeGrain(
      new THREE.MeshPhysicalMaterial({
        ...CARTRIDGE_LABEL_FINISH,
        map: labelTexture,
        color: 0xffffff,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
      pixelRatio
    )
  }
  return addCartridgeGrain(
    sharpenTextures(material.clone(), maxAniso),
    pixelRatio
  )
}

export function configureLabelTexture(texture: THREE.Texture, gl: THREE.WebGLRenderer) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = gl.capabilities.getMaxAnisotropy()
  // Trilinear mipmaps stabilize the steeply tilted resting labels. Full
  // anisotropy retains detail along their less-compressed texture axis.
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  gl.initTexture(texture)
}

export function uploadSceneTextures(
  scene: THREE.Scene,
  gl: THREE.WebGLRenderer
) {
  const textures = new Set<THREE.Texture>()

  if (scene.background instanceof THREE.Texture) textures.add(scene.background)
  if (scene.environment) textures.add(scene.environment)

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value)
      }
    }
  })

  for (const texture of textures) gl.initTexture(texture)
}

function sharpenTextures(material: THREE.Material, maxAniso: number) {
  const std = material as THREE.MeshStandardMaterial
  for (const map of [std.map, std.normalMap, std.roughnessMap, std.metalnessMap]) {
    if (map) {
      map.anisotropy = maxAniso
      map.needsUpdate = true
    }
  }
  return material
}

export function createCartridgeInstance(scene: THREE.Object3D, options: {
  color: string; maxAniso: number; pixelRatio: number; labelTexture: THREE.Texture;
  shellOpacity?: number; renderOrderBase: number;
}) {
  const { color, maxAniso, pixelRatio, labelTexture, shellOpacity, renderOrderBase } = options
    const clone = scene.clone()
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.receiveShadow = true
        obj.raycast = () => null
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        const hasArtwork = materials.some(isLabelArtworkMaterial)
        const isShell = materials.some((m) => m.name === 'Cartridge Shell')
        obj.material = Array.isArray(obj.material)
          ? materials.map((m) =>
              prepareMaterial(
                m,
                color,
                maxAniso,
                pixelRatio,
                labelTexture,
                shellOpacity
              )
            )
          : prepareMaterial(
              materials[0],
              color,
              maxAniso,
              pixelRatio,
              labelTexture,
              shellOpacity
            )
        if (hasArtwork) {
          obj.renderOrder = renderOrderBase + 1
          obj.castShadow = false
          obj.receiveShadow = true
        } else if (isShell && shellOpacity != null && shellOpacity < 1) {
          obj.castShadow = false
          obj.renderOrder = renderOrderBase
        }
      }
    })
    return clone
}

/** Only cloned materials belong to an instance; GLTF geometry and loader textures are shared. */
export function disposeCartridgeInstance(instance: THREE.Object3D) {
  const materials = new Set<THREE.Material>()
  instance.traverse(object => {
    if (object instanceof THREE.Mesh) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
    }
  })
  for (const material of materials) material.dispose()
}
