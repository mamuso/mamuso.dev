# Quality checks

See [Content caching](caching.md) for the Cache Components policies and publication
workflow. The production build validates prerender/cache boundaries.

Use Node 24 and the pnpm version pinned in `package.json`.

## Dependency compatibility

The project uses Next 16.4, React 19.3, Three 0.187, vgpu 0.6 and pnpm 10.34.
Keep React and React DOM versions aligned, along with the StyleX packages,
Next/eslint-config-next, and vgpu/@vgpu/wgsl. React type, PostCSS and Sharp
versions also appear in `pnpm-workspace.yaml`; update those overrides together
with the manifest so the lockfile does not silently retain older versions.

TypeScript 7's native compiler is installed as `@typescript/native` and supplies
the `tsc` executable used by `pnpm typecheck`. TypeScript 7 has no compiler API
for the existing tools, so `typescript` aliases `@typescript/typescript6` as
recommended by [Microsoft's migration guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
That package supplies the TypeScript 6 API for ts-node and typescript-eslint;
Next's build also resolves this compatibility compiler. Do not replace the
alias with TypeScript 7 without migrating those consumers. `pnpm exec tsc
--version` reports 7; `pnpm exec tsc6 --version` reports the compatibility compiler.

ESLint remains at the latest 9.x release because eslint-plugin-react,
eslint-plugin-import and eslint-plugin-jsx-a11y do not declare ESLint 10 support.
Do not force their peer ranges merely to remove `pnpm outdated` output.
The scoped MCP/minimatch overrides address security advisories while preserving
the APIs those consumers use; do not force minimatch 11 onto legacy consumers
that call its old default export. Recheck `pnpm audit` when upgrading this stack.

Next's `partialPrefetching: false` explicitly preserves the previous navigation
behavior. Its file traces exclude static photo binaries and local verification
artifacts, which must not be packaged into server functions. The function-size
test checks both that boundary and the deployment size budget.

R3F 9.8 mounts its scene synchronously inside Canvas's commit. CartridgeItem
defers Drei's keyboard-control HTML roots until the outer commit has finished;
without this, the first cartridge's accessible control is lost. Preserve the
six-control and pointer/keyboard/resize browser assertions when upgrading it.

## Running checks

```sh
git submodule update --init
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` validates frontmatter and referenced images, runs ESLint, generates current Next route types, checks TypeScript,
runs all Node contract tests, and validates WGSL. Shader validation uses Dawn's
null backend so it requires no physical GPU (including on Vercel). It still
compiles WGSL and rejects type errors; browser smoke tests exercise actual rendering. It stops at the first failed
command. Content tests validate published canonical URLs and filename aliases;
they do not require date prefixes or rename existing URLs.

For the complete production gate:

```sh
pnpm exec playwright install chromium
pnpm verify
```

`pnpm verify` runs `check`, a production build, a 200 MiB per-function trace
budget, the full HTTP metadata/image audit,
and Chromium smoke tests at desktop and mobile viewport sizes. It requires a
populated content submodule and installs no browsers implicitly. Local and CI builds use
the parent's pinned content revision. Only Vercel (where `VERCEL` is set) builds with
`git submodule update --remote`, deploying the latest content `main`.

After a build, the browser suite alone is `pnpm smoke:test`. It starts its own
production server on port 3103 (`SMOKE_TEST_PORT` overrides it), refuses to reuse an
existing server, and closes it afterward. It clears the production image cache
first so optimizer/OG regressions cannot hide behind warm cached images. The metadata audit uses port 3101
(`METADATA_TEST_PORT`). Neither suite uses the dev server on port 3000.

Smoke coverage:

- Homepage, decoded cartridge scene, and animated-name interaction.
- Notes archive → note, including canonical metadata.
- Infinite gallery append, preserved DOM/scroll/history, refresh, photo viewer and focus restoration.
- Collection viewer and Escape.
- Reserved photo dimensions with image downloads blocked.
- Legacy `/post`, `/posts` and filename aliases; a real PNG social image with special characters.
- Aborted GLB request: a scoped error boundary retains the homepage and displays work history.

For a manual typography review, open `/note/markdown-specimen`. This unlisted,
`noindex` page uses the real `Post` template with the fixture in
`app/note/markdown-specimen/specimen.md`. It stays outside the content index,
archives, and feed. Edit the fixture to add cases when changing Markdown styles.
The URL is directly accessible; it is a design specimen, not private content.

Browser failures retain a trace, screenshot, and HTML report. Inspect them with
`pnpm exec playwright show-report`; CI uploads them for seven days. There are no
automatic test retries, skipped smoke tests, or `continue-on-error` steps.
Software WebGL makes the smoke suite independent of a physical GPU. The overall
90-second test timeout includes browser-context setup. Cartridge hold and swipe
scenarios each have a 180-second budget for software WebGL. Swipe switching,
cancellation and scrolling run on separate fresh pages so one long sequence cannot
consume the final gesture's budget. Coordinate helpers wait up to 60 seconds for
three stable rendered-frame comparisons, measuring cumulative movement from the
start of that window rather than elapsed wall time. Other
assertions retain their 15-second timeout (30 seconds for model decoding). Holds
allow 60 seconds for the opening spring to become ready and request audio.
The gesture specs retain DOM/action traces but disable continuous trace screencasts,
whose GPU readbacks stall SwiftShader; screenshots on failure remain enabled. The mobile
project emulates a viewport and touch input; it is not a physical-device test.

## GitHub and Vercel

`.github/workflows/quality.yml` runs on pushes to `main`, pull requests, merge
queues and manual dispatch. Branch pushes are left to the pull request run so each
commit is tested once. It uses pinned action revisions, read-only permissions, Node 24,
locked dependencies, and the pinned content submodule. The required status check
name is **Quality gate**. Four parallel **Browser tests** jobs each run `pnpm build`
followed by one `pnpm smoke:core --shard=N/4`: the production build is needed to
serve the browser tests, and `fullyParallel` lets shards split individual tests.
Quality gate passes only when every shard does. The core suite keeps the homepage
scene and cartridge pointer, keyboard and resize checks from `site.spec.ts`.

The long cartridge gesture specs (`cartridge-blow`, `-buffer`, `-readiness` and
`-swipe`) run separately as **Cartridge gestures** via `pnpm smoke:gestures`. On
hosted runners software WebGL makes them several times slower than locally, so
they report without gating merges; `pnpm verify` and `pnpm smoke:test` still run
the full suite. On CI, Playwright stops itself after 15 minutes so a slow shard
still reports its failures, and diagnostics upload on failure or cancellation. It does not repeat
`pnpm check` or `pnpm metadata:test`, which run on Vercel. There are no path
filters that could leave a required check pending indefinitely.

`main` requires this check from the GitHub Actions app, including administrators,
with the branch up to date before integration (configured on 2026-09-07). This setting lives in GitHub branch protection, not in
the workflow file. The workflow must be pushed to a feature branch before GitHub can run it;
integrate into `main` only after Quality gate passes.

Vercel independently initializes the submodule at the latest content `main` and runs `check`, `build`
and the metadata audit. A failed command fails the deployment build. The shared
build command retains its content validation and asset/feed preparation in both
environments. `pnpm verify` remains available locally for the complete gate. Browser
smoke tests run in GitHub, where Chromium and its system dependencies are installed;
requiring Quality gate on `main` protects the normal production Git deployment
path. Preview deployments can still be produced while the GitHub browser suite
runs. Manual deployment overrides and changes to branch protection are separate
administrative controls.

## Next OG regression coverage

Next.js 16.4.3 passes the cold-cache image optimization → OG rendering check
without the version-specific Resvg workaround previously needed for 16.3.3.
The old pnpm patch has been removed.

The legacy/social smoke test requests an optimized image with a cold cache before
requesting an OG PNG. Keep that regression test when upgrading Next to catch
interactions between the optimizer's Sharp loader restrictions and OG rendering.
