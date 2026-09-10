import { advanceCartridgeSpring } from './cartridgeSpring.ts';
import { BLOW } from './cartridgeBlow.ts';

/** Return dynamics independent of Three: one spring for the handling tilt,
 * plus a short inertial fade for the wind. All frame storage is reused. */
export class CartridgeBlowReturn {
  readonly pose = new Float64Array(6);
  private readonly velocity = new Float64Array(6);
  private readonly wind = new Float64Array(6);
  private readonly windVelocity = new Float64Array(6);
  private readonly angle = { current: 0 };
  private readonly angularVelocity = { current: 0 };
  private observedAt = -1;
  private tilt = 0;
  private tiltVelocity = 0;
  private integrated = 0;
  private damping: number = BLOW.RETURN_DAMPING;
  startedAt = -1;

  reset() {
    this.observedAt = -1; this.startedAt = -1;
    this.tilt = this.tiltVelocity = 0;
    this.pose.fill(0); this.velocity.fill(0);
  }

  observe(x: number, y: number, z: number, px: number, py: number, pz: number, tilt: number, now: number) {
    const dt = this.observedAt < 0 ? 0 : (now - this.observedAt) / 1000;
    this.record(0, x, dt); this.record(1, y, dt); this.record(2, z, dt);
    this.record(3, px, dt); this.record(4, py, dt); this.record(5, pz, dt);
    this.tiltVelocity = dt > 0 ? (tilt - this.tilt) / dt : 0;
    this.tilt = tilt;
    this.observedAt = now;
  }

  private record(axis: number, value: number, dt: number) {
    this.velocity[axis] = dt > 0 ? (value - this.pose[axis]) / dt : 0;
    this.pose[axis] = value;
  }

  start(now: number, reducedMotion: boolean) {
    this.startedAt = now;
    this.integrated = 0;
    this.angle.current = this.tilt;
    this.angularVelocity.current = this.tiltVelocity;
    this.wind.set(this.pose);
    this.windVelocity.set(this.velocity);
    this.wind[0] -= this.tilt;
    this.windVelocity[0] -= this.tiltVelocity;
    this.damping = reducedMotion ? 2 * Math.sqrt(BLOW.RETURN_STIFFNESS) : BLOW.RETURN_DAMPING;
  }

  advance(now: number) {
    const elapsed = Math.max(0, Math.min(BLOW.RETURN_DURATION, now - this.startedAt));
    const seconds = elapsed / 1000;
    // Integrate bounded substeps, including on 30 Hz phones and delayed frames.
    while (this.integrated < seconds) {
      const dt = Math.min(BLOW.RETURN_STEP, seconds - this.integrated);
      advanceCartridgeSpring(this.angle, this.angularVelocity, 0, BLOW.RETURN_STIFFNESS, this.damping, dt);
      this.integrated += dt;
    }
    const fadeDuration = BLOW.RETURN_WIND_DURATION / 1000;
    const windTime = Math.min(seconds, fadeDuration);
    const envelope = Math.pow(1 - windTime / fadeDuration, 2);
    for (let axis = 0; axis < this.pose.length; axis++) {
      // Cubic Hermite tail: preserve starting position/velocity; finish at rest.
      this.pose[axis] = envelope * (this.wind[axis] + windTime * (this.windVelocity[axis] + 2 * this.wind[axis] / fadeDuration));
    }
    this.pose[0] += this.angle.current;
    if (elapsed === BLOW.RETURN_DURATION) {
      this.pose.fill(0);
      return true;
    }
    return false;
  }
}
