'use client'

import { usePathname } from 'next/navigation'
import RecentMusic from './RecentMusic'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'

export default function Footer() {
  const pathname = usePathname()
  return (
    <footer {...stylex.props(layout.fullBleed, styles.footer)}>
      <div {...stylex.props(layout.container, styles.content)}>
        {pathname === '/' ? <RecentMusic /> : null}
        <p {...stylex.props(typography.muted, styles.copy)}>
          mamuso <Link href="https://x.com/mamuso" {...stylex.props(typography.mutedLink)}>x</Link>{' '}
          <Link href="https://github.com/mamuso" {...stylex.props(typography.mutedLink)}>github</Link>
        </p>
      </div>
    </footer>
  )
}

const styles = stylex.create({
  content: {
    alignItems: { default: 'stretch', '@media (min-width: 880px)': 'center' },
    flexDirection: { default: 'column', '@media (min-width: 880px)': 'row' },
    gap: 24,
    display: 'flex',
    justifyContent: { default: 'flex-start', '@media (min-width: 880px)': 'flex-end' },
  },
  footer: {
    gridColumn: '1 / -1',
    marginBlockStart: 80,
    paddingBlockStart: 32,
    paddingBlockEnd: 24,
    isolation: 'isolate',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  copy: {
    flexShrink: 0,
    marginBlock: 0,
    marginInlineStart: { default: 0, '@media (min-width: 880px)': 'auto' },
    position: 'relative',
    whiteSpace: 'nowrap',
  },
})
