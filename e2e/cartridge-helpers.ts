import { expect, type Locator, type Page } from '@playwright/test'

declare global {
  interface Window { cartridgeFramesPending: () => number }
}

/** Track the demand loop without reaching into React/Three component internals. */
export async function trackCartridgeFrames(page: Page) {
  await page.addInitScript(() => {
    const pending = new Set<number>()
    const request = window.requestAnimationFrame.bind(window)
    const cancel = window.cancelAnimationFrame.bind(window)
    window.requestAnimationFrame = callback => {
      const id = request(time => { pending.delete(id); callback(time) })
      pending.add(id)
      return id
    }
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id) }
    window.cartridgeFramesPending = () => pending.size
  })
}

export async function waitForCartridgeIdle(page: Page) {
  await expect.poll(() => page.evaluate(() => window.cartridgeFramesPending()),
    { timeout: 60_000 }).toBe(0)
}

/** Raycast coordinates must follow the rendered spring, even on software WebGL. */
export async function waitForCartridgeLayout(page: Page, controls: Locator) {
  // Parked warm-up poses can look stable, even across animation frames. The
  // controls only become actionable once their entrance actually completes.
  await expect.poll(() => controls.evaluateAll(elements =>
    elements.length > 0 && elements.every(element => !element.matches(':disabled'))),
  { timeout: 60_000 }).toBe(true)
  let previous: number[] = []
  let stableSince = 0
  await expect.poll(async () => {
    // Repeated DOM reads during a slow GPU frame do not prove stability.
    // Let the animation loop present its next pose before comparing positions.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
    const canvas = await page.locator('canvas').last().boundingBox()
    const values = await controls.evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect()
      return [rect.x + rect.width / 2, rect.y + rect.height / 2]
    }))
    if (!canvas || !values.length || values.some((value, index) => index % 2 === 0
      ? value < canvas.x || value > canvas.x + canvas.width
      : value < canvas.y || value > canvas.y + canvas.height)) {
      previous = []
      stableSince = 0
      return false
    }
    if (!previous.length || values.some((value, index) => Math.abs(value - previous[index]) > 0.25)) stableSince = Date.now()
    previous = values
    return Date.now() - stableSince > 300
  }, { timeout: 60_000 }).toBe(true)
}
