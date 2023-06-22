import fs from 'fs-extra'
import Link from 'next/link'

export default function Header() {
  const lastUpdate = fs.readFileSync('.lastupdate', 'utf8')
  return (
    <section>
      Last update: {lastUpdate} ⁃ <Link href="https://github.com/mamuso">GitHub</Link> ⁃ <Link href="https://www.linkedin.com/in/mamuso/">Linkedin</Link> ⁃ <Link href="mailto:mamuso@mamuso.net">Say Hi</Link>
    </section>
  )
}
