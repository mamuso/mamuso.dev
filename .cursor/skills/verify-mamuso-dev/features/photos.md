# Photos

Photos is a gallery of stills. Choosing one opens a photo note with the image, camera/exposure lines, and optional caption.

## Sub-features

- `photos-gallery` lists images on `/photos` under `Say Cheese`.
- `photos-open` opens a gallery still into `/note/<slug>`.
- `photos-meta` shows camera and exposure lines on the photo note.
- `photos-asset` serves the underlying `/assets/feed/...` image as 200.

## How to get to it (user POV)

- Choose `pics` in the header.
- Open `/photos`.
- Open a photo note URL such as `/note/2024-07-15-DSCF8915`.

## Driving it with control-mamuso

Preconditions:

- mamuso.dev is healthy at `$BASE`.
- `public/assets/feed/` contains processed images (helper runs `pnpm run assets` when `public/assets` is missing).
- `content/posts/2024-07-15-DSCF8915.md` exists (title `Psycobolic Shadow`). If missing, pick another gallery still and substitute.

- **Header entry.** From `$BASE/`, click `pics`. Heading `Say Cheese` appears. Multiple images with non-empty `alt` are listed.
- **Open still.** Click the image named `Psycobolic Shadow` (alt text). The path contains `/note/2024-07-15-DSCF8915`. An `article` heading reads `Psycobolic Shadow`. An image with that alt is visible.
- **Meta.** On that article, list items include `FUJIFILM X-T5`, `ƒ/1.4`, and `ISO 400`.
- **Asset bytes.** Run `.cursor/skills/verify-mamuso-dev/bin/control-mamuso curl --path /assets/feed/2024-07-15-DSCF8915.jpg`. Status is `200` and `content-type` starts with `image/`.
- **Proof.** Screenshot the gallery and the opened photo. Save `.cursor/skills/verify-mamuso-dev/artifacts/photos/gallery.png`, `.cursor/skills/verify-mamuso-dev/artifacts/photos/photo.png`, and `.cursor/skills/verify-mamuso-dev/artifacts/photos/gallery.aria.txt`. The gallery artifacts show `Say Cheese`; the photo artifacts show `Psycobolic Shadow` and the camera line.

## Gotchas

- Gallery thumbs are `/assets/feed/gallery-<basename>`; the note uses `/assets/feed/<basename>`. A 200 on one does not prove the other.
- If `public/assets` was not copied, the gallery headings still render and every image is broken. Doctor does not check assets. A missing image is a failed photo proof, not a failed doctor.
- Do not use `pnpm run photos` during verification. That processes originals and writes Markdown into the content submodule.
- Photo dates have the same timezone caveat as notes. Assert title, image, and camera lines.
