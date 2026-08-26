# Notes archive

The notes archive lists every journal entry grouped by year, and an expand-all path shows full notes twenty at a time with previous/next links.

## Sub-features

- `archive-years` groups entries under year headings on `/notes`.
- `archive-open` opens a note from a year list.
- `archive-expand` follows `Expand all notes ↓` into the paginated view.
- `archive-paginate` walks `Next →` and `← Previous` without dropping the header chrome.

## How to get to it (user POV)

- Choose `notes` in the header.
- Choose `View more →` on the homepage Journal section.
- Open `/notes` or `/notes/1` directly.

## Driving it with control-mamuso

Preconditions:

- mamuso.dev is healthy at `$BASE`.
- `content/posts/` contains more than twenty Markdown files (paginated view has a next link).

- **Header entry.** From `$BASE/`, click `notes`. A heading `Journal` appears, `Expand all notes ↓` is present, and at least one year heading (`h3`, four digits) precedes a list of note links.
- **Homepage entry.** From `$BASE/`, click `View more →`. The same `Journal` archive appears.
- **Open from a year.** Under a year heading, click `Cozy` (or another listed title; record it). The article heading matches.
- **Expand all.** Return to `/notes` via `notes`. Click `Expand all notes ↓`. The path is `/notes/1`. Full notes render as `article` elements with headings and `Next →` is present. `← Previous` is absent on page 1.
- **Next page.** Click `Next →`. The path is `/notes/2`. `← Previous` is present. At least one `article` heading is visible and is not a duplicate of only page 1 if you recorded page 1 titles.
- **Previous page.** Click `← Previous`. The path is `/notes/1` again and `Next →` returns.
- **Proof.** Snapshot and screenshot the year archive (not a single note). Save `.cursor/skills/verify-mamuso-dev/artifacts/notes-archive/years.aria.txt` and `.cursor/skills/verify-mamuso-dev/artifacts/notes-archive/years.png`. Both show `Journal`, a year heading, and `Expand all notes ↓`.

## Gotchas

- `/notes` is the compact year index. `/notes/1` is the expanded paginated dump. Do not treat them as the same view.
- Pagination links are `← Previous` and `Next →` (arrow characters included).
- Expanded pages render photos and notes inline; a long page is expected. Scroll to the pagination nav at the bottom before clicking Next.
- Year grouping uses `new Date(post.date).getFullYear()`. A date-only string can land in the previous calendar year in US timezones. Assert that year headings exist and notes are listed; do not assert a slug's year folder against the heading without checking the rendered date.
