'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { CARTRIDGE_WIDTH } from './cartridgeConfig'
import { advanceCartridgeSpring } from './cartridgeSpring'
import { CARTRIDGE_SWIPE as SWIPE, CartridgeSwipeGesture } from './cartridgeSwipe'

export function useCartridgeSwipe(
  enabled: boolean,
  onNavigate: ((direction: -1 | 1) => void) | undefined,
  onDragStart: () => void,
) {
  const { gl, invalidate, size } = useThree()
  const offset = useRef<Group>(null)
  const gesture = useRef(new CartridgeSwipeGesture())
  const target = useRef(0)
  const position = useRef(0)
  const velocity = useRef(0)
  const reduced = useRef(false)
  const dragStart = useRef(onDragStart)
  useEffect(() => { dragStart.current = onDragStart }, [onDragStart])

  useEffect(() => {
    if (!enabled || !onNavigate) return
    const coarse = window.matchMedia('(pointer: coarse)')
    if (!coarse.matches) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const current = gesture.current
    const cancel = () => { current.cancel(); target.current = 0; invalidate() }
    const preferences = () => { reduced.current = media.matches; if (!coarse.matches) cancel(); invalidate() }
    const down = (event: PointerEvent) => {
      current.suppressClick = false
      if (event.target !== gl.domElement || current.state !== 'idle') cancel()
    }
    const move = (event: PointerEvent) => {
      if (current.move(event.pointerId, event.clientX, event.clientY)) dragStart.current()
      if (current.state !== 'horizontal') return
      target.current = Math.max(-SWIPE.MAX_OFFSET, Math.min(SWIPE.MAX_OFFSET, current.displacement / size.width * CARTRIDGE_WIDTH))
      invalidate()
    }
    const up = (event: PointerEvent) => {
      if (event.pointerId !== current.pointerId) return
      current.move(event.pointerId, event.clientX, event.clientY)
      const direction = current.release(event.pointerId)
      target.current = 0
      invalidate()
      if (direction) onNavigate(direction)
    }
    const click = (event: MouseEvent) => {
      if (!current.suppressClick) return
      current.suppressClick = false
      event.preventDefault(); event.stopPropagation()
    }
    const hidden = () => { if (document.visibilityState !== 'visible') cancel() }
    preferences()
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move, { capture: true, passive: true })
    window.addEventListener('pointerup', up, true)
    window.addEventListener('pointercancel', cancel, true)
    window.addEventListener('blur', cancel)
    window.addEventListener('scroll', cancel, { capture: true, passive: true })
    document.addEventListener('visibilitychange', hidden)
    gl.domElement.addEventListener('click', click, true)
    coarse.addEventListener('change', preferences)
    media.addEventListener('change', preferences)
    return () => {
      cancel()
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', up, true)
      window.removeEventListener('pointercancel', cancel, true)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('scroll', cancel, true)
      document.removeEventListener('visibilitychange', hidden)
      gl.domElement.removeEventListener('click', click, true)
      coarse.removeEventListener('change', preferences)
      media.removeEventListener('change', preferences)
    }
  }, [enabled, onNavigate, gl, invalidate, size.width, size.height])

  useFrame((_, delta) => {
    const group = offset.current
    if (!group || target.current === 0 && position.current === 0 && velocity.current === 0) return
    if (reduced.current) { position.current = target.current; velocity.current = 0 }
    else {
      let remaining = Math.min(delta, 0.1)
      while (remaining > 0) {
        const dt = Math.min(remaining, SWIPE.STEP)
        advanceCartridgeSpring(position, velocity, target.current, SWIPE.STIFFNESS, SWIPE.DAMPING, dt)
        remaining -= dt
      }
    }
    const moving = Math.abs(position.current - target.current) > SWIPE.REST_DISTANCE || Math.abs(velocity.current) > SWIPE.REST_SPEED
    if (!moving) { position.current = target.current; velocity.current = 0 }
    group.position.x = position.current
    group.rotation.z = reduced.current ? 0 : position.current * SWIPE.ROLL_PER_METER
    if (moving) invalidate()
  })

  return {
    offset,
    pointerDown(event: ThreeEvent<PointerEvent>) {
      if (!enabled || !onNavigate || event.pointerType !== 'touch' || !event.isPrimary || !window.matchMedia('(pointer: coarse)').matches) return
      gesture.current.begin(event.pointerId, event.clientX, event.clientY)
    },
    consumeClick() {
      const current = gesture.current
      const consumed = current.suppressClick
      current.suppressClick = false
      return consumed
    },
  }
}
