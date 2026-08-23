# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, React 19) personal blog (`mamuso.dev`). It is
filesystem/markdown-driven: no database, no auth, no API routes, and no required env vars.
Standard commands live in `package.json` scripts and `CLAUDE.md`; only the non-obvious
caveats are captured here.

### Services

- Next.js dev server: `pnpm dev` (Turbopack) on `http://localhost:3000`. This is the whole product.
- There are no other services (no backend/DB). Vercel Analytics/Speed Insights are client-only and no-op locally.

### Content lives in a git submodule (required)

- All posts/photos/assets come from the `content/` git submodule (`github.com/mamuso/mamuso.dev.content.git`, public).
- The app reads `content/posts/` at render time, so pages error with `ENOENT` if the submodule is not populated.
- The build script runs `git submodule update --init` to populate the pinned content commit. Use `pnpm run content:update` only when intentionally advancing the submodule pointer.

### Node version gotcha (important)

- `package.json` `engines` requires Node `24.x`.
- The VM's `node` on `PATH` is v22 (provided at `/exec-daemon/node`) and it shadows nvm even after `nvm use`.
- A one-time entry in the agent's `~/.bashrc` prepends nvm's Node 24 `bin`, so login/interactive shells (including tmux sessions) get Node 24. Run `pnpm dev` / `pnpm build` from a login shell (e.g. `bash -l`) so Node 24 is active.
- `pnpm` is installed under Node 24 (via `npm i -g pnpm@10`). `pnpm install` also works under Node 22 (native deps are N-API/ABI-stable), which is why the update script does not force a Node switch.

### Listing pages read content during rendering

- The homepage (`/`) and `/notes` read their post lists inside their Server Component functions, so development requests see content changes without a server restart.
- Production listings opt into indefinite revalidation because each deployment is built from the content commit pinned by the parent repository.

### Content pipeline scripts

- `pnpm run assets` copies `content/assets` → `public/assets` (needed for images to load locally).
- `pnpm run rss` generates `public/feed.xml` (needed to test `/feed.xml`).
- `pnpm run photos` processes new originals in `content/assets/originals/` (only when adding photos).
- `pnpm build` runs the submodule update + `assets` + `rss` + `next build`; prefer `pnpm dev` for development.

### Lint

- `pnpm lint` (`eslint .`) — passes clean on a fresh setup.
