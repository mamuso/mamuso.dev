import * as stylex from '@stylexjs/stylex'
import HeaderBrand from './HeaderBrand'

export default function Header() {
  return (
    <header {...stylex.props(styles.header)}>
      <HeaderBrand />
    </header>
  )
}

const styles = stylex.create({
  header: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    gridColumn: '1 / -1',
    minHeight: 28,
    paddingBlock: 2,
    pointerEvents: 'none',
    position: 'relative',
    zIndex: 1,
  },
})
