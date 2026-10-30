async (page) => {
 const phase = 'baseline'
 const root = 'output/verification/fonts/' + phase
 const paths = ['/note/markdown-specimen','/note/push-to-talk','/photo/2024-11-14-casa-batllo','/photo/2023-07-01-river-and-beach-3','/notes','/photos','/','/photos/stack/soho-2026-09-18']
 const results = []
 for (const width of [1280,390]) for (const path of paths) {
  const context = await page.context().browser().newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
  await context.addInitScript(() => { Math.random = () => 0.42 })
  await context.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort())
  const p = await context.newPage()
  const fonts = []
  p.on('response',async r=>{if(/\.(woff2?|ttf|otf)(\?|$)/.test(r.url())) fonts.push({url:r.url(),bytes:(await r.body()).length})})
  await p.goto('http://localhost:3117'+path,{waitUntil:'domcontentloaded'})
  await p.evaluate(()=>document.fonts.ready)
  await p.waitForTimeout(2000)
  await p.evaluate(async()=>{await Promise.race([Promise.all([...document.images].filter(i=>i.complete).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,2000))])})
  // Freeze only non-typographic moving/random surfaces; same masks both builds.
  await p.addStyleTag({content:'canvas, [data-home-photo], [data-music-artwork], [data-music-glow] {visibility:hidden!important} * {animation:none!important;transition:none!important;caret-color:transparent!important}'})
  await p.waitForTimeout(600)
  const id = (path==='/'?'home':path.slice(1).replaceAll('/','_'))+'-'+width
  await p.screenshot({path:root+'/'+id+'.png',fullPage:true})
  const details = await p.evaluate(()=>({preloads:[...document.querySelectorAll('link[as="font"]')].map(x=>x.getAttribute('href')),faces:[...document.fonts].map(f=>({family:f.family,weight:f.weight,style:f.style,range:f.unicodeRange,status:f.status})),paper:[...document.querySelectorAll('[data-photo-paper], [data-photo-paper] *')].filter(x=>x.childNodes.length&&[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(x=>({text:x.textContent,font:getComputedStyle(x).fontFamily,weight:getComputedStyle(x).fontWeight,style:getComputedStyle(x).fontStyle,features:getComputedStyle(x).fontFeatureSettings,numeric:getComputedStyle(x).fontVariantNumeric}))}))
  results.push({path,width,fonts,...details})
  console.log(JSON.stringify(results[results.length-1]))
  // Identical extra browser fixture exercises preserved Latin and system CJK,
  // including nested bold italics; not published or mixed into real content.
  if(path==='/photo/2024-11-14-casa-batllo') {
   await p.evaluate(()=>{const e=document.querySelector('[data-photo-paper] h3');e.innerHTML='Muñoz Ā Ł Œ ƒ/2 — “quotes”… 日本語 中文 한글 <em>italic <strong>bold italic</strong></em>'})
   await p.evaluate(()=>document.fonts.ready)
   await p.waitForTimeout(300)
   await p.screenshot({path:root+'/fixture-'+width+'.png',fullPage:true})
  }
  await context.close()
 }
 return results
}
