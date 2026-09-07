'use client'

import { useEffect, useRef, type ComponentPropsWithoutRef, type PointerEvent } from 'react'

const MAX_SHIFT = 4
const MAX_ROTATION = 0.6
const HOVER_DISTANCE = 60
const MAX_DRAG = 18
const clamp = (value: number, limit = 1) => Math.max(-limit, Math.min(limit, value))
type Position = { x: number; y: number; angle: number }
type Gesture = { x: number; y: number; down: boolean; moved: boolean; origin: Position }

function printAt(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>('[data-photo-print]') : null
}

// Runs once per stack; pointer movement only changes the shared offset afterwards.
function scatter(node: HTMLElement) {
  node.querySelectorAll<HTMLElement>('[data-photo-print]').forEach((print, index) => {
    if (index === 0) return
    const x = (Math.random() - 0.5) * 36
    const y = (Math.random() - 0.5) * 28
    const angle = (Math.random() - 0.5) * 14
    print.style.setProperty('--print-open', `translate(${x}px, ${y}px) rotate(${angle}deg)`)
  })
  node.dataset.opened = ''
}

export default function PhotoStackMotion(props: ComponentPropsWithoutRef<'span'>) {
  const element = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const gesture = useRef<Gesture | null>(null)
  const resting = useRef<Position>({ x: 0, y: 0, angle: 0 })
  const pending = useRef<Position>({ x: 0, y: 0, angle: 0 })
  const suppressClick = useRef(false)
  const scattered = useRef(false)

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function paint(position: Position) {
    const previous = pending.current
    if (previous.x === position.x && previous.y === position.y && previous.angle === position.angle) return
    pending.current = position
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      const node = element.current
      const { x, y, angle } = pending.current
      if (node) {
        node.style.setProperty('--print-drift-x', `${x}px`)
        node.style.setProperty('--print-drift-y', `${y}px`)
        node.style.setProperty('--print-drift-angle', `${angle}deg`)
      }
      frame.current = 0
    })
  }

  function reset() {
    gesture.current = null
    if (element.current) {
      delete element.current.dataset.tracking
      delete element.current.dataset.dragging
    }
    paint(resting.current)
  }

  function finishHover() {
    if (gesture.current && !gesture.current.down) {
      resting.current = pending.current
      reset()
    }
  }

  function begin(event: PointerEvent<HTMLSpanElement>, down: boolean) {
    const print = printAt(event.target)
    if (!print || !event.isPrimary || (down && event.button !== 0) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (gesture.current && !gesture.current.down) resting.current = pending.current
    suppressClick.current = false
    gesture.current = {
      x: event.clientX, y: event.clientY, down, moved: false,
      origin: resting.current,
    }
    event.currentTarget.dataset.tracking = ''
  }

  function move(event: PointerEvent<HTMLSpanElement>) {
    if (!event.isPrimary) return
    // Clicks, pointer capture and the viewer can end a gesture without another
    // pointerover event. Resume from actual movement over a print in that case.
    if (!gesture.current) {
      if (event.pointerType !== 'touch' && printAt(event.target)) begin(event, false)
      return
    }
    const current = gesture.current
    if (!current.down && !printAt(event.target)) {
      finishHover()
      return
    }
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if ((dx !== 0 || dy !== 0) && !scattered.current) {
      scatter(event.currentTarget)
      scattered.current = true
    }
    if (current.down) {
      if (!current.moved) {
        if (dx * dx + dy * dy <= 36) return
        current.moved = true
        // Capture once, after the threshold, so taps still activate the link.
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.dataset.dragging = ''
      }
      paint({
        x: clamp(current.origin.x + dx * 0.3, MAX_DRAG),
        y: clamp(current.origin.y + dy * 0.3, MAX_DRAG),
        angle: clamp(current.origin.angle + dx * 0.025, 2),
      })
    } else {
      const x = clamp(dx / HOVER_DISTANCE)
      const y = clamp(dy / HOVER_DISTANCE)
      paint({
        x: clamp(current.origin.x + x * MAX_SHIFT, MAX_DRAG),
        y: clamp(current.origin.y + y * MAX_SHIFT, MAX_DRAG),
        angle: clamp(current.origin.angle + x * MAX_ROTATION, 2),
      })
    }
  }

  return <span {...props} ref={element}
    onPointerOver={(event) => {
      if (event.pointerType !== 'touch' && !gesture.current && printAt(event.target)) begin(event, false)
    }}
    onPointerOut={(event) => {
      const next = printAt(event.relatedTarget)
      if (!next || !event.currentTarget.contains(next)) finishHover()
    }}
    onPointerDown={(event) => begin(event, true)}
    onPointerMove={move}
    onPointerLeave={finishHover}
    onPointerCancel={reset}
    onLostPointerCapture={reset}
    onPointerUp={() => {
      suppressClick.current = Boolean(gesture.current?.moved)
      if (gesture.current?.moved) resting.current = pending.current
      reset()
    }}
    onDragStart={(event) => event.preventDefault()}
    onClickCapture={(event) => {
      if (suppressClick.current && event.detail !== 0) {
        event.preventDefault()
        event.stopPropagation()
      }
      suppressClick.current = false
      reset()
    }}
  />
}
