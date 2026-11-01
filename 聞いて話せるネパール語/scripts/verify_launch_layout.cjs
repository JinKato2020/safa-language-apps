// Actual invitation JSX with DOM adapters; this does not certify native devices.
const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),work=path.resolve(process.argv[2]||'.work-launch');
const src=fs.readFileSync('聞いて話せるネパール語/expo-app/src/useEngagement.tsx','utf8');
function style(s,view=false){const flat=Object.assign({},...(Array.isArray(s)?s.flat(Infinity):[s]).filter(Boolean)),out=view?{display:'flex',flexDirection:'column',borderStyle:'solid',borderWidth:0}:{};
 for(const [k,v]of Object.entries(flat))if(k==='paddingHorizontal'){out.paddingLeft=v;out.paddingRight=v}else if(k==='paddingVertical'){out.paddingTop=v;out.paddingBottom=v}else if(k==='lineHeight')out[k]=v+'px';else out[k]=v;
 return {...out,...(!view?{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}:{})};}
const View=p=>React.createElement('div',{style:style(p.style,true)},p.children),Text=p=>React.createElement('span',{style:style(p.style)},p.children),Button=p=>React.createElement('button',{style:{...style(p.style,true),font:'inherit',textAlign:'left'},'aria-label':p.accessibilityLabel},p.children);
const cases=[];
for(const lang of ['ja','en'])for(const width of [320,390])for(const scale of [1,1.25]){
 let state=0;const hooks={...React,useState:v=>[++state===1?true:v,()=>{}],useEffect:()=>{},useRef:v=>({current:v}),useCallback:fn=>fn};
 const imports={'react':hooks,'react/jsx-runtime':require('react/jsx-runtime'),'react-native':{View,Text,Pressable:Button,StyleSheet:{create:v=>v}},'@react-native-async-storage/async-storage':{},'expo-store-review':{},'expo-mail-composer':{},'@safa/shared':{useI18n:()=>({lang}),useScaleStyle:()=> (fontSize,lineHeight)=>({fontSize:fontSize*scale,lineHeight:lineHeight*scale})},'../app.json':{default:{expo:{version:'2.1.7'}}},'./engagementPolicy':{}};
 const module={exports:{}};const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{setTimeout,clearTimeout})(name=>imports[name],module,module.exports);
 const banner=module.exports.useEngagement().banner;
 cases.push(`<section data-case="${lang}-${width}-${scale}" style="width:${width}px;flex:none;background:white"><div style="height:30px;padding:6px">${lang.toUpperCase()} · ${width}px · ${scale}×</div><div style="height:220px;background:#f8fafc"></div>${renderToStaticMarkup(banner)}<nav style="padding:20px;border-top:1px solid #ddd;text-align:center;font-size:13px">${lang==='ja'?'文法　会話　聞き流し　単語　設定':'Grammar · Chat · Listen · Words · Settings'}</nav></section>`);
}
const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{display:flex;flex-wrap:wrap;gap:16px;background:#e2e8f0;padding:12px;font-family:Arial,'Yu Gothic UI',sans-serif}button{cursor:pointer;border:0}section{overflow:hidden}</style>${cases.join('')}`;
fs.writeFileSync(path.join(work,'engagement-preview.html'),html);
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1500,height:1300}});await page.goto('file:///'+path.join(work,'engagement-preview.html').replaceAll('\\','/'));await page.evaluate(()=>document.fonts.ready);
 const result=await page.locator('section').evaluateAll(items=>items.map(s=>{const r=s.getBoundingClientRect();return{id:s.dataset.case,overflow:s.scrollWidth>s.clientWidth+1,buttons:[...s.querySelectorAll('button')].map(b=>({height:b.getBoundingClientRect().height,outside:b.getBoundingClientRect().right>r.right+1})),text:s.textContent}}));
 assert.equal(result.length,8);for(const r of result){assert(!r.overflow,r.id);assert(r.buttons.every(b=>b.height>=44&&!b.outside),r.id);assert.equal(r.buttons.length,3);assert(!/★|星5|five.star/i.test(r.text));}
 await page.screenshot({path:'docs/previews/nepali-free-launch-2.1.7.png',fullPage:true});
 fs.writeFileSync(path.join(work,'layout-results.json'),JSON.stringify(result,null,2));console.log('PASS8 layouts ja/en ×320/390px ×normal/large;3 dismissible invitation controls,44px targets,no horizontal overflow.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
