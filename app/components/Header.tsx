import Link from 'next/link'
import { BLOG_TITLE } from '@/lib/constants'

export default function Header() {
  return (
    <nav>
      <h1>
        <Link href="/">{BLOG_TITLE}</Link>
      </h1>
    </nav>
  )
}
