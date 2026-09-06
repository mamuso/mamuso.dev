# Photo inbox

Use Node 24 and the pinned pnpm version. Run `pnpm install` after updating.

1. Run `pnpm photos` once to create `photo-inbox/` and `.photo-import/`.
2. Drop exported photos in `photo-inbox/`, then run `pnpm photos` again.
3. Open `.photo-import/review.html` to see thumbnails, dates, palettes and links to each draft and extracted EXIF.
4. Run `pnpm photos --review` in a terminal to set titles, slugs and dates. Alternatively edit each `.photo-import/<ID>/draft.md`, including an optional caption below the frontmatter. Run `pnpm photos` again to refresh the review page.
5. Run `pnpm photos --publish ID` for one photo, or `pnpm photos --publish all` for all prepared drafts. Incomplete drafts report errors; other valid drafts can still publish. This writes into the content checkout and refreshes assets and feed. It does not commit, push or deploy.

Dates use the camera's local calendar date, without conversion through the computer's time zone. Missing dates require an explicit editorial choice. Title and slug are deliberately left empty until review; the terminal suggests a slug from your title. Published URLs and existing content are never overwritten.

## Processing

- Sharp applies EXIF orientation (including mirroring), converts to sRGB and fits the full image within 2048 × 2048 without enlarging or cropping it. Gallery images retain the existing maximum height of 640. Dimensions come from the generated web image.
- A palette of up to eight representative colors is quantized from an sRGB thumbnail. Solid-color photos can have fewer colors; white is retained.
- ExifTool extracts camera, capture date, ISO, aperture, exposure compensation, exposure time and signed GPS coordinates. Missing values are omitted, and long exposures retain their duration. The complete returned tag object is saved locally as `exif.json`. The published Markdown still includes GPS when present, as before.
- JPEG, PNG, WebP, AVIF and TIFF are accepted. HEIC/HEIF are attempted, but decoding depends on the installed Sharp/libvips build; unsupported codecs produce a per-file error. RAW development and nested inbox folders are not supported. Export RAW/unsupported HEIC to JPEG with metadata first.
- Original files are never moved or deleted. Both local folders are Git-ignored and are not copied to the website. The asset copier also excludes legacy `content/assets/originals/`.

## Retrying and recovery

Each original is identified by its full SHA-256 hash. Renaming identical bytes does not create a second draft; re-exporting a photo with different bytes does. Keep `.photo-import/` to retain publication status and your edits. Back it up with the originals if needed.

Preparations write images and metadata before marking the record prepared. Failures stay in the report and set a nonzero command exit status. Rerun `pnpm photos` to retry failures or repair missing preparation files; existing Markdown edits remain intact. Metadata extraction errors become warnings, so an otherwise readable image can still be prepared.

Publishing installs images before Markdown and refuses to overwrite differing destination files. An interrupted publication can resume if its existing files match. If only asset/feed refresh failed, rerun the same publish command. An active-process lock prevents simultaneous imports; a lock left by an exited process is recovered automatically.

Existing published photos are unchanged. For old originals, the new hash registry has no historical mapping: do not copy the entire legacy originals archive into the inbox without reviewing for already published photos.

Run `pnpm photos:test` for orientation, EXIF, palette, duplicate and publication recovery checks. Test real camera exports before publishing a large batch. The Atom feed currently excludes photo posts; this importer preserves that existing policy.
