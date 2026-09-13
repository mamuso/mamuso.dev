'use client'

import dynamic from 'next/dynamic'
import CartridgeErrorBoundary from './CartridgeErrorBoundary'
import * as stylex from '@stylexjs/stylex'

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
    <CartridgeErrorBoundary>
      <CartridgeStage onOpenChange={onOpenChange} />
    </CartridgeErrorBoundary>
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
})
