import { rm } from 'node:fs/promises'

// Exercise the image optimizer itself, not artifacts left by an earlier run.
// Next's development cache lives separately under .next/dev.
await rm(new URL('../.next/cache/images/', import.meta.url), { recursive: true, force: true })
