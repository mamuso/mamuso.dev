import assert from 'node:assert/strict';
import test from 'node:test';
import { Euler, Vector3 } from 'three';
import { blendClosedPose, mobileClosedPose, mobileRackSpacing, mobileOpenDisplacement, MOBILE_SLOT_SPACING } from './cartridgeMobileLayout.ts';
import { stageBlend } from './cartridgeStagePolicy.ts';

test('the GLB left spine dominates while a sliver of the front remains visible', () => {
  const pose = mobileClosedPose(0, 6, 0);
  const rotation = new Euler(pose.pitch, pose.yaw, pose.roll);
  const leftNormal = new Vector3(-1, 0, 0).applyEuler(rotation);
  const faceNormal = new Vector3(0, 0, 1).applyEuler(rotation);
  assert.ok(leftNormal.z > 0.98);
  assert.ok(faceNormal.z > 0.04 && faceNormal.z < 0.09);
});

test('the full rack stays centered and fits its available width', () => {
  for (const availableWidth of [0.12, 0.15, 0.25]) {
    const spacing = mobileRackSpacing(6, availableWidth);
    const poses = Array.from({ length: 6 }, (_, index) => mobileClosedPose(index, 6, 0.1, spacing));
    assert.ok(spacing <= MOBILE_SLOT_SPACING);
    assert.equal(poses[0].position[0], -poses[5].position[0]);
    assert.ok(poses[5].position[0] - poses[0].position[0] + 0.03 <= availableWidth + 1e-12);
    for (let index = 1; index < poses.length; index++) {
      assert.ok(poses[index].position[0] > poses[index - 1].position[0]);
    }
    assert.ok(poses.every(pose => pose.position[2] < -0.02));
  }
  assert.equal(mobileRackSpacing(1, 0.12), 0);
  assert.equal(mobileClosedPose(0, 1, 0.1, 0).position[0], 0);
});

test('perspective preserves the spine profile across the full row', () => {
  const camera = { x: 0, z: 0.8 };
  for (let index = 0; index < 6; index++) {
    const pose = mobileClosedPose(index, 6, 0, MOBILE_SLOT_SPACING, camera);
    const rotation = new Euler(pose.pitch, pose.yaw, pose.roll);
    const view = new Vector3(camera.x - pose.position[0], 0, camera.z - pose.position[2]).normalize();
    assert.ok(new Vector3(-1, 0, 0).applyEuler(rotation).dot(view) > 0.98);
    const face = new Vector3(0, 0, 1).applyEuler(rotation).dot(view);
    assert.ok(face > 0.04 && face < 0.09);
  }
});

test('both sides yield clearance for every selection without changing rack slots', () => {
  for (const count of [3, 6, 9]) {
    for (const viewport of [0.13, 0.18]) {
      const spacing = mobileRackSpacing(count, viewport - 0.02);
      for (const offset of [-0.02, 0, 0.02]) {
        for (let active = 0; active < count; active++) {
          const openX = 0.003;
          const openWidth = 0.12;
          const positions = Array.from({ length: count }, (_, index) => {
            const base = mobileClosedPose(index, count, 0, spacing).position[0] + offset;
            const shift = mobileOpenDisplacement(index, count, spacing, active, openX, openWidth, viewport, offset);
            if (index < active) {
              assert.ok(shift <= 0);
              assert.ok(base + shift + 0.015 < openX - openWidth / 2);
            } else if (index > active) {
              assert.ok(shift >= 0);
              assert.ok(base + shift - 0.015 > openX + openWidth / 2);
            } else assert.equal(shift, 0);
            assert.equal(mobileOpenDisplacement(index, count, spacing, null, openX, openWidth, viewport, offset), 0);
            return base + shift;
          });
          for (let index = 1; index < count; index++) {
            if (index === active || index - 1 === active) continue;
            const gap = positions[index] - positions[index - 1];
            assert.ok(gap >= spacing * 0.9 - 1e-12);
            assert.ok(gap <= spacing + 1e-12);
          }
        }
      }
    }
  }
});

test('responsive blend preserves exact desktop transforms and has continuous endpoints', () => {
  const desktop = { position: [0.004, 0.02, -0.01], pitch: 1.4, yaw: 0.03, roll: -0.01 };
  const mobile = mobileClosedPose(2, 6, 0.1);
  assert.equal(blendClosedPose(mobile, desktop, stageBlend(390)), mobile);
  assert.equal(blendClosedPose(mobile, desktop, stageBlend(1024)), desktop);
  assert.equal(blendClosedPose(mobile, desktop, stageBlend(1440)), desktop);
  const middle = blendClosedPose(mobile, desktop, stageBlend(952));
  assert.ok(Math.abs(middle.position[0] - (mobile.position[0] + desktop.position[0]) / 2) < 1e-12);
  for (const width of [880, 881, 952, 1023, 1024, 881, 390]) {
    const pose = blendClosedPose(mobile, desktop, stageBlend(width));
    assert.ok([...pose.position, pose.pitch, pose.yaw, pose.roll].every(Number.isFinite));
  }
});
