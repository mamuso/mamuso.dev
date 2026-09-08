'use client'

import dynamic from 'next/dynamic'
import CartridgeErrorBoundary from './CartridgeErrorBoundary'
import * as stylex from '@stylexjs/stylex'
import { layout } from '../styles/site'

const CartridgeStage = dynamic(() => import('./CartridgeStage'), {
  ssr: false,
  loading: () => (
    <div {...stylex.props(styles.stage)} aria-hidden="true" />
  ),
})

type CartridgeStageDynamicProps = {
  onOpenChange?: (isOpen: boolean) => void
}

export default function CartridgeStageDynamic({
  onOpenChange,
}: CartridgeStageDynamicProps) {
  return (
    <>
      <CartridgeErrorBoundary>
        <CartridgeStage onOpenChange={onOpenChange} />
      </CartridgeErrorBoundary>
      <div aria-hidden="true" {...stylex.props(layout.container, styles.dividerContainer)}>
        <div {...stylex.props(styles.divider)} />
      </div>
    </>
  )
}

const styles = stylex.create({
  stage: {
    boxSizing: 'border-box',
    height: { default: 360, '@media (min-width: 880px)': 640 },
    insetInlineStart: '50%',
    marginInline: '-50vw',
    position: 'absolute',
    top: 0,
    width: '100vw',
    zIndex: 1,
  },
  dividerContainer: {
    display: 'block',
    insetInline: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: { default: 360, '@media (min-width: 880px)': 640 },
    zIndex: 2,
  },
  divider: {
    borderBlockEndColor: '#ADADAD',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
})
