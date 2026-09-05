'use client'

import dynamic from 'next/dynamic'
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
      <CartridgeStage onOpenChange={onOpenChange} />
      <div aria-hidden="true" {...stylex.props(layout.container, styles.dividerContainer)}>
        <div {...stylex.props(styles.divider)} />
      </div>
    </>
  )
}

const styles = stylex.create({
  stage: {
    boxSizing: 'border-box',
    height: 'clamp(360px, calc(222.222222vw - 1595.555556px), 680px)',
    insetInlineStart: '50%',
    marginInline: '-50vw',
    position: 'absolute',
    top: 0,
    width: '100vw',
    zIndex: 1,
  },
  dividerContainer: {
    display: { default: 'none', '@media (min-width: 1024px)': 'block' },
    insetInline: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 'clamp(360px, calc(222.222222vw - 1595.555556px), 680px)',
    zIndex: 2,
  },
  divider: {
    borderBlockEndColor: '#ADADAD',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
})
