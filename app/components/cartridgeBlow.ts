/** Tunable mobile microphone/gesture policy. All energy values are RMS amplitudes. */
export const BLOW = {
  LONG_PRESS_DURATION: 600,
  MOVEMENT_CANCEL_THRESHOLD: 12,
  CALIBRATION_DURATION: 400,
  BLOW_THRESHOLD: 3.5,
  BLOW_MIN_DURATION: 2800,
  BLOW_SMOOTHING: 65,
  BASELINE_FLOOR: 0.003,
  MIN_ENERGY: 0.025,
  ENERGY_MARGIN: 0.018,
  FULL_INTENSITY_RATIO: 2.2,
  MAX_SAMPLE_GAP: 500,
  MAX_ENVELOPE_STEP: 100,
  BLOW_MIN_SAMPLES: 3,
  SESSION_TIMEOUT: 20_000,
  ENTER_DURATION: 440,
  RETURN_DURATION: 1400,
  TILT: -47 * Math.PI / 180,
  SHAKE_DECAY: 55,
  RETURN_SHAKE_DECAY: 160,
  SHAKE_ROTATION: 0.1,
  SHAKE_POSITION: 0.0014,
  KICK: 0.045,
  KICK_DURATION: 180,
  DEBUG_INTERVAL: 250,
  FFT_SIZE: 1024,
} as const;

export type BlowState = 'idle' | 'longPress' | 'requestingPermission' | 'calibrating' | 'listening' | 'blowing' | 'returning' | 'cleanup';

/** Frame-rate-independent envelope with a bounded ambient estimate and sustained gate. */
export class BlowDetector {
  baseline = 0;
  energy = 0;
  rms = 0;
  intensity = 0;
  threshold: number = BLOW.MIN_ENERGY;
  sustained = 0;
  elapsed = 0;
  private aboveSamples = 0;
  update(rms: number, delta: number) {
    this.rms = rms;
    const dt = Math.min(delta, BLOW.MAX_ENVELOPE_STEP);
    this.elapsed += dt;
    const smoothing = 1 - Math.exp(-dt / BLOW.BLOW_SMOOTHING);
    this.energy += (rms - this.energy) * smoothing;
    if (this.elapsed <= BLOW.CALIBRATION_DURATION) {
      this.baseline += (this.energy - this.baseline) * smoothing;
      this.threshold = Math.max(BLOW.MIN_ENERGY, this.baseline * BLOW.BLOW_THRESHOLD, this.baseline + BLOW.ENERGY_MARGIN);
      return false;
    }
    this.baseline = Math.max(BLOW.BASELINE_FLOOR, this.baseline);
    this.threshold = Math.max(BLOW.MIN_ENERGY, this.baseline * BLOW.BLOW_THRESHOLD, this.baseline + BLOW.ENERGY_MARGIN);
    this.intensity = Math.max(0, Math.min(1, (this.energy - this.baseline) / (this.threshold * BLOW.FULL_INTENSITY_RATIO - this.baseline)));
    // Raw energy also has to hold: smoothing's tail must not turn a transient into a blow.
    this.sustained = delta <= BLOW.MAX_SAMPLE_GAP && rms >= this.threshold && this.energy >= this.threshold ? this.sustained + dt : 0;
    this.aboveSamples = this.sustained > 0 ? this.aboveSamples + 1 : 0;
    return this.sustained >= BLOW.BLOW_MIN_DURATION && this.aboveSamples >= BLOW.BLOW_MIN_SAMPLES;
  }
}

// getUserMedia cannot be aborted. Retain the lease until even a late permission
// result is disposed, including across selection changes and Strict Mode remounts.
let microphoneOwner: symbol | null = null;

export class CartridgeBlowController {
  state: BlowState = 'idle';
  detector = new BlowDetector();
  enteredAt = 0;
  returnedAt = 0;
  completed = false;
  suppressClick = false;
  private generation = 0;
  private lease: symbol | null = null;
  private pending = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private deadline: ReturnType<typeof setTimeout> | undefined;
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: Float32Array<ArrayBuffer> | null = null;
  private lastSample = 0;

  private wake: () => void;
  private eligible: () => boolean;
  constructor(wake: () => void, eligible: () => boolean) {
    this.wake = wake;
    this.eligible = eligible;
  }

  begin() {
    this.suppressClick = false;
    if (this.state !== 'idle' || microphoneOwner || !this.eligible()) return;
    this.state = 'longPress';
    this.timer = setTimeout(() => {
      if (!this.eligible()) { this.cancel(); return; }
      void this.request();
    }, BLOW.LONG_PRESS_DURATION);
  }

  release() {
    if (this.state === 'longPress') this.cancel();
    // Safari can require a fresh trusted pointerup to resume a context created
    // after the hold timer. Never create another context or another stream here.
    const context = this.context;
    if (context?.state === 'suspended') void context.resume().catch(() => {
      if (this.context === context) this.cancel();
    });
  }

  private async request() {
    if (microphoneOwner || this.state !== 'longPress') { this.cancel(); return; }
    const lease = Symbol('cartridge microphone');
    microphoneOwner = this.lease = lease;
    const generation = ++this.generation;
    this.state = 'requestingPermission';
    this.suppressClick = true;
    this.deadline = setTimeout(() => this.cancel(), BLOW.SESSION_TIMEOUT);
    try {
      const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) throw new Error('Web Audio unavailable');
      const context = this.context = new Audio();
      void context.resume().catch(() => { if (generation === this.generation) this.cancel(); });
      this.pending = true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pending = false;
      if (generation !== this.generation || !this.eligible()) {
        stream.getTracks().forEach(track => track.stop());
        if (microphoneOwner === lease) microphoneOwner = null;
        if (generation === this.generation) this.cancel();
        return;
      }
      this.stream = stream;
      stream.getTracks().forEach(track => track.addEventListener('ended', this.audioEnded));
      this.source = context.createMediaStreamSource(stream);
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = BLOW.FFT_SIZE;
      this.samples = new Float32Array(BLOW.FFT_SIZE);
      this.source.connect(this.analyser); // No destination: never play microphone audio.
      this.detector = new BlowDetector();
      this.enteredAt = this.lastSample = performance.now();
      this.completed = false;
      this.state = 'calibrating';
      this.wake();
    } catch {
      this.pending = false;
      if (generation === this.generation) this.cancel();
      else if (microphoneOwner === lease) microphoneOwner = null;
    }
  }

  private audioEnded = () => this.cancel();

  sample(now: number) {
    if (!this.analyser || !this.samples || !this.context) return;
    if (!this.eligible() || this.context.state === 'closed') { this.cancel(); return; }
    if (this.context.state !== 'running') {
      if (this.detector.elapsed > 0) this.cancel();
      return;
    }
    try {
      this.analyser.getFloatTimeDomainData(this.samples);
      let energy = 0;
      for (let i = 0; i < this.samples.length; i++) energy += this.samples[i] * this.samples[i];
      const complete = this.detector.update(Math.sqrt(energy / this.samples.length), now - this.lastSample);
      this.lastSample = now;
      if (this.detector.elapsed <= BLOW.CALIBRATION_DURATION) return;
      this.state = this.detector.sustained > 0 ? 'blowing' : 'listening';
      if (complete) {
        this.completed = true;
        this.returnedAt = now;
        this.state = 'returning';
        this.disposeAudio();
      }
    } catch { this.cancel(); }
  }

  finish() { this.cancel(); }

  cancel() {
    ++this.generation;
    this.state = 'cleanup';
    clearTimeout(this.timer);
    clearTimeout(this.deadline);
    this.disposeAudio();
    this.detector.intensity = 0;
    this.state = 'idle';
    this.wake();
  }

  private disposeAudio() {
    clearTimeout(this.deadline);
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.stream?.getTracks().forEach(track => {
      track.removeEventListener('ended', this.audioEnded);
      track.stop();
    });
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.context = null;
    this.stream = null;
    this.source = null;
    this.analyser = null;
    this.samples = null;
    if (!this.pending && microphoneOwner === this.lease) microphoneOwner = null;
    this.lease = null;
  }
}
