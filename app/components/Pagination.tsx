import Link from 'next/link'

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const previousPage = +page - 1
  const nextPage = +page + 1
  return (
    <nav>
      {previousPage > 0 && <Link href={`/notes/${previousPage}`}>← Previous</Link>}
      {previousPage > 0 && nextPage <= totalPages && ' · '}
      {nextPage <= totalPages && <Link href={`/notes/${nextPage}`}>Next →</Link>}
    </nav>
  )
}
