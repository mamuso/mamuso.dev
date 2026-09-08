# AGENTS.md

Repository-specific guidance for coding agents working on `mamuso.dev`.

## Project and setup

This is a single Next.js 16 App Router site running React 19: a personal site with
notes, photography, an Atom feed, and a client-side 3D cartridge viewer. Content is
filesystem/Markdown-backed. There is no database, authentication, API service, or
required environment configuration.

Use Node.js 24 (`engines: 24.x`) and pnpm 10 (the exact version is pinned in
`package.json`). Check `node --version` in the shell that will run commands;
activate Node 24 if needed rather than relying on machine-specific shell setup.

```bash
git submodule update --init
pnpm install
pnpm run assets
pnpm dev
```

The dev server uses Turbopack at `http://localhost:3000`. No other service is needed.
Standard commands are defined in `package.json`:

- `pnpm build`: initialize/update the pinned content submodule, copy assets, generate the feed, then run `next build`.
- `pnpm start`: serve an existing production build.
- `pnpm lint`: run `eslint .`.
- `pnpm run assets`: replace `public/assets` with a copy of `content/assets`.
- `pnpm run rss`: generate `public/feed.xml` (Atom despite the script name).
- `pnpm run photos`: prepare originals from local `photo-inbox/` into `.photo-import/` drafts; see `docs/photo-import.md`.
- `pnpm run shader:check`: validate component WGSL shaders with vgpu.
- `pnpm test`: run all Node contract tests.
- `pnpm check`: lint, route types, TypeScript, Node tests, and shader validation.
- `pnpm verify`: check, production build, HTTP metadata audit, and desktop/mobile browser smoke tests. Run `pnpm exec playwright install chromium` once first.
- See `docs/quality-checks.md` for CI, deployment gates, and the version-specific Next OG patch.

Prefer the dev server for development. Run checks relevant to the change; a full
build also runs the content pipeline and updates the submodule checkout.

## Content and URLs

- Posts and photo assets live in the public `content/` git submodule (`github.com/mamuso/mamuso.dev.content.git`). App-specific images, models, and labels also live in `public/`.
- Populate the submodule before rendering content pages: `lib/post-index.ts` reads `content/posts/`, which otherwise fails with `ENOENT`.
- Builds use the parent repository's pinned content revision. Do not advance to the remote default branch during a build. After committing content changes, stage the updated `content` gitlink before building; push the content commit before the parent commit so deployments can fetch it.
- Markdown uses gray-matter frontmatter. `lib/post-index.ts` validates explicit slugs and rejects collisions with canonical URLs or filename aliases. `lib/api.tsx` wraps reads in React `cache()` and selects requested fields.
- Photo posts use `category: photo`, `basename`, image dimensions, and optional camera/EXIF, GPS, and palette fields. A non-photo note can also have a `basename` image; it will not appear in the photo gallery. Notes lists include all non-photo entries, including legacy `code` and uncategorized posts.
- Editorial dates are calendar days in `YYYY-MM-DD` format. Use `lib/editorial-date.ts` for formatting, archive years, and conversion to feed timestamps; never format them in the server's local time zone.
- Keep published explicit slugs fixed when editing titles. Markdown filenames also remain stable: photo import uses them for duplicate detection. `/note/<filename>` permanently redirects to `/note/<slug>` when an explicit slug exists; otherwise the filename remains the URL.
- Photo import deduplicates originals by SHA-256 and preserves draft edits. `pnpm photos --review` collects title, slug and date; `pnpm photos --publish ID` (or `all`) installs reviewed drafts and images into content and refreshes assets/feed. Originals and raw EXIF stay local. See `docs/photo-import.md`.
- Feed links use canonical `/note/<slug>` URLs, while entry IDs retain historical `/post/<filename>` URLs to preserve subscriber history.
- `lib/types.ts` distinguishes notes and photos. API field selections expose only requested keys; optional data has an `undefined` value. Use `POST_DETAIL_FIELDS` for full-post rendering. EXIF numbers are numeric; unavailable legacy GPS `"NaN"` values normalize to absence.
- `pnpm content:check` validates frontmatter, calendar dates, positive image dimensions, referenced feed assets and consistent stack titles. It runs in `pnpm check` and before every build. Runtime index reads validate frontmatter; asset existence checks stay in the build gate to avoid bundling photo binaries into server functions.

## Routes and rendering

- `app/page.tsx`: homepage introduction and cartridge scene through `HomeContent`; the journal section is currently disabled by `SHOW_JOURNAL = false`.
- `app/notes/page.tsx`: notes archive grouped by year.
- `app/notes/[page]/page.tsx`: full notes, 20 per page.
- `app/note/[slug]/page.tsx`: individual note or photo, with canonical redirects.
- `app/photos/page.tsx`: photo gallery.
- `app/og/[title]/[description]/opengraph-image.tsx`: generated social image.
- `app/layout.tsx`: shared layout, metadata, header, and footer.

Use `/notes` and `/note/<slug>` in new links. `next.config.js` permanently redirects
legacy `/posts/:path*` and `/post/:slug` URLs to those routes. React Strict Mode is
enabled in that config. Resource effects must tolerate development setup/cleanup replay.

The `/notes` archive holds its post list at module scope: restart the dev server
after Markdown changes to refresh it. The homepage's optional journal, paginated
notes, individual notes, and photos read inside their render functions. This does
not guarantee production reads on every request: notes and pagination have
`generateStaticParams`, and published content changes need a rebuild. Rerun
`pnpm run assets` after image changes and `pnpm run rss` to preview feed changes.

## Styling

Use StyleX (`stylex.create` / `stylex.props`) for components. Do not add SCSS, CSS
modules, Tailwind, or webfonts. The site uses the native system font stack.

- Shared styles and tokens live in `app/styles/site.ts` and `app/styles/tokens.stylex.ts`.
- `babel.config.js` configures the StyleX Babel plugin; `postcss.config.cjs` configures its PostCSS plugin. `app/globals.css` starts with `@stylex;`.
- Layout, page templates, and shared components already use StyleX. `Post.tsx` styles Markdown elements through `markdown-to-jsx` overrides; extend those when appropriate.
- Put necessary descendant/content CSS in a named `@layer`. StyleX emits layered rules (`useCSSLayers: true`), so unlayered global CSS outranks its classes.

## GPU rendering

- Use `vgpu` for all new GPU rendering work. `CartridgeBackdrop.tsx` and `cartridge-backdrop.wgsl` provide an existing vgpu example.
- The Three.js/React Three Fiber/Drei cartridge scene is a temporary compatibility baseline. Do not remove it until a vgpu renderer loads the same GLB and passes visual-parity checks; do not add another rendering stack.
- Keep GPU features progressively enhanced: the page and content must remain usable when WebGPU is unavailable.
- The homepage loads the scene via `HomeContent` → `CartridgeStageDynamic` (`ssr: false`) → `CartridgeStage` → `CartridgeViewer`. Keep the scene and its assets scoped to the homepage. Cartridge definitions are in `data/cartridges.ts`, with label textures in `public/labels/`.
- The viewer composes focused camera, layout, motion and material modules. See `docs/cartridge-architecture.md` for ownership rules and verification.
- WGSL loaders are configured for both Turbopack and Webpack in `next.config.js`.

## TypeScript

The application uses `tsconfig.json`. Content scripts under `lib/` use
`node.tsconfig.json` through `ts-node`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
