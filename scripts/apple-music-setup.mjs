import { randomBytes } from 'node:crypto'
import { developerToken } from '../lib/apple-music-token.mjs'
import { createServer } from 'node:http'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'


export async function startSetup({ privateKey, teamId, keyId, save, request = fetch, restrictBrowserTokenOrigin = true }) {
  const session = randomBytes(32).toString('hex')
  const pagePath = `/${session}`
  let origin
  let browserToken
  let saving = false
  const serverToken = developerToken(privateKey, teamId, keyId, 600)
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    // Apple's authorization popup needs document.referrer to establish its
    // postMessage return channel. Send the origin, never our session path.
    res.setHeader('Referrer-Policy', 'strict-origin')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    const reply = (status, message) => { res.writeHead(status, { 'Content-Type': 'text/plain' }).end(message) }
    if (req.headers.host !== new URL(origin).host) return reply(403, 'Forbidden')
    if (req.method === 'GET' && req.url === pagePath) {
      const nonce = randomBytes(24).toString('base64')
      res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}' https://js-cdn.music.apple.com; connect-src 'self' https://*.apple.com https://*.itunes.apple.com; img-src 'self' https://*.mzstatic.com data:; style-src 'unsafe-inline'; frame-src https://*.apple.com; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="icon" href="data:,"><title>Connect Apple Music locally</title>
<body><h1>Connect Apple Music</h1><p>This local tool saves your tokens on this computer. Your private key never reaches the browser.</p>
<button disabled>Authorize with Apple</button><p role="status">Loading MusicKit…</p><p id="diagnostics"></p>
<script nonce="${nonce}">
const button = document.querySelector('button')
const status = document.querySelector('[role=status]')
const diagnostics = document.querySelector('#diagnostics')
const networkFailures = []
const originalFetch = window.fetch.bind(window)
window.fetch = async (...args) => {
  let label = ''
  try {
    const url = new URL(typeof args[0] === 'string' ? args[0] : args[0].url)
    if (url.protocol === 'https:' && url.hostname.endsWith('.apple.com')) {
      label = url.pathname === '/v1/me/storefront' ? 'APPLE_STOREFRONT'
        : url.pathname === '/WebObjects/MZPlay.woa/wa/webPlayerLogout' ? 'APPLE_LOGOUT'
          : 'APPLE_REQUEST'
    }
  } catch { /* Local requests need no extra diagnostics. */ }
  try {
    const response = await originalFetch(...args)
    if (label && !response.ok) networkFailures.push(label + '_HTTP_' + response.status)
    return response
  } catch (error) {
    if (label) networkFailures.push(label + '_NETWORK_FAILED')
    throw error
  }
}
let policyBlocked = ''
document.addEventListener('securitypolicyviolation', event => {
  if (event.disposition === 'enforce') {
    // Report only the CSP directive and origin. Paths, queries and fragments
    // can contain authorization parameters and must never be displayed.
    const directives = ['connect-src', 'script-src', 'script-src-elem', 'script-src-attr', 'frame-src', 'form-action', 'img-src', 'media-src', 'worker-src', 'font-src', 'style-src', 'style-src-elem', 'default-src']
    const directive = directives.includes(event.effectiveDirective) ? event.effectiveDirective : 'other'
    let resource = 'other'
    try {
      const blocked = new URL(event.blockedURI)
      if (blocked.protocol === 'https:' && (blocked.hostname.endsWith('.apple.com') || blocked.hostname.endsWith('.mzstatic.com'))) {
        resource = blocked.origin
      } else if (['data:', 'blob:'].includes(blocked.protocol)) {
        resource = blocked.protocol
      }
    } catch {
      if (['inline', 'eval'].includes(event.blockedURI)) resource = event.blockedURI
    }
    policyBlocked = directive + ' → ' + resource
    diagnostics.textContent = 'Browser resource blocked: ' + policyBlocked
  }
})
document.addEventListener('musickitloaded', async () => {
  try {
    await MusicKit.configure({ developerToken: ${JSON.stringify(browserToken)}, app: { name: 'mamuso.dev local setup', build: '1.0' } })
    button.disabled = false
    status.textContent = 'Ready. Sign in only in Apple’s authorization window.'
  } catch { status.textContent = 'MusicKit could not initialize. Check the MusicKit key configuration.' }
})
button.addEventListener('click', async () => {
  button.disabled = true
  networkFailures.length = 0
  let userToken
  try {
    status.textContent = 'Waiting for authorization in Apple’s window…'
    userToken = await MusicKit.getInstance().authorize()
  } catch (error) {
    const knownErrors = ['AUTHORIZATION_ERROR', 'UNAUTHORIZED_ERROR', 'ACCESS_DENIED', 'NETWORK_ERROR', 'TOKEN_EXPIRED', 'SUBSCRIPTION_ERROR', 'SecurityError', 'QuotaExceededError', 'NotAllowedError']
    const reason = knownErrors.includes(error?.name) ? error.name : 'UNKNOWN'
    status.textContent = 'APPLE_AUTHORIZATION_FAILED: ' + reason
    const failures = networkFailures.slice(-5).join(', ')
    if (failures) status.textContent += '. ' + failures
    // A blocked image/font is a separate warning, not an authorization diagnosis.
    button.disabled = false
    return
  }
  let response
  try {
    status.textContent = 'Apple authorization completed. Validating the user token…'
    response = await fetch(${JSON.stringify(`${pagePath}/token`)}, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userToken })
    })
  } catch {
    status.textContent = 'LOCAL_SERVER_UNREACHABLE: restart the terminal command and open its new URL.'
    button.disabled = false
    return
  }
  if (!response.ok) {
    // Only fixed diagnostic codes from our local server; never raw Apple errors.
    const messages = {
      INVALID_REQUEST: 'LOCAL_INVALID_REQUEST: the token request could not be read.',
      INVALID_TOKEN: 'LOCAL_TOKEN_FORMAT: MusicKit did not return a supported user token.',
      APPLE_401: 'APPLE_401: Apple rejected the credentials. Restart setup to use a fresh developer token.',
      APPLE_403: 'APPLE_403: Apple refused access to listening history. Check the subscription and MusicKit permission for this account.',
      APPLE_429: 'APPLE_429: Apple rate-limited the request. Wait a few minutes before retrying.',
      APPLE_REJECTED: 'APPLE_REJECTED: Apple returned an unexpected HTTP status. The terminal shows only the status number.',
      APPLE_NETWORK: 'APPLE_NETWORK: the local server could not reach Apple or the request timed out.',
      SAVE_FAILED: 'LOCAL_SAVE_FAILED: authorization worked, but the credentials file could not be written. Check local folder permissions.',
    }
    let diagnostic
    try { diagnostic = await response.json() } catch { /* No upstream details displayed. */ }
    status.textContent = messages[diagnostic?.code] || 'LOCAL_REQUEST_FAILED: restart setup and open its new URL.'
    button.disabled = false
    return
  }
  // Storage cleanup is best-effort: privacy settings may forbid storage access
  // even though authorization and saving already succeeded.
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch { /* Close the private window to discard its storage. */ }
  status.textContent = 'Saved. Close this private window and follow docs/apple-music.md.'
})
</script><script nonce="${nonce}" src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script></body></html>`)
      return
    }
    if (req.method !== 'POST' || req.url !== `${pagePath}/token`) return reply(404, 'Not found')
    if (req.headers.origin !== origin || req.headers['content-type'] !== 'application/json') return reply(403, 'Forbidden')
    if (saving) return reply(409, 'Already saving')
    saving = true
    let stage = 'request'
    const fail = (status, code) => {
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify({ code }))
    }
    try {
      let body = ''
      for await (const chunk of req) {
        body += chunk.toString()
        if (Buffer.byteLength(body) > 16384) return reply(413, 'Too large')
      }
      const { userToken } = JSON.parse(body)
      if (typeof userToken !== 'string' || !/^[A-Za-z0-9._~+/=-]{20,16000}$/.test(userToken)) return fail(400, 'INVALID_TOKEN')
      stage = 'apple'
      const check = await request('https://api.music.apple.com/v1/me/recent/played/tracks?limit=1&types=songs,library-songs', {
        headers: { Authorization: `Bearer ${serverToken}`, 'Music-User-Token': userToken },
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      })
      await check.body?.cancel()
      if (!check.ok) {
        console.log(`Apple Music validation: HTTP ${check.status}. No response body or credentials logged.`)
        return fail(502, [401, 403, 429].includes(check.status) ? `APPLE_${check.status}` : 'APPLE_REJECTED')
      }
      stage = 'save'
      await save(`APPLE_MUSIC_USER_TOKEN=${userToken}\n`)
      reply(200, 'Saved')
      server.close()
    } catch {
      const code = stage === 'apple' ? 'APPLE_NETWORK' : stage === 'save' ? 'SAVE_FAILED' : 'INVALID_REQUEST'
      fail(stage === 'request' ? 400 : 500, code)
    } finally {
      saving = false
    }
  })
  server.requestTimeout = 15000
  await new Promise((resolveListening, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListening)
  })
  origin = `http://127.0.0.1:${server.address().port}`
  browserToken = developerToken(privateKey, teamId, keyId, 600, restrictBrowserTokenOrigin ? origin : undefined)
  const timeout = setTimeout(() => server.close(), 600_000)
  timeout.unref()
  server.on('close', () => clearTimeout(timeout))
  return { server, url: `${origin}${pagePath}` }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--compat')) throw new Error('Unknown argument')
  const { APPLE_MUSIC_KEY_PATH, APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID } = process.env
  if (!APPLE_MUSIC_KEY_PATH || !APPLE_MUSIC_TEAM_ID || !APPLE_MUSIC_KEY_ID) {
    throw new Error('Missing setup configuration. Follow docs/apple-music.md.')
  }
  const privateKey = await readFile(APPLE_MUSIC_KEY_PATH, 'utf8')
  const { url } = await startSetup({
    privateKey, teamId: APPLE_MUSIC_TEAM_ID, keyId: APPLE_MUSIC_KEY_ID,
    restrictBrowserTokenOrigin: !args.includes('--compat'),
    save: async contents => {
      const directory = resolve('.apple-music')
      await mkdir(directory, { recursive: true, mode: 0o700 })
      const temporary = resolve(directory, `${randomBytes(16).toString('hex')}.tmp`)
      await writeFile(temporary, contents, { mode: 0o600, flag: 'wx' })
      await rename(temporary, resolve(directory, 'credentials.env'))
      console.log('Saved .apple-music/credentials.env (owner-only permissions). Music User Token is ready for your server environment.')
    },
  })
  if (args.includes('--compat')) {
    console.log('Compatibility mode: the browser developer token expires in 10 minutes and has no optional origin claim. The private key stays local.')
  }
  console.log(`Open this local setup URL in a private browser window (expires in 10 minutes):\n${url}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error('Apple Music setup failed. Check the local configuration and key permissions. No secret details were logged.')
    process.exitCode = 1
  })
}
