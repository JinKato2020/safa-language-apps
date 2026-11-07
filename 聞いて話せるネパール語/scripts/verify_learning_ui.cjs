// Actual TSX screens and persistence provider through DOM adapters. Native gestures/audio are not simulated as device proof.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../..'),work=path.resolve(process.argv[2]||'.work-beginner/ui');fs.mkdirSync(work,{recursive:true});
const source=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const modules={};for(const[p,file]of[['react','react.production.js'],['react/jsx-runtime','react-jsx-runtime.production.js'],['react-dom','react-dom.production.js'],['react-dom/client','react-dom-client.production.js'],['scheduler','scheduler.production.js']])modules[p]=fs.readFileSync(path.join(path.dirname(require.resolve(p.split('/')[0]+'/package.json')),'cjs',file),'utf8');
for(const name of ['learning','learningCopy','LearningContext','LearningLaunch','themeLabels','theme','l1','transliterate','grammarReading','grammarPresentation'])modules[name]=compile(source(`packages/shared/src/${name}.${['LearningContext','LearningLaunch'].includes(name)?'tsx':'ts'}`));
for(const name of ['LearningHomeScreen','LearningPathScreen','PracticeScreen','GrammarGuideScreen'])modules[name]=compile(source(`packages/shared/src/screens/${name}.tsx`));
modules.compose=compile(source('聞いて話せるネパール語/expo-app/src/pack/compose.ts'));
const core=JSON.parse(source('聞いて話せるネパール語/expo-app/data/ota-baseline/core.json'));
const overlays={},strings={};for(const lang of ['ja','en']){overlays[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/data/overlays/${lang}.json`));strings[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/src/i18n/${lang}.json`));}
const code=`
const modules=${JSON.stringify(modules)},cache={},overlays=${JSON.stringify(overlays)},strings=${JSON.stringify(strings)},core=${JSON.stringify(core)};
function require(n){if(n.startsWith('.'))n=n.split('/').pop();if(cache[n])return cache[n].exports;const m={exports:{}};cache[n]=m;if(!modules[n])throw Error('Missing '+n);new Function('require','module','exports','process',modules[n])(require,m,m.exports,{env:{NODE_ENV:'production'}});return m.exports;}
const React=require('react'),h=React.createElement;window.caseInfo={lang:'ja',scale:1};window.route={name:'HomeTab'};window.events=[];window.failStorage=false;
const flat=s=>Object.assign({},...(Array.isArray(s)?s.flat(Infinity):[s]).filter(Boolean));
function css(style,view=false){const s=flat(style),out=view?{display:'flex',flexDirection:'column',flexShrink:0,minWidth:0,borderWidth:0,borderStyle:'solid'}:{};for(const[k,v]of Object.entries(s)){
if(k==='paddingHorizontal'){out.paddingLeft=v;out.paddingRight=v;}else if(k==='paddingVertical'){out.paddingTop=v;out.paddingBottom=v;}else if(k==='marginHorizontal'){out.marginLeft=v;out.marginRight=v;}else if(k==='marginVertical'){out.marginTop=v;out.marginBottom=v;}else if(k==='lineHeight')out[k]=v*window.caseInfo.scale+'px';else if(k==='fontSize')out[k]=v*window.caseInfo.scale;else out[k]=v;}return out;}
function View(p){const ref=React.useRef(null);React.useEffect(()=>{if(!p.onLayout)return;const r=new ResizeObserver(()=>p.onLayout({nativeEvent:{layout:{width:ref.current.clientWidth,height:ref.current.clientHeight}}}));r.observe(ref.current);return()=>r.disconnect();},[p.onLayout]);return h('div',{ref,style:css(p.style,true)},p.children);}
function Text(p){return h('span',{role:p.accessibilityRole==='header'?'heading':undefined,style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',...css(p.style)}},p.children);}
function Pressable(p){return h('button',{'aria-label':p.accessibilityLabel,'aria-expanded':p.accessibilityState?.expanded,disabled:p.disabled,onClick:p.onPress,role:p.accessibilityRole==='tab'?'tab':undefined,style:{font:'inherit',textAlign:'left',...css(typeof p.style==='function'?p.style({pressed:false}):p.style,true)}},typeof p.children==='function'?p.children({pressed:false}):p.children);}
const ScrollView=React.forwardRef((p,ref)=>{const el=React.useRef(null);React.useImperativeHandle(ref,()=>({scrollTo:({y})=>el.current.scrollTo(0,y)}));return h('div',{ref:el,style:{overflowY:'auto',flex:1,minHeight:0,...css(p.style,true)}},h('div',{style:css(p.contentContainerStyle,true)},p.children));});
const Image=p=>h('img',{src:p.source?.uri,style:css(p.style)});
cache['react-native']={exports:{View,Text,Pressable,ScrollView,Image,Animated:{View},StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:innerWidth,height:innerHeight,fontScale:window.caseInfo.scale})}};
cache.Text={exports:{Text}};cache.SettingsContext={exports:{useSettings:()=>({practiceDirection:'ja2ne',romaji:true}),useScaleStyle:()=> (fontSize,lineHeight)=>({fontSize,lineHeight}),useGlobalScaleStyle:()=>fontSize=>({fontSize})}};
cache.i18n={exports:{useI18n:()=>({lang:window.caseInfo.lang,t:(key,vars={})=>{let s=key.split('.').reduce((v,k)=>v?.[k],strings[window.caseInfo.lang])??key;for(const[k,v]of Object.entries(vars))s=String(s).replace('{'+k+'}',v);return s;}})}};
cache.AppDataContext={exports:{useAppData:()=>window.data}};
cache['react-native-safe-area-context']={exports:{useSafeAreaInsets:()=>({top:0,bottom:0})}};
cache['react-native-svg']={exports:{__esModule:true,default:()=>null,Line:()=>null,Path:()=>null,Polyline:()=>null}};
cache.useCardFlip={exports:{useCardFlip:()=>({flip:cb=>cb(),animatedStyle:{}})}};
cache.useHorizontalSwipe={exports:{useHorizontalSwipe:()=>({})}};
cache['expo-audio']={exports:{useAudioPlayer:src=>({seekTo:()=>{},pause:()=>{},play:()=>window.events.push(['audio',src])})}};
cache['@react-native-async-storage/async-storage']={exports:{getItem:async k=>localStorage.getItem(k),setItem:async(k,v)=>{if(window.failStorage)throw Error('full');localStorage.setItem(k,v);}}};
const nav={navigate:(name,params)=>{window.events.push(['navigate',name,params]);window.stack.push(window.route);window.route={name,params};window.redraw();},replace:(name,params)=>{window.events.push(['replace',name,params]);window.route={name,params};window.redraw();},goBack:()=>{window.route=window.stack.pop()??{name:'HomeTab'};window.redraw();},setOptions:()=>{}};
cache['@react-navigation/native']={exports:{useNavigation:()=>nav,useRoute:()=>window.route,useFocusEffect:cb=>React.useEffect(cb,[cb])}};
cache.heroImages={exports:{useHeroImage:()=>1,ModeHero:()=>h('img',{src:${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))},style:{width:'100%',aspectRatio:'3/1',objectFit:'contain',borderRadius:16}})}};
cache.grammarGuide={exports:{useGrammarGuide:()=>window.data.GRAMMAR_GUIDE,useGrammarGuideImageResolver:()=>async()=>null}};
const root=require('react-dom/client').createRoot(document.getElementById('root')),Provider=require('LearningContext').LearningProvider;let generation=0;
const names={HomeTab:'LearningHomeScreen',LearningPath:'LearningPathScreen',Practice:'PracticeScreen',GrammarGuide:'GrammarGuideScreen'};
function Frame(){const[count,setCount]=React.useState(0);window.redraw=()=>setCount(x=>x+1);const name=names[window.route.name];return name?h(require(name).default,{key:window.route.name+JSON.stringify(window.route.params??{})}):h('div',null,window.route.name);}
window.boot=async(lang='ja',clear=false,route={name:'HomeTab'},scale=1)=>{if(clear)localStorage.clear();window.caseInfo={lang,scale};window.route=route;window.stack=[];window.events=[];
const neAudio={},neGram={},l1Audio={},l1Gram={};for(const[k,rows]of Object.entries(core.examplesNe))rows.forEach((_,i)=>{neAudio[k+'-'+(i+1)]='ne/'+k+'-'+(i+1);l1Audio[k+'-'+(i+1)]=lang+'/'+k+'-'+(i+1);});for(const[k,id]of Object.entries(core.grammarAudioRefs??Object.fromEntries(Object.entries(core.grammarNe).flatMap(([t,rows])=>rows.map((_,i)=>[t+'-'+(i+1),t+'-'+(i+1)]))))){if(id){neGram[id]='ne/'+id;l1Gram[id]=lang+'/'+id;}}
window.data=require('compose').composePack({...core,nepaliAudio:neAudio,nepaliGrammarAudio:neGram},{...overlays[lang],nativeLang:lang,l1Audio,l1GrammarAudio:l1Gram},{version:'test'});
require('react-dom').flushSync(()=>root.render(h(Provider,{storageKey:'test-study',key:++generation},h(Frame))));await new Promise(r=>setTimeout(r,30));};
window.navigate=nav.navigate;window.boot();
`;
fs.writeFileSync(path.join(work,'index.js'),code);fs.writeFileSync(path.join(work,'index.html'),'<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,"Nirmala UI","Yu Gothic UI",sans-serif}#root{height:100vh;display:flex;flex-direction:column}button{background:none;cursor:pointer}</style><div id="root"></div><script src="index.js"></script>');
(async()=>{
const{chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('file:///'+path.join(work,'index.html').replaceAll('\\','/'));
for(const lang of ['ja','en']){
const copy=lang==='ja'?{start:'はじめての方へ →',practice:'この5文を練習 →',reveal:'答えを見る',known:'できた',again:'もう一度',finish:'今回の練習はここまで',back:'一覧に戻る',guide:'教材を読む →',intro:'はじめに：音と文字の読み方 ＋',read:'読んだので、学習を始める'}:{start:'Start here →',practice:'Practise these 5 sentences →',reveal:'Show answer',known:'I could do it',again:'Try again',finish:'This practice set is complete',back:'Back to list',guide:'Read the guide →',intro:'First: sounds and reading ＋',read:'Read — start learning'};
await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
await page.getByRole('button',{name:copy.start,exact:true}).click();await page.getByRole('button',{name:copy.intro,exact:true}).click();await page.getByRole('button',{name:copy.read,exact:true}).click();
for(let step=0;step<7;step++){
await page.getByRole('button',{name:copy.practice,exact:true}).nth(step).click();
for(let n=0;n<5;n++){await page.getByRole('button',{name:copy.reveal,exact:true}).click();await page.getByRole('button',{name:n===0?copy.again:copy.known,exact:true}).click();}
await page.getByRole('heading',{name:copy.finish,exact:true}).waitFor();await page.getByRole('button',{name:copy.back,exact:true}).click();}
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')));assert.equal(Object.keys(saved.completed).length,7);assert.equal(Object.keys(saved.ratings).length,35);assert.equal(saved.introRead,true);
// Restart and resume preserve the exact course position and previously answered items.
await page.getByRole('button',{name:copy.practice,exact:true}).first().click();await page.getByRole('button',{name:copy.reveal,exact:true}).click();await page.getByRole('button',{name:copy.known,exact:true}).click();await page.waitForTimeout(30);
let resume=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).resume);assert.equal(resume.session.position,1);
await page.evaluate(l=>window.boot(l,false),lang);await page.getByRole('button',{name:(lang==='ja'?'前回の続きから':'Continue where you left off')+' →',exact:true}).click();assert.equal(await page.evaluate(()=>window.route.params.studySession.position),1);
await page.getByRole('button',{name:copy.reveal,exact:true}).click();await page.evaluate(()=>window.failStorage=true);await page.getByRole('button',{name:copy.known,exact:true}).click();await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).resume.session.position),1);await page.evaluate(()=>window.failStorage=false);
// Real guide button carries the selected five-sentence session.
await page.evaluate(l=>window.boot(l,false,{name:'LearningPath'}),lang);await page.getByRole('button',{name:copy.guide,exact:true}).first().click();await page.getByRole('button',{name:lang==='ja'?'このテーマを練習 →':'Practise this topic →',exact:true}).click();assert.equal(await page.evaluate(()=>window.route.params.studySession.items.length),5);
// Screen geometry: phones, large text and landscape, with actual content.
for(const[width,height,scale]of[[320,568,1],[390,844,1],[320,568,1.4],[844,390,1]])for(const name of ['HomeTab','LearningPath','Practice']){
await page.setViewportSize({width,height});await page.evaluate(({lang,name,scale})=>window.boot(lang,false,{name,params:name==='Practice'?{themeId:1,mode:'grammar'}:undefined},scale),{lang,name,scale});
const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert(!over,lang+' '+name+' overflow '+width+' '+scale);
if(width===390){fs.mkdirSync(path.join(ROOT,'docs/previews'),{recursive:true});await page.screenshot({path:path.join(ROOT,`docs/previews/nepali-learning-2.1.12-${lang}-${name}.png`)});}
}
}
assert.deepEqual(errors,[]);console.log('PASS JA/EN: all7 course sessions,35 ratings each, intro, persistent restart/resume, storage failure, guide handoff,24 screen layouts; no browser exceptions.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
