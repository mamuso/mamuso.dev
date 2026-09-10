export const CARTRIDGE_SWIPE = {
  AXIS_THRESHOLD: 12,
  AXIS_DOMINANCE: 1.2,
  COMMIT_DISTANCE: 48,
  MAX_OFFSET: 0.022,
  STIFFNESS: 420,
  DAMPING: 36,
  STEP: 1 / 240,
  REST_DISTANCE: 0.00001,
  REST_SPEED: 0.0001,
  ROLL_PER_METER: -1.8,
} as const;

/** One direction-locked, primary-touch gesture; distances are viewport pixels. */
export class CartridgeSwipeGesture {
  state: 'idle' | 'pending' | 'horizontal' | 'vertical' = 'idle';
  pointerId = -1;
  displacement = 0;
  suppressClick = false;
  private x = 0;
  private y = 0;

  begin(id: number, x: number, y: number) {
    this.state = 'pending';
    this.pointerId = id;
    this.x = x; this.y = y;
    this.displacement = 0;
    this.suppressClick = false;
  }

  move(id: number, x: number, y: number) {
    if (id !== this.pointerId || this.state === 'idle') return false;
    const dx = x - this.x, dy = y - this.y;
    const before = this.state;
    if (this.state === 'pending' && Math.max(Math.abs(dx), Math.abs(dy)) >= CARTRIDGE_SWIPE.AXIS_THRESHOLD) {
      if (Math.abs(dx) > Math.abs(dy) * CARTRIDGE_SWIPE.AXIS_DOMINANCE) this.state = 'horizontal';
      else this.state = 'vertical';
    }
    if (this.state === 'horizontal') {
      this.displacement = dx;
      this.suppressClick = true;
    }
    return before !== 'horizontal' && this.state === 'horizontal';
  }

  release(id: number): -1 | 0 | 1 {
    if (id !== this.pointerId) return 0;
    const direction = this.state === 'horizontal' && Math.abs(this.displacement) >= CARTRIDGE_SWIPE.COMMIT_DISTANCE
      ? this.displacement < 0 ? 1 : -1 : 0;
    this.cancel();
    return direction;
  }

  cancel() { this.state = 'idle'; this.pointerId = -1; this.displacement = 0; }
}

export function swipeCartridgeIndex(index: number, direction: -1 | 1, count: number) {
  return Math.max(0, Math.min(count - 1, index + direction));
}
