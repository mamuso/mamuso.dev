# Dependency refresh after the font optimization

Updated 11 runtime dependency entries and 17 development entries, including the
new TypeScript native-compiler alias. This brings Next to 16.4.3, React/React DOM
to 19.3.1, Three to 0.187.0, R3F to 9.8.2, vgpu/WGSL to 0.6.0, StyleX to 0.19.1,
Playwright to 1.64.1 and pnpm to 10.34.9. The workspace overrides for React types,
Babel 7, Browserslist, PostCSS and Sharp were refreshed along with the lockfile.

`pnpm outdated` reports only ESLint: it stays on 9.39.5 because the current
React/import/accessibility lint plugins declare support through ESLint 9. The
rest of the direct dependencies are current. Babel and legacy YAML overrides
stay within the major versions required by their consumers. Node remains 24
and pnpm remains on the repository's required major 10. The manually installed
Python font-processing packages were checked against PyPI and are already at
the latest releases; their pins and all generated fonts remain unchanged.

TypeScript 7's native CLI runs the explicit typecheck. Microsoft's TypeScript 6
compatibility package supplies the compiler API needed by existing content and
lint tools; Next's build resolves the compatibility compiler. Details and
upgrade constraints are in [quality-checks.md](quality-checks.md).

Two regressions found during validation are fixed rather than weakening checks:

- R3F 9.8 mounts the scene synchronously inside the Canvas commit. Mounting
  Drei's separate HTML roots there lost the first cartridge's accessible
  control. CartridgeItem now defers those roots until the outer commit has
  finished. The visible scene is unchanged and the existing six-control,
  pointer, keyboard and resize checks pass.
- Next 16.4's file tracing included static photo binaries and local verification
  artifacts, producing a 554.8 MiB server trace. Targeted exclusions restore
  the correct static/runtime boundary. The largest trace is now 28.6 MiB, below
  the existing 200 MiB budget. The metadata test also rejects these files in
  traces instead of merely relying on the byte limit. Static assets still ship
  normally; content Markdown, fonts and OG templates remain available.

Partial prefetching is explicitly disabled to preserve the site's existing
navigation behavior. Font-display, fallback fonts and the manual-only font
processing policy are unchanged.

## Validation and visual evidence

Production build, `pnpm check` (content, lint, native TypeScript checks, all 87
Node tests and WGSL validation), a frozen-lockfile install, and both production
metadata tests pass. The metadata audit covers 406 pages and 406 social image
URLs, rendering 62 images. The full browser suite passes all **56 desktop/mobile checks**, including the
optional cartridge hold, buffer, readiness and swipe scenarios (4.6 minutes).

Visual comparison uses the saved screenshots from before this dependency
refresh, the same pinned content, Chrome 156 on macOS, DPR 1, and both desktop
and mobile widths. These are additional comparisons against the already
optimized-font build, not a replacement for the original font baseline.

- Main matrix: 16/18 full-page screenshots are pixel-identical. Mobile gallery
  differences are confined to an image. The mobile Markdown specimen has image
  resampling differences and 53 antialiased edge pixels outside images; a fresh
  capture on the same upgraded build matches the earlier text pixels exactly.
  This establishes capture-time rasterization variability rather than a
  dependency-induced typography change. Initial counts remain in the report;
  no blanket pixel tolerance is applied.
- Long articles: 6/8 full-page screenshots are pixel-identical. Remaining
  differences are the same desktop animated GIF and resized-illustration
  regions documented in the earlier long-article review. All text and layout
  match. All screenshot dimensions remain identical.
- Font request sizes and preload behavior match the earlier optimized build.
  No font assets or typography settings changed.

[Exact counts and audit summary](fonts/dependency-update-verification.json),
[page request records](fonts/dependency-pages.json), and
[long-article records](fonts/dependency-long-pages.json) are committed. Raw
screenshots, diffs and the supplementary specimen repeat are local under
`output/verification/fonts/`. See the existing font reports for the masks and
limitations of the browser setup; this is not exhaustive browser/OS proof.

MCP server and supported minimatch consumers were updated through scoped
workspace overrides. The final audit reports **zero high/critical and one
moderate** advisory. The remaining minimatch 3 advisory comes through ESLint
9's legacy `@eslint/eslintrc` dependency; its old default-export API prevents a
safe forced major upgrade. Revisit it with upstream ESLint plugin support.
