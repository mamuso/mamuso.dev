import { test, expect } from '@playwright/test'
import { waitForCartridgeLayout } from './cartridge-helpers'

// Continuous trace screencasts compete with SwiftShader for GPU readbacks.
// Retain action/DOM traces and the configured screenshot on failure.
test.use({ trace: { mode: 'retain-on-failure', screenshots: false } })

test('horizontal touch drags switch open cartridges while taps and vertical scroll remain usable', async ({ page, isMobile }) => {
  // Real raycasting and animated gestures are expensive on CI's software GPU.
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const controls = page.getByRole('button', { name: /^View .* cartridge$/ })
  await expect(controls).toHaveCount(6)
  await waitForCartridgeLayout(page, controls)
  const session = await page.context().newCDPSession(page)
  const drag = async (index: number, dx: number, dy = 0, cancel = false) => {
    const rect = (await controls.nth(index).boundingBox())!
    const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2
    if (!isMobile) {
      await page.mouse.move(x, y); await page.mouse.down()
      await page.mouse.move(x + dx, y + dy, { steps: 5 }); await page.mouse.up()
      return
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 5; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 5, y: y + dy * step / 5 }] })
    }
    await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] })
  }
  await drag(2, -80)
  await expect(page.locator('button[aria-expanded=true]')).toHaveCount(0)
  const box = (await controls.nth(2).boundingBox())!
  if (isMobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
  await waitForCartridgeLayout(page, controls.nth(2))
  await drag(2, -90)
  if (!isMobile) {
    await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
  } else {
    await expect(controls.nth(3)).toHaveAttribute('aria-expanded', 'true')
    await waitForCartridgeLayout(page, controls.nth(3))
    await drag(3, 90)
    await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
    await waitForCartridgeLayout(page, controls.nth(2))
    await drag(2, 25)
    await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
    await drag(2, -80, 0, true)
    await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
    await page.setViewportSize({ width: 390, height: 640 })
    await waitForCartridgeLayout(page, controls.nth(2))
    await drag(2, 3, -100)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
    await expect(controls.nth(2)).toHaveAttribute('aria-expanded', 'true')
  }
  await session.detach()
  expect(errors).toEqual([])
})
