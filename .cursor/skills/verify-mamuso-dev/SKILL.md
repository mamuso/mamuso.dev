---
name: verify-mamuso-dev
description: Drive the mamuso.dev Next.js journal in a real browser and over HTTP to prove homepage, notes, photos, feed, and legacy-URL behavior. Use when verifying UI or routing changes, after content-pipeline edits, or when a proof of user-visible behavior is required.
---

# Verify mamuso.dev

mamuso.dev is a filesystem-backed personal journal. There is no auth, database, or write API. A user reads notes and photos in the browser, follows header nav, and may subscribe to `/feed.xml`. Proof means driving those surfaces, not calling `lib/api.ts` from a script.

Content lives in the `content/` git submodule. Listing pages currently read posts at module load, so a running `pnpm dev` will not pick up new Markdown until the server restarts. Do not treat a stale listing as a content-pipeline failure.

## Launch

Use the helper. It starts an isolated Turbopack server on `127.0.0.1:3010` by default and will not bind to an occupied port.

```bash
.cursor/skills/verify-mamuso-dev/bin/control-mamuso launch
.cursor/skills/verify-mamuso-dev/bin/control-mamuso doctor
BASE="$(.cursor/skills/verify-mamuso-dev/bin/control-mamuso url)"
```

Ready means `GET $BASE/` returns 200 within 60s and the HTML contains `mamuso` plus `Manuel Muñoz Solera`. The helper runs `git submodule update --init` (never `--remote`), `pnpm install`, copies assets if `public/assets` is missing, and generates `public/feed.xml` if missing. Always install even when `node_modules` already exists: a stale tree is how StyleX/Next fail with 500s.

Override isolation with `--port` / `--host` or `VERIFY_MAMUSO_PORT` / `VERIFY_MAMUSO_HOST`. Node must be 24.x; the helper starts the server from a login shell so nvm Node 24 wins over a shadowed v22.

Do not attach to `localhost:3000` unless this run started it. Two instances can share the read-only content tree on different ports. Never drive a server you did not launch.

Teardown: `control-mamuso cleanup`. That kills only the pid recorded at launch.

## Doctor

```bash
.cursor/skills/verify-mamuso-dev/bin/control-mamuso doctor
```

Pass conditions: recorded pid is alive, the bound port belongs to that pid or a child, `GET /` is 200, homepage HTML contains the site name and identity heading. Run doctor before the first drive, after any failed drive, and whenever the UI looks wedged. A doctor failure is not a feature failure.

## Drive

Browser: cursor-ide-browser MCP (`browser_navigate`, `browser_lock`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`, `browser_unlock`). HTTP: `control-mamuso curl`. Recipes live in `features/`. Start from `$BASE/` unless a feature file says otherwise.

Stable handles (prefer these over CSS or coordinates):

| Handle | Kind | Where |
| --- | --- | --- |
| `mamuso` | link | header home (`/`) |
| `notes` | link | header (`/notes/`) |
| `pics` | link | header (`/photos/`) |
| `View more →` | link | homepage Journal (`/notes`) |
| `Expand all notes ↓` | link | notes archive (`/notes/1`) |
| `← Previous` / `Next →` | links | paginated archive (`/notes/<n>`) |
| `Cozy` | link or heading | note `2023-08-21-cozy` |
| `Psycobolic Shadow` | image alt / heading | photo `2024-07-15-DSCF8915` |

Click by accessible name. Header `h1` text is `mamuso`. Notes archive groups by year `h3`. A note page is an `article` whose `h2` is the title.

The cartridge stack is a WebGL canvas on `/` only. It has no ARIA controls. Prove presence with a screenshot of the canvas region on the homepage; do not report mesh click/hover as keyboard-verified. `/notes` and `/photos` must not show the canvas.

## Evidence

Write under `.cursor/skills/verify-mamuso-dev/artifacts/<feature-id>/`. Keep that tree across cleanup.

Proof standards:

- Exercise the real user path (nav click or typed URL the user would use). Do not import `getPostBySlug` as a substitute for a page load.
- Capture the action and the resulting state: ARIA snapshot plus screenshot with `mamuso` visible in the header, or HTTP status/headers/body for feed and redirects.
- Side effects on this app are almost none (read-only). For redirects, prove the `Location` header. For the feed, prove the body is Atom and names the site. For photos, prove the `<img>` loads (status 200 on `/assets/feed/...`, or a screenshot where the image is visible).
- Record the feature id and entry point on every artifact.

In `pnpm dev`, dismiss the Next.js hydration overlay before driving clicks. `browser_take_screenshot` may time out on the WebGL cartridge canvas; keep ARIA + HTML and retry the screenshot once.

Mocks are not used. There is no test-only endpoint to hit instead of the page.

## Cleanup

```bash
.cursor/skills/verify-mamuso-dev/bin/control-mamuso cleanup
```

Stops the launch pid (and its process group). Leaves `/tmp/verify-mamuso-dev/next.log` and everything under `artifacts/` in place. Never `pkill -f next` / `pnpm`. After cleanup, confirm artifacts still exist at the paths you wrote.

## Helpers

All commands are run from the repo root. The script is executable.

```bash
.cursor/skills/verify-mamuso-dev/bin/control-mamuso launch [--port 3010] [--host 127.0.0.1]
.cursor/skills/verify-mamuso-dev/bin/control-mamuso doctor
.cursor/skills/verify-mamuso-dev/bin/control-mamuso url
.cursor/skills/verify-mamuso-dev/bin/control-mamuso curl --path /feed.xml --out .cursor/skills/verify-mamuso-dev/artifacts/feed/feed.xml
.cursor/skills/verify-mamuso-dev/bin/control-mamuso cleanup
```

HTTP helper prints `status=`, `content-type=`, and `location=` when present.
