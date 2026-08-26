# CLAUDE.md

This file gives coding agents the repository-specific context needed to work on mamuso.dev.

## Project overview

mamuso.dev is a Next.js 16 App Router site running React 19. It is a filesystem-backed personal journal with notes, photography, an Atom feed, and a client-side 3D cartridge viewer. There is no database, authentication, API service, or required environment configuration.

Content and source images live in the `content/` git submodule. The application validates Markdown frontmatter and reads content from the filesystem in Server Components and build scripts.

## Requirements and commands

Use Node.js 24 and pnpm 10.

```bash
pnpm dev     # Turbopack development server on localhost:3000
pnpm build   # Submodule update, copy assets, generate RSS, production build
pnpm start   # Serve a production build
pnpm lint    # eslint .
pnpm run assets   # Copy content/assets to public/assets
pnpm run rss      # Generate public/feed.xml (Atom, despite the filename)
pnpm run photos   # Process new originals in content/assets/originals/
```

For local development:

```bash
git submodule update --init
pnpm install
pnpm run assets
pnpm dev
```

`pnpm build` runs `git submodule init && git submodule update --remote`. That advances the submodule to the remote default branch. Do not assume the parent repo's pinned gitlink is what production will read unless that pointer was committed after the update.

## Routes and rendering

- `app/page.tsx` — homepage with recent notes, side projects, and work
- `app/notes/page.tsx` — archive grouped by year
- `app/notes/[page]/page.tsx` — paginated full notes (20 per page)
- `app/note/[slug]/page.tsx` — individual note or photo
- `app/photos/page.tsx` — photo gallery
- `app/og/[title]/[description]/opengraph-image.tsx` — generated social image
- `app/layout.tsx` — metadata, header, cartridge stage, footer

Legacy `/posts/:path*` and `/post/:slug` URLs permanently redirect to `/notes/:path*` and `/note/:slug`. When adding links in app code, use `/notes` and `/note/<slug>`, not `/posts` or `/post`.

The homepage and `/notes` read their post lists at module scope, so new Markdown does not show on those two pages until the dev server restarts. `/note/[slug]` and `/photos` read per request.

React Strict Mode is off (`reactStrictMode: false` in `next.config.js`).

## Content pipeline

Markdown files in `content/posts/` use gray-matter frontmatter. `lib/api.tsx` reads them with field lists and React `cache()`. Photo posts use `category: photo` plus `basename`, dimensions, camera/EXIF, GPS, and a color palette. A post can have a `basename` image without being a photo (screenshot notes). Those appear in the article but not on `/photos`.

`pnpm run photos` reads new files from `content/assets/originals/`, writes web/gallery images to `content/assets/feed/`, and creates matching Markdown. Already processed basenames are skipped.

`lib/assets.tsx` replaces `public/assets` with a copy of the submodule assets. `lib/feed.tsx` renders Markdown and writes Atom to `public/feed.xml`. Feed item links still use `/post/<slug>` and rely on the redirect.

Script-only modules use `.ts` or `.tsx` under `lib/`. There is no Sass.

## Styling

Do not add SCSS, CSS modules, Tailwind, or a webfont other than the one already in the repo.

StyleX is the component styling system:

- `@stylexjs/stylex` in components (`stylex.create` / `stylex.props`)
- `babel.config.js` (`@stylexjs/babel-plugin`)
- `postcss.config.js` (`@stylexjs/postcss-plugin` with `useCSSLayers: true`, scanning `app/**` and `lib/**`)
- `app/globals.css` starts with `@stylex;` so compiled atoms land there
- ESLint rules `@stylexjs/no-conflicting-props`, `no-unused`, and `valid-styles`

Chrome you own (layout, header, nav, cards, the cartridge frame) gets StyleX. Markdown bodies in `Post.tsx` are `markdown-to-jsx` with no overrides, so StyleX cannot style descendant `p` / `h2` / `img`. Article prose and content classes such as `photo-gallery` and `video-embed` belong in CSS (put that CSS in a named `@layer` so it does not silently beat StyleX atoms). `postcss.config.js` `useCSSLayers: true` emits StyleX inside `@layer priority*`. Unlayered rules in `globals.css` outrank every StyleX class.

The body font is the platform system font on Apple devices and `/fonts/SFPro.woff2` (`SF Pro Web`) elsewhere. `app/layout.tsx` sets `document.documentElement.dataset.platform` before hydration. There is no Geist font and no `geist` package.

A few files already use StyleX (`app/layout.tsx`, `CartridgeStageDynamic.tsx`, `CartridgeViewer.tsx`). Header, Footer, Post, PostHome, PhotoMeta, Pagination, and the page templates are still unstyled HTML.

## Cartridge viewer

The homepage dynamically imports the React Three Fiber cartridge scene so other routes do not load the Three.js bundle or cartridge assets. `app/page.tsx` renders `CartridgeStage` (`ssr: false`) above the journal. The viewer lives in `app/components/CartridgeViewer.tsx`, with definitions in `data/cartridges.ts` and textures in `public/labels/`. Interaction is pointer-only on mesh hitboxes. Hover labels are still placeholder copy until wired to real employer names.

## TypeScript

The app uses `tsconfig.json`. Node-run content scripts use `node.tsconfig.json` via `ts-node`. `lib/types.tsx` `PostType` lists many fields as required; `getPostBySlug` only copies requested frontmatter keys and casts the rest. Treat photo EXIF fields as present only when the post actually has them.
