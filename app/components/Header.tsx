import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header>
      <h1>
        <Link href="/">
          <Image src="/images/logo.svg" width={20} height={20} alt="" aria-hidden="true" />
          mamuso
        </Link>
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
