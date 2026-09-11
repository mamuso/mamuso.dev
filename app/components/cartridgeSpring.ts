/** Mutable scalar state lets the frame loop advance without allocating objects. */
type Scalar = { current: number }

export function advanceCartridgeSpring(
  position: Scalar, velocity: Scalar, target: number,
  stiffness: number, damping: number, dt: number,
) {
  const displacement = position.current - target
  velocity.current += (-stiffness * displacement - damping * velocity.current) * dt
  position.current += velocity.current * dt
  return displacement
}
