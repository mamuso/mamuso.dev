# Dependency security review

Reviewed on 2026-10-06. The pnpm overrides keep source-map-js at 1.2.2,
js-yaml at 3.15.2, browserslist at 4.28.8, and brace-expansion on patched
releases within each existing major (1.1.21 and 5.0.12).

## sprintf-js: no patched release

[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
affects sprintf-js through 1.1.3 when an attacker controls the format string
and supplies an excessive numeric precision. The installed copy is 1.0.3.

The dependency path is gray-matter → js-yaml 3.x → argparse 1.x → sprintf-js.
The application uses gray-matter in lib/post-index.ts to parse Markdown from
the content submodule. gray-matter uses js-yaml.safeLoad; js-yaml's library
entry point loads its YAML loader and dumper without argparse. Only js-yaml's
CLI imports argparse. The application's app/, lib/ and scripts/ sources do
not import argparse or sprintf-js directly.

A Node require-cache inspection after parsing a real content post through
gray-matter confirmed that neither argparse nor sprintf-js was loaded.
This supports the conclusion that the reported vulnerable formatting path is
not reachable through this site's frontmatter parser. This is a reachability
assessment, not a package fix: the dependency and alert remain. Reassess if
CLI usage or application imports change. No alert was dismissed.

## braces: no patched release

The post-update pnpm audit also reports
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
a stack-exhaustion denial of service in braces through 3.0.3. The latest
published release is still 3.0.3. The audit identifies the development path
@stylexjs/eslint-plugin → micromatch → braces. This finding remains unresolved;
there is no patched release to select in this dependency-update change.
