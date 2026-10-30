async (page) => {
 const phase = 'baseline'
 const root = 'output/verification/fonts/long-articles/' + phase
 const paths = ['/note/imperfection', '/note/push-to-talk', '/note/2021-06-30-dark-mode-cssvars', '/note/2023-08-23-design-advice-from-bill-hader']
 const results = []
 for (const width of [1280,390]) for (const path of paths) {
  const context = await page.context().browser().newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  await context.addInitScript(() => { Math.random = () => 0.42 })
  await context.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort())
  const p = await context.newPage()
  const fonts = []
  p.on('response',async r=>{if(/\.(woff2?|ttf|otf)(\?|$)/.test(r.url())) fonts.push({url:r.url(),bytes:(await r.body()).length})})
  await p.goto('http://localhost:3117'+path,{waitUntil:'domcontentloaded'})
  await p.evaluate(() => { for (const image of document.images) image.loading = 'eager' })
  await p.evaluate(()=>document.fonts.ready)
  await p.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode().catch(() => {}))) })
  await p.waitForTimeout(2000)
  await p.evaluate(async()=>{await Promise.race([Promise.all([...document.images].filter(i=>i.complete).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,2000))])})
  // Freeze video/iframe regions in both builds; keep all article text and images.
  await p.addStyleTag({content:'video, iframe, canvas, [data-home-photo], [data-music-artwork], [data-music-glow] {visibility:hidden!important} * {animation:none!important;transition:none!important;caret-color:transparent!important}'})
  await p.waitForTimeout(600)
  const id = (path==='/'?'home':path.slice(1).replaceAll('/','_'))+'-'+width
  await p.screenshot({path:root+'/'+id+'.png',fullPage:true})
  const details = await p.evaluate(()=>({preloads:[...document.querySelectorAll('link[as="font"]')].map(x=>x.getAttribute('href')),images:[...document.images].map(i=>{const r=i.getBoundingClientRect();return {src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,rect:[r.left,r.top+scrollY,r.right,r.bottom+scrollY]}}),pageHeight:document.documentElement.scrollHeight,faces:[...document.fonts].map(f=>({family:f.family,weight:f.weight,style:f.style,range:f.unicodeRange,status:f.status})),paper:[...document.querySelectorAll('[data-photo-paper], [data-photo-paper] *')].filter(x=>x.childNodes.length&&[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(x=>({text:x.textContent,font:getComputedStyle(x).fontFamily,weight:getComputedStyle(x).fontWeight,style:getComputedStyle(x).fontStyle,features:getComputedStyle(x).fontFeatureSettings,numeric:getComputedStyle(x).fontVariantNumeric}))}))
  results.push({path,width,fonts,...details})
  console.log(JSON.stringify(results[results.length-1]))
  await context.close()
 }
 return results
}
