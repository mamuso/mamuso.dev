import { test, expect } from '@playwright/test'

for (const batch of [1, 2]) {
  test(`All photos restores batch ${batch} before capturing the return morph`, async ({ page }) => {
    await page.addInitScript(() => {
      const captures: string[][] = []
      Object.assign(window, { returnMorphs: captures })
      const start = document.startViewTransition.bind(document)
      document.startViewTransition = (...args: Parameters<typeof start>) => {
        const transition = start(...args)
        transition.ready.then(() => {
          captures.push(document.getAnimations().flatMap(animation => {
            const effect = animation.effect as KeyframeEffect | null
            return effect?.pseudoElement?.startsWith('::view-transition-group(photo-') ? [effect.pseudoElement] : []
          }))
        }, () => {})
        return transition
      }
    })
    const gallery = batch === 1 ? '/photos' : '/photos?page=2'
    await page.goto(gallery)
    // Pick a standalone photo below the initial viewport, including a later batch.
    const photo = page.locator(`[data-gallery-card]:nth-child(n+${batch === 1 ? 9 : 25}) [data-photo-print][href^="/note/"]`).first()
    await photo.scrollIntoViewIfNeeded()
    // Stay clear of the next-batch sentinel so the origin cannot change before clicking.
    await expect(page).toHaveURL(gallery)
    const origin = await page.evaluate(() => ({ href: location.pathname + location.search, scrollY }))
    expect(origin.scrollY).toBeGreaterThan(0)
    const destination = await photo.getAttribute('href')
    await photo.click()
    await expect(page).toHaveURL(destination!)
    const back = page.getByRole('link', { name: /^(?:← )?All photos$/ })
    await expect(back).toHaveAttribute('href', origin.href)
    if (batch === 2) {
      await page.reload()
      await expect(back).toHaveAttribute('href', origin.href)
    }
    // Discard the forward transition; only the return should satisfy this assertion.
    await page.evaluate(async () => {
      await Promise.allSettled(document.getAnimations().map(animation => animation.finished))
      ;(window as typeof window & { returnMorphs: string[][] }).returnMorphs.length = 0
    })
    await back.click()
    await expect(page).toHaveURL(origin.href)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(origin.scrollY, 0)
    const expected = `::view-transition-group(photo-${destination!.split('/').pop()})`
    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & { returnMorphs: string[][] }).returnMorphs.flat()
    )).toContain(expected)
    await expect(photo).toBeInViewport()
  })
}
