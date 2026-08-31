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
    boxSizing: 'border-box',
    display: 'flex',
    gridColumn: '1 / -1',
    minHeight: 28,
    paddingBlock: 2,
    pointerEvents: 'none',
    position: 'relative',
    zIndex: 1,
  },
  home: {
    marginBlockStart: {
      default: 16,
      '@media (min-width: 640px)': 48,
    },
  },
})
