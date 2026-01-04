export const BLOG_URL: string = 'https://mamuso.dev'
export const BLOG_TITLE: string = 'mamuso.dev'
export const BLOG_SUBTITLE: string = 'A (Mostly) Personal Journal'

// Efficient date formatting utility
export function formatPostDate(dateString: string, includeWeekday: boolean = false): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeWeekday && { weekday: 'long' })
  }
  return date.toLocaleDateString('en-us', options)
}
