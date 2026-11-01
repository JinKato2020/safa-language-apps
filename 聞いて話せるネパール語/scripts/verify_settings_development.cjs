// Render and exercise the real shared SettingsScreen with app-owned test tools.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const work=path.resolve(process.argv[2]||'.work-settings');
function compile(source,imports){const module={exports:{}};const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(`(function(require,module,exports){${js}\n})`,{})(name=>{assert(name in imports,name);return imports[name]},module,module.exports);return module.exports}
const theme=compile(fs.readFileSync('packages/shared/src/theme.ts','utf8'),{});
function css(style,view=false){const value=Object.assign({},...(Array.isArray(style)?style.flat(Infinity):[style]).filter(Boolean)),result=view?{display:'flex',flexDirection:'column',borderStyle:'solid',borderWidth:0}:{};
 for(const[k,v]of Object.entries(value))if(k==='paddingHorizontal'){result.paddingLeft=v;result.paddingRight=v}else if(k==='paddingVertical'){result.paddingTop=v;result.paddingBottom=v}else if(k==='lineHeight')result[k]=v+'px';else result[k]=v;
 return{...result,...(!view?{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}:{})}}
function screen(lang,tools,finite=true,scale=1){
 const copy=JSON.parse(fs.readFileSync(`聞いて話せるネパール語/expo-app/src/i18n/${lang}.json`,'utf8')),buttons=[],links=[],alerts=[];
 const t=(key,params={})=>{let v=key.split('.').reduce((o,k)=>o?.[k],copy)??key;for(const[k,x]of Object.entries(params))v=v.replaceAll('{'+k+'}',x);return v};
 const View=p=>React.createElement('div',{style:css(p.style,true)},p.children),Text=p=>React.createElement('span',{style:css(p.style)},p.children);
 const Button=p=>{const label=renderToStaticMarkup(p.children).replace(/<[^>]*>/g,'');buttons.push({label,press:p.onPress});return React.createElement('button',{style:{font:'inherit',textAlign:'left',...css(p.style,true)}},p.children)};
 const icon=()=>React.createElement('svg',{width:16,height:16});
 const settings={listenSpeed:1,nepaliRepeat:1,practiceDirection:'ja2ne',listenDirection:'ja2ne',listenLoop:true,gap:'normal',romaji:true,fontMode:'medium',autoFlip:true,shuffle:false};
 const imports={'react/jsx-runtime':require('react/jsx-runtime'),'react-native':{Alert:{alert:(...a)=>alerts.push(a)},Linking:{openURL:async url=>links.push(url)},Platform:{OS:'ios'},Pressable:Button,ScrollView:View,Share:{share:async()=>{}},StyleSheet:{create:s=>s},Switch:()=>null,View},'react-native-svg':{default:icon,Circle:icon,Ellipse:icon,Line:icon,Path:icon,Polygon:icon},'../Text':{Text},'../ModalDropdown':{ModalDropdown:p=>React.createElement('span',{},p.value)},'../theme':theme,'../SettingsContext':{useSettings:()=>settings,useScaleStyle:()=> (fontSize,lineHeight)=>({fontSize:fontSize*scale,...(lineHeight?{lineHeight:lineHeight*scale}:{})})},'../i18n':{useI18n:()=>({t,lang,setLang:()=>{},langs:['ja','en']})},'../l1':{L1_REGISTRY:{en:{name:'English'},ja:{name:'日本語'}},langOrderRank:l=>l==='en'?0:1},'../AppDataContext':{useAppData:()=>({version:'2.1.8',review:{iosAppId:'6771720689'}})},'expo-application':{nativeBuildVersion:'test'},'@react-navigation/native':{useNavigation:()=>({navigate:()=>{}})},'../entitlement':{useEntitlement:()=>({isPro:true,accessKind:'launch-free',freeThemes:finite?5:Infinity,restore:()=>{}})},'../settingsDevelopment':{useSettingsDevelopment:()=>tools}};
 const module=compile(fs.readFileSync('packages/shared/src/screens/SettingsScreen.tsx','utf8'),imports);
 const html=renderToStaticMarkup(React.createElement(module.default));return{html,buttons,links,alerts,t};
}
(async()=>{
 const samples=[];let requests=0;
 for(const lang of ['ja','en'])for(const width of [320,390])for(const development of [false,true]){
  const tools=development?{showReview:async()=>'unavailable',showRequest:()=>requests++}:null;
  const s=screen(lang,tools,true,1.25),text=s.html.replace(/<[^>]*>/g,'');
  assert.equal(text.split(s.t('settings.rateApp')).length-1,1,'One normal rating action');
  assert(text.indexOf(s.t('settings.rateApp'))>text.indexOf(s.t('settings.restore')),'Rating after restore/purchases');
  assert(text.indexOf(s.t('settings.rateApp'))<text.indexOf(s.t('settings.sectionLang')),'Rating before language settings');
  const label=lang==='ja'?'開発確認':'Development checks';assert.equal(text.includes(label),development);
  if(development){
   await s.buttons.find(b=>b.label===(lang==='ja'?'起動':'Launch')).press();assert.equal(s.alerts.length,1);assert.equal(s.links.length,0,'No automatic App Store redirect');
   await s.alerts[0][2].at(-1).onPress();assert(s.links[0].endsWith('id6771720689?action=write-review'));
   s.buttons.find(b=>b.label===(lang==='ja'?'表示':'Show')).press();
  }
  samples.push(`<section data-case="${lang}-${width}-${development}" style="width:${width}px;flex:none;background:white">${s.html}</section>`);
 }
 assert.equal(requests,4);
 const other=screen('en',null,false);const otherText=other.html.replace(/<[^>]*>/g,'');assert(otherText.indexOf(other.t('settings.rateApp'))>otherText.indexOf(other.t('settings.sectionAbout')),'Other apps keep rating in About');
 const native=screen('ja',{showReview:async()=>'requested',showRequest:()=>{}});await native.buttons.find(b=>b.label==='起動').press();assert.equal(native.alerts.length,0,'Successful native request does not claim visible or open a second prompt');
 fs.writeFileSync(path.join(work,'settings-preview.html'),`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{font-family:Arial,'Yu Gothic UI',sans-serif;display:flex;flex-wrap:wrap;gap:16px;background:#eef2f6}button{cursor:pointer}</style>${samples.join('')}`);
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1500,height:900}});await page.goto('file:///'+path.join(work,'settings-preview.html').replaceAll('\\','/'));await page.evaluate(()=>document.fonts.ready);
 const result=await page.locator('section').evaluateAll(items=>items.map(s=>({id:s.dataset.case,overflow:s.scrollWidth>s.clientWidth+1,controls:[...s.querySelectorAll('button')].filter(b=>['起動','表示','Launch','Show'].includes(b.textContent)).map(b=>b.getBoundingClientRect().height)})));
 for(const r of result){assert(!r.overflow,r.id);assert(r.controls.every(h=>h>=44),r.id);}
 await page.screenshot({path:'docs/previews/nepali-settings-triggers-2.1.8.png'});fs.writeFileSync(path.join(work,'settings-results.json'),JSON.stringify(result,null,2));
 console.log('PASS8 actual settings layouts ja/en×320/390px×production/TestFlight at large text; rating directly after purchases, no duplication, other apps unchanged; developer actions and explicit App Store fallback tested.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
