'use client'

import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'

const NAME_PARTS = [
  { prefix: 'ma', extension: 'nuel', extensionWidth: '4.25ch' },
  { prefix: 'mu', extension: 'ñoz', extensionWidth: '3.65ch' },
  { prefix: 'so', extension: 'lera', extensionWidth: '4.15ch' },
] as const

const STAGGER_MS = 48
const DURATION_MS = 320

function extensionDelay(index: number, expanded: boolean) {
  const step = expanded ? index : NAME_PARTS.length - 1 - index
  return `${step * STAGGER_MS}ms`
}

function gapDelay(index: number, expanded: boolean) {
  if (index === 0) return '0ms'
  const step = expanded ? index : NAME_PARTS.length - index
  return expanded ? `${step * STAGGER_MS + 36}ms` : `${step * 20}ms`
}

export default function AnimatedName() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <button
      type="button"
      aria-label={isExpanded ? 'show mamuso' : 'show manuel muñoz solera'}
      aria-pressed={isExpanded}
      onClick={() => setIsExpanded((expanded) => !expanded)}
      {...stylex.props(styles.trigger)}
    >
      {NAME_PARTS.map((part, index) => (
        <span
          key={part.prefix}
          aria-hidden="true"
          {...stylex.props(styles.word, index > 0 && styles.spacedWord)}
          style={{
            marginInlineStart: index > 0 ? (isExpanded ? '0.28em' : 0) : undefined,
            transitionDelay: gapDelay(index, isExpanded),
          }}
        >
          <span>{part.prefix}</span>
          <span
            {...stylex.props(styles.extension)}
            style={{
              maxWidth: isExpanded ? part.extensionWidth : 0,
              transitionDelay: extensionDelay(index, isExpanded),
            }}
          >
            {part.extension}
          </span>
        </span>
      ))}
      <span aria-hidden="true" {...stylex.props(styles.handDrawnUnderline)} />
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
    display: 'inline-flex',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    letterSpacing: '-0.01em',
    lineHeight: 'inherit',
    margin: 0,
    padding: 0,
    pointerEvents: 'auto',
    position: 'relative',
    textAlign: 'start',
    userSelect: 'text',
  },
  handDrawnUnderline: {
    backgroundColor: '#fff',
    bottom: -3,
    height: 6,
    insetInline: -2,
    maskImage: 'url(/images/hand-drawn-underline.svg)',
    maskRepeat: 'repeat-x',
    maskSize: '100px 100%',
    pointerEvents: 'none',
    position: 'absolute',
  },
  word: {
    display: 'inline-flex',
    whiteSpace: 'nowrap',
  },
  spacedWord: {
    transitionDuration: {
      default: `${DURATION_MS}ms`,
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'margin-inline-start',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  extension: {
    display: 'inline-block',
    maxWidth: 0,
    overflow: 'hidden',
    transitionDuration: {
      default: `${DURATION_MS}ms`,
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'max-width',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    verticalAlign: 'baseline',
  },
})
