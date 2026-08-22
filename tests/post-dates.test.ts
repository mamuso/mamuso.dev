import assert from 'node:assert/strict'
import test from 'node:test'
import { formatPostDate, getPostYear, parsePostDate } from '../lib/constants'

test(`post dates remain calendar-stable in ${process.env.TZ}`, () => {
  assert.equal(parsePostDate('2024-01-01').toISOString(), '2024-01-01T00:00:00.000Z')
  assert.equal(formatPostDate('2024-01-01'), 'Jan 1, 2024')
  assert.equal(formatPostDate('2024-01-01', true), 'Monday, Jan 1, 2024')
  assert.equal(getPostYear('2024-01-01'), 2024)
})

test('post dates reject invalid calendar values', () => {
  assert.throws(() => parsePostDate('2023-02-29'), RangeError)
  assert.throws(() => parsePostDate('01/02/2024'), RangeError)
})
