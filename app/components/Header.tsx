import Link from 'next/link'
import Image from 'next/image'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'

export default function Header() {
  return (
    <header {...stylex.props(styles.header)}>
      <h1 {...stylex.props(typography.heading, styles.interactive)}>
        <Link href="/" {...stylex.props(typography.link, styles.brand)}>
          <Image src="/images/logo.svg" width={20} height={20} alt="" aria-hidden="true" />
          mamuso
        </Link>
      </h1>
      <nav {...stylex.props(styles.interactive)}>
        <ul {...stylex.props(layout.list, styles.navigation)}>
          <li>
            <Link href="/notes/" {...stylex.props(typography.mutedLink)}>notes</Link>
          </li>
          <li>
            <Link href="/photos/" {...stylex.props(typography.mutedLink)}>pics</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}

const styles = stylex.create({
  header: {
    alignItems: 'center',
    borderColor: '#ff00ff',
    borderStyle: 'solid',
    borderWidth: 2,
    display: 'flex',
    gridColumn: '1 / -1',
    justifyContent: 'space-between',
    pointerEvents: 'none',
    position: 'relative',
    zIndex: 1,
  },
  interactive: {
    pointerEvents: 'auto',
  },
  brand: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  navigation: {
    display: 'flex',
    gap: 24,
  },
})
