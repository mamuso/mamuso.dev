'use client'

import { useEffect, useRef } from 'react'
import * as stylex from '@stylexjs/stylex'
import { PAPER_SETTINGS, type PaperSettings } from './paper-settings'

export default function PaperSurface({ settings = PAPER_SETTINGS }: { settings?: PaperSettings }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !('gpu' in navigator)) return
    const controller = new AbortController()
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      void import('./paper-renderer').then(({ mountPaper }) => {
        if (!controller.signal.aborted) return mountPaper(canvas, settings, controller.signal)
      }).catch(() => {})
    }, { rootMargin: '200px' })
    observer.observe(canvas)
    return () => { observer.disconnect(); controller.abort(); delete canvas.dataset.ready }
  }, [settings])
  return <canvas ref={ref} aria-hidden="true" data-paper-surface {...stylex.props(styles.canvas)} />
}

const styles = stylex.create({
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
})
