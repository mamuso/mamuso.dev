import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomInt } from 'node:crypto'

export function getRandomFact(): string | null {
  const facts = readFileSync(join(process.cwd(), 'data/random-facts.md'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return facts.length > 0 ? facts[randomInt(facts.length)] : null
}
