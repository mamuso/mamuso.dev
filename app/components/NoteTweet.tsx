import { cacheLife } from 'next/cache'
import { EmbeddedTweet, TweetNotFound } from 'react-tweet'
import { getTweet } from 'react-tweet/api'

async function getCachedTweet(id: string) {
  'use cache'
  cacheLife('max')
  return getTweet(id)
}

/** Renders `<Tweet id="…" />` in notes as static HTML, sized to the text column. */
export default async function NoteTweet({ id }: { id?: string }) {
  const tweet = id ? await getCachedTweet(id).catch(() => undefined) : undefined
  return (
    <div className="note-tweet" data-theme="light">
      {tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />}
    </div>
  )
}
