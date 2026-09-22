import { test, expect } from '@playwright/test'

test('photo endpoint returns disjoint bounded batches and rejects invalid pages', async ({ request }) => {
  const keys = new Set<string>()
  let totalCount = 0
  for (let page = 1; page === 1 || keys.size < totalCount; page++) {
    const response = await request.get(`/api/photos?page=${page}`)
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toBe('no-store')
    const batch = await response.json()
    totalCount = batch.totalCount
    expect(batch.page).toBe(page)
    expect(batch.groups.length).toBe(Math.min(24, totalCount - keys.size))
    for (const group of batch.groups) {
      expect(keys.has(group.key)).toBe(false)
      keys.add(group.key)
    }
  }
  expect(keys.size).toBe(totalCount)
  for (const query of ['', '?page=0', '?page=01', '?page=999999', '?page=1&page=2']) {
    expect((await request.get(`/api/photos${query}`)).status()).toBe(400)
  }
})

test('failed batch preserves cards and URL, and can be retried', async ({ page }) => {
  let attempts = 0
  await page.route('**/api/photos?page=2', async route => {
    attempts++
    if (attempts === 1) return route.fulfill({ status: 503, body: '{}' })
    await route.continue()
  })
  await page.goto('/photos')
  await expect(page.locator('[data-gallery-card]')).toHaveCount(24)
  await page.locator('[data-gallery-sentinel]').scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page).toHaveURL('/photos')
  await expect(page.locator('[data-gallery-card]')).toHaveCount(24)
  expect(attempts).toBe(1)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.locator('[data-gallery-card]')).toHaveCount(48)
  await expect(page).toHaveURL('/photos?page=2')
  expect(attempts).toBe(2)
})

test('gallery keeps cumulative pagination without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  try {
    const page = await context.newPage()
    await page.goto('/photos')
    await expect(page.locator('[data-gallery-card]')).toHaveCount(24)
    await page.getByRole('link', { name: 'Next photos' }).click()
    await expect(page).toHaveURL('/photos?page=2')
    await expect(page.locator('[data-gallery-card]')).toHaveCount(48)
  } finally {
    await context.close()
  }
})
