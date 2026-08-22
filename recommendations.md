# Project cleanup recommendations

This audit was performed against the Next.js 16 / React 19 codebase in August 2026. The project is structurally sound: TypeScript passes, all 181 posts have valid dates and referenced assets, and a production build successfully prerenders 196 pages.

## 1. Fix the failing lint gate

**Status:** Implemented in this cleanup.

`CartridgeViewer.tsx` had React 19 lint failures caused by reading a ref during render, mutating values returned by hooks, and using a complex effect dependency. Keep imperative Three.js work isolated inside effects and refs, with narrow exceptions only where an external renderer genuinely requires mutation.

## 2. Repair and type metadata

**Status:** Implemented in this cleanup.

- Type every metadata export so unsupported fields fail TypeScript checks.
- Use `alternates.canonical`, `openGraph.siteName`, and `twitter.card`/`twitter.creator`.
- Give every page its actual canonical and Open Graph URL.
- Generate OG image URLs from stable slugs rather than titles. Titles containing `/`, `%`, or other reserved characters produce malformed dynamic routes.
- Keep shared metadata defaults in one helper instead of duplicating them across pages.

## 3. Harden invalid routes

**Status:** Implemented in this cleanup.

- Unknown note slugs should return 404 rather than exposing a filesystem `ENOENT` error.
- Pagination parameters arrive as strings and should be parsed and validated.
- Zero, non-numeric, and out-of-range pages should return 404 rather than an empty 200 response.
- Explicitly reject unspecified dynamic parameters while retaining static generation for known paths.

## 4. Fix timezone-sensitive post dates

`new Date('YYYY-MM-DD')` is parsed as UTC and can display the previous calendar day in negative UTC offsets. Parse post dates as local calendar dates or format them explicitly in UTC. Cover this with tests running in more than one timezone.

## 5. Split up `CartridgeViewer.tsx`

**Status:** Implemented in this cleanup.

The viewer was split into focused modules for camera framing, model/material preparation, animation state, stack layout, cartridge interaction, and scene composition. The placeholder company labels and their reserved mobile layout gap remain available for the upcoming real content; the magenta debug border was removed.

## 6. Make the 3D interaction accessible

The cartridges are pointer-operated meshes without keyboard or semantic equivalents. Add named DOM controls or an accessible overlay, provide a meaningful fallback, and honor `prefers-reduced-motion`. Once the viewer's effects are confirmed idempotent, re-enable React Strict Mode.

## 7. Replace unsafe content typing

`getPostBySlug` accepts arbitrary field strings and casts an incomplete record through `unknown` to a fully required `PostType`. Validate frontmatter and use type-safe projections such as `Pick<Post, K>`, or return a complete typed post. Mark photo-only and optional fields as optional.

## 8. Remove module-load content snapshots

The homepage and Notes listing read posts into top-level constants, so content changes do not appear during development until the server restarts. Read content inside page functions and choose an explicit production caching strategy.

## 9. Reduce static asset weight

The 3D experience eagerly loads approximately 6.6 MB of label PNGs, a 2.7 MB font, a 356 KB model, and its JavaScript bundle. Resize and compress label textures, subset the font, and reconsider eager texture preloading. The asset pipeline currently copies roughly 189 MB into `public`; copy only files needed at runtime.

## 10. Make builds reproducible

The build script runs `git submodule update --remote`, allowing a deployment to use content newer than the submodule commit recorded by the parent repository. Build from the pinned commit with `git submodule update --init`, and provide a separate explicit `content:update` command.

## 11. Refresh repository documentation

`CLAUDE.md` still describes Next.js 15, old `/posts` routes, SCSS modules, and Geist. `README.md` still names `feed.mamuso.net` and contains no useful setup instructions. Update both to match the current architecture. Rename script-only `lib/*.tsx` files to `.ts` where they contain no JSX.

## 12. Add a small regression suite

Start with tests for:

- Frontmatter validation and missing assets
- Date formatting across timezones
- Post sorting and pagination boundaries
- Unknown slug/page 404 behavior
- Metadata and OG URL generation
