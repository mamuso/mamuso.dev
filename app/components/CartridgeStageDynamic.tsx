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
    height: {
      default: 580,
      '@media (min-width: 720px)': 760,
    },
    left: '50%',
    marginInline: '-50vw',
    position: 'relative',
    right: '50%',
    width: '100vw',
  },
})
