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
      default: 640,
      '@media (min-width: 720px)': 920,
    },
    left: '50%',
    marginBlockEnd: 51,
    marginBlockStart: -51,
    marginInline: '-50vw',
    position: 'relative',
    right: '50%',
    width: '100vw',
  },
})
