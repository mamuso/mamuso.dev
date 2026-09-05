import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { typography } from '../styles/site'

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const previousPage = +page - 1
  const nextPage = +page + 1
  return (
    <nav {...stylex.props(styles.pagination)}>
      {previousPage > 0 && <Link href={`/notes/${previousPage}`} {...stylex.props(typography.mutedLink)}>← Previous</Link>}
      {nextPage <= totalPages && <Link href={`/notes/${nextPage}`} {...stylex.props(typography.mutedLink)}>Next →</Link>}
    </nav>
  )
}

const styles = stylex.create({
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBlockStart: 48,
  },
})
