'use client'

import { usePathname } from 'next/navigation'
import RecentMusic from './RecentMusic'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'
import { colors } from '../styles/tokens.stylex'

export default function Footer() {
  const pathname = usePathname()
  return (
    <footer {...stylex.props(layout.fullBleed, styles.footer)}>
      <div {...stylex.props(layout.container, styles.content)}>
        <p {...stylex.props(typography.muted, styles.copy)}>
          mamuso{' '}
          <Link href="https://github.com/mamuso" aria-label="GitHub" {...stylex.props(styles.link)}>gh</Link>{' '}
          <Link href="https://x.com/mamuso" {...stylex.props(styles.link)}>x</Link>
        </p>
        {pathname === '/' ? <RecentMusic /> : null}
      </div>
    </footer>
  )
}

const styles = stylex.create({
  link: {
    color: colors.textPrimary,
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: { default: 16, '@media (min-width: 880px)': 24 },
    display: 'flex',
    justifyContent: 'space-between',
  },
  footer: {
    gridColumn: '1 / -1',
    marginBlockStart: 32,
    paddingBlockStart: 80,
    paddingBlockEnd: 12,
    isolation: 'isolate',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  copy: {
    flexShrink: 0,
    marginBlock: 0,
    position: 'relative',
    whiteSpace: 'nowrap',
  },
})
