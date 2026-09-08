# Photo gallery budget

The gallery initially renders **24 cards**, with at most six previews per stack.
An IntersectionObserver requests the next cumulative window 400px before the end.
`/photos?page=2` represents the first 48 cards, including on a fresh visit. Automatic
loads replace the current history entry and preserve scroll; opening a viewer still
pushes an entry, so Back returns to the loaded gallery. Without JavaScript, a
`noscript` pagination link remains available. No virtualizer or scroll listener is used.

Miniatures have explicit responsive CSS dimensions calculated from the source aspect
ratio (long edge 120px / 160px). The HTML image attributes alone were insufficient:
`width: auto; height: auto` with only maximum sizes produced zero-size content before
the image loaded. Collection images also reserve their ratio and width, excluding
the frame border from the image aspect ratio.

## Baseline and budgets

Local production measurements, September 2026. Chrome with a 390×844 viewport,
4× CPU slowdown, 150ms network latency, 1.6Mbps throughput and an empty HTTP cache.
Image requests were held until the unloaded geometry was captured, then released.
These are controlled local measurements, not field Web Vitals or a physical phone.
Raw captures: [benchmarks/photo-gallery.json](benchmarks/photo-gallery.json).

| Metric | Before | Initial window | Entire gallery after fix |
| --- | ---: | ---: | ---: |
| Cards | 286 | 24 | 286 |
| Image elements | 333 | 39 | 333 |
| DOM elements | 1,899 | 247 | 1,895 |
| HTML, uncompressed | 1,406,421 B | 201,969 B | 1,487,257 B |
| HTML, gzip | 91,639 B | 19,209 B | 94,466 B |
| Loading layout-shift sum | 0.097 | 0 | 0 |
| DOMContentLoaded | 1,407ms | 629ms | 1,380ms |
| First responding photo handler | 1,590ms | 1,360ms | 1,562ms |
| Scroll frame interval, p95 | 16.7ms | 16.7ms | 16.7ms |
| Initial fetch resources | 22 | 22 | 22 |

The loading shift metric sums non-input layout shifts during the controlled image
load; it is not a whole-session CLS score. Scroll intervals and interaction timing
are noisy: these samples show stable scrolling, not a proven improvement in frame
rate. Prefetch remains enabled for normal photo links because the measurement did
not show hundreds of speculative requests.

Review targets for this content set and protocol:

- Initial window: 24 cards; ≤144 preview images even if every card is a stack.
- Initial HTML: ≤250KB raw / ≤25KB gzip; ≤900 DOM elements.
- No image-size changes or content layout shifts when delayed images arrive.
- First responding photo handler within 2s under the stated emulation.
- Scroll p95 below 25ms, with no new long tasks caused by continuous scrolling.
- Existing DOM nodes, focus, scroll and photo interaction state survive appended windows.

A complete visit can still accumulate the full gallery DOM. Each Next.js request
renders the cumulative prefix; this makes direct URLs and Back straightforward but
means later responses grow. Profile this tradeoff again if many users browse the
whole archive or it grows substantially. Do not introduce virtualization solely
because the archive has more photos. A separate cursor endpoint would be the next
option if cumulative response cost becomes material.

## Repeat the measurements

Use Node 24. Start an isolated production server and dedicated browser:

```sh
pnpm build
pnpm start --port 3102
npx agent-browser --session gallery-budget open http://localhost:3102/photos
npx agent-browser --session gallery-budget get cdp-url
node scripts/profile-gallery.mjs <returned-cdp-url> initial
node scripts/profile-gallery.mjs <returned-cdp-url> full '/photos?page=12'
node scripts/profile-gallery.mjs <returned-cdp-url> collection /photos/stack/japan-cars
```

The profiler writes JSON and an unloaded screenshot to `/tmp/gallery-<label>*`.
`GALLERY_PROFILE_ORIGIN` overrides the default server. Use a dedicated browser because
it changes viewport, cache and network settings. Close it after profiling.

```sh
node --test lib/photo-gallery-window.test.mjs app/components/photoInteraction.test.mjs
pnpm metadata:test
```

Window tests cover 286, 2,860 and 28,600 cards, invalid URLs, empty galleries and the
last batch. They verify the initial bound independently of library size; they do not
simulate filesystem reads or hydrate 28,600 cards.

Browser checks performed: 24 → 48 cards without scrolling or replacing the existing
first card; preserved `data-opened` interaction state; unchanged history length;
photo viewer → Escape restored `/photos?page=2`, 48 cards, focus and scrollY 1943.
Also verified: a fresh `/photos?page=2` visit with 48 cards; collection viewer and
Back with focus restored; desktop thumbnails at 160px without horizontal overflow;
disabled JavaScript with 24 sized cards and a working next-page URL. Repeat these
checks when changing routing or the infinite-scroll controller.
