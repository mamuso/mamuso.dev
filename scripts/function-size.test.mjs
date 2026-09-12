import assert from 'node:assert/strict'
import { globSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'

test('server traces stay within the deployment size budget', t => {
  const traces = [...globSync('.next/server/app/**/*.nft.json')]
  assert.ok(traces.length, 'Run pnpm build before checking function traces')
  let largest = 0
  for (const trace of traces) {
    const files = new Set(JSON.parse(readFileSync(trace, 'utf8')).files.map(file => resolve(dirname(trace), file)))
    files.add(resolve(trace.replace(/\.nft\.json$/, '')))
    const bytes = [...files].reduce((total, file) => total + statSync(file).size, 0)
    largest = Math.max(largest, bytes)
    // Leave headroom for platform wrappers below Vercel's 250 MB limit.
    assert.ok(bytes < 200 * 1024 * 1024, `${trace}: ${(bytes / 1024 / 1024).toFixed(1)} MiB exceeds the 200 MiB function budget`)
  }
  t.diagnostic(`${traces.length} function traces checked; largest ${(largest / 1024 / 1024).toFixed(1)} MiB`)
})
