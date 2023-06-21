import Link from 'next/link'

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const previousPage = +page - 1
  const nextPage = +page + 1
  return (
    <section>
      {previousPage > 0 && <Link href={`/posts/${previousPage}`}>← Previous</Link>}
      {nextPage <= totalPages && <Link href={`/posts/${nextPage}`}>Next →</Link>}
    </section>
  )
}
