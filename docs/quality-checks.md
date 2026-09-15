# Quality checks

Use Node 24 and the pnpm version pinned in `package.json`.

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
populated content submodule and installs no browsers implicitly. The build uses
the parent's pinned content revision, never `git submodule update --remote`.

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

Browser failures retain a trace, screenshot, and HTML report. Inspect them with
`pnpm exec playwright show-report`; CI uploads them for seven days. There are no
automatic test retries, skipped smoke tests, or `continue-on-error` steps.
Software WebGL makes the smoke suite independent of a physical GPU. The overall
90-second test timeout includes browser-context setup. The two longer cartridge
gesture scenarios have 180-second (hold) and 240-second (swipe) budgets for software WebGL and wait up to
60 seconds for rendered targets to settle before taking touch coordinates. Other
assertions retain their 15-second timeout (30 seconds for model decoding). Holds
allow 60 seconds for the opening spring to become ready and request audio.
The gesture specs retain DOM/action traces but disable continuous trace screencasts,
whose GPU readbacks stall SwiftShader; screenshots on failure remain enabled. The mobile
project emulates a viewport and touch input; it is not a physical-device test.

## GitHub and Vercel

`.github/workflows/quality.yml` runs on pushes, pull requests, merge queues and
manual dispatch. It uses pinned action revisions, read-only permissions, Node 24,
locked dependencies, and the pinned content submodule. The required status check
name is **Quality gate**. There are no path filters that could leave a required
check pending indefinitely.

`main` requires this check from the GitHub Actions app, including administrators,
with the branch up to date before integration (configured on 2026-09-07). This setting lives in GitHub branch protection, not in
the workflow file. The workflow must be pushed to a feature branch before GitHub can run it;
integrate into `main` only after Quality gate passes.

Vercel independently initializes the pinned submodule and runs `check`, `build`
and the metadata audit. A failed command fails the deployment build. Browser
smoke tests run in GitHub, where Chromium and its system dependencies are installed;
requiring Quality gate on `main` protects the normal production Git deployment
path. Preview deployments can still be produced while the GitHub browser suite
runs. Manual deployment overrides and changes to branch protection are separate
administrative controls.

## Next 16.3.0 OG regression

`patches/next@16.3.0.patch` keeps Next's Node OG renderer on its bundled Resvg
fallback. The image optimizer globally blocks SVG loading in Sharp; Next's OG
renderer otherwise picks that same Sharp instance and fails after an optimizer
cache miss. The patch changes only OG renderer selection, preserves the optimizer's
loader restrictions, and adds no renderer dependency. It is applied by pnpm's
locked `patchedDependencies` configuration, including clean CI installs.

The legacy/social smoke test requests an optimized image with a cold cache before
requesting an OG PNG. Keep that regression test when upgrading Next; remove the
version-specific patch once upstream rendering passes it without the workaround.
