// Actual TSX screens and persistence provider through DOM adapters. Native gestures/audio are not simulated as device proof.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const VERSION=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../expo-app/app.json'),'utf8')).expo.version;
const ROOT=path.resolve(__dirname,'../..'),work=path.resolve(process.argv[2]||'.work-beginner/ui');fs.mkdirSync(work,{recursive:true});
const source=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const modules={};for(const[p,file]of[['react','react.production.js'],['react/jsx-runtime','react-jsx-runtime.production.js'],['react-dom','react-dom.production.js'],['react-dom/client','react-dom-client.production.js'],['scheduler','scheduler.production.js']])modules[p]=fs.readFileSync(path.join(path.dirname(require.resolve(p.split('/')[0]+'/package.json')),'cjs',file),'utf8');
for(const name of ['guidedPractice','LearningSound','learning','learningCopy','LearningContext','LearningLaunch','themeLabels','theme','l1','transliterate','grammarReading','grammarPresentation'])modules[name]=compile(source(`packages/shared/src/${name}.${['LearningContext','LearningLaunch','LearningSound'].includes(name)?'tsx':'ts'}`));
for(const name of ['GuidedPracticeScreen','ExampleStudyScreen','LearningHomeScreen','LearningPathScreen','PracticeScreen','GrammarGuideScreen'])modules[name]=compile(source(`packages/shared/src/screens/${name}.tsx`));
modules.compose=compile(source('聞いて話せるネパール語/expo-app/src/pack/compose.ts'));
const core=JSON.parse(source('聞いて話せるネパール語/expo-app/data/ota-baseline/core.json'));
const overlays={},strings={};for(const lang of ['ja','en']){overlays[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/data/overlays/${lang}.json`));strings[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/src/i18n/${lang}.json`));}
const code=`
const modules=${JSON.stringify(modules)},cache={},overlays=${JSON.stringify(overlays)},strings=${JSON.stringify(strings)},core=${JSON.stringify(core)};
function require(n){if(n.startsWith('.'))n=n.split('/').pop();if(cache[n])return cache[n].exports;const m={exports:{}};cache[n]=m;if(!modules[n])throw Error('Missing '+n);new Function('require','module','exports','process',modules[n])(require,m,m.exports,{env:{NODE_ENV:'production'}});return m.exports;}
const React=require('react'),h=React.createElement;window.caseInfo={lang:'ja',scale:1};window.route={name:'HomeTab'};window.events=[];window.failStorage=false;
const flat=s=>Object.assign({},...(Array.isArray(s)?s.flat(Infinity):[s]).filter(Boolean));
function css(style,view=false){const s=flat(style),out=view?{position:'relative',display:'flex',flexDirection:'column',flexShrink:0,minWidth:0,borderWidth:0,borderStyle:'solid'}:{};for(const[k,v]of Object.entries(s)){
if(k==='paddingHorizontal'){out.paddingLeft=v;out.paddingRight=v;}else if(k==='paddingVertical'){out.paddingTop=v;out.paddingBottom=v;}else if(k==='marginHorizontal'){out.marginLeft=v;out.marginRight=v;}else if(k==='marginVertical'){out.marginTop=v;out.marginBottom=v;}else if(k==='lineHeight')out[k]=v*window.caseInfo.scale+'px';else if(k==='fontSize')out[k]=v*window.caseInfo.scale;else out[k]=v;}return out;}
function View(p){const ref=React.useRef(null);React.useEffect(()=>{if(!p.onLayout)return;const r=new ResizeObserver(()=>p.onLayout({nativeEvent:{layout:{width:ref.current.clientWidth,height:ref.current.clientHeight}}}));r.observe(ref.current);return()=>r.disconnect();},[p.onLayout]);return h('div',{ref,style:css(p.style,true)},p.children);}
function Text(p){return h('span',{role:p.accessibilityRole==='header'?'heading':undefined,style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',...css(p.style)}},p.children);}
function Pressable(p){return h('button',{'aria-label':p.accessibilityLabel,'aria-expanded':p.accessibilityState?.expanded,disabled:p.disabled,onClick:p.onPress,role:p.accessibilityRole==='tab'?'tab':undefined,style:{font:'inherit',textAlign:'left',...css(typeof p.style==='function'?p.style({pressed:false}):p.style,true)}},typeof p.children==='function'?p.children({pressed:false}):p.children);}
const ScrollView=React.forwardRef((p,ref)=>{const el=React.useRef(null);React.useImperativeHandle(ref,()=>({scrollTo:({y})=>el.current.scrollTo(0,y)}));return h('div',{ref:el,style:{overflowY:'auto',flex:1,minHeight:0,...css(p.style,true)}},h('div',{style:css(p.contentContainerStyle,true)},p.children));});
const heroPath=${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))};
const Image=p=>h('img',{src:p.source===1?heroPath:p.source?.uri,style:{objectFit:p.resizeMode==='contain'?'contain':undefined,...css(p.style)}});Image.resolveAssetSource=()=>({width:1200,height:400});
cache['react-native']={exports:{AppState:{addEventListener:()=>({remove:()=>{}})},View,Text,Pressable,ScrollView,Image,Animated:{View},StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:innerWidth,height:innerHeight,fontScale:window.caseInfo.scale})}};
cache.Text={exports:{Text}};cache.SettingsContext={exports:{useSettings:()=>({practiceDirection:'ja2ne',romaji:true}),useScaleStyle:()=> (fontSize,lineHeight)=>({fontSize,lineHeight}),useGlobalScaleStyle:()=>fontSize=>({fontSize})}};
cache.i18n={exports:{useI18n:()=>({lang:window.caseInfo.lang,t:(key,vars={})=>{let s=key.split('.').reduce((v,k)=>v?.[k],strings[window.caseInfo.lang])??key;for(const[k,v]of Object.entries(vars))s=String(s).replace('{'+k+'}',v);return s;}})}};
cache.AppDataContext={exports:{useAppData:()=>window.data}};
cache['react-native-safe-area-context']={exports:{useSafeAreaInsets:()=>({top:0,bottom:0})}};
cache['react-native-svg']={exports:{__esModule:true,default:()=>null,Line:()=>null,Path:()=>null,Polyline:()=>null}};
cache.useCardFlip={exports:{useCardFlip:()=>({flip:cb=>cb(),animatedStyle:{}})}};
cache.useHorizontalSwipe={exports:{useHorizontalSwipe:()=>({})}};
cache['expo-audio']={exports:{useAudioPlayer:src=>React.useMemo(()=>({source:src,seekTo:async()=>{},pause:()=>{},play:()=>window.events.push(['audio',src])}),[src]),useAudioPlayerStatus:p=>({isLoaded:!!p.source,playing:false})}};
cache['@react-native-async-storage/async-storage']={exports:{getItem:async k=>localStorage.getItem(k),setItem:async(k,v)=>{if(window.failStorage)throw Error('full');localStorage.setItem(k,v);}}};
const nav={navigate:(name,params)=>{window.events.push(['navigate',name,params]);window.stack.push(window.route);window.route={name,params};window.redraw();},replace:(name,params)=>{window.events.push(['replace',name,params]);window.route={name,params};window.redraw();},goBack:()=>{window.route=window.stack.pop()??{name:'HomeTab'};window.redraw();},setOptions:()=>{}};
cache['@react-navigation/native']={exports:{useNavigation:()=>nav,useRoute:()=>window.route,useFocusEffect:cb=>React.useEffect(cb,[cb])}};
cache.heroImages={exports:{useHeroImage:()=>1,ModeHero:()=>h('img',{src:${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))},style:{width:'100%',aspectRatio:'3/1',objectFit:'contain',borderRadius:16}})}};
cache.grammarGuide={exports:{useGrammarGuide:()=>window.data.GRAMMAR_GUIDE,useGrammarGuideImageResolver:()=>async()=>null}};
const root=require('react-dom/client').createRoot(document.getElementById('root')),Provider=require('LearningContext').LearningProvider;let generation=0;
const AudioProvider=require('LearningSound').LearningAudioProvider,resolveAudio=async a=>({uri:a.url});
const names={HomeTab:'LearningHomeScreen',LearningPath:'LearningPathScreen',Practice:'PracticeScreen',GrammarGuide:'GrammarGuideScreen'};
function Frame(){const[count,setCount]=React.useState(0);window.redraw=()=>setCount(x=>x+1);const name=names[window.route.name];return name?h(require(name).default,{key:window.route.name+JSON.stringify(window.route.params??{})}):h('div',null,window.route.name);}
window.boot=async(lang='ja',clear=false,route={name:'HomeTab'},scale=1)=>{if(clear)localStorage.clear();window.caseInfo={lang,scale};window.route=route;window.stack=[];window.events=[];
const neAudio={},neGram={},l1Audio={},l1Gram={};for(const[k,rows]of Object.entries(core.examplesNe))rows.forEach((_,i)=>{neAudio[k+'-'+(i+1)]='ne/'+k+'-'+(i+1);l1Audio[k+'-'+(i+1)]=lang+'/'+k+'-'+(i+1);});for(const[k,id]of Object.entries(core.grammarAudioRefs??Object.fromEntries(Object.entries(core.grammarNe).flatMap(([t,rows])=>rows.map((_,i)=>[t+'-'+(i+1),t+'-'+(i+1)]))))){if(id){neGram[id]='ne/'+id;l1Gram[id]=lang+'/'+id;}}
window.data=require('compose').composePack({...core,nepaliAudio:neAudio,nepaliGrammarAudio:neGram},{...overlays[lang],nativeLang:lang,l1Audio,l1GrammarAudio:l1Gram},{version:'test'});
require('react-dom').flushSync(()=>root.render(h(Provider,{storageKey:'test-study',key:++generation},h(AudioProvider,{resolve:resolveAudio},h(Frame)))));await new Promise(r=>setTimeout(r,30));};
window.navigate=nav.navigate;window.boot();
`;
fs.writeFileSync(path.join(work,'index.js'),code);fs.writeFileSync(path.join(work,'index.html'),'<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,"Nirmala UI","Yu Gothic UI",sans-serif}#root{height:100vh;display:flex;flex-direction:column}button{background:none;cursor:pointer}</style><div id="root"></div><script src="index.js"></script>');
(async()=>{
const{chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage();page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+path.join(work,'index.html').replaceAll('\\','/'));
 for(const lang of ['ja','en']){
  const en=lang==='en',b=name=>page.getByRole('button',{name,exact:true});
  const model=en?'See the model':'見本へ進む',form=en?'Choose the verb form':'活用を選んでみる',meaning=en?'Choose the meaning':'意味を選んでみる',nextMeaning=en?'Next: choose the meaning':'次は、意味を選ぶ',puzzle=en?'Next: word-order puzzle':'次は、語順パズル',check=en?'Check the order':'並びを確かめる',save=en?'Confirmed — next':'確認した・次へ';
  const pathRoute={name:'LearningPath'};
  await page.setViewportSize({width:390,height:844});await page.evaluate(({lang,pathRoute})=>window.boot(lang,true,pathRoute),{lang,pathRoute});
  await b(en?'First: sounds and reading ＋':'はじめに：音と文字の読み方 ＋').click();
  await b(en?'क · Listen':'क · 聞く').click();await page.waitForTimeout(40);
  assert(await page.evaluate(()=>window.events.some(e=>e[0]==='audio'&&e[1]?.uri?.includes('/learning-'))),'pronunciation clip resolves and reaches actual player call');
  await b(en?'Reviewed — start learning':'確認して、学習を始める').click();
  const steps=await page.evaluate(()=>window.data.LEARNING_PATH.steps),exercises=await page.evaluate(()=>window.data.LEARNING_PATH.exercises);
  async function exercise(item,{fail=false,hint=false,shots=false}={}){
    const e=exercises[item.exerciseId];
    await b(model).click();
    await b(en?'Listen in Nepali':'ネパール語を聞く').click();
    if(e.forms){await b(form).click();if(shots)await page.screenshot({path:path.join(ROOT,`docs/previews/nepali-learning-${VERSION}-${lang}-Conjugation.png`)});const target=e.words.at(-1).text;await b(e.forms.find(f=>f.form===target).form+' · '+e.forms.find(f=>f.form===target).roman).click();await b(nextMeaning).click();}
    else await b(meaning).click();
    if(shots)await page.screenshot({path:path.join(ROOT,`docs/previews/nepali-learning-${VERSION}-${lang}-Meaning.png`)});
    // A wrong meaning cannot finish a sentence or generate a mastery record.
    const before=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('test-study')).ratings).length);
    const wrong=await page.locator('button').allTextContents();
    await b(e.jp).click();await b(puzzle).click();
    if(shots)await page.screenshot({path:path.join(ROOT,`docs/previews/nepali-learning-${VERSION}-${lang}-Puzzle.png`)});
    if(hint){await b(en?'Show the model':'見本を見て確かめる').click();}
    else {for(const w of e.words)await b(w.text).first().click();await b(check).click();}
    if(fail){await page.evaluate(()=>window.failStorage=true);await b(save).click();await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('test-study')).ratings).length),before);await page.evaluate(()=>window.failStorage=false);}
    await b(save).click();
  }
  for(let i=0;i<steps.length;i++){
    await b(en?'Start this step →':'このステップを始める →').nth(i).click();
    for(let j=0;j<steps[i].items.length;j++)await exercise(steps[i].items[j],{hint:i===6&&j===2,shots:i===0&&j===0});
    await page.getByRole('heading',{name:en?'You explored this step':'このステップを確認しました',exact:true}).waitFor();
    await b(en?'Back to learning':'学習の道案内に戻る').click();
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')));
  assert.equal(Object.keys(saved.completed).length,7);assert.equal(Object.keys(saved.ratings).length,21);assert(Object.values(saved.ratings).every(r=>r.result==='supported'&&r.streak===0));assert.equal(Object.values(saved.activity).flat().length,21);assert(saved.introRead);
  await b(en?'Start this step →':'このステップを始める →').first().click();await exercise(steps[0].items[0]);
  await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).resume.session.position),1);
  await page.evaluate(l=>window.boot(l,false),lang);await b(en?'Continue where you left off':'前回の続きへ').click();await exercise(steps[0].items[1],{fail:true});
  await page.evaluate(l=>window.boot(l,false,{name:'LearningPath'}),lang);await b(en?'Read the guide →':'教材を読む →').first().click();
  assert.equal(await page.getByRole('tab',{name:en?'Examples':'例題',exact:true}).count(),0,'the lesson does not duplicate the example bank');
  await b(en?'View examples & audio →':'例題と音声を見る →').click();assert.equal(await page.evaluate(()=>window.route.params.examplesOnly),true);
  assert.equal(await b(en?'I could do it':'できた').count(),0,'examples are readable without a premature recall test');
  await page.evaluate(()=>window.navigate('LearningPath'));
  // Layouts use the actual new practice screen and the same content as the native app.
  for(const[width,height,scale]of[[320,568,1],[390,844,1],[320,568,1.4],[844,390,1]]){
    await page.setViewportSize({width,height});
    for(const name of ['HomeTab','LearningPath','Practice']){
      const params=name==='Practice'?{themeId:1,mode:'grammar',studySession:{kind:'course',stepId:steps[0].id,items:steps[0].items}}:undefined;
      await page.evaluate(({lang,name,params,scale})=>window.boot(lang,false,{name,params},scale),{lang,name,params,scale});
      assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${name} overflow ${width} ${scale}`);
      if(width===390)await page.screenshot({path:path.join(ROOT,`docs/previews/nepali-learning-${VERSION}-${lang}-${name}.png`)});
      if(name==='Practice'){
        await b(model).click();await b(form).click();
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
      }
    }
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: JA/EN 7 milestones × 3 independent exercises; actual conjugation/meaning/puzzle interactions; pronunciation player source; supported-only records; restart, failed saves, guide/example separation and 24 screen layouts.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
