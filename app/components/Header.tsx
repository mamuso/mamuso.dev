import Link from 'next/link'

export default function Header() {
  return (
    <header>
      <h1>
        <Link href="/">mamuso</Link>
      </h1>
      <nav>
        <ul>
          <li>
            <Link href="/notes/">notes</Link>
          </li>
          <li>
            <Link href="/photos/">pics</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
