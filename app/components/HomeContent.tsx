'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import AnimatedName from '@/app/components/AnimatedName'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'

export default function HomeContent() {
  const [cartridgeOpen, setCartridgeOpen] = useState(false)

  return (
    <section {...stylex.props(layout.fullBleed, styles.hero)}>
      <CartridgeStage onOpenChange={setCartridgeOpen} />
      <div {...stylex.props(layout.container, styles.inner)}>
        <div {...stylex.props(styles.stageSpacer)} aria-hidden="true" />
        <div {...stylex.props(styles.intro, cartridgeOpen && styles.introOpen)}>
          <h2 {...stylex.props(typography.heading, styles.introCopy)}>
            <span {...stylex.props(typography.muted, styles.tagline, styles.reveal, styles.revealLead)}>
              I&apos;m{' '}
            </span>
            <span {...stylex.props(styles.reveal, styles.revealName)}>
              <AnimatedName />
            </span>
            <span {...stylex.props(typography.muted, styles.tagline, styles.reveal, styles.revealDetails)}>
              , a designer, based in Oakland,{' '}
            </span>
            <span {...stylex.props(typography.muted, styles.tagline, styles.reveal, styles.revealClosing)}>
              having a lot of fun building at SpaceXAI.
            </span>
          </h2>
          <Link href="/photos" {...stylex.props(typography.link, styles.photosLink)}>
            Photos →
          </Link>
        </div>
      </div>
    </section>
  )
}

const introReveal = stylex.keyframes({
  from: {
    filter: 'blur(1.5px)',
    opacity: 0,
  },
  to: {
    filter: 'blur(0)',
    opacity: 1,
  },
})

const styles = stylex.create({
  hero: {
    flex: {
      default: '1',
      '@media (min-width: 720px)': '0 0 auto',
    },
    minHeight: {
      default: 560,
      // Canvas height minus the home header and the layout's row gap.
      '@media (min-width: 720px)': 'calc(680px - 192px - 32px)',
    },
  },
  inner: {
    minHeight: '100%',
  },
  stageSpacer: {
    height: {
      default: 380,
      '@media (min-width: 720px)': 0,
    },
  },
  intro: {
    insetBlockStart: -40,
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
    letterSpacing: '-0.015em',
    lineHeight: 1.2,
    marginBlock: 0,
  },
  tagline: {
    fontWeight: 400,
  },
  photosLink: {
    display: 'inline-block',
    marginBlockStart: 24,
    pointerEvents: 'auto',
  },
  reveal: {
    animationDuration: {
      default: '900ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    animationFillMode: 'backwards',
    animationName: {
      default: introReveal,
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  revealLead: {
    animationDelay: '250ms',
  },
  revealName: {
    animationDelay: '315ms',
  },
  revealDetails: {
    animationDelay: '380ms',
  },
  revealClosing: {
    animationDelay: '445ms',
  },
})
