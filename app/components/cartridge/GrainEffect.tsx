"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const DEFAULT_GRAIN_INTENSITY = 0.04;

const GRAIN_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: DEFAULT_GRAIN_INTENSITY },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    varying vec2 vUv;

    float random(vec2 coordinates) {
      vec3 value = fract(vec3(coordinates.xyx) * 0.1031);
      value += dot(value, value.yzx + 33.33);
      return fract((value.x + value.y) * value.z);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = random(floor(gl_FragCoord.xy)) - 0.5;
      float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      float midtone = 1.0 - abs(luminance * 2.0 - 1.0);
      float response = mix(0.35, 1.0, smoothstep(0.0, 1.0, midtone));
      color.rgb += grain * intensity * response * color.a;
      gl_FragColor = color;
    }
  `,
};

export function GrainEffect({
  intensity = DEFAULT_GRAIN_INTENSITY,
}: {
  intensity?: number;
}) {
  const composerRef = useRef<EffectComposer | null>(null);
  const { camera, gl, invalidate, scene, size, viewport } = useThree();

  useLayoutEffect(() => {
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
    });
    renderTarget.samples = Math.min(4, gl.capabilities.maxSamples);

    const composer = new EffectComposer(gl, renderTarget);
    const grainPass = new ShaderPass(GRAIN_SHADER);
    grainPass.uniforms.intensity.value = intensity;

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(grainPass);
    composer.addPass(new OutputPass());
    composerRef.current = composer;
    invalidate();

    return () => {
      composerRef.current = null;
      composer.dispose();
    };
  }, [camera, gl, intensity, invalidate, scene]);

  useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    composer.setPixelRatio(viewport.dpr);
    composer.setSize(size.width, size.height);
    invalidate();
  }, [invalidate, size.height, size.width, viewport.dpr]);

  useFrame(() => {
    const composer = composerRef.current;
    if (composer) {
      composer.render();
    } else {
      gl.render(scene, camera);
    }
  }, 1);

  return null;
}
