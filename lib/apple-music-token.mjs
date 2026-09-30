// Node-only signing helper shared by the server-only boundary and local setup.
import { createPrivateKey, sign } from 'node:crypto'

export function developerToken(privateKey, teamId, keyId, lifetime, origin = undefined) {
  const key = createPrivateKey(privateKey)
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') {
    throw new Error('Expected a MusicKit P-256 private key.')
  }
  if (!/^[A-Z0-9]{10}$/.test(teamId) || !/^[A-Z0-9]{10}$/.test(keyId)) {
    throw new Error('Expected 10-character Team ID and Key ID.')
  }
  const issued = Math.floor(Date.now() / 1000)
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'ES256', kid: keyId })
  const payload = encode({ iss: teamId, iat: issued, exp: issued + lifetime, ...(origin ? { origin: [origin] } : {}) })
  const unsigned = `${header}.${payload}`
  const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
  return `${unsigned}.${signature}`
}
