import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { NextPage } from 'next'
import Link from 'next/link'
import { getRecentPosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'

export const metadata = {
  metadataBase: new URL('https://mamuso.dev'),
  title: 'mamuso - manuel muñoz solera',
  description: BLOG_SUBTITLE,
  canonical: `/`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/og/${BLOG_TITLE}/${BLOG_SUBTITLE}/opengraph-image`,
        width: 1200,
        height: 600,
        alt: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
      },
    ],
    site_name: `${BLOG_TITLE}`,
  },
  twitter: {
    handle: '@mamuso',
    site: '@mamuso',
    cardType: 'summary_large_image',
  },
  icons: {
    icon: {
      url: '/images/favicon.png',
      type: 'image/png',
    },
    shortcut: { url: '/images/favicon.png', type: 'image/png' },
  },
}

const POSTS_PER_PAGE = 10
const recentPosts = getRecentPosts(POSTS_PER_PAGE, ['title', 'date', 'slug', 'image', 'category'])

const Home: NextPage = () => {
  return (
    <>
      <CartridgeStage />
      <section>
        <h2>Manuel Muñoz Solera</h2>
        <p>Crayon holder and key stroker.</p>
      </section>

      <section>
        <h2>Journal</h2>
        <ul>
          {recentPosts.map((post) => (
            <li key={post.slug}>
              <PostHome post={post} />
            </li>
          ))}
        </ul>
        <p>
          <Link href="/notes">View more →</Link>
        </p>
      </section>

      <section>
        <h2>Side, Fun Projects</h2>
        <ul>
          <li>
            <Link href="https://www.figma.com/community/plugin/1091247524080548244/Orgchart">
              <strong>Figma OrgChart</strong> — Create an org chart from a yaml or a json
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/weekly-update-action">
              <strong>Weekly update – GitHub Action</strong> — Automate the creation of a weekly discussion
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/discussion-to-markdown-action">
              <strong>Discussion to Markdown – GitHub Action</strong> — Transform a discussion into markdown – duh!
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/figma-to-gh-pages">
              <strong>Figma to GitHub Pages – GitHub Action</strong> — Use a Figma doc as a CMS for your site
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/close-figma-tab">
              <strong>Close Figma tab</strong> — Get rid off tabs once docs open in the app
            </Link>
          </li>
          <li>
            <Link href="https://papercups.mamuso.net/">
              <strong>Papercups</strong> — Drawing the coffee cups that I sip
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/unvlogable">
              <strong>Unvlogable</strong> — oEmbed output for video services
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/sketch-truncate-textlines">
              <strong>Truncate textlines – Sketch plugin</strong> — Reduce the number of lines in a textbox
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/sketch-cat-ipsum">
              <strong>Cat Ipsum – Sketch plugin</strong> — catipsum.com, but inside Sketch
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/yammer-sketch-tools">
              <strong>Yammer Commands – Sketch plugin</strong> — A collection of utilities we used at Yammer
            </Link>
          </li>
          <li>
            <Link href="https://github.com/mamuso/acts_as_unvlogable">
              <strong>acts_as_unvlogable</strong> — A ruby gem to embed videos in a rails app
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Work</h2>
        <ul>
          <li>
            <Link href="https://vercel.com">
              <strong>Vercel</strong> — VP of Design · <time>2024 – 2026</time>
            </Link>
          </li>
          <li>
            <Link href="https://github.com">
              <strong>GitHub</strong> — Director of Design · <time>2019 – 2024</time>
            </Link>
          </li>
          <li>
            <Link href="https://azure.microsoft.com/en-us/products/devops">
              <strong>Microsoft, Dev Services</strong> — Director of Design · <time>2018 – 2019</time>
            </Link>
          </li>
          <li>
            <Link href="https://www.microsoft.com">
              <strong>Microsoft</strong> — Designer · <time>2013 – 2018</time>
            </Link>
          </li>
          <li>
            <Link href="https://tuenti.es/">
              <strong>Tuenti</strong> — Head of Design · <time>2010 – 2013</time>
            </Link>
          </li>
          <li>
            <Link href="https://jobandtalent.com/">
              <strong>Jobandtalent</strong> — Designer · <time>2010</time>
            </Link>
          </li>
          <li>
            <Link href="https://the-cocktail.com/">
              <strong>The Cocktail</strong> — Designer and Developer · <time>2006 – 2010</time>
            </Link>
          </li>
          <li>
            <Link href="https://ruiznicoli.com/">
              <strong>Masmadera – RNL</strong> — Designer and Developer · <time>2005 – 2006</time>
            </Link>
          </li>
        </ul>
      </section>
    </>
  )
}

export default Home
