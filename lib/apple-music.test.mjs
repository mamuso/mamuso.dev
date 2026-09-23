import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import { get } from 'node:http'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { createRecentTrackReader, publicTrack } from './apple-music.ts'
import { startSetup } from '../scripts/apple-music-setup.mjs'
import { developerToken } from './apple-music-token.mjs'

const response = {
  data: [{ type: 'songs', id: '123', attributes: {
    name: 'Song', artistName: 'Artist', account: 'PRIVATE',
    artwork: { url: 'https://is1-ssl.mzstatic.com/image/{w}x{h}bb.jpg' },
    url: 'https://music.apple.com/us/album/example/456?i=123&private=secret',
  } }],
  token: 'PRIVATE', next: '/private/history',
}

test('public projection contains only display fields and approved URLs', () => {
  assert.deepEqual(publicTrack(response), {
    name: 'Song', artist: 'Artist', bgColor: null,
    artwork: 'https://is1-ssl.mzstatic.com/image/160x160bb.jpg',
    url: 'https://music.apple.com/us/album/example/456?i=123',
  })
  for (const url of ['javascript:alert(1)', 'https://music.apple.com.evil.test/a', 'https://user:password@music.apple.com/a', 'http://music.apple.com/a']) {
    const payload = structuredClone(response)
    payload.data[0].attributes.url = url
    payload.data[0].attributes.artwork.url = url
    assert.equal(publicTrack(payload).url, null)
    assert.equal(publicTrack(payload).artwork, null)
  }
  for (const payload of [null, {}, { data: [] }, { errors: ['PRIVATE'] }, { data: [{ type: 'stations' }] }]) {
    assert.equal(publicTrack(payload), null)
  }
})

test('artwork background accepts only six-digit hex colors', () => {
  for (const [input, expected] of [['aB12ef', '#aB12ef'], ['000000', '#000000'], [undefined, null], ['#abcdef', null], ['red', null], ['url(https://example.com)', null], [123456, null]]) {
    const payload = structuredClone(response)
    payload.data[0].attributes.artwork.bgColor = input
    assert.equal(publicTrack(payload).bgColor, expected)
  }
})

test('missing credentials never contact Apple', async () => {
  const read = createRecentTrackReader({ credentials: () => ({}), request: () => assert.fail('Network request') })
  assert.deepEqual(await read(), { status: 'unavailable', track: null, refreshAfterMs: 15_000 })
})

test('fixed upstream, no redirects or persistent fetch cache; concurrent requests deduplicate', async () => {
  let calls = 0
  let time = 0
  const read = createRecentTrackReader({
    credentials: () => ({ developerToken: 'FAKE_DEVELOPER', userToken: 'FAKE_USER' }),
    now: () => time,
    request: async (url, options) => {
      calls++
      assert.equal(url, 'https://api.music.apple.com/v1/me/recent/played/tracks?limit=1')
      assert.deepEqual(options.headers, { Authorization: 'Bearer FAKE_DEVELOPER', 'Music-User-Token': 'FAKE_USER' })
      assert.equal(options.redirect, 'error')
      assert.equal(options.cache, 'no-store')
      return Response.json(response)
    },
  })
  const results = await Promise.all([read(), read(), read()])
  assert.equal(calls, 1)
  assert.equal(JSON.stringify(results).includes('FAKE'), false)
  await read()
  assert.equal(calls, 1)
  time = 60_001
  await read()
  assert.equal(calls, 2)
})

test('authentication errors, malformed data and network failures fail closed with a cooldown', async () => {
  for (const request of [
    async () => new Response('PRIVATE', { status: 401 }),
    async () => new Response('PRIVATE', { status: 429 }),
    async () => new Response('not JSON'),
    async () => { throw new Error('PRIVATE') },
  ]) {
    let calls = 0
    const read = createRecentTrackReader({
      credentials: () => ({ developerToken: 'FAKE', userToken: 'FAKE' }),
      request: (...args) => { calls++; return request(...args) },
    })
    assert.equal((await read()).status, 'unavailable')
    assert.equal((await read()).track, null)
    assert.equal(calls, 1)
  }
})

test('every failed refresh clears the last track immediately and recovers after fifteen seconds', async () => {
  for (const failure of [
    async () => new Response(null, { status: 401 }),
    async () => new Response(null, { status: 403 }),
    async () => new Response(null, { status: 429 }),
    async () => new Response(null, { status: 503 }),
    async () => new Response('not JSON'),
    async () => Response.json({ data: [{ type: 'songs' }] }),
    async () => { throw new DOMException('Timed out', 'TimeoutError') },
    async () => { throw new Error('PRIVATE') },
  ]) {
    let time = 0
    let failing = false
    let calls = 0
    const read = createRecentTrackReader({
      credentials: () => ({ developerToken: 'FAKE', userToken: 'FAKE' }),
      now: () => time,
      request: async () => {
        calls++
        return failing ? failure() : Response.json(response)
      },
    })
    const ready = await read()
    assert.equal(ready.status, 'ready')
    time = 59_999
    await read()
    assert.equal(calls, 1)
    failing = true
    time = 60_000
    assert.deepEqual(await read(), { status: 'unavailable', track: null, refreshAfterMs: 15_000 })
    failing = false
    time = 74_999
    assert.deepEqual(await read(), { status: 'unavailable', track: null, refreshAfterMs: 1 })
    assert.equal(calls, 2)
    time = 75_000
    assert.deepEqual(await read(), ready)
    assert.equal(calls, 3)
  }
})

test('empty history clears a previous song and is distinct from a failed request', async () => {
  let time = 0
  const read = createRecentTrackReader({
    credentials: () => ({ developerToken: 'FAKE', userToken: 'FAKE' }),
    now: () => time,
    request: async () => time === 0 ? Response.json(response) : Response.json({ data: [] }),
  })
  assert.equal((await read()).status, 'ready')
  time = 60_000
  assert.deepEqual(await read(), { status: 'empty', track: null, refreshAfterMs: 60_000 })
})

const keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' })

test('compatibility setup only omits the optional origin claim; expiry and local guards remain', async t => {
  const { server, url } = await startSetup({
    privateKey, teamId: 'ABCDEFGHIJ', keyId: '1234567890',
    restrictBrowserTokenOrigin: false, save: async () => assert.fail('Unexpected save'),
  })
  t.after(() => { server.closeAllConnections(); server.close() })
  const response = await fetch(url)
  const html = await response.text()
  const jwt = html.match(/developerToken: "([^"]+)"/)[1]
  const claims = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url'))
  assert.equal(claims.exp - claims.iat, 600)
  assert.equal('origin' in claims, false)
  assert.equal(html.includes('PRIVATE KEY'), false)
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/)
  const rejected = await fetch(`${url}/token`, { method: 'POST', headers: { Origin: 'https://evil.test', 'Content-Type': 'application/json' }, body: '{}' })
  assert.equal(rejected.status, 403)
})

test('developer tokens use verifiable ES256 signatures and restricted short-lived browser claims', () => {
  const jwt = developerToken(privateKey, 'ABCDEFGHIJ', '1234567890', 600, 'http://127.0.0.1:1234')
  const [header, payload, signature] = jwt.split('.')
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'ES256', kid: '1234567890' })
  const claims = JSON.parse(Buffer.from(payload, 'base64url'))
  assert.equal(claims.exp - claims.iat, 600)
  assert.deepEqual(claims.origin, ['http://127.0.0.1:1234'])
  assert.equal(verify('sha256', Buffer.from(`${header}.${payload}`), { key: keys.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')), true)
})

test('local authorization rejects cross-origin/unknown requests and saves tokens only after Apple validates', async t => {
  let saved
  let valid = false
  const { server, url } = await startSetup({
    privateKey, teamId: 'ABCDEFGHIJ', keyId: '1234567890',
    save: async value => { saved = value },
    request: async () => new Response(null, { status: valid ? 200 : 403 }),
  })
  t.after(() => { server.closeAllConnections(); server.close() })
  const origin = new URL(url).origin
  assert.equal((await fetch(`${origin}/`)).status, 404)
  const wrongHostStatus = await new Promise((resolve, reject) => {
    get(url, { headers: { Host: 'evil.test' } }, res => {
      res.resume()
      resolve(res.statusCode)
    }).on('error', reject)
  })
  assert.equal(wrongHostStatus, 403)
  const page = await fetch(url)
  assert.equal(page.headers.get('cache-control'), 'no-store')
  assert.equal(page.headers.get('referrer-policy'), 'strict-origin')
  const html = await page.text()
  assert.equal(html.includes('PRIVATE KEY'), false)
  const browserJWT = html.match(/developerToken: "([^"]+)"/)[1]
  const claims = JSON.parse(Buffer.from(browserJWT.split('.')[1], 'base64url'))
  assert.equal(claims.exp - claims.iat, 600)
  const post = (headers, body = { userToken: 'FAKE_USER_TOKEN_FOR_TESTS_ONLY' }) => fetch(`${url}/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
  assert.equal((await post({ Origin: 'https://evil.test' })).status, 403)
  assert.equal((await post({})).status, 403)
  assert.equal((await post({ Origin: origin }, { userToken: 'bad\nINJECT=value' })).status, 400)
  const rejected = await post({ Origin: origin })
  assert.equal(rejected.status, 502)
  assert.deepEqual(await rejected.json(), { code: 'APPLE_403' })
  assert.equal(saved, undefined)
  valid = true
  assert.equal((await post({ Origin: origin })).status, 200)
  assert.equal(saved.includes('APPLE_MUSIC_DEVELOPER_TOKEN'), false)
  assert.match(saved, /APPLE_MUSIC_USER_TOKEN=FAKE_USER_TOKEN_FOR_TESTS_ONLY\n$/)
  assert.equal(saved.includes(browserJWT), false)
  assert.equal(saved.includes('PRIVATE KEY'), false)

  // Exercise the actual served script: denied browser storage must not mask a save.
  const handlers = {}
  const status = { textContent: '' }
  const diagnostics = { textContent: '' }
  const button = { disabled: false, addEventListener: (event, handler) => { handlers[event] = handler } }
  const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1]
  const context = {
    document: { querySelector: selector => selector === 'button' ? button : selector === '#diagnostics' ? diagnostics : status, addEventListener: (event, handler) => { handlers[event] = handler } },
    URL,
    MusicKit: { getInstance: () => ({ authorize: async () => 'FAKE_USER_TOKEN_FOR_TESTS_ONLY' }) },
    fetch: async () => new Response('Saved'),
    localStorage: { clear() { throw new Error('PRIVATE storage denied') } },
    sessionStorage: { clear() {} },
  }
  context.window = { fetch: async () => new Response(null, { status: 403 }) }
  runInNewContext(script, context)
  await handlers.click()
  assert.match(status.textContent, /^Saved\./)
  context.fetch = async () => Response.json({ code: 'APPLE_403', ignoredSecret: 'PRIVATE' }, { status: 502 })
  await handlers.click()
  assert.match(status.textContent, /^APPLE_403:/)
  assert.equal(status.textContent.includes('PRIVATE'), false)
  context.MusicKit.getInstance = () => ({ authorize: async () => { throw new Error('PRIVATE') } })
  await handlers.click()
  assert.match(status.textContent, /^APPLE_AUTHORIZATION_FAILED:/)
  assert.equal(status.textContent.includes('PRIVATE'), false)
  handlers.securitypolicyviolation({ disposition: 'enforce', effectiveDirective: 'connect-src', blockedURI: 'https://api.music.apple.com/private-path?token=PRIVATE#PRIVATE' })
  assert.equal(diagnostics.textContent, 'Browser resource blocked: connect-src → https://api.music.apple.com')
  assert.match(status.textContent, /^APPLE_AUTHORIZATION_FAILED:/)
  assert.equal(status.textContent.includes('PRIVATE'), false)
  context.MusicKit.getInstance = () => ({ authorize: async () => {
    await context.window.fetch('https://api.music.apple.com/v1/me/storefront?token=PRIVATE')
    throw new Error('PRIVATE')
  } })
  await handlers.click()
  assert.match(status.textContent, /APPLE_STOREFRONT_HTTP_403/)
  assert.equal(status.textContent.includes('PRIVATE'), false)
})


test('cached music reports remaining freshness instead of restarting one minute', async () => {
  let time = 0
  let calls = 0
  const read = createRecentTrackReader({
    credentials: () => ({ developerToken: 'FAKE', userToken: 'FAKE' }),
    now: () => time,
    request: async () => { calls++; return Response.json(response) },
  })
  assert.equal((await read()).refreshAfterMs, 60_000)
  time = 50_000
  assert.equal((await read()).refreshAfterMs, 10_000)
  assert.equal(calls, 1)
  time = 60_000
  assert.equal((await read()).refreshAfterMs, 60_000)
  assert.equal(calls, 2)
})
