'use client'

import React, { useRef, useEffect } from 'react'
import styles from './Canvas.module.scss'

export default function Canvas(props: React.CanvasHTMLAttributes<HTMLCanvasElement>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return // Add null check

    function getCanvasWidth() {
      return parseInt(canvas?.getBoundingClientRect().width?.toString() || '0')
    }

    function getCanvasHeight() {
      return parseInt(canvas?.getBoundingClientRect().height?.toString() || '0')
    }

    let vw = getCanvasWidth()
    let vh = getCanvasHeight()

    let regularSpacing = true
    let branching = false

    window.addEventListener('resize', onResize, false)

    function onResize() {
      regularSpacing = true
      branching = false
      vw = getCanvasWidth()
      vh = getCanvasHeight()
      resizeCanvas()
    }

    function resizeCanvas() {
      if (!canvas) return
      canvas.width = vw
      canvas.height = vh
      drawDots()
    }

    resizeCanvas()

    // Redraw on change color scheme
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      onResize()
    })

    // Function to generate normally distributed random numbers
    function randn_bm() {
      var u = 0,
        v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    }

    function drawDots() {
      var r = 2

      var count = 0
      var switchPoint = Math.random() * (0.85 - 0.55) + 0.55

      for (var x = -8; x < vw + 8; ) {
        var cw = regularSpacing ? 14 : branching ? Math.random() * 15 + 15 : Math.abs(randn_bm()) * 15 + 15
        x += cw

        for (var y = -8; y < vh + 8; ) {
          var ch = regularSpacing ? 14 : branching ? Math.random() * 15 + 24 : Math.abs(randn_bm()) * 15 + 24
          y += ch

          if (context && canvas) {
            console.log(getComputedStyle(canvas).getPropertyValue('--dots'))
            context.fillStyle = getComputedStyle(canvas).getPropertyValue('--dots')
            context.fillRect(x - r / 2, y - r / 2, r, r)
          }
          count++

          // Switch to irregular grid at a random point
          if (regularSpacing && count / ((vw * vh) / (15 * 15)) >= switchPoint) {
            regularSpacing = false
            branching = true
          }

          // Draw branches if in branching mode
          if (branching) {
            for (var i = 0; i < Math.random() * 2 + 1; i++) {
              var bx = x + Math.random() * 32 - 16
              var by = y + Math.random() * 32 - 16
              if (context) {
                context.fillRect(bx - r / 2, by - r / 2, r, r)
              }
            }
          }
        }
      }
    }
  }, [])

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} {...props} />
    </div>
  )
}
