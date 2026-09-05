type Pose = {
  position: [number, number, number];
  pitch: number;
  yaw: number;
  roll: number;
};

const DEG = Math.PI / 180;
export const MOBILE_ROW_DEPTH = -0.05;
export const MOBILE_SLOT_SPACING = 0.024;

/** Reserve the projected shell width before distributing the remaining room.
 * Small viewports compress the rack instead of shrinking the shared open pose. */
export function mobileRackSpacing(count: number, availableWidth: number) {
  return count < 2 ? 0 : Math.min(MOBILE_SLOT_SPACING, Math.max(0, availableWidth - 0.03) / (count - 1));
}

/** Translate each side of the rack as a unit, keeping its original slots.
 * Open dimensions are projected onto the rack's depth plane by the caller. */
export function mobileOpenDisplacement(
  index: number, count: number, spacing: number, activeIndex: number | null,
  openCenterX: number, openWidth: number, viewportWidth: number, rackOffset = 0,
) {
  if (activeIndex === null || index === activeIndex) return 0;
  const side = index < activeIndex ? -1 : 1;
  const nearestSlot = (activeIndex + side - (count - 1) / 2) * spacing + rackOffset;
  const clearance = Math.min(0.012, viewportWidth * 0.055);
  const edge = openCenterX + side * (openWidth / 2 + 0.03 / 2 + clearance);
  const displacement = side < 0 ? Math.min(0, edge - nearestSlot) : Math.max(0, edge - nearestSlot);
  const distance = Math.abs(index - activeIndex);
  // The immediate neighbor clears the face; the outer rack yields less,
  // retaining 90% of its slot spacing instead of moving like a rigid panel.
  const compression = Math.min(Math.abs(displacement) * 0.25, (distance - 1) * spacing * 0.1);
  return displacement - side * compression;
}

/** GLB axes: X spans the face, Y is upright, Z is shell thickness.
 * Positive Y rotation brings the local -X (left) edge toward the +Z camera.
 * Leave 4 degrees of the face visible, rather than a perfectly edge-on slab. */
export function mobileClosedPose(
  index: number, count: number, rowY: number, spacing = MOBILE_SLOT_SPACING,
  viewpoint?: { x: number; z: number },
): Pose {
  const slot = index - (count - 1) / 2;
  const x = slot * spacing;
  const z = MOBILE_ROW_DEPTH - Math.abs(slot) * 0.001;
  // Compensate for perspective across the row: the leftmost cartridges should
  // expose the same sliver of artwork as those on the right.
  const viewYaw = viewpoint ? Math.atan2(viewpoint.x - x, viewpoint.z - z) : 0;
  return {
    position: [
      x,
      rowY - Math.abs(slot) * 0.0005,
      z,
    ],
    pitch: -6 * DEG,
    yaw: 86 * DEG + viewYaw,
    roll: (index % 2 === 0 ? -0.3 : 0.3) * DEG,
  };
}

/** One responsive blend for the entire closed pose. Opening uses the existing
 * scene's position and orientation, independently of this closed composition. */
export function blendClosedPose(mobile: Pose, desktop: Pose, desktopBlend: number): Pose {
  if (desktopBlend === 1) return desktop;
  if (desktopBlend === 0) return mobile;
  const mix = (a: number, b: number) => a + (b - a) * desktopBlend;
  return {
    position: mobile.position.map((value, axis) => mix(value, desktop.position[axis])) as Pose['position'],
    pitch: mix(mobile.pitch, desktop.pitch),
    yaw: mix(mobile.yaw, desktop.yaw),
    roll: mix(mobile.roll, desktop.roll),
  };
}
