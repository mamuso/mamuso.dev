'use client'

import { Component, type ReactNode } from 'react'
import * as stylex from '@stylexjs/stylex'
import { CARTRIDGES } from '@/data/cartridges'

/** A failed GPU context, model or texture must not replace the whole homepage. */
export default class CartridgeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section aria-label="Work experience" data-cartridge-fallback {...stylex.props(styles.fallback)}>
        <ul {...stylex.props(styles.list)}>
          {CARTRIDGES.map((cartridge) => (
            <li key={cartridge.name}>
              <span>{cartridge.company}</span>{' '}
              <span {...stylex.props(styles.period)}>{cartridge.period}</span>
            </li>
          ))}
        </ul>
      </section>
    )
  }
}

const styles = stylex.create({
  fallback: {
    position: 'absolute', insetInlineStart: { default: 24, '@media (min-width: 880px)': '50%' }, insetInlineEnd: 24, top: 0,
    height: { default: 360, '@media (min-width: 880px)': 640 },
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  period: { color: '#62626a', fontSize: 13 },
})
