import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="footer">
      <i></i>
      <div>
        <p>
          mamuso.dev · <Link href="https://x.com/mamuso">x</Link> · <Link href="https://github.com/mamuso">github</Link>
        </p>
        <span>
          <Link href="#header" aria-label="Back to top">↑</Link>
        </span>
      </div>
    </footer>
  )
}
