# Long-article font verification

Follow-up to [the font audit](fonts.md), using the same pinned content
`3bb568ae7a4b6bd081025c79146d03cb9f7da9f4`. The baseline production build uses
the original PhotoMeta font loader from `368afe6`; the optimized production
build uses `9a072f7`. No content, fallback fonts or font-display behavior changed.
Both were built with Node 24.22.2 and captured in Chrome 156 on macOS, DPR 1,
at 1280×900 and 390×900.

The two longest published notes are Imperfection (approximately 2,000 words)
and Push to talk. Two shorter articles add code, strong text and embedded-media
coverage. All screenshots include the complete page, with article images eagerly
loaded and decoded. The mobile Imperfection screenshot is 13,084px tall. Video,
iframe and canvas regions are hidden identically in both builds; text and static
article images are retained. External requests are blocked on both builds.

| Article | Desktop changed pixels | Mobile changed pixels | Font bytes before → after |
| --- | ---: | ---: | ---: |
| [Imperfection](https://mamuso.dev/note/imperfection) | 502,326 initially; **0 on a fresh same-build capture** | 0 | 144,044 → 0 |
| [Push to talk](https://mamuso.dev/note/push-to-talk) | 0 | 0 | 144,044 → 0 |
| [Light/Dark mode, the CSS-variable way](https://mamuso.dev/note/2021-06-30-dark-mode-cssvars) | 191,227, entirely inside the animated GIF | 0 | 144,044 → 0 |
| [Design advice from Bill Hader](https://mamuso.dev/note/2023-08-23-design-advice-from-bill-hader) | 0 | 0 | 144,044 → 0 |

Across 32,325,990 pixels in the eight original comparisons, **six complete
screenshots are pixel-identical and all eight have zero changed pixels outside
images**. Page dimensions are identical in every comparison. No text, code,
heading, punctuation, emphasis or surrounding layout differences were found.
The optimized pages have no font preload links and no font network requests.

The remaining differences were investigated individually:

- The desktop CSS article contains an 85-frame animated GIF. Its 191,227 changed
  pixels are entirely inside that GIF's rectangle, `(160,257)`–`(1120,857)`.
  These are different animation frames, not a content edit or font regression.
- Imperfection's initial desktop differences are confined to resized article
  illustrations. A fresh browser context on the **same optimized build** produces
  a screenshot pixel-identical to the baseline. Compared with the initial
  optimized screenshot, that repeat reproduces the exact same 502,326 differing
  image pixels. This establishes image rasterization/resampling variability
  independent of the font change; no image or text change was shipped. Unlike
  the original gallery's two rounding pixels, this is not dismissed as a tiny
  channel-value tolerance.

Evidence committed alongside this report:

- [Baseline requests and faces](fonts/long-baseline-pages.json)
- [Optimized requests, faces and loaded-image rectangles](fonts/long-after-pages.json)
- [Exact full-page diff counts](fonts/long-pixel-diffs.json)
- [Per-image classification and same-build repeat result](fonts/long-diff-review.json)

Screenshots, snapshot and diff PNGs remain locally under
`output/verification/fonts/long-articles/`, including the separate
`imperfection-same-build-repeat.png`. The raw initial screenshots are preserved;
none were replaced with the more favorable repeat. The rectangle review checks
that each recorded image loaded successfully and that **every** differing pixel
is inside an image; it uses no blanket pixel tolerance.

To repeat, build and start each revision on port 3117 as in the main audit, keep
the content revision fixed, and run `scripts/capture-long-articles.js` through
the Playwright CLI. Set its `phase` to `baseline` or `after` for the respective
build and create both directories first. It returns the request logs and image
rectangles. Save the returned JSON as the corresponding `long-*-pages.json`.

```sh
/tmp/mamuso-font-tools/bin/python scripts/diff-fonts.py \
  output/verification/fonts/long-articles/baseline \
  output/verification/fonts/long-articles/after \
  output/verification/fonts/long-articles/diff
/tmp/mamuso-font-tools/bin/python scripts/review-long-article-diffs.py
```

The exact diff exits nonzero for the documented media differences. The review
script verifies the recorded image-region classification and expects the
separately captured same-build Imperfection repeat. The diff utility now streams
pixel counts so very tall article screenshots do not require a Python tuple
for every pixel. Application and generated-font files are unchanged by this
follow-up. Production builds, ESLint and both pixel-classification assertions
passed. This evidence has the same browser/OS scope as the original audit.
