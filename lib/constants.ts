export const BLOG_URL: string = 'https://mamuso.dev'
export const BLOG_TITLE: string = 'mamuso.dev'
export const BLOG_SUBTITLE: string = 'A (Mostly) Personal Journal'

const POST_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parse a date-only post value as a calendar date in UTC. */
export function parsePostDate(dateString: string): Date {
  const match = POST_DATE_PATTERN.exec(dateString)
  if (!match) throw new RangeError(`Invalid post date: ${dateString}`)

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new RangeError(`Invalid post date: ${dateString}`)
  }

  return date
}

export function getPostYear(dateString: string): number {
  return parsePostDate(dateString).getUTCFullYear()
}

export function formatPostDate(dateString: string, includeWeekday: boolean = false): string {
  const date = parsePostDate(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...(includeWeekday && { weekday: 'long' })
  }
  return date.toLocaleDateString('en-us', options)
}
