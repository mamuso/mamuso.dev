# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal portfolio/journal site built with Next.js. Content is managed in a **separate Git submodule** (`mamuso.dev.content`) and processed at build time to generate a static site with blog posts and a photography portfolio.

## Development Commands

```bash
# Development server with Turbopack
pnpm dev

# Build the site
pnpm build
# Note: build command runs in sequence:
# 1. git submodule init && git submodule update --remote (fetch latest content)
# 2. pnpm run assets (copy content/assets to public/assets)
# 3. pnpm run rss (generate RSS feed from markdown posts)
# 4. next build (Next.js static generation)

# Start production server
pnpm start

# Lint code
pnpm lint

# Process new RAW photos (extracts EXIF, generates thumbnails, creates markdown)
pnpm run photos

# Generate RSS feed manually
pnpm run rss

# Copy assets to public folder manually
pnpm run assets
```

## Architecture

### Content Management

Content is **externalized in a Git submodule**. The repository structure is:

- **Content source**: `content/` (Git submodule, separate repository)
  - `content/posts/` - Markdown files with YAML frontmatter
  - `content/assets/` - Images and media
  - `content/assets/originals/` - RAW photo files for processing
- **Build output**: `public/assets/` - Assets copied during build

All content fetching happens at **build time** using filesystem reads. There are no runtime API calls or databases.

### Data Loading (lib/api.tsx)

Core data fetching functions that read markdown files directly from the filesystem:

- `getPostSlugs()` - Returns array of all post filenames
- `getPostBySlug(slug, fields)` - Parses individual markdown file with `gray-matter`, returns specified fields
- `getAllPosts(fields)` - Loads all posts, sorted by date descending
- `getPhotoPosts(fields)` - Filters posts where `category === 'photo'`

**Frontmatter schema** (PostType):

```yaml
title: string
date: string (YYYY-MM-DD)
category: string (e.g., 'photo')
summary: string
basename: string (for photos, filename of the image)
camera: string (EXIF Make + Model)
iso: number
fnumber: number
exposureBiasValue: number
exposureTime: number
GPSLatitude: number
GPSLongitude: number
width: number (image dimensions)
height: number
colorPalette: string[] (hex colors extracted from photo)
```

### Build Scripts (lib/)

Three custom Node.js scripts run during build:

**1. `lib/assets.tsx`** - Asset Management

- Copies `content/assets/` to `public/assets/`
- Ensures images are available for Next.js static generation

**2. `lib/feed.tsx`** - RSS Feed Generation

- Reads all markdown posts via `getAllPosts()`
- Converts markdown to HTML using `marked`
- Generates Atom 1.0 feed with `feed` library
- Outputs to `public/feed.xml`
- Rewrites relative asset paths to absolute URLs

**3. `lib/photos.tsx`** - Photo Processing Pipeline

- Monitors `content/assets/originals/` for new RAW photos
- Extracts EXIF metadata (camera, ISO, exposure, GPS coordinates)
- Generates color palette using `color-thief-node`
- Creates optimized thumbnails with `sharp` (mozjpeg compression)
- Auto-generates markdown file in `content/posts/` with all metadata
- Prevents reprocessing by checking if markdown already exists
- Run with: `pnpm run photos`

### Routing Structure

```
/                             - Home (10 latest posts + work history)
/post/[slug]/                 - Individual post view
/posts/                       - All posts grouped by year
/posts/[page]/                - Paginated posts (20 per page)
/photos/                      - Photo gallery grid
/og/[title]/[description]/    - Dynamic OG image generation
```

### Markdown Rendering

- Markdown parsed with `gray-matter` (YAML frontmatter + content)
- Rendered to JSX using `markdown-to-jsx` library
- Rendering happens in React components after build-time data loading
- Full posts rendered in `app/components/Post.tsx`
- Summaries rendered in `app/components/PostHome.tsx`

### Photo Workflow

To add a new photo to the site:

1. Place RAW image in `content/assets/originals/`
2. Run `pnpm run photos`
3. Script automatically:
   - Extracts EXIF data
   - Generates color palette
   - Creates optimized thumbnails in `content/assets/feed/`
   - Generates markdown file in `content/posts/` with frontmatter
4. Photo appears as a post with `category: photo`
5. Displayed in photo gallery and post feeds

Photo posts include camera metadata (via `PhotoMeta.tsx`) and justified gallery layouts (via `PhotoGallery.tsx`).

## TypeScript Configuration

- Main config: `tsconfig.json` (Next.js, strict mode, paths aliased with `@/*`)
- Node scripts: `node.tsconfig.json` (extends main, targets ES2017 CommonJS for ts-node compatibility)
- Use `ts-node --project ./node.tsconfig.json` for running build scripts

## Key Dependencies

- **Framework**: Next.js 15.4.10, React 19.0.0, Turbopack
- **Content**: `gray-matter` (frontmatter), `marked` (Markdown→HTML), `markdown-to-jsx` (Markdown→JSX)
- **Images**: `sharp` (processing), `color-thief-node` (palette), `fast-exif` (metadata)
- **Feeds**: `feed` (RSS generation)
- **Analytics**: Vercel Analytics, Vercel Speed Insights

## Important Notes

- **Content is in a submodule**: Always run `git submodule update --remote` to fetch latest content before building
- **No runtime database**: All data comes from markdown files read at build time
- **Photo processing is manual**: Run `pnpm run photos` when adding new photos to `content/assets/originals/`
- **Build scripts use ts-node**: They require the separate `node.tsconfig.json` to run
- **pnpm only**: This project uses pnpm with specific overrides in package.json
