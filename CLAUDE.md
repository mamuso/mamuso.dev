# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based personal website and blog (mamuso.dev) featuring posts, photos, and an RSS feed. Content is stored in a separate git submodule repository, and the site uses a build pipeline to process photos, generate RSS feeds, and copy assets before deployment.

## Common Commands

### Development
```bash
pnpm dev              # Start development server with Turbopack
pnpm build            # Initialize/update submodules, process assets, generate RSS, and build for production
pnpm start            # Start production server
pnpm lint             # Run Next.js linting
```

### Content Processing
```bash
pnpm run assets       # Copy assets from content/assets to public/assets
pnpm run rss          # Generate RSS feed at public/feed.xml
pnpm run photos       # Process new photos from content/assets/originals/
```

**Important**: The `photos` script processes photos by:
1. Reading EXIF data from originals in `content/assets/originals/`
2. Generating resized versions in `content/assets/feed/`
3. Creating markdown files in `content/posts/` with photo metadata
4. Only processing photos that haven't been processed yet (checks for existing markdown files)

## Architecture

### Content Management via Git Submodule

The `content/` directory is a git submodule (separate repository). The build process:
1. Initializes/updates the submodule (`git submodule init && git submodule update --remote`)
2. Processes assets and RSS feed
3. Builds the Next.js application

All blog posts and photos are markdown files in `content/posts/` with frontmatter metadata.

### Content Processing Pipeline

**Posts**: Markdown files in `content/posts/` with gray-matter frontmatter
- `lib/api.tsx` handles reading posts from the filesystem
- `getAllPosts()` returns all posts sorted by date
- `getPhotoPosts()` filters posts with `category: photo`
- Posts can be regular blog entries or photo posts with EXIF metadata

**Photos**: Special posts with additional metadata
- Stored as markdown in `content/posts/` with `category: photo`
- Include EXIF data: camera, ISO, f-number, exposure time, GPS coordinates
- Include color palette extracted from the image
- Photo files referenced via `basename` field

**RSS Feed** (`lib/feed.tsx`):
- Generates Atom feed at `public/feed.xml`
- Converts markdown to HTML using marked
- Rewrites relative asset URLs to absolute URLs for feed readers

**Assets** (`lib/assets.tsx`):
- Removes symlink and copies actual files from `content/assets` to `public/assets`
- Required before build because content is externalized

### Application Structure

**Next.js App Router**: Uses Next.js 15 with App Router pattern
- `app/page.tsx` - Homepage with recent posts
- `app/posts/page.tsx` - All posts listing
- `app/posts/[page]/page.tsx` - Paginated posts
- `app/post/[slug]/page.tsx` - Individual post view
- `app/photos/page.tsx` - Photo gallery
- `app/og/[title]/[description]/opengraph-image.tsx` - Dynamic OG images

**Components** (`app/components/`):
- All components are in `app/components/`
- Uses SCSS modules for styling (e.g., `Canvas.module.scss`)
- Geist Sans and Geist Mono fonts from `geist/font`

**Styling**:
- Global styles in `app/globals.scss`
- CSS reset in `app/reset.scss`
- Component-specific SCSS modules

**TypeScript**:
- Main config: `tsconfig.json`
- Build scripts use separate config: `node.tsconfig.json`

## Key Implementation Details

**Photo Processing**: When adding new photos to `content/assets/originals/`, run `pnpm run photos` to:
- Extract EXIF metadata
- Generate color palettes using color-thief-node
- Create 2048px web versions and 640px gallery thumbnails
- Generate markdown files with all metadata

**Build Process**: The build command runs scripts sequentially:
1. Updates content submodule
2. Copies assets to public directory
3. Generates RSS feed
4. Builds Next.js application

**Content Fields**: Posts use the `PostType` interface with optional fields. Photo posts include: `camera`, `iso`, `fnumber`, `exposureBiasValue`, `exposureTime`, `GPSLatitude`, `GPSLongitude`, `width`, `height`, `colorPalette`, and `basename`.

## Configuration

- **React Strict Mode**: Disabled (`reactStrictMode: false` in `next.config.js`)
- **Package Manager**: Uses pnpm with specific overrides for React types
- **Built Dependencies**: Only certain dependencies are built (`@parcel/watcher`, `canvas`, `sharp`, `unrs-resolver`)
