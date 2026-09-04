import * as stylex from '@stylexjs/stylex'
import { layout } from '../styles/site'
import HeaderBrand from './HeaderBrand'

export default function Header() {
  return (
    <header {...stylex.props(layout.fullBleed, styles.header)}>
      <div {...stylex.props(layout.container, styles.inner)}>
        <HeaderBrand />
      </div>
    </header>
  )
}

const styles = stylex.create({
  header: {
    backgroundColor: 'var(--app-background)',
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
  inner: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },
})
