# Feed

`/feed.xml` is the public Atom document for the journal. A subscriber fetches it; they do not render it inside the site chrome.

## Sub-features

- `feed-available` serves `/feed.xml` as XML with a 200.
- `feed-identity` names mamuso.dev in the document.
- `feed-entries` includes at least one entry whose title matches a known post.
- `feed-discovery` advertises the feed from the homepage HTML.

## How to get to it (user POV)

- Request `https://mamuso.dev/feed.xml` (locally `$BASE/feed.xml`).
- Discover it from the homepage `<link rel="alternate" type="application/rss+xml" title="mamuso.dev RSS">`.

## Driving it with control-mamuso

Preconditions:

- mamuso.dev is healthy at `$BASE`.
- `public/feed.xml` exists (helper generates it with `pnpm run rss` when missing).

- **Fetch.** Run `.cursor/skills/verify-mamuso-dev/bin/control-mamuso curl --path /feed.xml --out .cursor/skills/verify-mamuso-dev/artifacts/feed/feed.xml`. Status is `200`. `content-type` includes `xml`.
- **Identity.** The saved body contains `<title>mamuso.dev</title>` (or a title element whose text is `mamuso.dev`) and a feed id/link for `https://mamuso.dev`.
- **Entry.** The body contains `Cozy` or another title that also appears in the notes archive.
- **Discovery.** `GET $BASE/` HTML includes `rel="alternate"` and `mamuso.dev RSS` pointing at a `feed.xml` href.
- **Proof.** Keep the saved `feed.xml` body. Also save curl stdout as `.cursor/skills/verify-mamuso-dev/artifacts/feed/headers.txt`.

## Gotchas

- The file is Atom (`atom1()`), even though the HTML alternate type says RSS and the path is `feed.xml`. Assert XML + site title, not `rss version=`.
- Item links inside the feed use `/post/<slug>`, which permanently redirects to `/note/<slug>`. That is the published feed shape; do not fail feed verification because links are not `/note/`.
- `pnpm run rss` is the generator. A missing `public/feed.xml` after a clean checkout is an environment gap; generate it, then prove the HTTP path.
- Do not treat unit tests in `tests/feed.test.ts` as a substitute for `GET /feed.xml` on the running server.
