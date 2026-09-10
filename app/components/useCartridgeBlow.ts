"use client";

import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { BLOW, CartridgeBlowController } from './cartridgeBlow';

/** Input/lifecycle adapter; audio and motion share the existing demand render loop. */
export function useCartridgeBlow(isOpen: boolean, settled: RefObject<boolean>, stickerBusy: RefObject<boolean>) {
  const { gl, invalidate } = useThree();
  const offset = useRef<Group>(null);
  const controller = useRef<CartridgeBlowController | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const shake = useRef(0);
  const returnPose = useRef({ startedAt: -1, x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0 });
  const debugAt = useRef(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const coarse = window.matchMedia('(pointer: coarse)');
    if (!coarse.matches || !navigator.mediaDevices?.getUserMedia || !(window.AudioContext || 'webkitAudioContext' in window)) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const eligible = () => coarse.matches && document.visibilityState === 'visible';
    const current = new CartridgeBlowController(invalidate, eligible, () => settled.current && !stickerBusy.current);
    controller.current = current;
    const reset = () => {
      current.cancel();
      pointer.current = null;
      shake.current = 0;
      offset.current?.rotation.set(0, 0, 0);
      offset.current?.position.set(0, 0, 0);
    };
    const move = (event: PointerEvent) => {
      const start = pointer.current;
      if (start && start.id === event.pointerId && (current.state === 'longPress' || current.state === 'armed') && Math.hypot(event.clientX - start.x, event.clientY - start.y) > BLOW.MOVEMENT_CANCEL_THRESHOLD) reset();
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId === pointer.current?.id) { current.release(); pointer.current = null; }
    };
    const down = (event: PointerEvent) => {
      current.suppressClick = false;
      if (event.target !== gl.domElement || pointer.current && pointer.current.id !== event.pointerId) reset();
    };
    const activationClick = (event: MouseEvent) => {
      // Opening can move the original hitbox away from the held finger. Consume
      // its release before raycasting so a canvas miss cannot close the rack.
      if (!current.suppressClick) return;
      current.suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const hidden = () => { if (document.visibilityState !== 'visible') reset(); };
    const blur = () => { if (current.state !== 'requestingPermission') reset(); };
    const preferences = () => { reduceMotion.current = reduced.matches; if (!coarse.matches) reset(); };
    const contextMenu = (event: Event) => {
      if (pointer.current || current.suppressClick && current.state !== 'idle') event.preventDefault();
    };
    preferences();
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', reset, true);
    window.addEventListener('scroll', reset, true);
    window.addEventListener('pagehide', reset);
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', reset);
    window.addEventListener('popstate', reset);
    document.addEventListener('visibilitychange', hidden);
    gl.domElement.addEventListener('contextmenu', contextMenu);
    gl.domElement.addEventListener('click', activationClick, true);
    coarse.addEventListener('change', preferences);
    reduced.addEventListener('change', preferences);
    return () => {
      reset();
      controller.current = null;
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', reset, true);
      window.removeEventListener('scroll', reset, true);
      window.removeEventListener('pagehide', reset);
      window.removeEventListener('blur', blur);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('popstate', reset);
      document.removeEventListener('visibilitychange', hidden);
      gl.domElement.removeEventListener('contextmenu', contextMenu);
      gl.domElement.removeEventListener('click', activationClick, true);
      coarse.removeEventListener('change', preferences);
      reduced.removeEventListener('change', preferences);
    };
  }, [isOpen, gl, invalidate, settled, stickerBusy]);

  useFrame((_, delta) => {
    const current = controller.current;
    const group = offset.current;
    if (!current || !group) return;
    const now = performance.now();
    current.advance();
    current.sample(now);
    if (process.env.NODE_ENV === 'development' && current.state !== 'idle' && now - debugAt.current >= BLOW.DEBUG_INTERVAL) {
      debugAt.current = now;
      try {
        if (window.localStorage.getItem('cartridge-blow-debug') === '1') console.debug('[cartridge blow]', { state: current.state, baseline: current.detector.baseline, rms: current.detector.rms, energy: current.detector.energy, blowIntensity: current.detector.intensity, threshold: current.detector.threshold, sustained: current.detector.sustained });
      } catch { /* Storage may be disabled; debugging must never affect the gesture. */ }
    }
    if (current.state === 'idle' || current.state === 'longPress' || current.state === 'armed' || current.state === 'requestingPermission') {
      group.rotation.set(0, 0, 0);
      group.position.set(0, 0, 0);
      shake.current = 0;
      return;
    }
    if (current.state === 'returning') {
      const pose = returnPose.current;
      if (pose.startedAt !== current.returnedAt) {
        pose.startedAt = current.returnedAt;
        pose.x = group.rotation.x; pose.y = group.rotation.y; pose.z = group.rotation.z;
        pose.px = group.position.x; pose.py = group.position.y; pose.pz = group.position.z;
      }
      const progress = Math.min(1, (now - current.returnedAt) / BLOW.RETURN_DURATION);
      const remaining = 1 - progress * progress * progress * (progress * (progress * 6 - 15) + 10);
      group.rotation.set(pose.x * remaining, pose.y * remaining, pose.z * remaining);
      group.position.set(pose.px * remaining, pose.py * remaining, pose.pz * remaining);
      if (progress === 1) current.finish();
      else invalidate();
      return;
    }
    const progress = Math.min(1, (now - current.enteredAt) / BLOW.ENTER_DURATION);
    const tilt = 1 - Math.pow(1 - progress, 3);
    shake.current += (current.detector.intensity - shake.current) * (1 - Math.exp(-delta * 1000 / BLOW.SHAKE_DECAY));
    const amplitude = reduceMotion.current ? 0 : shake.current * BLOW.SHAKE_ROTATION;
    const t = now / 1000;
    // Incommensurate frequencies modulate each other: turbulent, bounded wind.
    const x = Math.sin(t * 73 + Math.sin(t * 19)) * 0.65 + Math.sin(t * 109) * 0.35;
    const y = Math.sin(t * 83 + Math.sin(t * 23)) * 0.6 + Math.sin(t * 127) * 0.4;
    const z = Math.sin(t * 97 + Math.sin(t * 31));
    group.rotation.set(BLOW.TILT * tilt + amplitude * x, amplitude * y, amplitude * z * 0.65);
    group.position.set(x * amplitude / BLOW.SHAKE_ROTATION * BLOW.SHAKE_POSITION, y * amplitude / BLOW.SHAKE_ROTATION * BLOW.SHAKE_POSITION, 0);
    invalidate();
  });

  return {
    offset,
    pointerDown(event: ThreeEvent<PointerEvent>) {
      if (event.pointerType !== 'touch' || !event.isPrimary || !navigator.mediaDevices?.getUserMedia || !(window.AudioContext || 'webkitAudioContext' in window)) return;
      const current = controller.current;
      if (!current) return;
      current.begin();
      if (current.state !== 'idle') {
        event.stopPropagation();
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }
    },
    consumeClick() {
      const current = controller.current;
      return current?.tap(performance.now()) ?? false;
    },
  };
}
