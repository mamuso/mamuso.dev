import { test, expect } from '@playwright/test'

declare global {
  interface Window {
    blowTest: { requests: number; closed: number; stopped: number; samples: number; amplitude: number; requestedAt: number; closedAt: number }
  }
}

test('secret touch hold survives opening, stays active through silence and exits on tap', async ({ page, isMobile }) => {
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
      close() { stats.closedAt = performance.now(); stats.closed++; this.state = 'closed'; return Promise.resolve() }
      createMediaStreamSource() { return { connect() {}, disconnect() {} } }
      createAnalyser() { return { getFloatTimeDomainData(buffer: Float32Array) { stats.samples++; buffer.fill(stats.amplitude) }, disconnect() {} } }
    }
    Object.defineProperty(window, 'AudioContext', { value: TestAudio })
  })
  await page.goto('/')
  const control = page.getByRole('button', { name: 'View GitHub cartridge', exact: true })
  await expect(control).toBeAttached({ timeout: 30_000 })
  let previous: number[] = []
  let stableSince = 0
  await expect.poll(async () => {
    const canvas = await page.locator('canvas').last().boundingBox()
    const values = await page.getByRole('button', { name: /^View .* cartridge$/ }).evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect()
      return [rect.x + rect.width / 2, rect.y + rect.height / 2]
    }))
    if (!canvas || values.some((value, index) => index % 2 === 0 ? value < canvas.x || value > canvas.x + canvas.width : value < canvas.y || value > canvas.y + canvas.height)) return false
    if (!previous.length || values.some((value, index) => Math.abs(value - previous[index]) > 0.25)) stableSince = Date.now()
    previous = values
    return Date.now() - stableSince > 300
  }, { timeout: 30_000 }).toBe(true)
  const closedBox = (await control.boundingBox())!
  if (isMobile) await page.touchscreen.tap(closedBox.x + closedBox.width / 2, closedBox.y + closedBox.height / 2)
  else await page.mouse.click(closedBox.x + closedBox.width / 2, closedBox.y + closedBox.height / 2)
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  await control.evaluate(element => element.blur())
  const box = (await control.boundingBox())!
  const x = box.x + box.width / 2, y = box.y + box.height / 2
  const session = await page.context().newCDPSession(page)
  const start = async () => {
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
  // Completion must precede the abandoned-session deadline, not pass via timeout.
  expect(await page.evaluate(() => window.blowTest.closedAt - window.blowTest.requestedAt)).toBeLessThan(15_000)
  await page.waitForTimeout(550)
  const samples = await page.evaluate(() => window.blowTest.samples)
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.blowTest.samples)).toBe(samples)
  await page.screenshot({ path: test.info().outputPath('returned.png') })
  await expect(control).toHaveAttribute('aria-expanded', 'true')
  // A normal tap still closes the cartridge after the easter egg.
  await page.touchscreen.tap(openBox.x + openBox.width / 2, openBox.y + openBox.height / 2)
  await expect(control).toHaveAttribute('aria-expanded', 'false')
  await session.detach()
  expect(errors).toEqual([])
})
