# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, React 19) personal blog (`mamuso.dev`). It is
filesystem/markdown-driven: no database, no auth, no API routes, and no required env vars.
Standard commands live in `package.json` scripts and `CLAUDE.md`; only the non-obvious
caveats are captured here.

### Services

- Next.js dev server: `pnpm dev` (Turbopack) on `http://localhost:3000`. This is the whole product.
- There are no other services (no backend/DB). Vercel Analytics/Speed Insights are client-only and no-op locally.

### GPU rendering

- Use `vgpu` for all new GPU rendering work in this project.
- The existing Three.js/React Three Fiber/Drei cartridge scene is a temporary compatibility baseline. Do not remove it until a vgpu renderer loads the same GLB and passes visual-parity checks; do not add another rendering stack.
- Keep GPU features progressively enhanced: the page and its content must remain usable when WebGPU is unavailable.

### Content lives in a git submodule (required)

- All posts/photos/assets come from the `content/` git submodule (`github.com/mamuso/mamuso.dev.content.git`, public).
- The app reads `content/posts/` at render time, so pages error with `ENOENT` if the submodule is not populated.
- The update script runs `git submodule update --init --remote` to populate it; re-run that command manually if `content/` is ever empty.

### Node version gotcha (important)

- `package.json` `engines` requires Node `24.x`.
- The VM's `node` on `PATH` is v22 (provided at `/exec-daemon/node`) and it shadows nvm even after `nvm use`.
- A one-time entry in the agent's `~/.bashrc` prepends nvm's Node 24 `bin`, so login/interactive shells (including tmux sessions) get Node 24. Run `pnpm dev` / `pnpm build` from a login shell (e.g. `bash -l`) so Node 24 is active.
- `pnpm` is installed under Node 24 (via `npm i -g pnpm@10`). `pnpm install` also works under Node 22 (native deps are N-API/ABI-stable), which is why the update script does not force a Node switch.

### Listing pages cache the post list at module load (content-editing gotcha)

- The homepage (`/`) and `/notes` build their post list from a top-level `const` + React `cache()` in `lib/api.tsx`, evaluated once when the module first loads.
- Newly added or edited markdown files in `content/posts/` do NOT appear on those listing pages until the dev server is restarted.
- Individual `/note/[slug]` pages read per-request, so they reflect new/edited content immediately.

### Content pipeline scripts

- `pnpm run assets` copies `content/assets` → `public/assets` (needed for images to load locally).
- `pnpm run rss` generates `public/feed.xml` (needed to test `/feed.xml`).
- `pnpm run photos` processes new originals in `content/assets/originals/` (only when adding photos).
- `pnpm build` runs the submodule update + `assets` + `rss` + `next build`; prefer `pnpm dev` for development.

### Lint

- `pnpm lint` (`eslint .`) — passes clean on a fresh setup.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
