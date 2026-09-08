/** Editorial dates are calendar days, never instants in the server's time zone. */
export function parseEditorialDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    throw new RangeError(`Invalid editorial date: ${value}; expected YYYY-MM-DD`)
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`Invalid editorial date: ${value}; expected a valid calendar day`)
  }
  return date
}

export function editorialYear(value: string): number {
  return parseEditorialDate(value).getUTCFullYear()
}

const options: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric',
}
const shortDate = new Intl.DateTimeFormat('en-US', options)
const weekdayDate = new Intl.DateTimeFormat('en-US', { ...options, weekday: 'long' })

export function formatPostDate(value: string, includeWeekday = false): string {
  return (includeWeekday ? weekdayDate : shortDate).format(parseEditorialDate(value))
}
