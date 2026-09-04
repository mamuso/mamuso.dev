'use client'

import dynamic from 'next/dynamic'
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
  return <CartridgeStage onOpenChange={onOpenChange} />
}

const styles = stylex.create({
  stage: {
    borderBlockEndColor: '#ADADAD',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
    boxSizing: 'border-box',
    height: {
      default: 640,
      '@media (min-width: 720px)': 680,
    },
    insetInlineStart: '50%',
    marginInline: '-50vw',
    position: 'absolute',
    top: 0,
    width: '100vw',
    zIndex: 1,
  },
})
