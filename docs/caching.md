# Content caching

The site enables Next.js Cache Components. Cache scopes use `use cache` and
explicit `cacheLife` policies instead of route-level `revalidate` or `dynamic`.

- `lib/api.tsx` caches the validated Markdown index with `cacheLife('max')`.
  Public content readers are asynchronous. They still project only requested
  fields, and callers must await them.
- `lib/photo-gallery.ts` caches sorted photo groups with the same policy.
  `/photos?page=N` resolves its query before revealing the destination. This
  route explicitly sets `instant = false`: a streamed loading fallback breaks
  the existing photo morph and scroll-restoration timing. The data remains cached;
  only the query-dependent page waits. Pagination, cumulative windows, canonical
  URLs, and scroll restoration retain their existing behavior. Scrolling fetches
  only the next 24 groups from `/api/photos?page=N`, appends them in place, and
  uses native `history.replaceState` to update the URL without an RSC navigation.
  The endpoint reuses the cached index, with `no-store` HTTP responses so a browser
  cannot reuse a previous deployment's batches. Failed or interrupted requests
  leave the current cards and URL intact; retry and full-reload links are offered.
  Without JavaScript the next-page link renders the cumulative window as before.
- The homepage caches its rendered content with a 180-second revalidation
  interval, 180-second client stale time, and a one-hour hard expiry. The random
  fact and selection of photos change when the homepage cache regenerates.
- Syntax highlighting caches tokens by source text and language with the `max`
  profile. Shiki's internal clock access remains inside that cache boundary.
- `/api/music` calls `connection()` before reading credentials or signing tokens.
  It stays outside the content cache: valid results live in instance memory for
  4 minutes, failures clear the previous song and retry after 15 seconds, and
  HTTP responses use `no-store`. The browser polls every 4 minutes, with an
  8-second timeout and no stale fallback. Node.js remains the default runtime.

Next includes the build ID in `use cache` keys. Publishing Markdown still requires
a new deployment using the updated, pinned content submodule revision. Long-lived
content caches therefore do not carry the previous build's index into a new one.
The `max` profile is finite (30-day background revalidation, one-year expiry), not
an instruction to publish filesystem edits without rebuilding.

The default `use cache` runtime storage is in memory; it is not a global singleton
across server instances and may be evicted. A miss recomputes from the deployed
content. No remote cache service or database is needed.

During local Markdown editing, restart the dev server to clear cached content;
rerun assets/feed generation when needed. Changes to application code also
invalidate cache entries through development HMR.

Validation: `pnpm check`, `pnpm build`, `pnpm metadata:test`, and `pnpm smoke:test`.
Keep the gallery append, Back, refresh, collection-return and image-transition
tests: Cache Components preserves route state through React Activity boundaries.
