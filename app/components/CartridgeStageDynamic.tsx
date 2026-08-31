'use client'

import dynamic from 'next/dynamic'
import * as stylex from '@stylexjs/stylex'

const CartridgeStageDynamic = dynamic(() => import('./CartridgeStage'), {
  ssr: false,
  loading: () => (
    <div {...stylex.props(styles.stage)} aria-hidden="true" />
  ),
})

export default CartridgeStageDynamic

const styles = stylex.create({
  stage: {
    borderBlockEndColor: {
      default: 'transparent',
      '@media (min-width: 720px)': '#ff00ff',
    },
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: {
      default: 0,
      '@media (min-width: 720px)': 2,
    },
    boxSizing: 'border-box',
    height: {
      default: 640,
      '@media (min-width: 720px)': 800,
    },
    left: '50%',
    marginBlockEnd: {
      default: 52,
      '@media (min-width: 720px)': 128,
    },
    marginBlockStart: {
      default: -52,
      '@media (min-width: 720px)': -128,
    },
    marginInline: '-50vw',
    position: 'relative',
    right: '50%',
    width: '100vw',
  },
})
