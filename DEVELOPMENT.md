# Developing mamuso.dev

mamuso.dev is a filesystem-backed personal journal with notes, photography, an Atom feed, and an interactive 3D career archive.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- React Three Fiber, Drei, and Three.js for the cartridge viewer
- Markdown content stored in the `content/` git submodule

There is no database, authentication layer, API service, or required environment configuration.

## Local setup

Requirements: Git, Node.js 24, and pnpm 10.

```bash
git clone --recurse-submodules https://github.com/mamuso/mamuso.dev.git
cd mamuso.dev
pnpm install
pnpm run assets
pnpm dev
```

The development server runs at [http://localhost:3000](http://localhost:3000). If the repository was cloned without submodules, initialize the content first:

```bash
git submodule update --init
```

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Turbopack development server |
| `pnpm build` | Check out pinned content, copy assets, generate the feed, and create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run date and frontmatter tests |
| `pnpm run assets` | Copy `content/assets/` into `public/assets/` |
| `pnpm run rss` | Generate `public/feed.xml` |
| `pnpm run photos` | Process new photo originals and create their content files |
| `pnpm run content:update` | Intentionally advance the content submodule to its configured remote branch |

## Content workflow

Posts and photo metadata live in `content/posts/`. The parent repository pins the exact content commit used by builds, making deployments reproducible. To update content:

```bash
pnpm run content:update
git status
```

Review the new content revision, then commit the updated `content` gitlink in this repository. Run `pnpm run assets` after changing content assets while developing.

## Application structure

- `/` — recent notes and the interactive cartridge viewer
- `/notes` and `/notes/[page]` — complete, paginated note archive
- `/note/[slug]` — individual note or photo
- `/photos` — photo gallery
- `/og/[slug]/opengraph-image` — generated social image
- `lib/` — content validation, filesystem queries, metadata, feed, asset, and photo scripts
- `content/` — independently versioned Markdown and source assets

Legacy `/posts` and `/post/[slug]` URLs permanently redirect to their current singular/plural routes.
