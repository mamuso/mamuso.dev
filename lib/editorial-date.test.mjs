import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { editorialYear, formatPostDate, parseEditorialDate } from './editorial-date.ts'
import { readPostIndex } from './post-index.ts'

const cases = [
  ['2026-08-29', 'Aug 29, 2026', 'Saturday, Aug 29, 2026', 2026],
  ['2020-01-01', 'Jan 1, 2020', 'Wednesday, Jan 1, 2020', 2020],
  ['2024-02-29', 'Feb 29, 2024', 'Thursday, Feb 29, 2024', 2024],
  ['2000-02-29', 'Feb 29, 2000', 'Tuesday, Feb 29, 2000', 2000],
  ['2024-03-10', 'Mar 10, 2024', 'Sunday, Mar 10, 2024', 2024],
  ['2024-11-03', 'Nov 3, 2024', 'Sunday, Nov 3, 2024', 2024],
]

for (const timeZone of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
  test(`editorial dates, weekdays and archive years are stable in ${timeZone}`, () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { formatPostDate, editorialYear, parseEditorialDate } from ${JSON.stringify(new URL('./editorial-date.ts', import.meta.url).href)};
      console.log(JSON.stringify(${JSON.stringify(cases.map(([date]) => date))}.map(date => [
        formatPostDate(date), formatPostDate(date, true), editorialYear(date), parseEditorialDate(date).toISOString()
      ])));
    `], { env: { ...process.env, TZ: timeZone }, encoding: 'utf8' })
    assert.deepEqual(JSON.parse(output), cases.map(([date, short, long, year]) => [short, long, year, `${date}T00:00:00.000Z`]))
  })
}

test('invalid dates fail explicitly rather than rolling into another month', () => {
  for (const value of ['', '2023-02-29', '1900-02-29', '2024-04-31', '2024-13-01', '2024-01-00', '0000-01-01', '2024-1-1', ' 2024-01-01', '2024-01-01T00:00:00Z']) {
    for (const fn of [parseEditorialDate, editorialYear, formatPostDate]) {
      assert.throws(() => fn(value), { name: 'RangeError', message: new RegExp('Invalid editorial date') })
    }
  }
})

test('all published content has valid calendar dates', () => {
  for (const post of readPostIndex().posts) {
    assert.doesNotThrow(() => parseEditorialDate(post.data.date), `Invalid date in ${post.fileSlug}.md`)
  }
})
