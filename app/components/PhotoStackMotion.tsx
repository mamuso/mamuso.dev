'use client'

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type PointerEvent } from 'react'
import { alternatePhotoOffset, createPhotoInteraction, photoMotion, type Position } from './photoInteraction'

function printAt(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>('[data-photo-print]') : null
}

function scatter(node: HTMLElement) {
  node.querySelectorAll<HTMLElement>('[data-photo-print]').forEach((print, index) => {
    if (index === 0) return
    const x = alternatePhotoOffset(index, (Math.random() - 0.5) * photoMotion.scatter.x)
    const y = (Math.random() - 0.5) * photoMotion.scatter.y
    const angle = alternatePhotoOffset(index, (Math.random() - 0.5) * photoMotion.scatter.angle)
    print.style.setProperty('--print-open', `translate(${x}px, ${y}px) rotate(${angle}deg)`)
  })
  node.dataset.opened = ''
}

export default function PhotoStackMotion(props: ComponentPropsWithoutRef<'span'>) {
  // A stable controller; pointer movement never triggers a React render.
  const [interaction] = useState(createPhotoInteraction)
  const element = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const pending = useRef<Position>({ x: 0, y: 0, angle: 0 })
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function paint() {
    const position = interaction.position
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

  function finish(reason: 'leave' | 'release' | 'cancel') {
    interaction.finish(reason)
    if (interaction.phase === 'idle' && element.current) {
      delete element.current.dataset.tracking
      delete element.current.dataset.dragging
    }
    paint()
  }

  function begin(event: PointerEvent<HTMLSpanElement>, mode: 'hover' | 'pressed') {
    if (!printAt(event.target) || !event.isPrimary || (mode === 'pressed' && event.button !== 0) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    interaction.begin(mode, event.clientX, event.clientY)
    event.currentTarget.dataset.tracking = ''
  }

  function move(event: PointerEvent<HTMLSpanElement>) {
    if (!event.isPrimary) return
    // Resume after a click or viewer close even when pointerover hasn't fired.
    if (interaction.phase === 'idle') {
      if (event.pointerType !== 'touch') begin(event, 'hover')
      return
    }
    if (interaction.phase === 'hover' && !printAt(event.target)) {
      finish('leave')
      return
    }
    const result = interaction.move(event.clientX, event.clientY)
    if (result.scatter) scatter(event.currentTarget)
    if (result.capture) {
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = ''
    }
    paint()
  }

  return <span {...props} ref={element}
    onPointerOver={(event) => {
      if (event.pointerType !== 'touch' && interaction.phase === 'idle') begin(event, 'hover')
    }}
    onPointerOut={(event) => {
      const next = printAt(event.relatedTarget)
      if (!next || !event.currentTarget.contains(next)) finish('leave')
    }}
    onPointerDown={(event) => begin(event, 'pressed')}
    onPointerMove={move}
    onPointerLeave={() => finish('leave')}
    onPointerCancel={() => finish('cancel')}
    onLostPointerCapture={() => finish('cancel')}
    onPointerUp={() => finish('release')}
    onDragStart={(event) => event.preventDefault()}
    onClickCapture={(event) => {
      if (interaction.consumeClick(event.detail)) {
        event.preventDefault()
        event.stopPropagation()
      }
      finish('leave')
    }}
  />
}
