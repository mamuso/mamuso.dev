import Link from 'next/link'

export default function Header() {
  return (
    <section id="footer">
      <i></i>
      <div>
        <p>
          mamuso.dev · <Link href="mailto:mamuso@mamuso.dev">Email</Link> · <Link href="https://github.com/mamuso">GitHub</Link>
        </p>
        <span>
          <Link href="#header">↑</Link>
        </span>
      </div>
    </section>
  )
}
