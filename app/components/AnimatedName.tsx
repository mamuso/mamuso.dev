'use client'

import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'

const NAME_PARTS = [
  { prefix: 'ma', extension: 'nuel' },
  { prefix: 'mu', extension: 'ñoz' },
  { prefix: 'so', extension: 'lera' },
]

export default function AnimatedName() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <button
      type="button"
      aria-label={isExpanded ? 'show mamuso' : 'show manuel muñoz solera'}
      aria-pressed={isExpanded}
      onClick={() => setIsExpanded((expanded) => !expanded)}
      {...stylex.props(styles.trigger, isExpanded && styles.expandedTrigger)}
    >
      {NAME_PARTS.map((part) => (
        <span
          key={part.prefix}
          aria-hidden="true"
          {...stylex.props(styles.word, isExpanded && styles.expandedWord)}
        >
          <span>{part.prefix}</span>
          <span
            {...stylex.props(styles.extensionSlot, isExpanded && styles.visibleExtension)}
          >
            <span {...stylex.props(styles.extensionMeasure)}>{part.extension}</span>
            <span {...stylex.props(styles.extension)}>
              {part.extension}
            </span>
          </span>
        </span>
      ))}
    </button>
  )
}

const styles = stylex.create({
  trigger: {
    appearance: 'none',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: 'inherit',
    columnGap: 0,
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: 'inherit',
    fontSize: 24,
    fontWeight: 'inherit',
    letterSpacing: '-0.01em',
    lineHeight: 'inherit',
    margin: 0,
    padding: 0,
    pointerEvents: 'auto',
    textAlign: 'start',
    transitionDuration: {
      default: '220ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'column-gap',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  expandedTrigger: {
    columnGap: '0.28em',
  },
  word: {
    display: 'inline-grid',
    gridTemplateColumns: 'auto 0fr',
    transitionDuration: {
      default: '220ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'grid-template-columns',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    whiteSpace: 'nowrap',
  },
  expandedWord: {
    gridTemplateColumns: 'auto 1fr',
  },
  extensionSlot: {
    maskImage: 'linear-gradient(black, black), linear-gradient(to right, black, transparent)',
    maskPosition: 'left top, right top',
    maskRepeat: 'no-repeat',
    maskSize: '45% 100%, 55% 100%',
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    transitionDuration: {
      default: '220ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'mask-size',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  visibleExtension: {
    maskSize: '100% 100%, 0% 100%',
  },
  extensionMeasure: {
    visibility: 'hidden',
  },
  extension: {
    insetInlineStart: 0,
    position: 'absolute',
    top: 0,
  },
})
