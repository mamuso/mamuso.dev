'use client'

import { usePathname } from 'next/navigation'
import * as stylex from '@stylexjs/stylex'
import HeaderBrand from './HeaderBrand'

export default function Header() {
  const isHome = usePathname() === '/'

  return (
    <header {...stylex.props(styles.header, isHome && styles.home)}>
      <HeaderBrand />
    </header>
  )
}

const styles = stylex.create({
  header: {
    alignItems: 'center',
    backgroundColor: {
      default: 'var(--app-background)',
      '@media (min-width: 640px)': 'transparent',
    },
    boxShadow: {
      default: '0 1px 0 rgba(0, 0, 0, 0.09)',
      '@media (min-width: 640px)': 'none',
    },
    boxSizing: 'border-box',
    display: 'flex',
    gridColumn: {
      '@media (min-width: 640px)': '1 / -1',
    },
    left: {
      default: 0,
      '@media (min-width: 640px)': 'auto',
    },
    minHeight: 28,
    padding: {
      default: 12,
      '@media (min-width: 640px)': 0,
    },
    paddingBlock: {
      '@media (min-width: 640px)': 2,
    },
    pointerEvents: 'none',
    position: {
      default: 'fixed',
      '@media (min-width: 640px)': 'relative',
    },
    right: {
      default: 0,
      '@media (min-width: 640px)': 'auto',
    },
    top: {
      default: 0,
      '@media (min-width: 640px)': 'auto',
    },
    zIndex: 2,
  },
  home: {
    marginBlockStart: {
      '@media (min-width: 640px)': 48,
    },
  },
})
