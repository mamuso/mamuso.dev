// Node 24. Attach only to a dedicated agent-browser session, against a production build.
// Usage: node scripts/profile-gallery.mjs <browser-cdp-url> <label> [/photos?page=2]
import { writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const [endpoint, label, route = '/photos'] = process.argv.slice(2)
if (!endpoint || !/^[a-z0-9-]+$/.test(label ?? '')) throw new Error('Provide a browser CDP URL and a simple label')
const origin = process.env.GALLERY_PROFILE_ORIGIN || 'http://localhost:3102'
const socket = new WebSocket(endpoint)
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))
let sequence = 0
let sessionId
const calls = new Map()
const events = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const call = calls.get(message.id)
    calls.delete(message.id)
    if (message.error) call.reject(new Error(JSON.stringify(message.error)))
    else call.resolve(message.result)
  } else {
    for (const listener of events.get(message.method) || []) listener(message.params)
  }
})
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    calls.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}
function on(name, listener) {
  events.set(name, [...events.get(name) || [], listener])
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails))
  return response.result.value
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

try {
  const { targetInfos } = await send('Target.getTargets')
  const target = targetInfos.find((item) => item.type === 'page' && item.url.startsWith(origin))
  if (!target) throw new Error(`Open ${origin}/photos in the dedicated browser first`)
  ;({ sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }))
  await send('Page.enable')
  await send('Network.enable')
  await send('Network.setCacheDisabled', { cacheDisabled: true })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 })
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.galleryProfile = { shifts: [], longTasks: [] };
    new PerformanceObserver(list => galleryProfile.shifts.push(...list.getEntries()
      .filter(entry => !entry.hadRecentInput).map(entry => entry.value)))
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => galleryProfile.longTasks.push(...list.getEntries().map(entry => entry.duration)))
      .observe({ type: 'longtask', buffered: true });
  ` })
  const paused = []
  let hold = true
  on('Fetch.requestPaused', (request) => {
    if (hold) paused.push(request.requestId)
    else void send('Fetch.continueRequest', { requestId: request.requestId })
  })
  await send('Fetch.enable', { patterns: [{ resourceType: 'Image', requestStage: 'Request' }] })
  const domReady = new Promise((resolve) => on('Page.domContentEventFired', resolve))
  await send('Page.navigate', { url: origin + route })
  let navigationTimeout
  try {
    await Promise.race([domReady, new Promise((_, reject) => { navigationTimeout = setTimeout(() => reject(new Error('Navigation timed out')), 30000) })])
  } finally {
    clearTimeout(navigationTimeout)
  }
  let interactiveAt = null
  if (route.startsWith('/photos') && !route.startsWith('/photos/stack/')) {
    // A real React pointer handler must respond; DOMContentLoaded alone is not interaction readiness.
    for (let attempt = 0; attempt < 100; attempt++) {
      interactiveAt = await evaluate(`(() => {
        const print = document.querySelector('[data-photo-print]');
        if (!print) return null;
        print.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, isPrimary: true, pointerType: 'mouse', clientX: 100, clientY: 100 }));
        print.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, isPrimary: true, pointerType: 'mouse', clientX: 110, clientY: 100 }));
        return print.closest('[data-photo-stack]').hasAttribute('data-opened') ? performance.now() : null;
      })()`)
      if (interactiveAt !== null) break
      await delay(50)
    }
  }
  await delay(450) // Let the deliberate pointer animation settle before comparing geometry.
  const geometry = `Array.from(document.querySelectorAll('[data-photo-print] img, main ul a > span > img'))
    .map(image => ({ width: image.offsetWidth, height: image.offsetHeight, top: image.getBoundingClientRect().top }))`
  const before = await evaluate(geometry)
  const screenshot = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(`/tmp/gallery-${label}-unloaded.png`, Buffer.from(screenshot.data, 'base64'))
  hold = false
  await Promise.all(paused.map((requestId) => send('Fetch.continueRequest', { requestId })))
  await delay(7000)
  const after = await evaluate(geometry)
  const metrics = await evaluate(`({ ...galleryProfile,
    dom: document.querySelectorAll('*').length,
    cards: document.querySelectorAll('[data-photo-link]').length,
    images: document.images.length,
    loadedImages: Array.from(document.images).filter(image => image.complete && image.naturalWidth > 0).length,
    fetches: performance.getEntriesByType('resource').filter(entry => entry.initiatorType === 'fetch').length,
    dcl: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd
  })`)
  const frames = await evaluate(`new Promise(resolve => {
    const times = []; let last = performance.now();
    function frame(now) {
      times.push(now - last); last = now; window.scrollBy(0, 8);
      if (times.length < 90) requestAnimationFrame(frame); else resolve(times);
    }
    requestAnimationFrame(frame);
  })`)
  const html = await (await fetch(origin + route)).text()
  const result = {
    label, route, profile: '390×844; CPU 4×; 150 ms latency; 1.6 Mbps; empty HTTP cache',
    htmlBytes: Buffer.byteLength(html), gzipBytes: gzipSync(html).length, interactiveAt, ...metrics,
    // Sum over this controlled loading interval, not field CLS over a full browsing session.
    loadingLayoutShift: metrics.shifts.reduce((sum, value) => sum + value, 0),
    sizeChanges: before.filter((rect, index) => rect.width !== after[index]?.width || rect.height !== after[index]?.height).length,
    geometryChanges: before.filter((rect, index) => Math.abs(rect.top - after[index]?.top) > 1).length,
    firstBefore: before.slice(0, 3), firstAfter: after.slice(0, 3),
    scrollFrameP95: frames.sort((a, b) => a - b)[Math.floor(frames.length * .95)],
  }
  await writeFile(`/tmp/gallery-${label}.json`, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
} finally {
  if (sessionId) {
    await send('Fetch.disable')
    await send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
    await send('Network.setCacheDisabled', { cacheDisabled: false })
  }
  socket.close()
}
