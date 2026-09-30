import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import AnimatedName from '@/app/components/AnimatedName'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'

const INTRO_DETAILS = ', a designer from Villena, Alicante, based in beautiful California, building fun things at SpaceXAI.'

// Word-by-word sweep with the original envelope: first word at 250ms, last
// word underway by 640ms, everything settled around 1.34s.
const REVEAL_START_MS = 250
const REVEAL_LAST_MS = 640

export default function HomeContent({ randomFact }: { randomFact: string | null }) {
  const detailWords = INTRO_DETAILS.split(' ')
  const factWords = randomFact ? `A random thing about me: ${randomFact}`.split(' ') : []
  const totalUnits = 2 + detailWords.length + factWords.length
  const stepMs = (REVEAL_LAST_MS - REVEAL_START_MS) / Math.max(totalUnits - 1, 1)
  const delayAt = (unit: number) => `${Math.round(REVEAL_START_MS + unit * stepMs)}ms`

  return (
    <section {...stylex.props(layout.fullBleed, styles.hero)}>
      <div {...stylex.props(layout.container, styles.inner)}>
        <div {...stylex.props(styles.intro)}>
          <h2 {...stylex.props(typography.heading, typography.display, styles.introCopy)}>
            <span {...stylex.props(typography.muted, styles.tagline, styles.reveal, styles.revealDelay(delayAt(0)))}>
              I&apos;m{' '}
            </span>
            <span {...stylex.props(styles.reveal, styles.revealDelay(delayAt(1)))}>
              <AnimatedName />
            </span>
            {detailWords.map((word, index) => (
              <span
                key={index}
                {...stylex.props(typography.muted, styles.tagline, styles.reveal, styles.revealDelay(delayAt(2 + index)))}
              >
                {index === 0 ? word : ` ${word}`}
              </span>
            ))}
          </h2>
          {randomFact ? (
            <p {...stylex.props(typography.muted, typography.display, styles.introCopy, styles.tagline, styles.factCopy)}>
              {factWords.map((word, index) => (
                <span
                  key={index}
                  {...stylex.props(styles.reveal, styles.revealDelay(delayAt(2 + detailWords.length + index)))}
                >
                  {index === 0 ? word : ` ${word}`}
                </span>
              ))}
            </p>
          ) : null}
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
      '@media (min-width: 880px)': 0,
    },
    flex: '0 0 auto',
    minHeight: {
      default: 0,
      // Canvas height minus the home header and the layout's row gap.
      '@media (min-width: 880px)': 'calc(640px - 192px - 32px)',
    },
  },
  inner: {
    minHeight: {
      default: 0,
      '@media (min-width: 880px)': '100%',
    },
  },
  stage: {
    // Keep a little space between the introduction and mobile canvas.
    marginBlockStart: {
      default: 16,
      '@media (min-width: 880px)': 0,
    },
    zIndex: {
      default: 0,
      '@media (min-width: 880px)': 'auto',
    },
    // Mobile reserves its own canvas below the copy. Desktop keeps the
    // existing page-anchored canvas beside the introduction.
    position: {
      default: 'relative',
      '@media (min-width: 880px)': 'static',
    },
    height: {
      default: 360,
      '@media (min-width: 880px)': 0,
    },
  },
  intro: {
    insetBlockStart: {
      default: 0,
      '@media (min-width: 880px)': -56,
    },
    marginBlockStart: {
      default: 0,
      '@media (min-width: 880px)': 24,
    },
    maxWidth: {
      default: '100%',
      '@media (min-width: 880px)': 320,
      '@media (min-width: 1024px)': 380,
    },
    pointerEvents: 'none',
    position: 'relative',
    // Keep text interactions above the page-wide desktop canvas.
    zIndex: 2,
  },
  introCopy: {
    pointerEvents: 'auto',
    userSelect: 'text',
  },
  tagline: {
    fontWeight: 400,
  },
  factCopy: {
    marginBlockStart: 24,
  },
  reveal: {
    animationDuration: {
      default: '700ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    animationFillMode: 'backwards',
    animationName: {
      default: introReveal,
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
    // A gentle curve, not the site's expo-out: the blur reveal needs its
    // motion spread across the whole duration to survive load-time frame drops.
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  revealDelay: (delay: string) => ({ animationDelay: delay }),
})
