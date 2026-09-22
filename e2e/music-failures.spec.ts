import { test, expect } from '@playwright/test'

const ready = {
  status: 'ready',
  track: { name: 'Test song', artist: 'Test artist', artwork: null, bgColor: null, url: 'https://music.apple.com/us/song/test/123' },
}

for (const failure of ['http', 'network', 'json', 'empty'] as const) {
  test(`music clears the previous song after ${failure} and recovers`, async ({ page }) => {
    let calls = 0
    await page.route('**/models/famicom_cartridge.glb', route => route.abort())
    await page.route('**/api/music', route => {
      calls++
      if (calls !== 2) return route.fulfill({ json: ready })
      if (failure === 'network') return route.abort()
      if (failure === 'json') return route.fulfill({ body: 'not JSON' })
      return route.fulfill({ status: failure === 'http' ? 503 : 200, json: { status: failure === 'http' ? 'unavailable' : 'empty', track: null } })
    })
    await page.clock.install()
    await page.goto('/')
    const music = page.locator('footer a[href="https://music.apple.com/us/song/test/123"]')
    await expect(music).toBeVisible()
    await page.clock.fastForward(240_000)
    await expect(music).toHaveCount(0)
    expect(calls).toBe(2)
    await page.clock.fastForward(failure === 'empty' ? 240_000 : 15_000)
    await expect(music).toBeVisible()
    expect(calls).toBe(3)
  })
}

test('a stalled music response times out, hides the song and allows a retry', async ({ page }) => {
  let calls = 0
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/models/famicom_cartridge.glb', route => route.abort())
  await page.route('**/api/music', async route => {
    calls++
    if (calls === 2) {
      await gate
      await route.abort()
    } else await route.fulfill({ json: ready })
  })
  await page.clock.install()
  try {
    await page.goto('/')
    const music = page.locator('footer a[href="https://music.apple.com/us/song/test/123"]')
    await expect(music).toBeVisible()
    await page.clock.fastForward(240_000)
    await expect.poll(() => calls).toBe(2)
    await page.clock.fastForward(8000)
    await expect(music).toHaveCount(0)
    release()
    await page.clock.fastForward(15_000)
    await expect(music).toBeVisible()
    expect(calls).toBe(3)
  } finally {
    release()
  }
})
