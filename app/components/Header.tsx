'use client'

import { ViewTransition } from 'react'
import type {} from 'react/canary'
import { usePathname } from 'next/navigation'
import * as stylex from '@stylexjs/stylex'
import { layout } from '../styles/site'
import HeaderBrand from './HeaderBrand'

export default function Header() {
  const isHome = usePathname() === '/'

  return (
    <ViewTransition name="site-header">
      <header {...stylex.props(layout.fullBleed, styles.header, isHome && styles.homeHeader)}>
        <div {...stylex.props(layout.container, styles.inner)}>
          <ViewTransition name="site-header-brand">
            <HeaderBrand />
          </ViewTransition>
        </div>
      </header>
    </ViewTransition>
  )
}

const styles = stylex.create({
  header: {
    backgroundColor: 'transparent',
    borderBlockEndColor: '#ADADAD',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
    boxSizing: 'border-box',
    gridColumn: '1 / -1',
    height: 56,
    marginBlockStart: -24,
    pointerEvents: 'none',
    position: 'relative',
  },
  homeHeader: {
    borderBlockEndColor: 'rgba(173, 173, 173, 0)',
    height: 192,
  },
  inner: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },
})
