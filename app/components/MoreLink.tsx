import { homeLink } from '../styles/homeLink.stylex'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { homeLinks } from '../styles/homeLinks'

export default function MoreLink({ href, label }: { href: string, label: string }) {
  return (
    <Link href={href} aria-label={label} {...stylex.props(homeLink, styles.link)}>
      <span aria-hidden="true" {...stylex.props(homeLinks.secondary, styles.words)}>
        More
        {['More', 'More', 'More', 'More', '›'].map((word, index) => (
          <span key={index} {...stylex.props(styles.word, styles.delay(index))}>
            {'\u00a0'}{word}
          </span>
        ))}
      </span>
    </Link>
  )
}

const styles = stylex.create({
  link: {
    display: 'inline-block',
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
      [stylex.when.ancestor(':hover', homeLink)]: '3em',
      [stylex.when.ancestor(':focus-visible', homeLink)]: '3em',
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
