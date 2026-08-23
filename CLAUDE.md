# CLAUDE.md

This file gives coding agents the repository-specific context needed to work on mamuso.dev.

## Project overview

mamuso.dev is a Next.js 16 App Router site running React 19. It is a filesystem-backed personal journal with notes, photography, an Atom feed, and a client-side 3D cartridge viewer. There is no database, authentication, API service, or required environment configuration.

Content and source images live in the public `content/` git submodule. The application validates Markdown frontmatter and reads content directly from the filesystem in Server Components and build scripts.

## Requirements and commands

Use Node.js 24 and pnpm 10.

```bash
pnpm dev                # Start the Turbopack development server on localhost:3000
pnpm build              # Check out pinned content, copy assets, generate RSS, and build for production
pnpm start              # Serve a production build
pnpm lint               # Run ESLint
pnpm test               # Run date tests in two timezones and validate content frontmatter
pnpm run assets         # Copy content/assets to public/assets
pnpm run rss            # Generate public/feed.xml
pnpm run photos         # Process previously unprocessed photo originals
pnpm run content:update # Intentionally advance the content submodule
```

`pnpm build` runs `git submodule update --init`, so it always uses the content commit pinned by the parent repository. Do not add `--remote` to the build. Use `pnpm run content:update`, review the result, and commit the changed gitlink when an intentional content update is needed.

For development, initialize the submodule and copy its assets before starting the app:

```bash
git submodule update --init
pnpm install
pnpm run assets
pnpm dev
```

## Routes and rendering

- `app/page.tsx` — homepage with recent notes
- `app/notes/page.tsx` — complete note archive grouped by year
- `app/notes/[page]/page.tsx` — paginated note archive
- `app/note/[slug]/page.tsx` — individual note or photo
- `app/photos/page.tsx` — photo gallery
- `app/og/[slug]/opengraph-image.tsx` — generated social image
- `app/layout.tsx` — global metadata, header/footer, and cartridge stage

Legacy `/posts/:path*` and `/post/:slug` URLs permanently redirect to `/notes/:path*` and `/note/:slug`. Listing pages read content inside their Server Component functions so filesystem changes appear during development; they opt into indefinite production revalidation because content is pinned for each deployment.

## Content pipeline

Markdown files in `content/posts/` use gray-matter frontmatter. `lib/post-frontmatter.ts` validates every post into the `Post` model in `lib/types.ts`; `lib/api.ts` exposes type-safe field projections and sorted post/photo queries.

Photo posts use `category: photo` and may include image dimensions, camera and exposure data, GPS coordinates, a color palette, and a `basename`. `pnpm run photos` reads new files from `content/assets/originals/`, applies EXIF orientation, writes web/gallery images to `content/assets/feed/`, and creates matching Markdown files. Already processed basenames are skipped.

The remaining scripts are:

- `lib/assets.ts` — replace `public/assets` with a copy of the submodule assets
- `lib/feed.ts` — render Markdown and generate the Atom feed at `public/feed.xml`
- `lib/photos.ts` — process photo originals and create their content metadata

Script-only modules use `.ts`; reserve `.tsx` for files that contain JSX.

## UI architecture

The interface uses Tailwind CSS 4 from `app/globals.css`; there are no Sass or CSS modules. The body font is the platform system font on Apple devices and the bundled variable SF Pro webfont elsewhere, with a system-font fallback.

The career archive is a dynamically imported React Three Fiber scene. `CartridgeViewer.tsx` coordinates focused modules under `app/components/cartridge/` for camera behavior, materials, layout, motion, controls, fallback content, and reduced-motion handling. Keep the DOM controls as the keyboard and screen-reader equivalent of mesh interaction.

React Strict Mode is enabled in `next.config.js`.

## TypeScript and tests

The application uses strict TypeScript through `tsconfig.json`. Node-run content scripts and tests use `node.tsconfig.json`. Date-only post values are parsed and formatted in UTC so their displayed calendar day is stable across timezones. Frontmatter tests validate both the content repository and failure cases for malformed metadata.
