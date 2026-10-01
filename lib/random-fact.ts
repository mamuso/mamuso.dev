import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function getRandomFacts(): string[] {
  return readFileSync(join(process.cwd(), 'data/random-facts.md'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}
