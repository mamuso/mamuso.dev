import { test, expect } from '@playwright/test'

test('cartridge buffer stays stable during interaction and after opening at rest', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const control = page.getByRole('button', { name: 'View Vercel cartridge' })
  await expect(control).toBeAttached()
  const canvas = page.locator('[data-cartridge-viewer] canvas').last()
  await expect.poll(() => canvas.evaluate(c => (c as HTMLCanvasElement).width)).toBeGreaterThan(0)
  await canvas.evaluate(element => {
    const canvas = element as HTMLCanvasElement
    const width = canvas.width, height = canvas.height
    // Record every backing-store size transition, including ones later undone.
    const changes: string[] = []
    new MutationObserver(() => {
      if (canvas.width !== width || canvas.height !== height) changes.push(`${canvas.width}x${canvas.height}`)
      canvas.dataset.bufferChanges = JSON.stringify(changes)
    }).observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] })
    canvas.dataset.bufferChanges = '[]'
    canvas.dataset.retainedCartridge = 'true'
  })
  await expect(control).toBeEnabled()
  await control.focus()
  await page.keyboard.press('Enter')
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  // Sustained no-input observation catches oscillation after motion settles.
  await page.waitForTimeout(6000)
  await page.evaluate(() => window.scrollTo(0, 100))
  await page.waitForTimeout(500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape')
  await expect(control).toHaveAttribute('aria-expanded', 'false')
  await page.waitForTimeout(2000)
  await expect(canvas).toHaveAttribute('data-buffer-changes', '[]')
  await expect(page.locator('canvas[data-retained-cartridge]')).toHaveCount(1)
  expect(errors).toEqual([])
})
