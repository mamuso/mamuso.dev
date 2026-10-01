import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import AnimatedName from '@/app/components/AnimatedName'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'
import RandomFact from '@/app/components/RandomFact'
import { reveal } from '@/app/styles/introReveal'

const INTRO_DETAILS = ', a designer from Villena, Alicante, based in beautiful California, building fun things at SpaceXAI.'

// Word-by-word sweep with the original envelope: first word at 250ms, last
// word underway by 640ms, everything settled around 1.34s.
const REVEAL_START_MS = 250
const REVEAL_LAST_MS = 640

export default function HomeContent({ randomFacts }: { randomFacts: string[] }) {
  const detailWords = INTRO_DETAILS.split(' ')
  // The fact is picked in the browser, so pace the sweep for the longest one.
  const factUnits = Math.max(0, ...randomFacts.map(fact => `A random thing about me: ${fact}`.split(' ').length))
  const totalUnits = 2 + detailWords.length + factUnits
  const stepMs = (REVEAL_LAST_MS - REVEAL_START_MS) / Math.max(totalUnits - 1, 1)
  const delayAt = (unit: number) => `${Math.round(REVEAL_START_MS + unit * stepMs)}ms`

  return (
    <section {...stylex.props(layout.fullBleed, styles.hero)}>
      <div {...stylex.props(layout.container, styles.inner)}>
        <div {...stylex.props(styles.intro)}>
          <h2 {...stylex.props(typography.heading, typography.display, styles.introCopy)}>
            <span {...stylex.props(typography.muted, styles.tagline, reveal.word, reveal.delay(delayAt(0)))}>
              I&apos;m{' '}
            </span>
            <span {...stylex.props(reveal.word, reveal.delay(delayAt(1)))}>
              <AnimatedName />
            </span>
            {detailWords.map((word, index) => (
              <span
                key={index}
                {...stylex.props(typography.muted, styles.tagline, reveal.word, reveal.delay(delayAt(2 + index)))}
              >
                {index === 0 ? word : ` ${word}`}
              </span>
            ))}
          </h2>
          <RandomFact
            facts={randomFacts}
            startMs={REVEAL_START_MS + (2 + detailWords.length) * stepMs}
            stepMs={stepMs}
          />
        </div>
      </div>
      <div {...stylex.props(styles.stage)}>
        <CartridgeStage />
      </div>
    </section>
  )
}

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
})
