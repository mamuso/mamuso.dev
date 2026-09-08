import { test, expect } from '@playwright/test'
import { readPostIndex } from '../lib/post-index'

const { posts } = readPostIndex()
const note = posts.find((post) => post.data.category !== 'photo')!
const alias = posts.find((post) => post.slug !== post.fileSlug)!

test('homepage loads its scene and the name remains interactive', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /a designer from Villena/ })).toBeVisible()
  const name = page.getByRole('button', { name: 'show manuel muñoz solera' })
  await name.click()
  await expect(page.getByRole('button', { name: 'show mamuso' })).toHaveAttribute('aria-pressed', 'true')
  // These controls mount only after the model is decoded inside the scene.
  await expect(page.getByRole('button', { name: 'View SpaceXAI cartridge' })).toBeAttached({ timeout: 30_000 })
  await expect(page.locator('[data-cartridge-fallback]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('notes archive and individual writing remain navigable', async ({ page }) => {
  await page.goto('/notes')
  await expect(page.getByRole('heading', { name: 'Journal', exact: true })).toBeVisible()
  await page.locator(`main a[href="/note/${note.slug}"]`).click()
  await expect(page).toHaveURL(`/note/${note.slug}`)
  await expect(page.locator('main h2')).toHaveText(note.data.title)
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://mamuso.dev/note/${note.slug}`)
})

test('infinite gallery preserves cards, scroll and viewer history', async ({ page }) => {
  await page.goto('/photos')
  const cards = page.locator('[data-gallery-card]')
  await expect(cards).toHaveCount(24)
  await page.evaluate(() => {
    const first = document.querySelector('[data-gallery-card]')!
    first.setAttribute('data-survives-append', '')
    window.scrollTo(0, document.documentElement.scrollHeight)
  })
  const position = await page.evaluate(() => ({ y: scrollY, history: history.length }))
  await expect(cards).toHaveCount(48)
  await expect(page).toHaveURL('/photos?page=2')
  expect(await page.evaluate(() => history.length)).toBe(position.history)
  expect(await page.evaluate(() => scrollY)).toBe(position.y)
  await expect(cards.first()).toHaveAttribute('data-survives-append', '')
  const photo = cards.locator('> div > a[href^="/note/"]').first()
  await photo.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => scrollY)
  await photo.click()
  await expect(page.locator('dialog')).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')
  await page.getByRole('button', { name: 'Close photo' }).click()
  await expect(page).toHaveURL('/photos?page=2')
  await expect(cards).toHaveCount(48)
  await expect(photo).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore)
  await page.reload()
  await expect(cards).toHaveCount(48)
})

test('collection viewer closes back to its gallery', async ({ page }) => {
  await page.goto('/photos')
  const collection = page.locator('[data-gallery-card] > div > a[href^="/photos/stack/"]').first()
  await collection.click()
  await expect(page.locator('dialog')).toBeVisible()
  await expect(page.locator('dialog figure')).not.toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL('/photos')
  await expect(collection).toBeFocused()
})

test('image dimensions are reserved before images arrive', async ({ page }) => {
  await page.route('**/_next/image?**', (route) => route.abort())
  await page.goto('/photos')
  await expect(page.locator('[data-gallery-card]')).toHaveCount(24)
  const dimensions = await page.locator('[data-photo-print] img').evaluateAll((images) =>
    images.map((image) => ({ width: (image as HTMLElement).offsetWidth, height: (image as HTMLElement).offsetHeight })))
  expect(dimensions.length).toBeGreaterThan(0)
  for (const image of dimensions) {
    expect(image.width).toBeGreaterThan(0)
    expect(image.height).toBeGreaterThan(0)
  }
})

test('legacy routes and social images return the correct resources', async ({ request }) => {
  for (const path of [`/post/${alias.fileSlug}`, `/note/${alias.fileSlug}`]) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    expect(new URL(response.url()).pathname).toBe(`/note/${alias.slug}`)
  }
  const archive = await request.get('/posts')
  expect(new URL(archive.url()).pathname).toBe('/notes')
  // The suite starts with a cold image cache; optimization must not break OG SVG rendering.
  const photo = posts.find((post) => post.data.category === 'photo')!
  const optimized = await request.get(`/_next/image?${new URLSearchParams({
    url: `/assets/feed/${photo.data.basename}`,
    w: '64', q: '75',
  })}`)
  expect(optimized.status()).toBe(200)
  const image = await request.get(`/og?${new URLSearchParams({ title: 'Mouse on / Mouse off? #1 — "Muñoz"', description: 'mamuso.dev' })}`)
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toContain('image/png')
  expect((await image.body()).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
})

test('a failed GLB leaves the homepage and work history usable', async ({ page }) => {
  let blocked = false
  await page.route('**/models/famicom_cartridge.glb', (route) => {
    blocked = true
    return route.abort()
  })
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Work experience' })).toBeVisible()
  expect(blocked).toBe(true)
  await expect(page.getByRole('heading', { name: /a designer from Villena/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Work experience' })).toContainText('GitHub')
  await page.getByRole('button', { name: 'show manuel muñoz solera' }).click()
  await expect(page.getByRole('button', { name: 'show mamuso' })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('a[href="/photos"]').click()
  await expect(page.getByRole('heading', { name: 'Say Cheese' })).toBeVisible()
})
