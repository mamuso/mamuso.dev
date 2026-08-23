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

**Status:** Implemented in this cleanup.

Post dates are parsed and formatted explicitly as UTC calendar dates, including year grouping, Open Graph descriptions, and feed timestamps. Tests cover the behavior in both `America/Los_Angeles` and `Asia/Tokyo`.

## 5. Split up `CartridgeViewer.tsx`

**Status:** Implemented in this cleanup.

The viewer was split into focused modules for camera framing, model/material preparation, animation state, stack layout, cartridge interaction, and scene composition. The placeholder company labels and their reserved mobile layout gap remain available for the upcoming real content; the magenta debug border was removed.

## 6. Make the 3D interaction accessible

**Status:** Implemented in this cleanup.

The viewer now has named, keyboard-accessible DOM controls synchronized with the 3D interaction, visible focus states, live selection status, and meaningful loading/WebGL fallbacks. Motion snaps to its end state when `prefers-reduced-motion` is enabled. Effects clean up subscriptions and avoid repeating random state during Strict Mode checks, so React Strict Mode is enabled again.

## 7. Replace unsafe content typing

**Status:** Implemented in this cleanup.

Frontmatter is validated into a complete internal `Post`, while content queries accept only `keyof Post` fields and return `Pick<Post, K>` projections. Summary, category, image, and photo metadata fields are optional, and malformed known fields fail with source-specific validation errors.

## 8. Remove module-load content snapshots

**Status:** Implemented in this cleanup.

The homepage and Notes listing now read posts inside their Server Component render functions, so development requests see filesystem changes without restarting Next.js. Both routes explicitly use indefinite production revalidation because content is immutable within a deployment and refreshed by the content-backed build.

## 9. Reduce static asset weight

The 3D experience eagerly loads approximately 6.6 MB of label PNGs, a 2.7 MB font, a 356 KB model, and its JavaScript bundle. Resize and compress label textures, subset the font, and reconsider eager texture preloading. The asset pipeline currently copies roughly 189 MB into `public`; copy only files needed at runtime.

## 10. Make builds reproducible

**Status:** Implemented in this cleanup.

Production builds now initialize and check out the content commit pinned by the parent repository. Updating from the configured content branch requires the separate `pnpm run content:update` command, after which the changed submodule pointer can be reviewed and committed explicitly.

## 11. Refresh repository documentation

**Status:** Implemented in this cleanup.

The original `README.md` is intentionally preserved. `DEVELOPMENT.md` now provides current setup, commands, content workflow, and route documentation, while `CLAUDE.md` describes the Next.js 16 and React 19 architecture, current note routes, Tailwind styling, SF Pro fallback strategy, content validation, and cartridge viewer. JSX-free modules under `lib/` now use the `.ts` extension.

## 12. Add a small regression suite

Start with tests for:

- Frontmatter validation and missing assets
- Date formatting across timezones
- Post sorting and pagination boundaries
- Unknown slug/page 404 behavior
- Metadata and OG URL generation
