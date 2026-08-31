'use client'

import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { typography } from '@/app/styles/site'
import AnimatedName from '@/app/components/AnimatedName'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'

export default function HomeContent() {
  const [cartridgeOpen, setCartridgeOpen] = useState(false)

  return (
    <div {...stylex.props(styles.content)}>
      <CartridgeStage onOpenChange={setCartridgeOpen} />
      <div {...stylex.props(styles.stageSpacer)} aria-hidden="true" />
      <section
        {...stylex.props(styles.intro, cartridgeOpen && styles.introOpen)}
      >
        <h2 {...stylex.props(typography.heading, styles.introCopy)}>
          <span {...stylex.props(typography.muted, styles.tagline)}>I'm </span>
          <AnimatedName />
          <span {...stylex.props(typography.muted, styles.tagline)}>
            , a designer, based in Oakland, having a lot of fun building at SpaceXAI.
          </span>
        </h2>
      </section>
    </div>
  )
}

const styles = stylex.create({
  content: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  stageSpacer: {
    height: {
      default: 380,
      '@media (min-width: 720px)': 0,
    },
  },
  intro: {
    marginBlockStart: {
      default: 48,
      '@media (min-width: 720px)': 24,
    },
    maxWidth: {
      default: '100%',
      '@media (min-width: 720px)': 340,
    },
    pointerEvents: 'none',
    position: 'relative',
    zIndex: 1,
    transitionDuration: {
      default: '250ms',
      '@media (min-width: 720px)': '0ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'margin-block-start',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  introOpen: {
    marginBlockStart: {
      default: 192,
      '@media (min-width: 720px)': 24,
    },
  },
  introCopy: {
    fontSize: 24,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    marginBlock: 0,
  },
  tagline: {
    fontWeight: 400,
  },
})
