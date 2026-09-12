import { test, expect } from '@playwright/test'
import { trackCartridgeFrames, waitForCartridgeIdle, waitForCartridgeLayout } from './cartridge-helpers'

declare global {
  interface Window {
    blowTest: { requests: number; closed: number; stopped: number; samples: number; amplitude: number; requestedAt: number; closedAt: number }
  }
}

test('secret touch hold stays active through silence and exits on tap', async ({ page, isMobile }) => {
  // Real raycasting and animated gestures are expensive on CI's software GPU.
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  // Deterministic local audio; never access the test runner's physical microphone.
  await page.addInitScript(() => {
    const stats = window.blowTest = { requests: 0, closed: 0, stopped: 0, samples: 0, amplitude: 0.006, requestedAt: 0, closedAt: 0 }
    const track = new EventTarget() as EventTarget & { stop: () => void }
    track.stop = () => { stats.stopped++ }
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      stats.requests++
      stats.requestedAt = performance.now()
      return { getTracks: () => [track] }
    } })
    class TestAudio {
      state = 'running'
      resume() { return Promise.resolve() }
      close() {
        stats.closedAt = performance.now(); stats.closed++; this.state = 'closed'
        // Reproduce a phone that cannot present a frame during audio teardown.
        const until = performance.now() + 350
        while (performance.now() < until) { /* Deliberate main-thread stall. */ }
        return Promise.resolve()
      }
      createMediaStreamSource() { return { connect() {}, disconnect() {} } }
      createAnalyser() { return { getFloatTimeDomainData(buffer: Float32Array) { stats.samples++; buffer.fill(stats.amplitude) }, disconnect() {} } }
    }
    Object.defineProperty(window, 'AudioContext', { value: TestAudio })
  })
  await trackCartridgeFrames(page)
  await page.goto('/')
  const control = page.getByRole('button', { name: 'View GitHub cartridge', exact: true })
  await expect(control).toBeAttached({ timeout: 30_000 })
  await waitForCartridgeLayout(page, page.getByRole('button', { name: /^View .* cartridge$/ }))
  const closedBox = (await control.boundingBox())!
  if (isMobile) await page.touchscreen.tap(closedBox.x + closedBox.width / 2, closedBox.y + closedBox.height / 2)
  else await page.mouse.click(closedBox.x + closedBox.width / 2, closedBox.y + closedBox.height / 2)
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  await control.evaluate(element => element.blur())
  const box = (await control.boundingBox())!
  let x = box.x + box.width / 2, y = box.y + box.height / 2
  const session = await page.context().newCDPSession(page)
  const start = async () => {
    // On software WebGL, unchanged DOM coordinates can mean no frame was
    // presented yet. Finish opening/returning before measuring the hold target.
    // Controller tests separately cover a hold armed during opening.
    await waitForCartridgeIdle(page)
    await waitForCartridgeLayout(page, control)
    const latest = (await control.boundingBox())!
    x = latest.x + latest.width / 2; y = latest.y + latest.height / 2
    if (isMobile) await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    else { await page.mouse.move(x, y); await page.mouse.down() }
  }
  const end = async () => {
    if (isMobile) await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    else await page.mouse.up()
  }
  await start()
  await page.waitForTimeout(750)
  if (!isMobile) {
    await end()
    expect(await page.evaluate(() => window.blowTest.requests)).toBe(0)
    await session.detach()
    expect(errors).toEqual([])
    return
  }
  await expect.poll(() => page.evaluate(() => window.blowTest.requests)).toBe(1)
  await end()
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  await page.waitForTimeout(700)
  await expect.poll(() => page.evaluate(() => window.blowTest.samples)).toBeGreaterThanOrEqual(10)
  await page.screenshot({ path: test.info().outputPath('ready-to-blow.png') })
  expect(await page.evaluate(() => window.blowTest.closed)).toBe(0)
  await page.evaluate(() => { window.blowTest.amplitude = 0.25 })
  await page.waitForTimeout(3000)
  expect(await page.evaluate(() => window.blowTest.stopped)).toBe(0)
  await page.evaluate(() => { window.blowTest.amplitude = 0.006 })
  await page.waitForTimeout(700)
  expect(await page.evaluate(() => window.blowTest.stopped)).toBe(0)
  // Exit while the wind is moving the model, to exercise the inertial return.
  await page.evaluate(() => { window.blowTest.amplitude = 0.25 })
  await page.waitForTimeout(150)
  // The selected cartridge may have moved since pointerdown during opening.
  const openBox = (await control.boundingBox())!
  await page.touchscreen.tap(openBox.x + openBox.width / 2, openBox.y + openBox.height / 2)
  await expect.poll(() => page.evaluate(() => window.blowTest.stopped), { timeout: 12_000 }).toBe(1)
  expect(await page.evaluate(() => window.blowTest.closed)).toBe(1)
  await page.screenshot({ path: test.info().outputPath('mid-return.png') })
  // Completion must precede the abandoned-session deadline, not pass via timeout.
  expect(await page.evaluate(() => window.blowTest.closedAt - window.blowTest.requestedAt)).toBeLessThan(15_000)
  await page.waitForTimeout(550)
  const samples = await page.evaluate(() => window.blowTest.samples)
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.blowTest.samples)).toBe(samples)
  await page.screenshot({ path: test.info().outputPath('returned.png') })
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  // A normal tap still closes the cartridge after the easter egg. Re-read
  // the target after the return instead of reusing its wind-time position.
  await waitForCartridgeIdle(page)
  await waitForCartridgeLayout(page, control)
  const returnedBox = (await control.boundingBox())!
  await page.touchscreen.tap(returnedBox.x + returnedBox.width / 2, returnedBox.y + returnedBox.height / 2)
  await expect(control).toHaveAttribute('aria-expanded', 'false')
  // A short horizontal drag must return smoothly without changing selection.
  await control.focus(); await page.keyboard.press('Enter'); await control.evaluate(element => element.blur())
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  await start()
  await expect.poll(() => page.evaluate(() => window.blowTest.requests)).toBe(2)
  await end()
  await page.waitForTimeout(550)
  const shortBox = (await control.boundingBox())!
  const shortX = shortBox.x + shortBox.width / 2, shortY = shortBox.y + shortBox.height / 2
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: shortX, y: shortY }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: shortX - 20, y: shortY }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await page.evaluate(() => window.blowTest.stopped)).toBe(2)
  await page.screenshot({ path: test.info().outputPath('short-drag-return.png') })
  await page.waitForTimeout(600)
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  // Re-enter, then commit a swipe while the microphone is active.
  await start()
  await expect.poll(() => page.evaluate(() => window.blowTest.requests)).toBe(3)
  await end()
  const dragBox = (await control.boundingBox())!
  const dragX = dragBox.x + dragBox.width / 2, dragY = dragBox.y + dragBox.height / 2
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: dragX, y: dragY }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: dragX - 80, y: dragY }] })
  await expect.poll(() => page.evaluate(() => window.blowTest.stopped)).toBe(3)
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByRole('button', { name: 'View Microsoft, Dev Services cartridge', exact: true })).toHaveAttribute('aria-expanded', 'true')
  await session.detach()
  expect(errors).toEqual([])
})
