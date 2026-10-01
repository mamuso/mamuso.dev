'use client'
import { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PINK_GRADIENT_MAP } from './pinkGradientMap'

const stops = (values: readonly number[]) => `vec4(${values.slice(0, 4).join(', ')}), ${values[4].toFixed(2)}`

// Same math as the SVG filter: sRGB luminance on unpremultiplied color, then
// a five-stop table per channel. The canvas holds premultiplied alpha.
const fragmentShader = /* glsl */ `
  uniform sampler2D frame;
  varying vec2 vUv;

  float lookup(float x, vec4 head, float last) {
    float t = clamp(x, 0.0, 1.0) * 4.0;
    float k = min(floor(t), 3.0);
    float a = k < 1.0 ? head.x : k < 2.0 ? head.y : k < 3.0 ? head.z : head.w;
    float b = k < 1.0 ? head.y : k < 2.0 ? head.z : k < 3.0 ? head.w : last;
    return mix(a, b, t - k);
  }

  void main() {
    vec4 color = texture2D(frame, vUv);
    if (color.a <= 0.0) { gl_FragColor = vec4(0.0); return; }
    float l = dot(color.rgb / color.a, vec3(0.2126, 0.7152, 0.0722));
    vec3 mapped = vec3(
      lookup(l, ${stops(PINK_GRADIENT_MAP.r)}),
      lookup(l, ${stops(PINK_GRADIENT_MAP.g)}),
      lookup(l, ${stops(PINK_GRADIENT_MAP.b)})
    );
    gl_FragColor = vec4(mapped * color.a, color.a);
  }
`

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const isPink = () => document.documentElement.dataset.pink !== undefined

class PinkPass {
  private pink = false
  private frame = new THREE.FramebufferTexture(1, 1)
  private size = new THREE.Vector2()
  private geometry = new THREE.BufferGeometry()
  private material = new THREE.ShaderMaterial({
    uniforms: { frame: { value: this.frame } },
    vertexShader,
    fragmentShader,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  })
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera()

  constructor() {
    // One triangle covering the viewport.
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
    const quad = new THREE.Mesh(this.geometry, this.material)
    quad.frustumCulled = false
    this.scene.add(quad)
  }

  /** Returns whether the state changed. */
  setPink(pink: boolean) {
    const changed = pink !== this.pink
    this.pink = pink
    return changed
  }

  render(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    gl.render(scene, camera)
    if (!this.pink) return
    gl.getDrawingBufferSize(this.size)
    if (this.frame.image.width !== this.size.x || this.frame.image.height !== this.size.y) {
      this.frame.dispose()
      this.frame = new THREE.FramebufferTexture(this.size.x, this.size.y)
      this.material.uniforms.frame.value = this.frame
    }
    gl.copyFramebufferToTexture(this.frame)
    gl.render(this.scene, this.camera)
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.frame.dispose()
  }
}

/**
 * Takes over the scene's render so the pink page can recolor the cartridges:
 * render normally, then, while the page is pink, copy the frame and redraw it
 * through the gradient map.
 */
export default function CartridgePinkPass() {
  const get = useThree((state) => state.get)
  const [pass] = useState(() => new PinkPass())

  useEffect(() => {
    // Redraw as soon as the theme flips, so the pink reveal's snapshot of the
    // new page already has pink cartridges.
    const sync = () => {
      if (!pass.setPink(isPink())) return
      const { gl, scene, camera } = get()
      pass.render(gl, scene, camera)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pink'] })
    return () => {
      observer.disconnect()
      pass.dispose()
    }
  }, [get, pass])

  // A positive priority replaces R3F's own render.
  useFrame(({ gl, scene, camera }) => pass.render(gl, scene, camera), 1)

  return null
}
