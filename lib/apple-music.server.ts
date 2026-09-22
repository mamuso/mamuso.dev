import 'server-only'
import { createRecentTrackReader } from './apple-music'
import { developerToken } from './apple-music-token.mjs'

export const getRecentTrack = createRecentTrackReader({
  credentials: () => {
    const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY
    const teamId = process.env.APPLE_MUSIC_TEAM_ID
    const keyId = process.env.APPLE_MUSIC_KEY_ID
    const userToken = process.env.APPLE_MUSIC_USER_TOKEN
    if (!privateKey || !teamId || !keyId || !userToken) return {}

    // Sign on each upstream refresh (at most once/minute per instance).
    // Short-lived tokens need no stored credential, cron or manual renewal.
    return {
      developerToken: developerToken(privateKey.replaceAll('\\n', '\n'), teamId, keyId, 600),
      userToken,
    }
  },
})
