'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as stylex from '@stylexjs/stylex'

export default function PlacePhoto({ label, image }: {
  label: string
  image: string
}) {
  const [visible, setVisible] = useState(false)
  const [angle, setAngle] = useState(0)
  const show = () => {
    if (visible) return
    setAngle(Math.random() * 6 - 3)
    setVisible(true)
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={visible}
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
      onFocus={show}
      onBlur={() => setVisible(false)}
      onClick={show}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          setVisible(false)
        }
      }}
      {...stylex.props(styles.trigger)}
    >
      {label}
      <span aria-hidden="true" {...stylex.props(styles.photo, styles.angle(visible ? angle : angle + 6), visible && styles.visible)}>
        <Image src={image} alt="" width={56} height={56} sizes="56px" loading="eager" {...stylex.props(styles.image)} />
      </span>
    </button>
  )
}

const styles = stylex.create({
  trigger: {
    appearance: 'none',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: 'inherit',
    cursor: 'pointer',
    display: 'inline',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    letterSpacing: 'inherit',
    lineHeight: 'inherit',
    margin: 0,
    padding: 0,
    position: 'relative',
    userSelect: 'text',
    whiteSpace: 'nowrap',
    outlineOffset: 3,
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
  },
  photo: {
    backgroundColor: '#fffdf8',
    borderRadius: 1,
    top: '50%',
    // Faint layers with negative spread keep the shadow close to the paper.
    boxShadow: '0 1px 1px -0.5px rgb(0 0 0 / 0.06), 0 3px 3px -1.5px rgb(0 0 0 / 0.06), 0 6px 6px -3px rgb(0 0 0 / 0.06), 0 12px 12px -6px rgb(0 0 0 / 0.06), 0 24px 24px -12px rgb(0 0 0 / 0.06)',
    boxSizing: 'border-box',
    display: 'block',
    left: 'calc(100% + 10px)',
    opacity: 0,
    padding: '4px 4px 12px',
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translate(-6px, -50%) scale(0.92)',
    transformOrigin: 'left center',
    transitionDuration: { default: '180ms, 240ms, 240ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionProperty: 'opacity, transform, rotate',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    width: 64,
    zIndex: 3,
  },
  angle: (degrees: number) => ({ rotate: `${degrees}deg` }),
  visible: {
    transitionDuration: { default: '180ms, 360ms, 360ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    opacity: 1,
    transform: 'translate(0, -50%) scale(1)',
  },
  image: {
    display: 'block',
    height: 56,
    objectFit: 'cover',
    width: 56,
  },
})
