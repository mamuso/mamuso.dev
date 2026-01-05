import Link from 'next/link'

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const previousPage = +page - 1
  const nextPage = +page + 1
  return (
    <section className="pagination">
      {previousPage > 0 && <Link href={`/notes/${previousPage}`}>← Previous</Link>}
      {nextPage <= totalPages && <Link href={`/notes/${nextPage}`}>Next →</Link>}
    </section>
  )
}
