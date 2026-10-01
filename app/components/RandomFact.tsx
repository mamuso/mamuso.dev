'use client'

import { useSyncExternalStore } from 'react'
import * as stylex from '@stylexjs/stylex'
import { typography } from '@/app/styles/site'
import { reveal } from '@/app/styles/introReveal'

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

  if (facts.length === 0) return null

  return (
    <p {...stylex.props(typography.muted, typography.display, styles.copy)}>
      {words.length ? words.map((word, i) => (
        <span key={i} {...stylex.props(reveal.word, reveal.delay(`${Math.round(startMs + i * stepMs)}ms`))}>
          {i === 0 ? word : ` ${word}`}
        </span>
      // Hold one line until the fact is picked, so the copy below doesn't jump.
      )) : ' '}
    </p>
  )
}

const styles = stylex.create({
  copy: {
    fontWeight: 400,
    marginBlockStart: 24,
    pointerEvents: 'auto',
    userSelect: 'text',
  },
})
