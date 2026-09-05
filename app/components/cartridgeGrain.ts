import type * as THREE from "three";

const CARTRIDGE_GRAIN_INTENSITY = 0.02;

export function addCartridgeGrain(material: THREE.Material, pixelRatio: number) {
  const grainDpr = { value: Math.min(pixelRatio, 2) };
  material.userData.cartridgeGrainDpr = grainDpr;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.cartridgeGrainDpr = grainDpr;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        /* glsl */ `
          uniform float cartridgeGrainDpr;
          float cartridgeGrainRandom(vec2 coordinates) {
            vec3 value = fract(vec3(coordinates.xyx) * 0.1031);
            value += dot(value, value.yzx + 33.33);
            return fract((value.x + value.y) * value.z);
          }

          void main() {
        `
      )
      .replace(
        "#include <opaque_fragment>",
        /* glsl */ `
          #include <opaque_fragment>

          float cartridgeGrainPixelRatio = min(cartridgeGrainDpr, 2.0);
          float cartridgeGrain =
            cartridgeGrainRandom(
              floor(gl_FragCoord.xy / cartridgeGrainPixelRatio)
            ) - 0.5;
          float cartridgeLuminance = dot(
            gl_FragColor.rgb,
            vec3(0.2126, 0.7152, 0.0722)
          );
          float cartridgeMidtone =
            1.0 - abs(cartridgeLuminance * 2.0 - 1.0);
          float cartridgeGrainResponse = mix(
            0.35,
            1.0,
            smoothstep(0.0, 1.0, cartridgeMidtone)
          );
          float cartridgeDprResponse = cartridgeGrainPixelRatio * 0.5;

          gl_FragColor.rgb +=
            cartridgeGrain *
            ${CARTRIDGE_GRAIN_INTENSITY.toFixed(3)} *
            cartridgeDprResponse *
            cartridgeGrainResponse *
            gl_FragColor.a;
        `
      );
  };
  material.customProgramCacheKey = () =>
    "cartridge-grain-v3";
  material.needsUpdate = true;
  return material;
}

