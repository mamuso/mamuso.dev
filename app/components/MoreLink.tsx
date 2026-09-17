'use client'

import { useState } from 'react'
import { homeLink } from '../styles/homeLink.stylex'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { homeLinks } from '../styles/homeLinks'

export default function MoreLink({ href, label }: { href: string, label: string }) {
  const [extraOs, setExtraOs] = useState([0, 0, 0, 0, 0])
  const chooseVariation = (link: HTMLAnchorElement) => {
    const counts = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6))
    const context = document.createElement('canvas').getContext('2d')
    if (context) {
      const style = getComputedStyle(link)
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const available = link.parentElement?.clientWidth ?? window.innerWidth
      const spacing = parseFloat(style.letterSpacing) || 0
      const width = () => {
        const text = counts.map(count => `M${'o'.repeat(count + 1)}re`).join(' ') + ' ›'
        return context.measureText(text).width + text.length * spacing
      }
      // Keep all five words; trim only extra letters when the column is narrow.
      while (width() > available - 4 && counts.some(count => count > 0)) {
        const longest = counts.indexOf(Math.max(...counts))
        counts[longest] -= 1
      }
    }
    setExtraOs(counts)
  }

  return (
    <Link
      href={href}
      aria-label={label}
      onMouseEnter={event => chooseVariation(event.currentTarget)}
      onFocus={event => {
        if (!event.currentTarget.matches(':hover')) chooseVariation(event.currentTarget)
      }}
      {...stylex.props(homeLink, styles.link)}
    >
      <span aria-hidden="true" {...stylex.props(homeLinks.secondary, styles.words)}>
        Mo<span {...stylex.props(styles.word)}>{'o'.repeat(extraOs[0])}</span>re
        {extraOs.slice(1).map((count, index) => (
          <span key={index} {...stylex.props(styles.word, styles.delay(index))}>
            {'\u00a0'}M{'o'.repeat(count + 1)}re
          </span>
        ))}
        <span {...stylex.props(styles.word, styles.delay(4))}>{'\u00a0›'}</span>
      </span>
    </Link>
  )
}

const styles = stylex.create({
  link: {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    paddingBlock: 4,
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
    color: 'rgba(23, 24, 27, 0.6)',
  },
  words: {
    display: 'inline-flex',
    whiteSpace: 'nowrap',
  },
  word: {
    display: 'inline-block',
    overflow: 'hidden',
    maxWidth: {
      default: 0,
      [stylex.when.ancestor(':hover', homeLink)]: '6em',
      [stylex.when.ancestor(':focus-visible', homeLink)]: '6em',
    },
    opacity: {
      default: 0,
      [stylex.when.ancestor(':hover', homeLink)]: 1,
      [stylex.when.ancestor(':focus-visible', homeLink)]: 1,
    },
    transitionProperty: 'max-width, opacity',
    transitionDuration: { default: '60ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'ease',
  },
  delay: (index: number) => ({
    transitionDelay: {
      default: `${(4 - index) * 30}ms`,
      [stylex.when.ancestor(':hover', homeLink)]: `${index * 30}ms`,
      [stylex.when.ancestor(':focus-visible', homeLink)]: `${index * 30}ms`,
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
  }),
})
