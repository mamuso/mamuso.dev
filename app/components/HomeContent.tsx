'use client'

import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import AnimatedName from '@/app/components/AnimatedName'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'

export default function HomeContent() {
  return (
    <section {...stylex.props(layout.fullBleed, styles.hero)}>
      <div {...stylex.props(layout.container, styles.inner)}>
        <div {...stylex.props(styles.intro)}>
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
            temp link to photos
          </Link>
        </div>
      </div>
      <div {...stylex.props(styles.stage)}>
        <CartridgeStage />
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
    marginBlockStart: {
      default: -32,
      '@media (min-width: 1024px)': 0,
    },
    flex: {
      default: '1',
      '@media (min-width: 1024px)': '0 0 auto',
    },
    minHeight: {
      default: 0,
      // Canvas height minus the home header and the layout's row gap.
      '@media (min-width: 1024px)': 'calc(680px - 192px - 32px)',
    },
  },
  inner: {
    minHeight: {
      default: 0,
      '@media (min-width: 1024px)': '100%',
    },
  },
  stage: {
    // Pull the canvas's empty top band closer without changing its camera.
    marginBlockStart: {
      default: -24,
      '@media (min-width: 1024px)': 0,
    },
    zIndex: {
      default: 0,
      '@media (min-width: 1024px)': 'auto',
    },
    // Mobile reserves its own canvas below the copy. Desktop keeps the
    // existing page-anchored canvas beside the introduction.
    position: {
      default: 'relative',
      '@media (min-width: 1024px)': 'static',
    },
    height: {
      default: 'clamp(360px, calc(222.222222vw - 1595.555556px), 680px)',
      '@media (min-width: 1024px)': 0,
    },
  },
  intro: {
    insetBlockStart: {
      default: 0,
      '@media (min-width: 1024px)': -40,
    },
    marginBlockStart: {
      default: 0,
      '@media (min-width: 1024px)': 24,
    },
    maxWidth: {
      default: '100%',
      '@media (min-width: 1024px)': 340,
    },
    pointerEvents: 'none',
    position: 'relative',
    // Keep text interactions above the page-wide desktop canvas.
    zIndex: 2,
  },
  introCopy: {
    fontSize: 24,
    letterSpacing: '-0.015em',
    lineHeight: 1.2,
    marginBlock: 0,
    pointerEvents: 'auto',
    userSelect: 'text',
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
