# Read a note

A written note is an article with a title, a full date line, and Markdown body. The same note is reachable from lists, a canonical `/note/<slug>` URL, and a permanent redirect from `/post/<slug>`.

## Sub-features

- `note-from-list` opens a note from the homepage or archive list.
- `note-canonical` loads `/note/2023-08-21-cozy` as an article titled `Cozy`.
- `note-body` shows the Markdown body (not an empty article).
- `note-legacy` redirects `/post/2023-08-21-cozy` to `/note/2023-08-21-cozy`.

## How to get to it (user POV)

- Choose a note title in the homepage Journal list or the notes archive.
- Open `/note/2023-08-21-cozy`.
- Open a bookmarked `/post/2023-08-21-cozy` URL.

## Driving it with control-mamuso

Preconditions:

- mamuso.dev is healthy at `$BASE`.
- `content/posts/2023-08-21-cozy.md` exists (title `Cozy`). If the gitlink has moved, pick another `category: note` post from the live archive and substitute its title and slug throughout this recipe.

- **List entry.** From `$BASE/notes`, click `Cozy`. The path contains `/note/2023-08-21-cozy`. An `article` heading reads `Cozy`.
- **Canonical URL.** Navigate to `$BASE/note/2023-08-21-cozy`. Same article heading. A `time` element is present. The body includes the word `Retro`.
- **Legacy redirect (HTTP).** Run `.cursor/skills/verify-mamuso-dev/bin/control-mamuso curl --path /post/2023-08-21-cozy`. Status is `308` (or `301`) and `location` ends with `/note/2023-08-21-cozy`.
- **Legacy redirect (browser).** Navigate to `$BASE/post/2023-08-21-cozy`. After follow, the article heading is `Cozy` and the path is `/note/2023-08-21-cozy`.
- **Proof.** Snapshot and screenshot the article. Save `.cursor/skills/verify-mamuso-dev/artifacts/note/cozy.aria.txt` and `.cursor/skills/verify-mamuso-dev/artifacts/note/cozy.png`. Both show header `mamuso` and heading `Cozy`. Save the redirect headers as `.cursor/skills/verify-mamuso-dev/artifacts/note/legacy-redirect.txt` (the curl stdout).

## Gotchas

- Photo posts also live under `/note/<slug>`. This feature is the written note. Use [Photos](./photos.md) for `category: photo`.
- Some notes include a `basename` image (for example `Hello dns!`). Title plus body still prove the note; do not require a hero image on `Cozy`.
- Feed item links historically point at `/post/<slug>`. A subscriber clicking a feed URL should land on the note via this redirect — that is expected, not a broken canonical.
- `curl` without `-L` is required to see the 308. The browser follows it automatically.
