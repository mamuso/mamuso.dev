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
      <header
        {...stylex.props(
          layout.fullBleed,
          styles.header,
          isHome && styles.homeHeader,
        )}
      >
        <div {...stylex.props(layout.container, styles.inner)}>
          <ViewTransition name="site-header-brand">
            <HeaderBrand />
          </ViewTransition>
          {!isHome && <span aria-hidden="true" {...stylex.props(styles.divider)} />}
        </div>
      </header>
    </ViewTransition>
  )
}

const styles = stylex.create({
  header: {
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
    gridColumn: '1 / -1',
    height: 56,
    marginBlockStart: -24,
    pointerEvents: 'none',
    position: 'relative',
  },
  homeHeader: {
    height: 192,
  },
  divider: {
    borderBlockEndColor: '#ADADAD',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
    bottom: 0,
    insetInline: {
      default: 24,
      '@media (min-width: 640px)': 60,
    },
    pointerEvents: 'none',
    position: 'absolute',
  },
  inner: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },
})
