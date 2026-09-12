# mamuso.dev verification map

This directory is the maintained source for verifying user-facing behavior of mamuso.dev. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-mamuso-dev/bin/control-mamuso launch` so the instance is isolated (default `http://127.0.0.1:3010`).
- Run `control-mamuso doctor` and require `ok pid=… url=http://127.0.0.1:3010`.
- `content/posts/` is populated (submodule init). `public/assets` and `public/feed.xml` exist (the helper creates them if missing).
- Never drive an instance that was not started by this verification run.
- Content is pinned by the parent repo gitlink. Do not run `git submodule update --remote` as part of verification.

## Driving conventions

- Start every recipe from `$BASE/` unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names (`mamuso`, `notes`, `pics`, `View more →`) over CSS selectors or canvas coordinates.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Run browser actions through cursor-ide-browser against `$BASE`.
- Run HTTP actions through `control-mamuso curl`.
- The UI does not mutate content. There is no fixture restore step. Do not delete proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with the `mamuso` header visible.
- HTTP proof includes status, headers, and the body (or a named excerpt).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with control-mamuso` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Homepage](./homepage.md) covers identity, recent journal, header home, and the cartridge canvas.
- [Notes archive](./notes-archive.md) covers the year index, expand-all, and pagination.
- [Read a note](./note.md) covers opening a written note from the list and by URL, including the legacy `/post/:slug` redirect.
- [Photos](./photos.md) covers the gallery, a photo note, EXIF-style meta, and image bytes.
- [Feed](./feed.md) covers `/feed.xml` as the public Atom document.
