# Content contract

`pnpm content:check` validates the same index used by the application. It runs
first in `pnpm check`, so CI and Vercel fail before building invalid content.
Errors identify the Markdown filename and field. Images are checked in
`content/assets/feed`, not the generated `public/assets` copy.

Every entry needs a non-empty title and a valid `YYYY-MM-DD` date. Entries without
a category normalize to `note`; legacy `code` entries remain writing. Photos
require a basename and positive integer width/height. Illustrated notes have the
same image requirements. Basenames must be filenames and reference existing files.
Dimensions describe the editorial image; validation does not compare them with
resized feed derivatives or decode every image at each index read.

EXIF fields are optional. ISO, aperture, exposure bias and GPS are finite numbers;
GPS coordinates must form a valid pair. Exposure time keeps its textual fraction
(e.g. `1/125`). Legacy GPS strings `NaN` represent missing coordinates and normalize
to `undefined`. Zero coordinates and zero exposure bias remain valid data.

A photo stack needs a URL-safe identifier and a non-empty title. All members must
agree on the title. Optional ordering is a non-negative integer; equal or absent
positions retain the existing relative order. Notes cannot join photo stacks.
Canonical slugs and filename aliases keep the same collision checks and routes.

## Selecting fields

```ts
const summary = getPostBySlug(slug, ['title', 'date'])
summary.title // string
summary.content // TypeScript error: not selected

const photo = getPhotoPosts(['width', 'iso'])[0]
photo.width // number
photo.iso // number | undefined
```

Selections include exactly their requested keys, even when a selected optional
value is `undefined`. `SelectedPost` preserves the note/photo and image/no-image
unions so narrowing by category or basename remains useful. `POST_DETAIL_FIELDS`
and `PostDetail` define the full-post component's contract; `PostSummary` defines
archive rows. Compile-time regression checks live in `tests/types/content-selection.ts`.
