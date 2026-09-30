import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { CARTRIDGES } from '../../data/cartridges.ts'
import { CAMERA_PRESET_LARGE, CAMERA_PRESET_SMALL, STACK_AXIS, CLOSED_CARTRIDGE_GAP } from './cartridgeConfig.ts'
import { buildCartridgeLayout, INITIAL_CARTRIDGE_RESTING_POSES, cartridgeExtentAlongAxis, resolveCartridgePoses } from './cartridgeLayout.ts'
import { frameCartridges, pixelYToWorldY } from './cartridgeCamera.ts'
import { createCartridgeInstance, disposeCartridgeInstance } from './cartridgeMaterials.ts'
import { advanceCartridgeSpring } from './cartridgeSpring.ts'

const layout = buildCartridgeLayout(CARTRIDGES, INITIAL_CARTRIDGE_RESTING_POSES)

test('resting slots retain physical clearance despite individual rotations', () => {
  assert.equal(layout.length, CARTRIDGES.length)
  for (let i = 1; i < layout.length; i++) {
    const a = layout[i - 1], b = layout[i]
    const extent = p => cartridgeExtentAlongAxis(p.restingPitch, p.restingYaw, p.restingRoll, STACK_AXIS)
    const separation = new THREE.Vector3(...b.position).sub(new THREE.Vector3(...a.position)).dot(STACK_AXIS)
    assert.ok(Math.abs(separation - (extent(a) + extent(b)) / 2 - CLOSED_CARTRIDGE_GAP) < 1e-12)
  }
})

test('camera framing restores animated transforms and reuses settled bounds', () => {
  const root = new THREE.Group()
  const model = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.072, 0.02))
  const pivot = new THREE.Group(); pivot.add(model); root.add(pivot)
  pivot.position.set(0.01, 0.3, 0.02); pivot.rotation.set(0.5, 0.3, 0.2)
  Object.assign(pivot.userData, { cameraPositionX: 0, cameraPositionY: 0, cameraPositionZ: 0, cameraRotationX: 1.4, cameraRotationY: 0, cameraRotationZ: 0 })
  const original = { position: pivot.position.clone(), rotation: pivot.rotation.clone() }
  const camera = new THREE.PerspectiveCamera(14, 2)
  const bounds = frameCartridges(root, camera, 640, CAMERA_PRESET_LARGE, () => {})
  assert.deepEqual(pivot.position, original.position); assert.deepEqual(pivot.rotation.toArray(), original.rotation.toArray())
  assert.ok(camera.near > 0 && camera.far > camera.near)
  for (const y of [0, 140, 274, 640]) {
    const worldY = pixelYToWorldY(camera, y, 640, 0)
    const pixel = (1 - new THREE.Vector3(0, worldY, 0).project(camera).y) * 320
    assert.ok(Math.abs(pixel - y) < 1e-8)
  }
  pivot.position.y = 5
  const next = camera.clone()
  assert.equal(frameCartridges(root, next, 640, CAMERA_PRESET_LARGE, () => {}, bounds), bounds)
  assert.deepEqual(next.position, camera.position)
  model.geometry.dispose(); model.material.dispose()
})

test('open layouts stay finite for every selection and responsive blend without mutating inputs', () => {
  const original = structuredClone(layout)
  const camera = new THREE.PerspectiveCamera(14, 2)
  camera.position.set(0, 0, 0.8); camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
  for (const blend of [0, 0.5, 1]) for (const open of [null, 0, 1, 2, 3, 4, 5]) {
    const preset = { ...(blend === 1 ? CAMERA_PRESET_LARGE : CAMERA_PRESET_SMALL), desktopBlend: blend }
    const result = resolveCartridgePoses(layout, open, camera, { width: 390, height: 640 }, preset, new THREE.Vector3(0.055, 0.036, 0.01))
    assert.equal(result.poses.length, layout.length)
    for (const pose of result.poses) assert.ok([...pose.position, pose.pitch, pose.yaw, pose.roll].every(Number.isFinite))
    assert.ok(Number.isFinite(result.openLabelY) && Number.isFinite(result.mobileEntranceY))
    if (open !== null) assert.equal(result.poses[open].position[0], layout[open].position[0])
  }
  assert.deepEqual(layout, original)
})

test('springs converge after an interrupted target without discarding momentum', () => {
  for (const [stiffness, damping] of [[205, 27], [310, 34], [410, 38], [220, 29]]) {
    const position = { current: 0 }, velocity = { current: 0 }
    for (let i = 0; i < 8; i++) advanceCartridgeSpring(position, velocity, 1, stiffness, damping, 1 / 60)
    assert.ok(velocity.current > 0)
    const oldVelocity = velocity.current
    advanceCartridgeSpring(position, velocity, -0.2, stiffness, damping, 1 / 60)
    assert.notEqual(velocity.current, 0)
    assert.ok(velocity.current < oldVelocity)
    for (let i = 0; i < 300; i++) advanceCartridgeSpring(position, velocity, -0.2, stiffness, damping, 1 / 60)
    assert.ok(Math.abs(position.current + 0.2) < 1e-8 && Math.abs(velocity.current) < 1e-8)
  }
})

test('instances own their materials but preserve cached geometry and textures', () => {
  const source = new THREE.Group(), geometry = new THREE.BoxGeometry(), texture = new THREE.Texture()
  const shell = new THREE.MeshStandardMaterial({ color: '#123456', roughness: 0.9 }); shell.name = 'Cartridge Shell'
  source.add(new THREE.Mesh(geometry, shell))
  let geometryDisposals = 0, textureDisposals = 0, materialDisposals = 0
  geometry.addEventListener('dispose', () => geometryDisposals++)
  texture.addEventListener('dispose', () => textureDisposals++)
  const options = { color: '#222222', maxAniso: 4, pixelRatio: 2, labelTexture: texture, shellOpacity: 0.1, renderOrderBase: 0 }
  const a = createCartridgeInstance(source, options), b = createCartridgeInstance(source, options)
  assert.equal(a.children[0].geometry, geometry)
  assert.notEqual(a.children[0].material, shell)
  assert.notEqual(a.children[0].material, b.children[0].material)
  assert.equal(a.children[0].material.transmission, 0.9)
  assert.equal(shell.roughness, 0.9)
  a.children[0].material.addEventListener('dispose', () => materialDisposals++)
  disposeCartridgeInstance(a)
  assert.equal(materialDisposals, 1); assert.equal(geometryDisposals, 0); assert.equal(textureDisposals, 0)
  disposeCartridgeInstance(b); geometry.dispose(); texture.dispose(); shell.dispose()
})
