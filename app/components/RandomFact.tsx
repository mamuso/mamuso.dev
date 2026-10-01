'use client'

import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import * as stylex from '@stylexjs/stylex'
import PinkSky from '@/app/components/PinkSky'
import { resetPinkSky, revealPink } from '@/app/components/pinkReveal'
import { typography } from '@/app/styles/site'
import { reveal } from '@/app/styles/introReveal'
import { colors } from '@/app/styles/tokens.stylex'

const HOT_PINK = '#fe019a'
const PINK_WORD = /^(pink)(\W*)$/i

// The homepage HTML is cached, so the fact is picked in the browser. One pick
// per page load keeps it stable across re-renders and client navigations.
let picked: number | undefined
const subscribe = () => () => {}

export default function RandomFact({ facts, startMs, stepMs }: {
  facts: string[]
  startMs: number
  stepMs: number
}) {
  const index = useSyncExternalStore(
    subscribe,
    () => (picked ??= Math.floor(Math.random() * facts.length)),
    () => null,
  )
  const fact = index === null ? undefined : facts[index]
  const words = fact ? `A random thing about me: ${fact}`.split(' ') : []
  // Each click on "pink" turns it up a notch; the third takes the whole page.
  const [heat, setHeat] = useState(0)

  // Applied during the click's commit, so the view transition snapshots it.
  useLayoutEffect(() => {
    if (heat < 3) return
    const root = document.documentElement
    const themeClasses = stylex.props(pinkPage).className?.split(' ') ?? []
    root.classList.add(...themeClasses)
    root.style.setProperty('--app-background', HOT_PINK)
    root.dataset.pink = ''
    return () => {
      root.classList.remove(...themeClasses)
      root.style.removeProperty('--app-background')
      delete root.dataset.pink
    }
  }, [heat])

  // Leaving the homepage resets the joke, even if the route is kept warm.
  useEffect(() => () => {
    setHeat(0)
    resetPinkSky()
  }, [])

  const turnUp = (event: MouseEvent<HTMLButtonElement>) => {
    if (heat >= 3) return
    if (heat < 2) return setHeat(heat + 1)
    const rect = event.currentTarget.getBoundingClientRect()
    revealPink(
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      () => flushSync(() => setHeat(3)),
    )
  }

  if (facts.length === 0) return null

  return (
    <p {...stylex.props(typography.muted, typography.display, styles.copy)}>
      {words.length ? words.map((word, i) => {
        const pink = word.match(PINK_WORD)
        return (
          <span key={i} {...stylex.props(reveal.word, reveal.delay(`${Math.round(startMs + i * stepMs)}ms`))}>
            {i === 0 ? '' : ' '}
            {pink ? (
              <>
                <button
                  type="button"
                  onClick={turnUp}
                  {...stylex.props(styles.pink, heat > 0 && styles.hot, heat > 1 && styles.glow, heat > 2 && styles.onPink)}
                >
                  {pink[1]}
                </button>
                {pink[2]}
              </>
            ) : word}
          </span>
        )
      // Hold one line until the fact is picked, so the copy below doesn't jump.
      }) : ' '}
      {heat >= 2 && <PinkSky />}
      {heat >= 2 && (
        <svg aria-hidden="true" width="0" height="0" {...stylex.props(styles.filters)}>
          {/* Gradient map for imagery on the pink page (cartridges, photos,
              album art): shadows to plum, mid-tones to pink, and light details
              back up to blush and white. */}
          <filter id="pink-gradient-map" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.14 0.62 1 1 1" />
              <feFuncG type="table" tableValues="0 0 0.42 0.84 1" />
              <feFuncB type="table" tableValues="0.08 0.36 0.72 0.92 1" />
            </feComponentTransfer>
          </filter>
        </svg>
      )}
    </p>
  )
}

const pinkPage = stylex.createTheme(colors, {
  textPrimary: '#ffffff',
  textMuted: '#ffffff',
  textFaint: 'rgba(255, 255, 255, 0.7)',
  textSubtle: 'rgba(255, 255, 255, 0.85)',
  rule: '#ffffff',
  ruleSoft: 'rgba(255, 255, 255, 0.6)',
  quote: 'rgba(255, 255, 255, 0.8)',
})

const styles = stylex.create({
  filters: {
    position: 'absolute',
  },
  pink: {
    appearance: 'none',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: 'inherit',
    cursor: 'inherit',
    font: 'inherit',
    letterSpacing: 'inherit',
    padding: 0,
    // Same layer count as the glow, so it blooms in rather than snapping.
    textShadow: '0 0 4px rgba(254, 1, 154, 0), 0 0 14px rgba(254, 1, 154, 0)',
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
    transitionDuration: { default: '900ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionProperty: 'color, text-shadow',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  hot: {
    color: HOT_PINK,
  },
  glow: {
    textShadow: '0 0 4px rgba(254, 1, 154, 0.45), 0 0 14px rgba(254, 1, 154, 0.25)',
  },
  onPink: {
    color: '#ffffff',
    textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 18px rgba(255, 255, 255, 0.6)',
  },
  copy: {
    fontWeight: 400,
    marginBlockStart: 24,
    pointerEvents: 'auto',
    userSelect: 'text',
  },
})
