// Browser geometry checks for actual TSX cards (DOM adapters, not native device QA).
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const work=path.resolve(process.argv[2]);
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:2000},deviceScaleFactor:1});
  await page.goto('file:///'+path.join(work,'culture-all.html').replaceAll('\\','/'));
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const results=await page.locator('section').evaluateAll(sections=>sections.map(s=>{
   const image=s.querySelector('img'),frame=image.parentElement,ir=image.getBoundingClientRect(),fr=frame.getBoundingClientRect(),sr=s.getBoundingClientRect();
   const outside=[...s.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left<sr.left-1||r.right>sr.right+1)}).map(e=>({tag:e.tagName,rect:e.getBoundingClientRect().toJSON()}));
   return {id:s.dataset.case,loaded:image.complete&&image.naturalWidth>0,ratio:ir.width/ir.height,frameRatio:fr.width/fr.height,overflow:s.scrollWidth>s.clientWidth+1,outside:outside.length>0,outsideElements:outside};
  }));
  assert.equal(results.length,80);
  fs.writeFileSync(path.join(work,'layout-results.json'),JSON.stringify({cases:results,nativeDeviceVerified:false},null,2));
  for(const r of results){assert(r.loaded,r.id);assert(!r.overflow&&!r.outside,r.id);assert(Math.abs(r.ratio-1.5)<0.02,r.id);assert(Math.abs(r.frameRatio-1.5)<0.02,r.id);}
  await page.goto('file:///'+path.join(work,'preview.html').replaceAll('\\','/'));
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const destination=path.resolve('docs/previews/nepali-culture-images-1213.png');
  await page.screenshot({path:destination});
  fs.writeFileSync(path.join(work,'layout-results.json'),JSON.stringify({cases:results,nativeDeviceVerified:false},null,2));
  console.log('PASS 80 culture cards: ja/en ×10 ×320/390px ×1/1.4 font; all images loaded, full 3:2 ratio, no horizontal clipping.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
