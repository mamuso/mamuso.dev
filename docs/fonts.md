# Manual web-font subsets and visual proof

The browser downloads Courier Prime only for photo metadata. The rest of the
site uses system fonts. Generated WOFF2 files, CSS, preload URLs and the inventory
are committed; font processing is **not** part of install, dev, build or CI.

## Rerun

From the repository root, with the pinned content submodule populated:

```sh
python3 -m venv /tmp/mamuso-font-tools
/tmp/mamuso-font-tools/bin/pip install -r scripts/requirements-fonts.txt
/tmp/mamuso-font-tools/bin/python scripts/subset-fonts.py
```

Commit `public/fonts/`, `app/fonts/courier-prime/{subsets.css,preloads.ts}` and
`docs/fonts/inventory.json`. Keep the original TTFs as reproducible source and
keep the OFL alongside the distributed fonts. Generated names include a content
hash, so a changed font gets a new URL.

Rerun after updating content (including photo titles/camera fields), changing
font source files, or changing strings in app components/data. Re-audit the
script's font/feature/core policy when changing language, inline font settings,
weights, italics, typography CSS, hyphenation or font families. It deliberately
fails for variable source fonts rather than silently pinning unknown axes.
New glyphs the original font never supported must continue to use the existing
fallback; this script never invents glyphs or adds a CJK font.

The scan covers Markdown/frontmatter, TS/TSX (including component inline styles
and strings), CSS and HTML entities. It conservatively retains all source
characters supported by the original fonts, plus their existing Latin-1 and
Latin Extended-A coverage. This is a source superset, not a claim that all those
characters currently render in Courier Prime. Exact retained ranges are in
`inventory.json`. Requested-but-missing characters are recorded there too.

Core = supported printable ASCII, curly quotes, en/em dashes and ellipsis.
Extended = the remaining retained characters. Character aliases retained by
fontTools are explicitly pruned; each output is reopened and its actual cmap
must exactly equal its requested subset. The script also checks disjoint parts,
coverage, every decomposed outline, every advance/sidebearing, vertical metrics,
TrueType hint programs and font-wide hint tables against the original.

## Audit and loading behavior

Baseline: parent `368afe6c1092138e10cff1167aa42909f0c6628b`, pinned content
`3bb568ae7a4b6bd081025c79146d03cb9f7da9f4`. Both builds use that same content.
Node 24.22.2, Next 16.3.8, Chrome 156 on macOS; 1280×900 and 390×900, DPR 1.

| Original font | Bytes | Glyphs / mapped characters | Axes | OpenType | Hinting |
| --- | ---: | --- | --- | --- | --- |
| Courier Prime Regular | 71,188 | 415 / 383 | none | GSUB: aalt, case, frac, locl, ordn, sups; no GPOS | 313 glyph programs; fpgm, prep, cvt, gasp |
| Courier Prime Bold | 72,856 | 415 / 383 | none | same | same |
| SF Pro Display Medium Latin | 70,704 | 499 / 505 | none | GPOS kern | CFF private hint parameters; no TrueType programs |

SF Pro is read only by `lib/social-image.tsx` to rasterize OG images. It is not
a web font, has no preload and contributes **zero browser font bytes**. It is
left intact; splitting it would not improve page font loading and would change
the independent Satori image-generation path.

`app/globals.css` and `app/styles/tokens.stylex.ts` use system-ui. CodeBlock has
its own ui-monospace stack and inline token overrides for italic/700/underline.
Post headings use 500/600; browser Markdown strong/em can use bold, italic and
bold italic. BlankNoteYear is italic. Cartridge captions use the system family
and tabular numerals. None of these need Courier Prime or axis trimming.

PhotoMeta alone sets the web family. Its paper explicitly sets 400; its heading
inherits 400 rather than the browser h3 bold default. Metadata requests
`tabular-nums`, but Courier Prime contains no tnum feature and is already
monospaced. It has no italic face or variable axes. No live metadata markup
requests bold, italic, or bold italic. The original bold face is retained and
its core is preloaded as requested; the proof fixture exercises synthesized
italics and nested bold inside italics using the original available faces.

There are no font-feature-settings, font-variation-settings or `hyphens: auto`
rules in app or content. U+2010 is nevertheless requested by the script, but is
absent from both originals, so adding it would change fallback rendering.
Document language is `en`; no nested language overrides were found. The six
GSUB features are unused opt-ins except locl, whose substitutions target
CAT/MOL/ROM rather than English. They are removed. No kerning table is removed
from these fonts because none exists. Font sources and all output tables,
features, coverage and hashes are in [the inventory](fonts/inventory.json).

`font-display: swap` is unchanged. The stack remains real Courier outlines,
Next's adjusted Arial fallback, Courier New, Courier, monospace. The generated
fallback uses the same 59.45% ascent, 26.01% descent, 0% gap, 131.41% size adjust;
the script recomputes these from the source with Next 16.3.8's formula. Core and
extended share **one** first family, with the adjusted fallback after both;
there is no generated fallback face between the subsets. Names change internally
to Mamuso Mono; the bundled OFL declares no Reserved Font Name, and the script
renames derivatives anyway while preserving attribution and licensing.

## Bytes after optimization

Counts are font response-body bytes, excluding HTTP framing/compression headers.
The preload observations are from the browser DOM, including links that Next
inserts during automatic route prefetching. Every measurement uses a fresh
browser context. Both viewport results are saved in
[baseline-pages.json](fonts/baseline-pages.json) and
[after-pages.json](fonts/after-pages.json).

| Font | Before | Core | Extended | After total | Reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| Regular | 71,188 | 11,884 | 16,812 | 28,696 | 59.7% |
| Bold | 72,856 | 12,196 | 17,404 | 29,600 | 59.4% |
| Both | 144,044 | 24,080 | 34,216 | 58,296 | 59.5% |
| SF Pro (server only) | 70,704 | — | — | 70,704 | 0% |

Each core contains 106 glyphs / 102 mapped characters; each extended file has
273 glyphs / 223 mapped characters. Extra unencoded glyphs are composite
components, not additional unicode-range coverage. Latin coverage missing from
the originals (U+0138, U+0149, U+017F, for example) remains fallback coverage.

| Page | Before | After | After preloads / conditional requests |
| --- | ---: | ---: | --- |
| `/` desktop | 144,044 | 0 | none |
| `/` mobile | 0 | 0 | none |
| `/notes` | 144,044 | 0 | none |
| `/note/markdown-specimen` | 144,044 | 0 | none |
| `/note/push-to-talk` | 144,044 | 0 | none |
| `/photos` | 144,044 | 0 | none |
| `/photo/2023-07-01-river-and-beach-3` | 144,044 | 24,080 | both cores; no extended request |
| `/photo/2024-11-14-casa-batllo` | 144,044 | 40,892 | both cores; Regular extended for ó/ƒ |
| `/photos/stack/soho-2026-09-18` | 144,044 | 40,892 | both cores; Regular extended |

Except the homepage, the desktop and mobile totals agree. The baseline homepage
has no font preload in its original HTTP HTML; desktop link prefetch subsequently
inserts both TTF preloads. Mobile doesn't trigger those prefetches. The new
preloads are emitted by React DOM only when PhotoMeta renders, rather than
Next/font attaching them to routes that merely import its module. A multi-photo
collection deduplicates each URL; its cost is not multiplied by photo count.
Both extended faces are behind exact unicode-range declarations, never preloaded.
The bold extended face is not requested on the measured production pages.

## Visual evidence and intentional exceptions

The strict priority is preserving rendering, including on hinting renderers.
**Hinting is retained.** Dropping it saves an additional 25,324 bytes across the
four files (10,392 across cores). The no-hint alternative is Regular 6,716 +
9,452 and Bold 6,972 + 9,832 = 32,972 bytes. The controlled 16px FreeType ASCII
sample changes 1,456 pixels in Regular and 1,403 in Bold after removing only
hinting. That is a regression; no change to hinting is shipped. The script's
`--drop-hinting` switch is for an explicitly approved experiment and overwrites
generated outputs; rerun without it to restore the default.

All 325 mapped characters in each shipped font are also rendered individually
with FreeType at 16px against the originals: **zero changed pixels** across all
four subsets. Browser comparisons cover full pages with code, italics, bold
italics, accents, camera metadata, tabular numerals and component font overrides.
A browser-only fixture adds `Muñoz Ā Ł Œ ƒ/2 — “quotes”… 日本語 中文 한글` and
nested bold inside italics to an actual photo metadata heading on both builds.
It adds no published content. CJK still uses the existing system fallback.

Full-page screenshots hide the same moving/non-font surfaces in both builds:
canvas (including paper textures and cartridge scene), random homepage photos,
and music artwork. External requests are blocked on both builds. No text or
font-bearing region is masked. Reduced motion is enabled. The homepage's random
fact is seeded for the final comparison; raw unseeded screenshots are retained
locally to explain the initial text/height differences. No content revision
changed between builds.

Final result: **17 of 18 full-page comparisons are pixel-identical** across
49,370,220 compared pixels. The remaining comparison differs only in the two
photograph pixels described below. The seeded homepage and both photo-stack
comparisons are pixel-identical. The first unseeded homepage comparison had
2,804 changed pixels on desktop and a 29px mobile height difference because the
random fact's text changed; both differences disappear with a fixed random pick.
Those were dynamic content changes, not font changes or subpixel excuses.

Detailed pixel counts are in [pixel-diffs.json](fonts/pixel-diffs.json).
Screenshots and raw diff PNGs live locally under
`output/verification/fonts/` (gitignored). The gallery's two differing pixels
are on a transformed photograph edge, at (61,199) and (61,202): only the blue
channel differs by 1/255. They are harmless image-compositing rounding, outside
text. No font differences are dismissed as rounding. Pixel proof is for the
listed Chrome/macOS configuration, supplemented by FreeType and exact glyph
checks; it does not claim exhaustive browser/OS coverage.

Reproduce the browser capture against a production server started by you on
port 3117, once before and once after applying the change. Keep the content
revision and browser version fixed. Use the Playwright CLI (the wrapper path
below is the installed local skill); set `phase` in `scripts/capture-fonts.js`
to `baseline` or `after` before each capture and create that output directory.
The script is a Playwright CLI function, not a build step or test runner spec.

```sh
pnpm build
pnpm start --port 3117
# In another shell:
mkdir -p output/verification/fonts/baseline output/verification/fonts/after
~/.codex/skills/playwright/scripts/playwright_cli.sh --session fonts open http://localhost:3117/
~/.codex/skills/playwright/scripts/playwright_cli.sh --session fonts run-code "$(cat scripts/capture-fonts.js)"
/tmp/mamuso-font-tools/bin/python scripts/diff-fonts.py \
  output/verification/fonts/baseline output/verification/fonts/after \
  output/verification/fonts/diff
/tmp/mamuso-font-tools/bin/python scripts/prove-font-hinting.py \
  output/verification/fonts/hinting
```

The exact diff command exits nonzero on *any* pixel difference, including the
explicitly documented two photograph pixels; review rather than applying a
blanket tolerance. Review unknown diffs as regressions, not acceptable noise.
Do not use `--drop-hinting` by default. No core embedding or idle precaching is
introduced; those remain future work.

Validation: production build (including TypeScript/content checks), ESLint,
all 42 core browser checks, both metadata/function-size tests (406 pages and
406 social image URLs audited), and all Node tests passed. The generator was
rerun repeatedly with byte-identical WOFF2 output. FontTools output reopening,
outline/metric/hint-program checks and the FreeType proof also passed. The
manual scripts are deliberately outside the build pipeline.

Tool behavior references: [fontTools subsetting](https://fonttools.readthedocs.io/en/stable/subset/)
and the installed `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`.
