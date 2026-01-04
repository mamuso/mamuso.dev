import Link from 'next/link'

export default function Header() {
  return (
    <section id="footer">
      <i></i>
      <div>
        <p>
          mamuso.dev · <Link href="https://x.com/mamuso">x</Link> · <Link href="https://github.com/mamuso">github</Link>
        </p>
        <span>
          <Link href="#header">↑</Link>
        </span>
      </div>
    </section>
  )
}
