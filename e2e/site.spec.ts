import { test, expect } from '@playwright/test'
import { readPostIndex } from '../lib/post-index'
import { waitForCartridgeLayout } from './cartridge-helpers'

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

test('infinite gallery preserves cards and scroll across photo navigation', async ({ page }) => {
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
  const href = await photo.getAttribute('href')
  await photo.click()
  await expect(page).toHaveURL(href!)
  await expect(page.locator('main [data-progressive-photo] img:not([aria-hidden])')).toBeVisible()
  await expect(page.locator('dialog')).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL('/photos?page=2')
  await expect(cards).toHaveCount(48)
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore)
  await page.reload()
  await expect(cards).toHaveCount(48)
})

test('collection and photo pages navigate back to the gallery', async ({ page }) => {
  await page.goto('/photos')
  const collection = page.locator('[data-gallery-card] > div > a[href^="/photos/stack/"]').first()
  await collection.click()
  await expect(page).toHaveURL(/\/photos\/stack\//)
  await expect(page.locator('dialog')).toHaveCount(0)
  const photo = page.locator('main a[href^="/note/"]').first()
  const href = await photo.getAttribute('href')
  await photo.click()
  await expect(page).toHaveURL(href!)
  await expect(page.locator('main [data-progressive-photo] img:not([aria-hidden])')).toBeVisible()
  await page.goBack()
  await page.getByRole('link', { name: /^(?:← )?All photos$/ }).click()
  await expect(page).toHaveURL('/photos')
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


test('photo navigation animates image geometry and captures the header', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document)
    const captures: { header: string; morphs: { name: string; widths: number[]; duration: number }[] }[] = []
    Object.assign(window, { photoTransitionCaptures: captures })
    document.startViewTransition = (...args) => {
      const transition = start(...args)
      transition.ready.then(() => {
        captures.push({
          header: getComputedStyle(document.querySelector('header')!).viewTransitionName,
          morphs: document.getAnimations().flatMap((animation) => {
            const effect = animation.effect as KeyframeEffect | null
            const name = effect?.pseudoElement ?? ''
            if (!effect || !name.startsWith('::view-transition-group(photo-')) return []
            return [{
              name,
              widths: effect.getKeyframes().map((frame) => Number.parseFloat(String(frame.width))),
              duration: Number(effect.getTiming().duration),
            }]
          }),
        })
      }).catch((error) => { throw error })
      return transition
    }
  })
  await page.goto('/photos')
  const photo = page.locator('[data-gallery-card] > div > a[href^="/note/"]').first()
  const href = await photo.getAttribute('href')
  await photo.click()
  await expect(page).toHaveURL(href!)
  const name = `::view-transition-group(photo-${href!.split('/').pop()})`
  await expect.poll(() => page.evaluate((name) => {
    const captures = (window as Window & {
      photoTransitionCaptures?: { header: string; morphs: { name: string; widths: number[]; duration: number }[] }[]
    }).photoTransitionCaptures ?? []
    return captures.some((capture) => capture.header === 'site-header' && capture.morphs.some(
      (morph) => morph.name === name && morph.duration > 0 && morph.widths.length >= 2 &&
        morph.widths[0] > 0 && morph.widths.at(-1)! > morph.widths[0],
    ))
  }, name)).toBe(true)
  expect(errors).toEqual([])
})

test('cartridges retain pointer, keyboard and resize interaction', async ({ page, isMobile }) => {
  await page.goto('/')
  const controls = page.getByRole('button', { name: /^View .* cartridge$/ })
  await expect(controls).toHaveCount(6)
  await waitForCartridgeLayout(page, controls)
  const box = (await controls.nth(2).boundingBox())!
  if (isMobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
  // Interrupt the open spring with a different selection using the keyboard.
  await controls.nth(1).focus()
  await page.keyboard.press('Enter')
  await expect(controls.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'false')
  await page.locator('canvas').last().evaluate(canvas => canvas.setAttribute('data-retained-canvas', 'true'))
  await page.setViewportSize({ width: isMobile ? 440 : 820, height: 900 })
  await expect(page.locator('canvas[data-retained-canvas]')).toHaveCount(1)
  await expect(controls.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(controls.nth(1)).toHaveAttribute('aria-expanded', 'false')
  if (isMobile) {
    await page.setViewportSize({ width: 440, height: 640 })
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 220, y: 550 }] })
    for (const y of [520, 480, 440, 400, 350]) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 220, y }] })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
    await expect(page.locator('button[aria-expanded=true]')).toHaveCount(0)
    await session.detach()
  }
})


test('photo detail retains its thumbnail while the full image loads', async ({ page }) => {
  let releaseImage!: () => void
  const imageGate = new Promise<void>((resolve) => { releaseImage = resolve })
  await page.route('**/_next/image?**', async (route) => {
    const source = new URL(route.request().url()).searchParams.get('url') ?? ''
    if (source.startsWith('/assets/feed/') && !source.startsWith('/assets/feed/gallery-')) await imageGate
    await route.continue()
  })
  try {
    await page.goto('/photos')
    await page.locator('[data-gallery-card] > div > a[href^="/note/"]').first().click()
    const frame = page.locator('main [data-progressive-photo]')
    const preview = frame.locator('img[aria-hidden="true"]')
    const original = frame.locator('img:not([aria-hidden])')
    await expect(preview).toBeVisible()
    await expect.poll(() => preview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await expect(original).toHaveCSS('opacity', '0')
    const before = await frame.boundingBox()
    releaseImage()
    await expect(original).toHaveCSS('opacity', '1')
    expect(await frame.boundingBox()).toEqual(before)
  } finally {
    releaseImage()
  }
})
