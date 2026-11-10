// Actual TSX screens and persistence provider through DOM adapters. Native gestures/audio are not simulated as device proof.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const VERSION=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../expo-app/app.json'),'utf8')).expo.version;
const ROOT=path.resolve(__dirname,'../..'),work=path.resolve(process.argv[2]||'.work-beginner/ui');fs.mkdirSync(work,{recursive:true});fs.mkdirSync(path.join(work,'previews'),{recursive:true});
const source=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const modules={};for(const[p,file]of[['react','react.production.js'],['react/jsx-runtime','react-jsx-runtime.production.js'],['react-dom','react-dom.production.js'],['react-dom/client','react-dom-client.production.js'],['scheduler','scheduler.production.js']])modules[p]=fs.readFileSync(path.join(path.dirname(require.resolve(p.split('/')[0]+'/package.json')),'cjs',file),'utf8');
for(const name of ['textDirection','nepaliDictionary','SettingsContext','letterPresentation','vocabularyQuiz','PuzzleBoard','puzzleDrag','practicePool','freePractice','guidedPractice','LearningSound','learning','learningCopy','LearningContext','LearningLaunch','StudyHeader','themeLabels','theme','l1','transliterate','grammarReading','grammarPresentation'])modules[name]=compile(source(`packages/shared/src/${name}.${['SettingsContext','PuzzleBoard','LearningContext','LearningLaunch','LearningSound','StudyHeader'].includes(name)?'tsx':'ts'}`));
for(const name of ['NepaliDictionaryScreen','VocabularyQuizScreen','SettingsScreen','VocabCategoryScreen','VocabDirectionScreen','FlashcardScreen','FreePracticeScreen','GuidedPracticeScreen','ExampleStudyScreen','LearningHomeScreen','LettersSoundsScreen','PracticeScreen','GrammarGuideScreen','GrammarLibraryScreen','ThemeScreen'])modules[name]=compile(source(`packages/shared/src/screens/${name}.tsx`));
modules.entitlement=compile(source('packages/shared/src/entitlement.tsx'));
modules.compose=compile(source('聞いて話せるネパール語/expo-app/src/pack/compose.ts'));
const core=JSON.parse(source('聞いて話せるネパール語/expo-app/data/ota-baseline/core.json'));
const overlays={},strings={};for(const lang of ['ja','en']){overlays[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/data/overlays/${lang}.json`));strings[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/src/i18n/${lang}.json`));}
if(process.argv.some(a=>a.startsWith('--korean-'))){
  overlays.ko=JSON.parse(source('聞いて話せるネパール語/expo-app/data/overlays/ko.json'));strings.ko=JSON.parse(source('聞いて話せるネパール語/expo-app/src/i18n/ko.json'));
  for(const[group,values]of Object.entries(strings.en))for(const[key,value]of Object.entries(values)){
    const translated=strings.ko[group]?.[key];assert.equal(typeof translated,'string',`${group}.${key}`);
    if(value.startsWith('https://')){assert.equal(translated,value);continue;}
    assert(/[가-힣]/.test(translated),`Untranslated UI: ${group}.${key}`);
    const expected=[...new Set(value.match(/\{\{\w+\}\}/g)??[])].filter(p=>!(group==='courseCopy'&&key==='c_3ec230bb4da9'&&p==='{{p1}}')).sort();
    assert.deepEqual([...new Set(translated.match(/\{\{\w+\}\}/g)??[])].sort(),expected,`${group}.${key}`);
  }
}
const arabicFoundation=process.argv.includes('--arabic-foundation');
modules.Text=compile(source('packages/shared/src/Text.tsx'));
if(arabicFoundation){
  strings.ar=JSON.parse(source('聞いて話せるネパール語/expo-app/src/i18n/ar.json'));
  overlays.ar=structuredClone(overlays.en);
  const plan=JSON.parse(source('聞いて話せるネパール語/文法教材/arabic_translation_requests.json'));
  const cache=JSON.parse(source('聞いて話せるネパール語/文法教材/arabic_translations.json'));
  // Preview-only partial overlay. It is never written into app data or published.
  for(const d of plan.destinations){
    if(d.path[0]!=='overlay'||!cache.items[d.key]?.reviewed)continue;
    let parent=overlays.ar;for(const k of d.path.slice(1,-1))parent=parent[k];
    parent[d.path.at(-1)]=(cache.overrides?.[JSON.stringify(d.path)]??cache.items[d.key]).ar;
  }
  overlays.ar.l1='ar';
  modules.Text=compile(source('packages/shared/src/Text.tsx'));
}
const code=`
const modules=${JSON.stringify(modules)},cache={},overlays=${JSON.stringify(overlays)},strings=${JSON.stringify(strings)},core=${JSON.stringify(core)};
function require(n){if(n.startsWith('.'))n=n.split('/').pop();if(cache[n])return cache[n].exports;const m={exports:{}};cache[n]=m;if(!modules[n])throw Error('Missing '+n);new Function('require','module','exports','process',modules[n])(require,m,m.exports,{env:{NODE_ENV:'production'}});return m.exports;}
const React=require('react'),h=React.createElement;window.caseInfo={lang:'ja',scale:1};window.route={name:'HomeTab'};window.events=[];window.failStorage=false;
const flat=s=>Object.assign({},...(Array.isArray(s)?s.flat(Infinity):[s]).filter(Boolean));
function css(style,view=false){const s=flat(style),out=view?{position:'relative',display:'flex',flexDirection:'column',flexShrink:0,minWidth:0,minHeight:0,borderWidth:0,borderStyle:'solid'}:{};for(const[k,v]of Object.entries(s)){
if(k==='writingDirection')out.direction=v;else if(k==='paddingHorizontal'){out.paddingLeft=v;out.paddingRight=v;}else if(k==='paddingVertical'){out.paddingTop=v;out.paddingBottom=v;}else if(k==='marginHorizontal'){out.marginLeft=v;out.marginRight=v;}else if(k==='marginVertical'){out.marginTop=v;out.marginBottom=v;}else if(k==='lineHeight')out[k]=v*window.caseInfo.scale+'px';else if(k==='fontSize')out[k]=v*window.caseInfo.scale;else out[k]=v;}return out;}
const View=React.forwardRef((p,ref)=>{const el=React.useRef(null),gesture=React.useRef(null);React.useImperativeHandle(ref,()=>({measureInWindow:cb=>{const r=el.current.getBoundingClientRect();cb(r.x,r.y,r.width,r.height);}}));React.useEffect(()=>{if(!p.onLayout)return;const r=new ResizeObserver(()=>p.onLayout({nativeEvent:{layout:{width:el.current.clientWidth,height:el.current.clientHeight}}}));r.observe(el.current);return()=>r.disconnect();},[p.onLayout]);const event=e=>({nativeEvent:{pageX:e.clientX,pageY:e.clientY}});const state=e=>({x0:gesture.current.x,y0:gesture.current.y,moveX:e.clientX,moveY:e.clientY,dx:e.clientX-gesture.current.x,dy:e.clientY-gesture.current.y,numberActiveTouches:1});return h('div',{ref:el,'data-testid':p.testID,style:{...css(p.style,true),...(p.pointerEvents==='none'?{pointerEvents:'none'}:{})},onPointerDown:e=>{if(p._pan){gesture.current={x:e.clientX,y:e.clientY,active:false};(e.target.closest('button')??el.current).setPointerCapture(e.pointerId);}},onPointerMoveCapture:e=>{if(!p._pan||!gesture.current)return;const g=state(e);if(!gesture.current.active&&p._pan.onMoveShouldSetPanResponderCapture?.(event(e),g)){gesture.current.active=true;el.current.setPointerCapture(e.pointerId);p._pan.onPanResponderGrant?.(event(e),g);}if(gesture.current.active)p._pan.onPanResponderMove?.(event(e),g);},onPointerUpCapture:e=>{if(gesture.current?.active)p._pan.onPanResponderRelease?.(event(e),state(e));p.onTouchEnd?.(event(e));gesture.current=null;},onPointerCancel:e=>{if(gesture.current?.active)p._pan.onPanResponderTerminate?.();p.onTouchCancel?.();gesture.current=null;}},p.children);});
function Text(p){return h('span',{'data-testid':p.testID,role:p.accessibilityRole==='header'?'heading':undefined,style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',...css(p.style)}},p.children);}
function Pressable(p){const timer=React.useRef();React.useEffect(()=>()=>clearTimeout(timer.current),[]);const stop=()=>clearTimeout(timer.current);return h('button',{'aria-label':p.accessibilityLabel,'aria-expanded':p.accessibilityState?.expanded,'aria-selected':p.accessibilityState?.selected,disabled:p.disabled,onClick:p.onPress,onPointerDown:e=>{if(p.disabled)return;p.onPressIn?.();const event={nativeEvent:{pageX:e.clientX,pageY:e.clientY}};if(p.onLongPress)timer.current=setTimeout(()=>p.onLongPress(event),p.delayLongPress??500);},onPointerUp:stop,onPointerLeave:stop,onPointerCancel:stop,'data-testid':p.testID,role:p.accessibilityRole==='tab'?'tab':undefined,style:{font:'inherit',textAlign:'left',...css(typeof p.style==='function'?p.style({pressed:false}):p.style,true)}},typeof p.children==='function'?p.children({pressed:false}):p.children);}
const ScrollView=React.forwardRef((p,ref)=>{const el=React.useRef(null);React.useImperativeHandle(ref,()=>({scrollTo:({y})=>el.current.scrollTo(0,y),scrollToEnd:()=>el.current.scrollTo(0,el.current.scrollHeight)}));return h('div',{ref:el,'data-testid':p.testID,style:{scrollbarGutter:'stable',overflowY:p.horizontal||p.scrollEnabled===false?'hidden':'auto',overflowX:p.horizontal?'auto':'hidden',flex:p.horizontal?'0 0 auto':1,minHeight:0,...css(p.style,true)}},h('div',{style:{...css(p.contentContainerStyle,true),...(p.horizontal?{flexDirection:'row',width:'max-content'}:{})}},p.children));});
const heroPath=${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))};
const Image=p=>h('img',{src:p.source===1?heroPath:p.source?.uri,style:{objectFit:p.resizeMode==='contain'?'contain':undefined,...css(p.style)}});Image.resolveAssetSource=()=>({width:1200,height:400});
cache['react-native']={exports:{Platform:{OS:'ios'},Alert:{alert:(...args)=>window.alerts.push(args)},Linking:{openURL:async url=>window.links.push(url)},Share:{share:async()=>{}},Switch:()=>null,PanResponder:{create:config=>({panHandlers:{_pan:config}})},AppState:{addEventListener:()=>({remove:()=>{}})},View,Text,Pressable,ScrollView,TextInput:p=>h('input',{'data-testid':p.testID,'aria-label':p.accessibilityLabel,value:p.value,onChange:e=>p.onChangeText(e.target.value),placeholder:p.placeholder,style:css(p.style)}),FlatList:p=>h(ScrollView,{style:p.style,contentContainerStyle:p.contentContainerStyle},p.ListHeaderComponent,p.data.length?null:p.ListEmptyComponent,p.data.map((item,index)=>h(React.Fragment,{key:p.keyExtractor(item)},p.renderItem({item,index})))),Image,Animated:{View},StyleSheet:{create:x=>x,flatten:flat},useWindowDimensions:()=>({width:innerWidth,height:innerHeight,fontScale:window.caseInfo.scale})}};
if(!modules.Text)cache.Text={exports:{Text}};
cache.i18n={exports:{useI18n:()=>({lang:window.caseInfo.lang,langs:Object.keys(strings),setLang:()=>{},copy:(key,ja,en,vars={})=>{let s=['ko','ar'].includes(window.caseInfo.lang)?strings[window.caseInfo.lang].courseCopy[key]??en:window.caseInfo.lang==='en'?en:ja;for(const[k,v]of Object.entries(vars))s=s.split('{{'+k+'}}').join(String(v));return s;},t:(key,vars={})=>{let s=key.split('.').reduce((v,k)=>v?.[k],strings[window.caseInfo.lang])??key;for(const[k,v]of Object.entries(vars))s=String(s).split('{{'+k+'}}').join(String(v));return s;}})}};
cache.ModalDropdown={exports:{ModalDropdown:p=>h('span',null,p.value)}};cache['expo-application']={exports:{nativeBuildVersion:'test'}};window.alerts=[];window.links=[];window.devCalls=[];window.devAvailable=true;window.devResult='unavailable';cache.settingsDevelopment={exports:{useSettingsDevelopment:()=>window.devAvailable?{showReview:async()=>{window.devCalls.push('review');return window.devResult;},showRequest:()=>window.devCalls.push('request')}:null}};
cache.PosterContext={exports:{usePosterLessons:()=>[]}};
cache.AppDataContext={exports:{useAppData:()=>window.data}};
const realEntitlement=require('entitlement');cache.entitlement={exports:{...realEntitlement,useEntitlement:()=>window.testEntitlement??{isPro:true,freeThemes:Infinity}}};
cache['react-native-safe-area-context']={exports:{useSafeAreaInsets:()=>({top:20,bottom:0,left:0,right:0})}};
cache['react-native-svg']={exports:{__esModule:true,default:p=>h('svg',p),...Object.fromEntries(['Line','Path','Polyline','Rect','Circle','Ellipse','Polygon'].map(n=>[n,p=>h(n.toLowerCase(),p)]))}};
cache.useCardFlip={exports:{useCardFlip:()=>({flip:cb=>cb(),animatedStyle:{}})}};
cache.useHorizontalSwipe={exports:{useHorizontalSwipe:()=>({})}};
cache['expo-audio']={exports:{useAudioPlayer:src=>{const p=React.useMemo(()=>({source:src,seekTo:async()=>{},pause:()=>window.activeAudio.delete(p),play:()=>{window.activeAudio.add(p);window.events.push(['audio',src]);}}),[src]);React.useEffect(()=>()=>window.activeAudio.delete(p),[p]);return p;},useAudioPlayerStatus:p=>({isLoaded:!!p.source,playing:false,didJustFinish:window.audioEnded})}};
cache['@react-native-async-storage/async-storage']={exports:{getItem:async k=>localStorage.getItem(k),setItem:async(k,v)=>{if(window.failStorage)throw Error('full');localStorage.setItem(k,v);}}};
window.focusEnds=new Set();const nav={setParams:params=>{window.route={...window.route,params:{...window.route.params,...params}};window.redraw();},isFocused:()=>true,canGoBack:()=>window.stack.length>0,navigate:(name,params)=>{window.events.push(['navigate',name,params]);window.stack.push(window.route);window.route={name,params};window.redraw();},replace:(name,params)=>{window.events.push(['replace',name,params]);window.route={name,params};window.redraw();},goBack:()=>{window.route=window.stack.pop()??{name:'HomeTab'};window.redraw();},setOptions:options=>{const next={...window.screenOptions,...options};if(JSON.stringify(next)===JSON.stringify(window.screenOptions))return;window.screenOptions=next;window.redraw?.();}};
cache['@react-navigation/native']={exports:{useNavigation:()=>nav,useRoute:()=>window.route,useFocusEffect:cb=>React.useEffect(()=>{const end=cb();window.focusEnds.add(end);return()=>{window.focusEnds.delete(end);end?.();};},[cb])}};
cache.heroImages={exports:{useHeroImage:()=>1,ModeHero:()=>h('img',{src:${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))},style:{width:'100%',aspectRatio:'3/1',objectFit:'contain',borderRadius:16}})}};
cache.grammarGuide={exports:{useGrammarGuide:()=>window.data.GRAMMAR_GUIDE,useGrammarGuideImageResolver:()=>async()=>null}};
const root=require('react-dom/client').createRoot(document.getElementById('root')),Provider=require('LearningContext').LearningProvider,SettingsProvider=require('SettingsContext').SettingsProvider;let generation=0;
const AudioProvider=require('LearningSound').LearningAudioProvider,resolveAudio=async a=>({uri:a.url});
const names={NepaliDictionary:'NepaliDictionaryScreen',SettingsMain:'SettingsScreen',SettingsTab:'SettingsScreen',VocabCategory:'VocabCategoryScreen',VocabDirection:'VocabDirectionScreen',Flashcard:'FlashcardScreen',HomeTab:'LearningHomeScreen',LearningPath:'LettersSoundsScreen',LettersSounds:'LettersSoundsScreen',Practice:'PracticeScreen',GrammarGuide:'GrammarGuideScreen',GrammarLibrary:'GrammarLibraryScreen',Theme:'ThemeScreen'};
function Frame(){document.getElementById('root').style.direction=window.caseInfo.lang==='ar'?'rtl':'ltr';const[count,setCount]=React.useState(0);window.redraw=()=>setCount(x=>x+1);const name=names[window.route.name];return h(React.Fragment,null,['NepaliDictionary','VocabCategory','VocabDirection','Flashcard','Practice','LettersSounds','LearningPath','GrammarLibrary'].includes(window.route.name)?h(require('StudyHeader').default,{navigation:nav,options:{title:window.screenOptions?.title??window.route.name}}):null,name?h(require(name).default,{key:window.route.name+JSON.stringify(window.route.params??{})}):h('div',null,window.route.name));}
window.boot=async(lang='ja',clear=false,route={name:'HomeTab'},scale=1)=>{if(clear)localStorage.clear();window.caseInfo={lang,scale};window.route=route;window.stack=[];window.events=[];window.activeAudio=new Set();window.audioEnded=false;
const neAudio={},neGram={},l1Audio={},l1Gram={};for(const[k,rows]of Object.entries(core.examplesNe))rows.forEach((_,i)=>{neAudio[k+'-'+(i+1)]='ne/'+k+'-'+(i+1);l1Audio[k+'-'+(i+1)]=lang+'/'+k+'-'+(i+1);});for(const[k,id]of Object.entries(core.grammarAudioRefs??Object.fromEntries(Object.entries(core.grammarNe).flatMap(([t,rows])=>rows.map((_,i)=>[t+'-'+(i+1),t+'-'+(i+1)]))))){if(id){neGram[id]='ne/'+id;l1Gram[id]=lang+'/'+id;}}
window.data=require('compose').composePack({...core,nepaliAudio:neAudio,nepaliGrammarAudio:neGram},{...overlays[lang],nativeLang:lang,l1Audio,l1GrammarAudio:l1Gram},{version:'test'});window.data.review={iosAppId:'6771720689'};
require('react-dom').flushSync(()=>root.render(h(SettingsProvider,{storageKey:'test-settings',key:++generation},h(Provider,{storageKey:'test-study'},h(AudioProvider,{resolve:resolveAudio},h(Frame))))));await new Promise(r=>setTimeout(r,30));};
window.navigate=nav.navigate;window.boot();
`;
fs.writeFileSync(path.join(work,'index.js'),code);fs.writeFileSync(path.join(work,'index.html'),'<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,"Nirmala UI","Yu Gothic UI",sans-serif}#root{height:100vh;display:flex;flex-direction:column}button{background:none;cursor:pointer}</style><div id="root"></div><script src="index.js"></script>');
(async()=>{
  const {chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try {
    const page=await browser.newPage();page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('file:///'+path.join(work,'index.html').replaceAll('\\','/'));
    if(arabicFoundation){
      for(const width of [320,390])for(const scale of [1,1.2]){
        await page.setViewportSize({width,height:844});
        await page.evaluate(scale=>window.boot('ar',true,{name:'GrammarLibrary'},scale),scale);
        await page.getByTestId('study-back').waitFor();
        assert.equal((await page.getByTestId('study-back').innerText()).trim(),'›');
        assert((await page.getByTestId('study-back').boundingBox()).x>width/2);
        await page.getByTestId('study-back').click();
        assert.equal(await page.evaluate(()=>window.route.name),'MainTabs');
        for(const route of [{name:'SettingsMain'},{name:'LettersSounds'},{name:'VocabCategory',params:{fromHome:true}}]){
          await page.evaluate(({route,scale})=>window.boot('ar',true,route,scale),{route,scale});
          await page.waitForTimeout(80);
          assert(/[\u0620-\u064a]/.test(await page.locator('body').innerText()));
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),route.name);
          await page.screenshot({path:path.join(work,`previews/${route.name}-ar-${width}-${scale}.png`)});
        }
        await page.evaluate(scale=>window.boot('ar',true,{name:'LettersSounds'},scale),scale);
        for(const category of ['start','vowels','combinations','conjuncts','marks','numbers']){
          await page.getByTestId('letters-category-'+category).click();
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`Arabic letters ${category}/${width}/${scale}`);
          if(category==='combinations'){
            const first=await page.getByTestId('letters-consonant-क').boundingBox(),second=await page.getByTestId('letters-consonant-ख').boundingBox();
            assert(second.x>first.x,'Nepali alphabet order stays left-to-right');
          }
          await page.screenshot({path:path.join(work,`previews/letters-ar-${category}-${width}-${scale}.png`)});
          await page.getByTestId('letters-library').click();
        }
        for(let themeId=1;themeId<=36;themeId++){
          await page.evaluate(({scale,themeId})=>window.boot('ar',true,{name:'GrammarGuide',params:{themeId,title:'الموضوع '+themeId}},scale),{scale,themeId});
          for(const label of ['القواعد الأساسية','الصيغ والمفردات','استراحة']){
          await page.getByRole('tab',{name:label,exact:true}).click();
          while(await page.locator('button[aria-expanded="false"]').count())await page.locator('button[aria-expanded="false"]').first().click();
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`Arabic reader ${label}/${width}/${scale}`);
          if([1,15,23,29,35].includes(themeId))await page.screenshot({path:path.join(work,`previews/reader-ar-${themeId}-${label}-${width}-${scale}.png`)});
          }
          await page.getByRole('tab',{name:'التدريبات',exact:true}).click();
          for(const stage of [2,3,4]){
            await page.getByTestId('practice-start-'+stage).click();await page.getByTestId('free-mode-'+stage).waitFor();
            assert(/[\u0620-\u064a]/.test(await page.locator('body').innerText()),`Arabic practice ${themeId}/${stage}`);
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`Arabic practice ${themeId}/${stage}/${width}/${scale} overflow`);
            const before=await page.evaluate(()=>window.route.params.studySession.items[0].exerciseId);
            await page.getByTestId('free-model').click();
            if([1,21,29,35].includes(themeId))await page.screenshot({path:path.join(work,`previews/practice-ar-${themeId}-${stage}-${width}-${scale}.png`)});
            await page.getByTestId('free-next').click();await page.getByTestId('free-mode-'+stage).waitFor();
            assert.notEqual(await page.evaluate(()=>window.route.params.studySession.items[0].exerciseId),before);
            await page.getByTestId('study-back').click();await page.getByRole('tab',{name:'التدريبات',exact:true}).click();
          }
        }
        await page.evaluate(scale=>window.boot('ar',true,{name:'Theme',params:{mode:'grammar',puzzleOnly:true,guidesOnHome:true}},scale),scale);
        await page.getByTestId('theme-1').click();await page.getByTestId('free-bank').waitFor();
        const question=await page.evaluate(()=>{const s=window.route.params.studySession;return require('freePractice').freePracticeQuestion(window.data,s.items[0],s.choiceSeed);});
        for(let i=0;i<question.answerWords.length;i++)await page.getByTestId('free-token-word-'+i).click();
        await page.getByTestId('free-feedback').waitFor();
        const tiles=await page.locator('[data-testid^="free-remove-"]').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));
        for(let i=1;i<tiles.length;i++)if(Math.abs(tiles[i].y-tiles[i-1].y)<2)assert(tiles[i].x>tiles[i-1].x,'Nepali puzzle stays left-to-right inside Arabic UI');
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
        await page.screenshot({path:path.join(work,`previews/puzzle-ar-${width}-${scale}.png`)});
        for(let category=1;category<=30;category++)for(const direction of ['ne2ja','ja2ne']){
          await page.evaluate(({category,direction,scale})=>window.boot('ar',true,{name:'Flashcard',params:{categoryId:category,direction}},scale),{category,direction,scale});
          await page.getByTestId('vocab-quiz-prompt').waitFor();
          assert.equal(await page.locator('[data-testid^="vocab-option-"]').count(),4);
          const target=page.getByTestId(direction==='ne2ja'?'vocab-option-0':'vocab-quiz-word');
          assert(/[\u0620-\u064a]/.test(await target.innerText()));
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
          await page.getByTestId('vocab-quiz-reveal').click();await page.getByTestId('vocab-quiz-next').click();
        }
        await page.screenshot({path:path.join(work,`previews/word-quiz-ar-${width}-${scale}.png`)});
      }
      assert.deepEqual(errors,[]);
      console.log('PASS Arabic foundation: real Text wrapper, right-side back/return, settings, all six letter categories, all 36 lesson readers and three practice modes, LTR Nepali alphabet and puzzle inside RTL UI, 30 vocabulary categories x both directions, 320/390px at normal/large text. Partial preview only; no full Arabic course claim.');
      return;
    }
    if(process.argv.includes('--korean-modes')){
      for(const [width,scale]of[[390,1],[320,1.4]]){
        await page.setViewportSize({width,height:844});
        await page.evaluate(scale=>window.boot('ko',true,{name:'LettersSounds'},scale),scale);
        await page.screenshot({path:path.join(work,`previews/letters-ko-${width}.png`)});
        for(const id of ['start','vowels','combinations','conjuncts','marks','numbers']){
          await page.getByTestId('letters-category-'+id).click();
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`Korean letters ${id}/${width}`);
          await page.getByTestId('letters-library').click();
        }
        await page.evaluate(scale=>window.boot('ko',true,{name:'NepaliDictionary'},scale),scale);
        for(const query of ['집','죽다','버리다','ghar','गर्छु']){
          await page.getByTestId('dictionary-search').fill(query);
          const result=page.locator('[data-testid^="dictionary-entry-"]').first();await result.click();
          assert(/[가-힣]/.test(await page.getByTestId('dictionary-detail').innerText()));
          await page.getByTestId('dictionary-listen').click();await page.waitForTimeout(50);
          assert.equal(await page.evaluate(()=>window.activeAudio.size),1);
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
        }
        await page.screenshot({path:path.join(work,`previews/dictionary-ko-${width}.png`)});
        for(let category=1;category<=30;category++)for(const direction of ['ne2ja','ja2ne']){
          await page.evaluate(({category,direction,scale})=>window.boot('ko',true,{name:'Flashcard',params:{categoryId:category,direction}},scale),{category,direction,scale});
          await page.getByTestId('vocab-quiz-prompt').waitFor();assert.equal(await page.locator('[data-testid^="vocab-option-"]').count(),4);
          assert(/[가-힣]/.test(direction==='ne2ja'?await page.getByTestId('vocab-option-0').innerText():await page.getByTestId('vocab-quiz-word').innerText()));
          await page.getByTestId('vocab-quiz-reveal').click();await page.getByTestId('vocab-quiz-next').click();await page.getByTestId('vocab-quiz-prompt').waitFor();
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
        }
        for(const mode of ['grammar','conversation']){
          await page.evaluate(({mode,scale})=>window.boot('ko',true,{name:'Practice',params:{mode,themeId:1,levelId:1}},scale),{mode,scale});
          assert(/[가-힣]/.test(await page.locator('body').innerText()));
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
          await page.screenshot({path:path.join(work,`previews/composition-ko-${mode}-${width}.png`)});
        }
      }
      assert.deepEqual(errors,[]);console.log('PASS Korean: all six letters categories, dictionary search/audio, 30 vocabulary themes × both directions, grammar/conversation composition at 320/390px.');return;
    }
    if(process.argv.includes('--korean-ui')){
      for(const [width,scale]of[[390,1],[320,1.4]]){
        await page.setViewportSize({width,height:844});
        await page.evaluate(scale=>window.boot('ko',true,{name:'HomeTab'},scale),scale);
        for(const label of ['문자와 소리','문법','단어','사전'])assert((await page.getByTestId('home-content-grid').innerText()).includes(label),label);
        await page.getByTestId('home-letters').click();
        for(const label of ['시작하기','모음','자음＋모음','결합 문자','기호','숫자'])assert((await page.locator('body').innerText()).includes(label));
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
        await page.screenshot({path:path.join(work,`previews/letters-library-ko-${width}.png`)});
        await page.evaluate(()=>{window.testEntitlement={isPro:true,accessKind:'launch-free',freeThemes:5,restore:()=>{}};window.navigate('SettingsTab');});
        const body=await page.locator('body').innerText();
        for(const label of ['모국어','한국어','네팔어 반복 횟수','무료 이용권 보유'])assert(body.includes(label),label);
        assert(!body.includes('開発確認'));assert(!body.includes('개발 확인'));
        for(let n=0;n<6;n++)await page.getByTestId('settings-version').click();assert.equal(await page.getByText('개발 확인',{exact:true}).count(),0);
        await page.getByTestId('settings-version').click();await page.getByText('개발 확인',{exact:true}).waitFor();
        await page.getByRole('button',{name:'실행',exact:true}).click();assert.equal(await page.evaluate(()=>window.alerts.at(-1)[0]),'기본 평가 창을 표시할 수 없어요');
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
        await page.screenshot({path:path.join(work,`previews/settings-ko-${width}.png`)});
        // Real Korean lessons: every theme, every reading section and all three practice modes.
        await page.evaluate(scale=>window.boot('ko',true,{name:'GrammarLibrary'},scale),scale);
        const themes=await page.evaluate(()=>window.data.GRAMMAR_THEMES);
        for(const theme of themes){
          await page.getByTestId('grammar-lesson-'+theme.id).click();
          for(const part of ['기본 규칙','활용·어휘','잠깐 쉬어가기']){
            await page.getByRole('tab',{name:part,exact:true}).click();
            while(await page.locator('button[aria-expanded="false"]').count())await page.locator('button[aria-expanded="false"]').first().click();
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`Korean ${theme.id}/${part}/${width} overflow`);
            if(theme.id===1&&part==='기본 규칙')await page.screenshot({path:path.join(work,`previews/grammar-ko-${width}.png`)});
          }
          await page.getByRole('tab',{name:'연습 문제',exact:true}).click();
          for(const stage of [2,3,4]){
            await page.getByTestId('practice-start-'+stage).click();await page.getByTestId('free-mode-'+stage).waitFor();
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`Korean practice ${theme.id}/${stage}/${width} overflow`);
            const before=await page.evaluate(()=>window.route.params.studySession.items[0].exerciseId);
            await page.getByTestId('free-model').click();await page.getByTestId('free-next').click();await page.getByTestId('free-mode-'+stage).waitFor();
            assert.notEqual(await page.evaluate(()=>window.route.params.studySession.items[0].exerciseId),before);
            await page.getByTestId('study-back').click();await page.getByRole('tab',{name:'연습 문제',exact:true}).click();
          }
          await page.getByRole('button',{name:'학습 자료 닫기',exact:true}).click();
        }
        console.log(`PASS Korean ${width}: all 36 lesson readers and 3 practice modes with actual Korean data.`);
      }
      assert.deepEqual(errors,[]);console.log('PASS Korean UI with real Korean course: home labels, six letters categories, settings and hidden development checks at 320/390px.');return;
    }
    if(process.argv.includes('--home-grid')){
      const routes={'home-letters':'LettersSounds','home-grammar-lessons':'GrammarLibrary','home-vocabulary':'VocabCategory','home-dictionary':'NepaliDictionary'};
      for(const lang of ['ja','en'])for(const [width,scale]of[[390,1],[320,1.4]]){
        await page.setViewportSize({width,height:844});await page.evaluate(({lang,scale})=>window.boot(lang,true,{name:'HomeTab'},scale),{lang,scale});
        const grid=page.getByTestId('home-content-grid');assert.equal(await grid.getByRole('button').count(),4);
        const boxes=[];for(const id of Object.keys(routes))boxes.push(await page.getByTestId(id).boundingBox());
        assert.equal(boxes[0].y,boxes[1].y);assert.equal(boxes[2].y,boxes[3].y);assert(boxes[2].y>boxes[0].y);
        assert(boxes[1].x>=boxes[0].x+boxes[0].width);for(const b of boxes)assert(b.width>=44&&b.height>=44);
        for(const id of Object.keys(routes))assert.equal(await page.getByTestId(id).locator('span').count(),id==='home-letters'?2:1,'Title and icon only');
        const body=await page.locator('body').innerText();assert(body.includes('Small steps')&&body.includes('strength.'));
        for(const old of ['今日の5文','今日の一歩','開く→','教材を開く','単語を学ぶ','言葉を調べる'])assert(!body.includes(old),old);
        assert(await page.getByTestId('home-motto').locator('span').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+2)),'Motto lines never split inside a word');
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
        assert(await grid.evaluate(e=>[...e.querySelectorAll('span')].every(s=>s.scrollWidth<=s.clientWidth+2)),'Titles fit their tiles');
        await grid.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(work,`previews/home-grid-${lang}-${width}.png`)});
        await page.getByTestId('home-motto').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(work,`previews/home-motto-${lang}-${width}.png`)});
        for(const[id,route]of Object.entries(routes)){
          await page.getByTestId(id).click();assert.equal(await page.evaluate(()=>window.route.name),route);
          await page.getByTestId('study-back').click();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
        }
        assert.deepEqual(errors,[]);
      }
      console.log('PASS home: compact 2×2 layout, JA/EN at 320/390px and large fonts, four live routes/back, no footer copy or horizontal overflow.');return;
    }
    if(process.argv.includes('--nepali-dictionary')){
      const by=id=>page.getByTestId(id);
      for(const lang of ['ja','en'])for(const width of [320,390]){
        await page.setViewportSize({width,height:844});await page.evaluate(l=>window.boot(l,true,{name:'HomeTab'},1.2),lang);
        await by('home-dictionary').click();await by('dictionary-search').waitFor();
        assert.equal(await page.evaluate(()=>window.route.name),'NepaliDictionary');
        for(const [q,meaning] of [['ghar',lang==='en'?'house':'家'],['家',lang==='en'?'house':'家'],['house',lang==='en'?'house':'家'],['गर्छु',lang==='en'?'do':'する'],['死ぬ',lang==='en'?'die':'死ぬ'],['捨てる',lang==='en'?'discard':'捨てる'],['मर्‍यो',lang==='en'?'die':'死ぬ']]){
          await by('dictionary-search').fill(q);await page.waitForTimeout(80);
          const result=page.locator('[data-testid^="dictionary-entry-"]').first();
          await result.click();await by('dictionary-detail').waitFor();
          assert((await by('dictionary-detail').innerText()).includes(meaning));
          await by('dictionary-listen').click();await page.waitForTimeout(80);
          assert.equal(await page.evaluate(()=>window.activeAudio.size),1);
          await by('dictionary-search').fill('zzzz-no-match');await page.waitForTimeout(80);
          assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
          await page.getByText(lang==='en'?'No matching word yet':'一致することばがありません',{exact:true}).waitFor();
        }
        await by('dictionary-clear').click();await by('dictionary-filters').click();await by('dictionary-category-11').click();const expected=await page.evaluate(()=>window.data.NEPALI_DICTIONARY.entries.filter(e=>e.sources.some(s=>s.startsWith('11:'))).length);assert((await by('dictionary-count').innerText()).startsWith(String(expected)));
        await by('dictionary-filters').click();await by('dictionary-category-0').click();await by('dictionary-search').fill('लाग्नु');await page.locator('[data-testid^="dictionary-entry-"]').first().click();
        await page.screenshot({path:path.join(work,`previews/dictionary-${lang}-${width}.png`)});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await by('dictionary-search').fill('हुनु');await page.locator('[data-testid^="dictionary-entry-"]').first().click();
        const lesson=by('dictionary-detail').getByRole('button').filter({hasText:/→/}).first();await lesson.click();assert.equal(await page.evaluate(()=>window.route.name),'GrammarGuide');
        await page.evaluate(()=>{window.navigate('NepaliDictionary');});await by('study-back').click();
        assert.notEqual(await page.evaluate(()=>window.route.name),'NepaliDictionary');assert.deepEqual(errors,[]);
      }
      console.log('PASS dictionary UI: home entry, four-script search, details, audio start/stop, no results, category counts, lesson links and back; JA/EN at 320/390px.');return;
    }
    if(process.argv.includes('--settings-gate')){
      const by=id=>page.getByTestId(id);
      for(const lang of ['ja','en'])for(const width of [320,390]){
        await page.setViewportSize({width,height:844});await page.evaluate(l=>{window.devAvailable=true;window.testEntitlement={isPro:true,accessKind:'launch-free',freeThemes:5,restore:()=>{}};return window.boot(l,true,{name:'SettingsTab'},1.25);},lang);
        const en=lang==='en',title=en?'Development checks':'開発確認',launch=en?'Launch':'起動',show=en?'Show':'表示';
        const body=await page.locator('body').innerText(),copy=strings[lang].settings;
        assert.equal(body.split(copy.rateApp).length-1,1);assert(body.indexOf(copy.rateApp)>body.indexOf(copy.restore));assert(await page.evaluate(copy=>{const spans=[...document.querySelectorAll('span')],rating=spans.find(e=>e.textContent===copy.rateApp),lang=spans.find(e=>e.textContent===copy.sectionLang);return !!(rating.compareDocumentPosition(lang)&Node.DOCUMENT_POSITION_FOLLOWING);},copy));
        assert.equal(await page.getByText(title,{exact:true}).count(),0);
        for(let n=0;n<6;n++)await by('settings-version').click();assert.equal(await page.getByText(title,{exact:true}).count(),0);
        await by('settings-version').click();await page.getByText(title,{exact:true}).waitFor();
        await page.evaluate(()=>{window.alerts=[];window.links=[];window.devCalls=[];});
        await page.getByRole('button',{name:launch,exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.devCalls),['review']);assert.equal(await page.evaluate(()=>window.links.length),0);
        assert.equal(await page.evaluate(()=>window.alerts.length),1);await page.evaluate(()=>window.alerts[0][2].at(-1).onPress());assert((await page.evaluate(()=>window.links[0])).endsWith('id6771720689?action=write-review'));
        await page.getByRole('button',{name:show,exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.devCalls),['review','request']);
        assert((await page.getByRole('button',{name:launch,exact:true}).boundingBox()).height>=44);
        await page.screenshot({path:path.join(work,`previews/settings-${lang}-${width}-unlocked.png`)});
        await page.evaluate(()=>{for(const end of window.focusEnds)end?.();});await page.getByText(title,{exact:true}).waitFor({state:'detached'});
        // A new focus starts hidden even when the tab itself stayed mounted.
        for(let n=0;n<6;n++)await by('settings-version').click();assert.equal(await page.getByText(title,{exact:true}).count(),0);
        await page.waitForTimeout(3100);await by('settings-version').click();assert.equal(await page.getByText(title,{exact:true}).count(),0,'Slow taps reset the count');
        await page.evaluate(()=>window.navigate('HomeTab'));await page.evaluate(()=>window.navigate('SettingsTab'));assert.equal(await page.getByText(title,{exact:true}).count(),0);
        assert.deepEqual(errors,[]);
      }
      await page.evaluate(()=>{window.devAvailable=false;window.testEntitlement={isPro:true,freeThemes:Infinity};return window.boot('en',true,{name:'SettingsTab'});});
      for(let n=0;n<7;n++)await by('settings-version').click();assert.equal(await page.getByText('Development checks',{exact:true}).count(),0);
      const text=await page.locator('body').innerText();assert(text.indexOf(strings.en.settings.rateApp)>text.indexOf(strings.en.settings.sectionAbout));
      console.log('PASS settings: ja/en×320/390 large text, hidden in all builds, seven fast taps only, timeout reset, re-hide on blur without unmount, review/request actions and explicit fallback, normal rating placement, other apps hidden.');return;
    }
    if(process.argv.includes('--vocabulary-quiz')){
      const by=id=>page.getByTestId(id),options=()=>page.locator('[data-testid^="vocab-option-"]');
      const correctIndex=async(category,direction)=>{
        const prompt=await by('vocab-quiz-word').innerText();
        const answers=await page.evaluate(({category,direction,prompt})=>window.data.getWords(category).filter(w=>(direction==='ne2ja'?w.ne:w.ja)===prompt).map(w=>direction==='ne2ja'?w.ja:w.ne),{category,direction,prompt});
        const labels=await options().evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));const indices=labels.flatMap((x,i)=>answers.includes(x)?[i]:[]);assert.equal(indices.length,1,'Only one displayed choice matches the prompt');return indices[0];
      };
      for(const lang of ['ja','en']){
        const en=lang==='en';await page.setViewportSize({width:390,height:844});
        for(let category=1;category<=30;category++)for(const direction of ['ne2ja','ja2ne']){
          await page.evaluate(({lang,category,direction})=>{window.testEntitlement={isPro:true,freeThemes:Infinity};return window.boot(lang,true,{name:'Flashcard',params:{categoryId:category,direction}});},{lang,category,direction});
          await by('vocab-quiz-prompt').waitFor();assert.equal(await options().count(),4);assert.equal(await page.locator('[data-testid^="vocab-direction-"]').count(),0,'Directions belong on the theme screen');
          const correct=await correctIndex(category,direction);await by('vocab-option-'+correct).click();await by('vocab-quiz-feedback').waitFor();
          assert((await by('vocab-quiz-count').innerText()).includes('1'));assert((await by('vocab-quiz-score').innerText()).includes('1'));
          assert(await options().evaluateAll(es=>es.every(e=>e.disabled)));
          await by('vocab-quiz-next').click();assert.equal(await by('vocab-quiz-feedback').count(),0);assert.equal(await options().count(),4);
          assert.deepEqual(errors,[]);
        }
        await page.evaluate(l=>window.boot(l,true,{name:'Flashcard',params:{categoryId:1,direction:'ne2ja'}}),lang);
        const correct=await correctIndex(1,'ne2ja');await by('vocab-option-'+((correct+1)%4)).click();
        assert((await by('vocab-quiz-score').innerText()).includes('0'));assert((await by('vocab-quiz-count').innerText()).includes('1'));
        await by('vocab-quiz-next').click();const answer=await correctIndex(1,'ne2ja');
        await page.evaluate(index=>{const b=document.querySelector('[data-testid="vocab-option-'+index+'"]');b.click();b.click();},answer);
        assert((await by('vocab-quiz-score').innerText()).includes('1'));assert((await by('vocab-quiz-count').innerText()).includes('2'),'Rapid double taps are counted once');
        await page.evaluate(()=>{const b=document.querySelector('[data-testid="vocab-quiz-next"]');b.click();b.click();});assert.equal(await by('vocab-quiz-feedback').count(),0);
        for(const [width,height,scale]of[[390,844,1],[320,568,1.4],[844,390,1]])for(const direction of ['ne2ja','ja2ne']){
          await page.setViewportSize({width,height});await page.evaluate(({lang,direction,scale})=>window.boot(lang,true,{name:'Flashcard',params:{categoryId:1,direction}},scale),{lang,direction,scale});
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),'Quiz does not overflow horizontally');
          const controls=await options().all();for(const b of controls){const box=await b.boundingBox();assert(box.width>=44&&box.height>=44);}
          if(width===390)await page.screenshot({path:path.join(work,`previews/vocabulary-${lang}-${direction}.png`)});
          await by('vocab-quiz-reveal').click();await by('vocab-quiz-next').scrollIntoViewIfNeeded();const next=await by('vocab-quiz-next').boundingBox();assert(next.height>=44);assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
          if(width===390&&direction==='ne2ja')await page.screenshot({path:path.join(work,`previews/vocabulary-${lang}-answer.png`)});
        }
        await page.evaluate(l=>window.boot(l,true,{name:'SettingsTab'}),lang);assert.equal(await page.getByText(strings[lang].settings.autoFlip,{exact:true}).count(),0);assert.equal(await page.getByText(strings[lang].settings.shuffle,{exact:true}).count(),0,'Obsolete card-only settings are removed');
        assert.deepEqual(errors,[]);console.log(`PASS ${lang}: 30 themes × both quiz directions, four options, correct/wrong/reveal/next, theme-level direction selection, double taps, responsive layouts and card-setting removal.`);
      }
      await page.evaluate(async()=>{await window.boot('ja',true,{name:'Flashcard',params:{categoryId:6,direction:'ne2ja'}});window.testEntitlement={isPro:false,freeThemes:5};window.redraw();});await by('vocab-quiz-back').waitFor();assert.equal(await by('vocab-quiz-prompt').count(),0);
      await page.evaluate(async()=>{window.testEntitlement={isPro:true,freeThemes:Infinity};await window.boot('ja',true,{name:'Flashcard',params:{categoryId:1,direction:'ne2ja'}});window.data={...window.data,WORDS:{}};window.redraw();});await by('vocab-quiz-back').waitFor();assert.equal(await options().count(),0,'Missing data never invents options');
      await page.evaluate(async()=>{await window.boot('en',true,{name:'Flashcard',params:{categoryId:1,direction:'ne2ja'}});window.data={...window.data,vocabularyQuiz:false};window.redraw();});await page.getByText(/tap to/i).first().waitFor();assert.equal(await by('vocab-quiz-prompt').count(),0,'Other apps keep their existing cards');
      assert.deepEqual(errors,[]);console.log('PASS entitlement guard, safe empty state and legacy opt-out.');return;
    }
    if(process.argv.includes('--conversation-puzzles')){
      for(const lang of ['ja','en']){
        await page.setViewportSize({width:390,height:844});
        for(const level of [1,2,3])for(let theme=1;theme<=30;theme++){
          await page.evaluate(l=>window.boot(l,true,{name:'Theme',params:{mode:'grammar',puzzleOnly:true,guidesOnHome:true}}),lang);
          assert.deepEqual(await page.locator('[data-testid^="puzzle-"]').evaluateAll(es=>es.map(e=>e.dataset.testid)),['puzzle-grammar','puzzle-conversation']);
          await page.getByTestId('puzzle-conversation').click();await page.getByTestId('theme-level-'+level).click();
          assert.equal(await page.locator('[data-testid^="theme-"]:not([data-testid^="theme-level-"])').count(),30);
          await page.getByTestId('theme-'+theme).click();await page.getByTestId('free-bank').waitFor();
          const ref=await page.evaluate(()=>window.route.params.studySession.items[0]);assert.equal(ref.mode,'conversation');assert.equal(ref.themeId,theme);assert.equal(ref.levelId,level);
          const q=await page.evaluate(()=>{const s=window.route.params.studySession;return require('freePractice').freePracticeQuestion(window.data,s.items[0],s.choiceSeed);});
          assert.equal(q.puzzleTokens.length,q.answerWords.length+2);assert.equal(await page.locator('[data-testid^="free-mode-"]').count(),0);
          await page.getByTestId('free-model').click();await page.getByTestId('free-next').click();await page.getByTestId('free-bank').waitFor();
          const next=await page.evaluate(()=>window.route.params.studySession);assert.equal(next.items[0].mode,'conversation');assert.equal(next.items[0].levelId,level);assert.notEqual(next.items[0].index,ref.index);assert.equal(next.freePractice.answered,1);
          await page.getByTestId('study-back').click();assert.equal(await page.getByTestId('puzzle-conversation').getAttribute('aria-selected'),'true');assert.equal(await page.getByTestId('theme-level-'+level).getAttribute('aria-selected'),'true');
        }
        await page.evaluate(l=>window.boot(l,false),lang);await page.getByRole('button',{name:lang==='en'?'Continue where you left off':'前回の続きへ',exact:true}).click();await page.getByTestId('free-bank').waitFor();assert.equal(await page.evaluate(()=>window.route.params.studySession.items[0].mode),'conversation');
        const question=await page.evaluate(()=>{const s=window.route.params.studySession;return require('freePractice').freePracticeQuestion(window.data,s.items[0],s.choiceSeed);});
        await page.getByTestId('free-token-extra-0').click();for(let i=1;i<question.answerWords.length;i++)await page.getByTestId('free-token-word-'+i).click();assert.equal(await page.getByTestId('free-feedback').count(),0);
        await page.getByTestId('free-remove-0').click();await page.getByTestId('free-token-word-0').click();
        // The board still supports correction and drag; solve in model order after reset.
        while(await page.locator('[data-testid^="free-remove-"]').count())await page.getByTestId('free-remove-0').click();
        for(let i=0;i<question.answerWords.length;i++)await page.getByTestId('free-token-word-'+i).click();await page.getByTestId('free-feedback').waitFor();
        for(const source of ['grammar','conversation']){
          await page.evaluate(l=>window.boot(l,true,{name:'Theme',params:{mode:'listening',grammarFirst:true}}),lang);
          assert.deepEqual(await page.locator('[data-testid^="listen-source-"]').evaluateAll(es=>es.map(e=>e.dataset.testid)),['listen-source-grammar','listen-source-conversation']);
          assert.equal(await page.getByTestId('listen-source-grammar').getAttribute('aria-selected'),'true');
          await page.getByTestId('listen-source-'+source).click();if(source==='conversation')await page.getByTestId('theme-level-3').click();
          await page.getByTestId('theme-1').click();assert.equal(await page.evaluate(()=>window.route.name),'Listening');assert.equal(await page.evaluate(()=>window.route.params.source??'conversation'),source);if(source==='conversation')assert.equal(await page.evaluate(()=>window.route.params.levelId),3);
        }
        for(const [width,scale]of[[390,1],[320,1.4]]){
          await page.setViewportSize({width,height:844});await page.evaluate(({lang,scale})=>window.boot(lang,true,{name:'Theme',params:{mode:'conversation',puzzleOnly:true,guidesOnHome:true,levelId:3}},scale),{lang,scale});
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));await page.screenshot({path:path.join(work,`previews/conversation-puzzle-themes-${lang}-${width}.png`)});
          await page.getByTestId('theme-1').click();await page.getByTestId('free-bank').waitFor();assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));await page.screenshot({path:path.join(work,`previews/conversation-puzzle-${lang}-${width}.png`)});
        }
        await page.evaluate(l=>window.boot(l,true),lang);assert.equal(await page.getByTestId('home-settings').count(),0);
        assert.deepEqual(errors,[]);console.log(`PASS ${lang}: 30 conversation puzzle themes × 3 levels, distractors/reveal/next/back/resume/solve, grammar-first listening routes and 320/390 layouts.`);
      }
      return;
    }
    if(process.argv.includes('--navigation-tabs')){
      const app=source('聞いて話せるネパール語/expo-app/App.tsx'),shell=source('packages/shared/src/AppShell.tsx');
      assert(app.includes("tabs={['home', 'puzzle', 'listening', 'composition', 'settings']}"));
      assert(shell.includes('CompositionStack.Screen name="Practice"'));assert(shell.includes('PuzzleStack.Screen name="Practice"'));
      for(const lang of ['ja','en']){
        await page.setViewportSize({width:390,height:844});
        for(let theme=1;theme<=36;theme++){
          await page.evaluate(l=>window.boot(l,true,{name:'Theme',params:{mode:'grammar',puzzleOnly:true,guidesOnHome:true}}),lang);
          assert.equal(await page.locator('[data-testid^="theme-"]:not([data-testid^="theme-level-"])').count(),36);
          await page.getByTestId('theme-'+theme).click();await page.getByTestId('free-bank').waitFor();
          assert.equal(await page.locator('[data-testid^="free-mode-"]').count(),0);
          assert.equal(await page.evaluate(()=>window.route.params.studySession.freePractice.puzzleOnly),true);
          const question=await page.evaluate(()=>{const s=window.route.params.studySession;return require('freePractice').freePracticeQuestion(window.data,s.items[0],s.choiceSeed);});
          assert(question.puzzleTokens.length>question.answerWords.length,'Puzzles include distractors');
          for(let i=0;i<question.answerWords.length;i++)await page.getByTestId('free-token-word-'+i).click();
          await page.getByTestId('free-feedback').waitFor();await page.getByTestId('free-next').click();await page.getByTestId('free-bank').waitFor();
          assert.equal(await page.evaluate(()=>window.route.params.studySession.freePractice.answered),1);
          assert.equal(await page.evaluate(()=>window.route.params.studySession.freePractice.puzzleOnly),true);
          assert.equal(await page.locator('[data-testid^="free-mode-"]').count(),0);
          await page.getByTestId('study-back').click();assert.equal(await page.evaluate(()=>window.route.name),'Theme');
        }
        await page.evaluate(l=>window.boot(l,false),lang);await page.getByRole('button',{name:lang==='en'?'Continue where you left off':'前回の続きへ',exact:true}).click();await page.getByTestId('free-bank').waitFor();assert.equal(await page.locator('[data-testid^="free-mode-"]').count(),0,'Puzzle-only mode survives saved resume');
        for(const mode of ['grammar','conversation']){
          await page.evaluate(l=>window.boot(l,true,{name:'Theme',params:{mode:'grammar',composition:true,guidesOnHome:true}}),lang);
          await page.getByTestId('composition-'+mode).click();assert.equal(await page.getByTestId('composition-'+mode).getAttribute('aria-selected'),'true');
          assert.equal(await page.locator('[data-testid^="theme-"]:not([data-testid^="theme-level-"])').count(),mode==='grammar'?36:30);
          await page.screenshot({path:path.join(work,`previews/composition-${lang}-${mode}.png`)});
          await page.getByTestId('theme-1').click();assert.equal(await page.evaluate(()=>window.route.name),'Practice');assert.equal(await page.evaluate(()=>window.route.params.mode??'conversation'),mode);
          await page.getByTestId('study-back').click();await page.getByTestId('composition-'+mode).waitFor();assert.equal(await page.getByTestId('composition-'+mode).getAttribute('aria-selected'),'true');
        }
        for(const width of [320,390]){
          await page.setViewportSize({width,height:844});await page.evaluate(l=>window.boot(l,true,{name:'Theme',params:{mode:'grammar',puzzleOnly:true,guidesOnHome:true}},1.4),lang);
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
          if(width===390)await page.screenshot({path:path.join(work,`previews/puzzle-themes-${lang}.png`)});
          await page.getByTestId('theme-1').click();await page.getByTestId('free-bank').waitFor();assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
          if(width===390)await page.screenshot({path:path.join(work,`previews/puzzle-${lang}.png`)});
        }
        assert.deepEqual(errors,[]);console.log(`PASS ${lang}: 36 puzzle themes, distractors, solve/next/back, puzzle-only saved resume, grammar/conversation composition routes and responsive layouts.`);
      }
      return;
    }
    if(process.argv.includes('--home-vocabulary')){
      const app=source('聞いて話せるネパール語/expo-app/App.tsx'),shell=source('packages/shared/src/AppShell.tsx');
      assert(app.includes("tabs={['home', 'puzzle', 'listening', 'composition', 'settings']}"));
      for(const route of ['VocabCategory','VocabDirection','Flashcard','PosterAudio'])assert(shell.includes('name="'+route+'"'));
      for(const lang of ['ja','en']){
        await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
        const ids=await page.locator('[data-testid^="home-"]').evaluateAll(es=>es.map(e=>e.dataset.testid));assert.equal(ids.indexOf('home-vocabulary'),ids.indexOf('home-grammar-lessons')+1);
        await page.getByTestId('home-vocabulary').click();assert.equal(await page.evaluate(()=>window.route.name),'VocabCategory');
        await page.getByTestId('vocab-direction-ja2ne').click();assert.equal(await page.getByTestId('vocab-direction-ja2ne').getAttribute('aria-selected'),'true');
        const directionBox=await page.getByTestId('vocab-direction-ja2ne').boundingBox(),descriptionBox=await page.getByTestId('vocab-theme-description').boundingBox();assert(directionBox.y>=descriptionBox.y+descriptionBox.height);
        await page.screenshot({path:path.join(work,`previews/vocabulary-themes-${lang}.png`)});
        const cat=await page.evaluate(()=>window.data.CONTENT_NAMES?.categories?.[1]??window.data.WORD_CATEGORIES[0].name);await page.getByText(cat,{exact:true}).first().click();
        assert.equal(await page.evaluate(()=>window.route.name),'Flashcard');assert.equal(await page.evaluate(()=>window.route.params.direction),'ja2ne');assert.equal(await page.getByTestId('vocab-quiz-prompt').count(),1);assert.equal(await page.locator('[data-testid^="vocab-option-"]').count(),4);
        await page.getByTestId('study-back').click();assert.equal(await page.evaluate(()=>window.route.name),'VocabCategory');assert.equal(await page.getByTestId('vocab-direction-ja2ne').getAttribute('aria-selected'),'true');await page.getByTestId('study-back').click();await page.getByTestId('home-vocabulary').waitFor();
        await page.screenshot({path:path.join(work,`previews/home-${lang}.png`)});
        assert.equal(await page.getByTestId('home-settings').count(),0);await page.evaluate(()=>window.navigate('SettingsTab'));assert.equal(await page.evaluate(()=>window.route.name),'SettingsTab');
        await page.evaluate(l=>window.boot(l,false,{name:'VocabCategory'}),lang);assert.equal(await page.getByTestId('vocab-direction-ja2ne').getAttribute('aria-selected'),'true','Direction survives restart');
        for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.evaluate(l=>window.boot(l,false,{name:'VocabCategory'},1.4),lang);for(const direction of ['ne2ja','ja2ne']){const box=await page.getByTestId('vocab-direction-'+direction).boundingBox();assert(box.width>=44&&box.height>=44);}assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));}
        await page.evaluate(()=>{window.data={...window.data,vocabularyQuiz:false};window.redraw();});assert.equal(await page.locator('[data-testid^="vocab-direction-"]').count(),0,'Legacy apps do not receive quiz controls');
        await page.evaluate(()=>window.navigate('Theme',{mode:'listening'}));assert((await page.locator('body').innerText()).includes(strings[lang].themeScreen.headerListen));
        assert.deepEqual(errors,[]);
      }
      console.log('PASS home vocabulary below lessons, real category/quiz/back routes, persisted directions above themes, bottom Settings route, bilingual listening introduction.');return;
    }
    if(process.argv.includes('--legacy-free-resume')){
      for(const lang of ['ja','en'])for(const position of [0,5,10]){
        await page.evaluate(({lang,position})=>{const old=require('practicePool').createPracticeSession(require('learning').emptyStudyState(),window.data.LEARNING_PATH,1,require('practicePool').seededRandom(7));old.session.position=position;old.session.answered=old.session.items.slice(0,position).map((r,i)=>require('practicePool').practiceTaskKey(old.session,r,i));old.state.resume={item:old.session.items[position],session:old.session};localStorage.setItem('test-study',JSON.stringify(old.state));return window.boot(lang,false);},{lang,position});
        await page.getByRole('button',{name:lang==='en'?'Continue where you left off':'前回の続きへ',exact:true}).click();
        const old=await page.evaluate(()=>window.route.params.studySession),stage=old.questionStages[position];
        assert.equal(await page.getByTestId('free-mode-'+stage).getAttribute('aria-selected'),'true');
        assert.equal(await page.getByTestId('free-count').textContent(),lang==='en'?`${position} practised`:`${position}問取り組んだ`);
        await page.getByTestId('free-model').click();await page.getByTestId('free-next').click();
        await page.waitForFunction(n=>window.route.params.studySession.freePractice?.answered===n,position+1);
        const upgraded=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')));assert.equal(upgraded.resume.session.items.length,1);assert.equal(upgraded.resume.session.freePractice.stage,stage);
        assert(upgraded.ratings['exercise:'+old.items[position].exerciseId]);
      }
      assert.deepEqual(errors,[]);console.log('PASS JA/EN: old fixed-set resumes at form, meaning and puzzle positions enter free practice; next atomically saves the compact session.');return;
    }
    if(process.argv.includes('--free-practice')){
      const by=id=>page.getByTestId(id),session=()=>page.evaluate(()=>window.route.params.studySession);
      for(const lang of ['ja','en']){
        const en=lang==='en',b=name=>page.getByRole('button',{name,exact:true});
        await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
        const steps=await page.evaluate(()=>window.data.LEARNING_PATH.steps);
        const open=async step=>{await page.evaluate(({themeId,title})=>window.navigate('GrammarGuide',{themeId,title}),{themeId:step.guideThemeId,title:step.title});await page.getByRole('tab',{name:en?'Practice':'練習問題',exact:true}).click();};
        const next=async()=>{const old=await session();await by('free-next').click();await page.waitForFunction(n=>window.route.params.studySession.freePractice.answered===n,old.freePractice.answered+1);assert.equal((await session()).items.length,1);};
        for(const step of steps){
          await open(step);assert.equal(await page.locator('[data-testid^="practice-start-"]').count(),3);
          if(step.guideThemeId===1)await page.screenshot({path:path.join(work,`previews/practice-${lang}-choose.png`)});
          for(const mode of [2,3,4]){
            await by('practice-start-'+mode).click();await by('free-mode-'+mode).waitFor();
            const s=await session(),e=await page.evaluate(id=>window.data.LEARNING_PATH.exercises[id],s.items[0].exerciseId);
            assert.equal(s.freePractice.stage,mode);assert.equal(s.freePractice.answered,0);assert.equal(s.items.length,1);
            assert.equal(await by('free-mode-'+mode).getAttribute('aria-selected'),'true');assert.equal(await page.getByRole('tab').count(),3);
            if(mode===2||mode===3){
              const wrong=mode===2?e.selection.options.find(o=>o.form!==e.selection.answer):e.meaningChoices.find(t=>t!==e.jp);
              await b(mode===2?wrong.form+' · '+wrong.roman:wrong).click();assert.equal(await by('free-next').count(),0);
              const correct=mode===2?e.selection.options.find(o=>o.form===e.selection.answer):e.jp;
              if(step.guideThemeId===1)await page.screenshot({path:path.join(work,`previews/practice-${lang}-${mode}.png`)});
              await b(mode===2?correct.form+' · '+correct.roman:correct).click();
            }else{
              assert.equal(await by('free-bank').getByRole('button').count(),e.words.length+2);
              if(step.guideThemeId===1)await page.screenshot({path:path.join(work,`previews/practice-${lang}-puzzle.png`)});
              await page.locator('[data-testid^="free-token-extra-"]').first().click();
              for(let i=1;i<e.words.length;i++)await by('free-token-word-'+i).click();
              assert.equal(await by('free-next').count(),0);
              assert((await page.locator('body').textContent()).includes(en?'Try replacing a word.':'語句を入れ替えてみよう。'));
              await by('free-remove-0').click();assert.equal(await by('free-check').count(),0);
              assert.equal(await by('free-reset').count(),0);while(await by('free-remove-0').count())await by('free-remove-0').click();
              for(let i=0;i<e.words.length;i++)await by('free-token-word-'+i).click();
              await by('free-feedback').waitFor();
            }
            await by('free-feedback').waitFor();
            if(step.guideThemeId===1&&mode===2){
              const saved=await page.evaluate(()=>localStorage.getItem('test-study'));
              await page.evaluate(()=>window.failStorage=true);await by('free-next').click();await page.getByText(en?'Could not save. Your question is still here; please try again.':'保存できませんでした。今の問題を残しています。もう一度お試しください。',{exact:true}).waitFor();
              assert.equal(await page.evaluate(()=>localStorage.getItem('test-study')),saved);assert.deepEqual(await session(),s);await page.evaluate(()=>window.failStorage=false);
            }
            await next();assert.notEqual((await session()).items[0].exerciseId,s.items[0].exerciseId);
            await b(en?'Back':'戻る').click();assert.equal(await page.evaluate(()=>window.route.name),'GrammarGuide');await page.getByRole('tab',{name:en?'Practice':'練習問題',exact:true}).click();
          }
          await b(en?'Close lesson':'教材を閉じる').click();
        }
        // Stay in one type for more than both the old five-question cap and a full pool.
        await page.evaluate(l=>window.boot(l,true),lang);await open(steps[0]);await by('practice-start-2').click();const seen=[];
        for(let i=0;i<25;i++){
          const s=await session();seen.push(s.items[0].exerciseId);await by('free-model').click();
          assert.equal(await by('free-audio').count(),0);
          await next();assert.equal((await session()).freePractice.answered,i+1);assert.equal(await page.evaluate(()=>window.stack.length),2);assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
        }
        assert.equal(new Set(seen.slice(0,20)).size,20);assert.notEqual(seen[19],seen[20]);
        const before=await session();await by('free-mode-4').click();await by('free-bank').waitFor();assert.equal((await session()).freePractice.answered,25);
        assert.equal(await by('free-hint').count(),0);assert.equal(await by('free-hints').count(),0);assert.equal(await by('free-puzzle-intro').count(),1);
        const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study'))),resumed=await session();
        await page.evaluate(l=>window.boot(l,false),lang);await b(en?'Continue where you left off':'前回の続きへ').click();assert.deepEqual(await session(),resumed);assert.equal(await by('free-puzzle-intro').count(),0);
        assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).practicePools),saved.practicePools);
        // Rapid Next cannot count twice; changing mode does not count an abandoned question.
        await by('free-model').click();await by('free-next').evaluate(el=>{el.click();el.click();});await page.waitForFunction(()=>window.route.params.studySession.freePractice.answered===26);
        await by('free-mode-3').click();await by('free-mode-3').waitFor();assert.equal((await session()).freePractice.answered,26);
        for(const[width,height,scale]of[[390,844,1],[320,568,1.4]]){
          await page.setViewportSize({width,height});const params=await page.evaluate(()=>window.route.params);await page.evaluate(({lang,scale,params})=>window.boot(lang,false,{name:'Practice',params},scale),{lang,scale,params});
          for(const mode of [2,3,4]){
            await by('free-mode-'+mode).click();await page.waitForFunction(m=>window.route.params.studySession.freePractice.stage===m,mode);
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${width} mode ${mode} overflow`);
            const buttons=await page.locator('button').evaluateAll(els=>els.map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height));assert(buttons.every(r=>r.height>=43),'44px minimum touch target');
            if(width===320&&mode===4)await page.screenshot({path:path.join(work,`previews/practice-${lang}-compact.png`)});
          }
        }
        assert.deepEqual(errors,[]);console.log(`PASS ${lang}: all 36 themes × 3 direct modes, incorrect forms/meanings/puzzle extras, undo, 25 continuous questions, switching, resume, double tap, save failure, audio cleanup and compact/large text layouts.`);
      }
      assert.deepEqual(errors,[]);return;
    }
    if(process.argv.includes('--puzzle-gestures')){
      const by=id=>page.getByTestId(id);
      const drag=async(source,target,fixed=false)=>{const before=await source.boundingBox();await source.scrollIntoViewIfNeeded();const box=await source.boundingBox();if(!fixed)target={x:target.x+box.x-before.x,y:target.y+box.y-before.y};await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(230);await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();};
      for(const lang of ['ja','en']){
        const en=lang==='en';await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
        await page.evaluate(()=>window.navigate('GrammarGuide',{themeId:1,title:window.data.LEARNING_PATH.steps[0].title}));await page.getByRole('tab',{name:en?'Practice':'練習問題',exact:true}).click();await by('practice-start-4').click();
        assert.equal(await by('free-puzzle-intro').count(),1);assert.equal(await by('free-hint').count(),0);assert.equal(await by('free-reset').count(),0);assert.equal(await by('free-check').count(),0);
        const ex=await page.evaluate(()=>window.data.LEARNING_PATH.exercises[window.route.params.studySession.items[0].exerciseId]);
        const labels=()=>page.locator('[data-testid^="free-remove-"]').allTextContents();
        await by('free-answer').scrollIntoViewIfNeeded();let a=await by('free-answer').boundingBox();
        await drag(by('free-token-word-1'),{x:a.x+a.width/2,y:a.y+a.height-20});assert.deepEqual(await labels(),[ex.words[1].text]);
        await by('free-token-word-0').click();assert.deepEqual(await labels(),[ex.words[1].text,ex.words[0].text]);
        a=await by('free-answer').boundingBox();await drag(by('free-token-word-2'),{x:a.x+a.width-15,y:a.y+a.height-16});
        assert.equal(await by('free-next').count(),0);assert.deepEqual(await labels(),[ex.words[1].text,ex.words[0].text,ex.words[2].text]);
        // Returning a selected card to the bank removes just that card.
        const bank=await by('free-bank').boundingBox();await drag(by('free-remove-0'),{x:bank.x+bank.width-5,y:bank.y+bank.height-5});assert.deepEqual(await labels(),[ex.words[0].text,ex.words[2].text]);
        // Dropping outside either area leaves the answer alone.
        await drag(by('free-token-word-1'),{x:5,y:90},true);assert.deepEqual(await labels(),[ex.words[0].text,ex.words[2].text]);await by('puzzle-drag-preview').waitFor({state:'detached'});
        const second=await by('free-remove-1').boundingBox();await drag(by('free-token-word-1'),{x:second.x+2,y:second.y+second.height/2});await by('free-feedback').waitFor();
        await by('free-next').click();await by('free-bank').waitFor();assert.equal(await by('free-puzzle-intro').count(),0);
        // A direct reorder of an existing card is also supported.
        const e=await page.evaluate(()=>window.data.LEARNING_PATH.exercises[window.route.params.studySession.items[0].exerciseId]);
        await by('free-token-word-1').click();await by('free-token-word-0').click();
        const first=await by('free-remove-0').boundingBox();await drag(by('free-remove-1'),{x:first.x+1,y:first.y+first.height/2});assert.deepEqual(await labels(),[e.words[0].text,e.words[1].text]);
        await page.screenshot({path:path.join(work,`previews/puzzle-${lang}-direct-cards.png`)});
        await page.evaluate(l=>window.boot(l,false),lang);await page.getByRole('button',{name:en?'Continue where you left off':'前回の続きへ',exact:true}).click();assert.equal(await by('free-puzzle-intro').count(),0);
        assert.deepEqual(errors,[]);console.log(`PASS ${lang}: real PanResponder handlers through pointer adapter, bank insertion, reorder, return to bank, cancelled outside drop, automatic judgement and one-time intro across restart.`);
      }
      return;
    }
    if(['--letters-only','--conjuncts','--letters-navigation'].some(f=>process.argv.includes(f))){
      const by=id=>page.getByTestId(id);
      const play=async(id,url)=>{const before=await page.evaluate(()=>window.events.filter(e=>e[0]==='audio').length);await by(id).click();await page.waitForFunction(({before,url})=>window.events.filter(e=>e[0]==='audio').length===before+1&&window.events.filter(e=>e[0]==='audio').at(-1)[1].uri===url,{before,url});assert.equal(await page.evaluate(()=>window.activeAudio.size),1);};
      const checkWord=async sample=>{
        assert.equal(await by('letters-play-word-0').count(),sample.examples?.length?1:0,'One natural example is visible without disclosure');
        assert.equal(await by('letters-play-word-1').count(),0);
        if(sample.examples?.length){assert((await by('letters-example-words').innerText()).includes(sample.examples[0].ne));await play('letters-play-word-0',sample.examples[0].audio.url);}
      };
      for(const lang of ['ja','en']){
        const en=lang==='en';await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true,{name:'LettersSounds'}),lang);
        const original=await page.evaluate(()=>JSON.stringify(window.data.LETTERS_SOUNDS));
        const letters=await page.evaluate(l=>require('letterPresentation').prepareLetterPresentation(window.data.LETTERS_SOUNDS,l==='en'),lang);
        assert.deepEqual(letters.sections.map(s=>s.id),['start','vowels','combinations','conjuncts','marks','numbers']);
        assert.equal(letters.combinations.length,33);assert.equal(letters.conjunctCombinations.length,30);
        assert.deepEqual(letters.combinations.filter(r=>r.samples[0].audio).map(r=>r.samples[0].ne),['क्','स्']);
        const raw=JSON.parse(original);for(let i=0;i<33;i++)assert.deepEqual(letters.combinations[i].samples.slice(1).map(s=>s.audio),raw.combinations[i].samples.map(s=>s.audio));
        for(let i=0;i<30;i++)assert.deepEqual(letters.conjunctCombinations[i].samples.map(s=>s.audio),raw.conjunctCombinations[i].samples.map(s=>s.audio));
        assert.equal(letters.combinations.find(r=>r.consonant==='ज').samples[0].examples?.some(w=>w.ne==='ज्ञान')??false,false);
        assert.equal(letters.combinations[0].samples[1].examples?.some(w=>w.ne==='किताब')??false,false);
        assert.equal(await page.locator('[data-testid^="letters-category-"]').count(),6);
        await page.screenshot({path:path.join(work,`previews/letters-${lang}-library.png`),fullPage:true});
        const saved=await page.evaluate(()=>localStorage.getItem('test-study'));
        await by('letters-category-start').click();assert.equal(await by('letters-play-ka-aa').count(),0);assert.equal(await by('letters-play-house').count(),0);
        for(const section of letters.sections){
          await page.getByRole('heading',{name:section.title,exact:true}).waitFor();
          assert(await by('letters-section-navigation').evaluate(el=>el===el.parentElement.lastElementChild));
          await by('letters-next-section').click();assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
        }
        await by('letters-category-numbers').click();
        for(const section of [...letters.sections].reverse()){await page.getByRole('heading',{name:section.title,exact:true}).waitFor();await by('letters-prev-section').click();}
        assert.equal(await page.evaluate(()=>localStorage.getItem('test-study')),saved);
        for(const section of letters.sections.filter(s=>!['combinations','conjuncts'].includes(s.id))){
          await by('letters-category-'+section.id).click();
          assert.equal(await by('letters-sound-chart').getByRole('button').count(),section.id==='numbers'?11:section.samples.length);
          for(const sample of section.samples){
            if(section.id==='numbers'){const group=sample.value>100?10:Math.max(0,Math.ceil(sample.value/10)-1);await by('letters-number-chooser').click();await by('letters-number-range-'+group).click();}
            if(sample.audio)await play('letters-play-'+sample.id,sample.audio.url);else await by('letters-symbol-'+sample.id).click();
            await checkWord(sample);
          }
          await by('letters-library').click();assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
        }
        for(const category of ['combinations','conjuncts']){
          await by('letters-category-'+category).click();
          const rows=category==='combinations'?letters.combinations:letters.conjunctCombinations;
          for(const row of rows){
            const selector=category==='combinations'?'letters-consonant-'+row.consonant:'letters-conjunct-'+letters.sections.find(s=>s.id==='conjuncts').samples.find(s=>s.ne===row.consonant).id;
            await by(selector).click();assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
            assert.equal(await by('letters-sound-chart').getByRole('button').count(),category==='combinations'?12:11);
            if(category==='conjuncts')assert.equal(await by('letters-play-word-0').count(),1,'Each conjunct starts at a form with a natural word');
            for(const sample of row.samples){
              if(sample.audio)await play('letters-play-'+sample.id,sample.audio.url);
              else{await by('letters-symbol-'+sample.id).click();assert.equal(await page.evaluate(()=>window.activeAudio.size),0);assert.equal(await by('letters-symbol-'+sample.id).getAttribute('aria-selected'),'true');}
              await checkWord(sample);
            }
          }
          await by('letters-library').click();
        }
        assert.equal(await page.evaluate(()=>JSON.stringify(window.data.LETTERS_SOUNDS)),original,'Presentation does not mutate OTA data');
        for(const [width,height,scale]of[[390,844,1],[320,568,1.4]]){
          await page.setViewportSize({width,height});await page.evaluate(({lang,scale})=>window.boot(lang,false,{name:'LettersSounds'},scale),{lang,scale});
          for(const category of ['start','vowels','combinations','conjuncts','marks','numbers']){
            await by('letters-category-'+category).click();
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));
            assert.equal(await page.getByText(en?'Reading tips':'読み方を見る',{exact:true}).count(),0);
            for(const tile of await by('letters-sound-chart').getByRole('button').all()){const box=await tile.boundingBox();assert(box.width>=44&&box.height>=44,'44px minimum target');}
            if(width===390&&['combinations','conjuncts'].includes(category)){const last=await by('letters-sound-chart').getByRole('button').last().boundingBox();assert(last.y+last.height<height-68,'All forms fit on standard screen');}
            await page.screenshot({path:path.join(work,`previews/letters-${lang}-${width}-${category}.png`)});
            await by('letters-library').click();
          }
        }
        await by('letters-category-vowels').click();assert.equal(await page.getByRole('button',{name:/確認済|Reviewed|Mark section/}).count(),0);
        assert.equal(await page.getByText(/確認済|sections reviewed|Reviewed/).count(),0);
        const numberSamples=letters.sections.find(s=>s.id==='numbers').samples;assert.equal(numberSamples.length,106);assert.deepEqual(numberSamples.slice(0,101).map(s=>s.value),Array.from({length:101},(_,i)=>i));assert.deepEqual(numberSamples.slice(101).map(s=>s.value),[1000,10000,100000,1000000,10000000]);
        await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('test-study'))??{version:1,introRead:false,ratings:{},completed:{}};s.lettersRead=window.data.LETTERS_SOUNDS.sections.map(s=>s.id);localStorage.setItem('test-study',JSON.stringify(s));});
        await page.evaluate(l=>window.boot(l,false,{name:'HomeTab'}),lang);await by('home-letters').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).lettersRead.length),raw.sections.length,'Hidden home counters do not erase letter progress');
        console.log(`PASS ${lang}: 6 cards, 106 spoken numbers, no reviewed UI, 6 sections both directions, 33×12 consonant forms, 30×11 conjunct forms, only k/s bare audio, default single examples, all audio routes, immutable source, progress migration and 320px large-text layout.`);
      }
      assert.deepEqual(errors,[]);return;
    }
    if(process.argv.includes('--grammar-clarity')){
      for(const lang of ['ja','en'])for(const [width,scale]of[[390,1],[320,1.4]]){
        await page.setViewportSize({width,height:844});await page.evaluate(({lang,scale})=>window.boot(lang,true,{name:'GrammarLibrary'},scale),{lang,scale});
        const themes=(await page.evaluate(()=>window.data.GRAMMAR_THEMES)).filter(t=>!process.argv.includes('--changed-only')||[13,19,21,23].includes(t.id));
        for(const theme of themes){
          await page.evaluate(({themeId,title})=>window.navigate('GrammarGuide',{themeId,title}),{themeId:theme.id,title:theme.name});
          for(const part of [lang==='ja'?'基本ルール':'Core rules',lang==='ja'?'活用・語彙':'Forms & words']){
            await page.getByRole('tab',{name:part,exact:true}).click();
            while(await page.locator('button[aria-expanded="false"]').count())await page.locator('button[aria-expanded="false"]').first().click();
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang}/${theme.id}/${width}/${part} page overflow`);
            const overflow=await page.evaluate(()=>[...document.querySelectorAll('div,span')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.x>=0&&b.right>innerWidth+2;}).map(e=>e.textContent.slice(0,70)));
            assert.deepEqual(overflow,[],`${lang}/${theme.id}/${width}/${part} text overflow`);
            if([3,21,23].includes(theme.id)&&part===(lang==='ja'?'基本ルール':'Core rules')){
              const rule=theme.id===23?(lang==='ja'?'2. 語尾の基本：オ → イ／ア':'2. The ending pattern: o → ī / ā'):theme.id===21?(lang==='ja'?'4. पर्छ → पर्यो：必要が生じた':'4. पर्छ → पर्यो: a need arose'):(lang==='ja'?'3. मलाई＋感覚＋लाग्नु：誰がどう感じる？':'3. मलाई + sensation + लाग्नु: who feels it?');
              await page.getByRole('heading',{name:rule,exact:true}).scrollIntoViewIfNeeded();
              await page.screenshot({path:path.join(work,`previews/grammar-${lang}-${theme.id}-${width}.png`)});
            }
          }
          await page.getByRole('button',{name:lang==='ja'?'教材を閉じる':'Close lesson',exact:true}).click();
        }
        assert.deepEqual(errors,[]);console.log(`PASS grammar ${lang} ${width}: ${themes.length} lessons, rules and expanded references, translated tables, no horizontal text overflow.`);
      }
      return;
    }
    if(process.argv.includes('--lesson-navigation')){
      for(const lang of ['ja','en']){
        const en=lang==='en',by=id=>page.getByTestId(id),b=name=>page.getByRole('button',{name,exact:true});
        await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
        await by('home-grammar-lessons').waitFor();
        assert(await page.evaluate(()=>document.querySelector('[data-testid="home-letters"]').nextElementSibling===document.querySelector('[data-testid="home-grammar-lessons"]')),'Lessons card follows letters in the first grid row');
        await by('home-grammar-lessons').click();assert.equal(await page.evaluate(()=>window.route.name),'GrammarLibrary');
        const themes=await page.evaluate(()=>window.data.GRAMMAR_THEMES);
        assert.equal(await page.locator('[data-testid^="grammar-lesson-"]').count(),themes.length);
        await page.screenshot({path:path.join(work,`previews/grammar-${lang}-library.png`)});
        for(const theme of themes){
          await by('grammar-lesson-'+theme.id).click();assert.equal(await page.evaluate(()=>window.route.name),'GrammarGuide');
          assert.equal(await page.evaluate(()=>window.route.params.themeId),theme.id);
          assert.equal(await page.evaluate(()=>window.route.params.title),theme.name);
          assert.equal(await page.getByRole('tab').count(),4);
          await b(en?'Close lesson':'教材を閉じる').click();assert.equal(await page.evaluate(()=>window.route.name),'GrammarLibrary');
        }
        await b(en?'Back':'戻る').click();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
        await page.evaluate(()=>window.navigate('Theme',{mode:'grammar',guidesOnHome:true}));
        assert.equal(await page.getByText(en?'Guide':'教材',{exact:true}).count(),0,'Grammar tab has no lesson controls');
        await by('theme-'+themes[0].id).click();assert.equal(await page.evaluate(()=>window.route.name),'Practice');
        assert.equal(await page.evaluate(()=>window.route.params.mode),'grammar');
        assert.deepEqual(errors,[]);
        await b(en?'Back':'戻る').click();assert.equal(await page.evaluate(()=>window.route.name),'Theme');
        await page.evaluate(()=>{window.testEntitlement={isPro:false,freeThemes:1};});await page.evaluate(l=>window.boot(l,false,{name:'GrammarLibrary'}),lang);
        await by('grammar-lesson-'+themes[1].id).click();assert.equal(await page.evaluate(()=>window.route.name),'Paywall','Original access limits preserved');
        await page.evaluate(()=>{window.testEntitlement=undefined;});
        await page.setViewportSize({width:320,height:568});await page.evaluate(l=>window.boot(l,false,{name:'GrammarLibrary'},1.4),lang);
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),'Lesson library narrow/large text overflow');
        console.log(`PASS ${lang}: home card order, all ${themes.length} lessons, four reader tabs, return to library/home, grammar tab examples and access limits.`);
      }
      assert.deepEqual(errors,[]);return;
    }
    if(process.argv.includes('--reader-only')){
      for(const lang of ['ja','en']){
        const en=lang==='en',labels=en?['Core rules','Forms & words','Practice','Take a break']:['基本ルール','活用・語彙','練習問題','一休み'];
        const b=name=>page.getByRole('button',{name,exact:true}),tab=name=>page.getByRole('tab',{name,exact:true});
        await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
        const steps=await page.evaluate(()=>window.data.LEARNING_PATH.steps);
        for(const step of steps){
          await page.evaluate(({themeId,title})=>window.navigate('GrammarGuide',{themeId,title}),{themeId:step.guideThemeId,title:step.title});
          assert.deepEqual(await page.getByRole('tab').allTextContents(),labels);
          const before=await page.evaluate(()=>localStorage.getItem('test-study'));
          for(const label of labels){
            await tab(label).click();assert.equal(await tab(label).getAttribute('aria-selected'),'true');
            if(label===labels[3])assert(await page.getByRole('heading').count()>=2,`${lang}/${step.guideThemeId}: the break tab must contain a real card`);
            for(const removed of ['View examples & audio →','例題と音声を見る →','Explore forms & words →','活用・語彙を確認 →','3-step practice · 5 questions each →','3ステップ練習・各5問 →'])assert.equal(await b(removed).count(),0);
            assert.equal(await page.locator('[data-testid^="practice-start-"]').count(),label===labels[2]?3:0);
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${step.id} ${label} overflow`);
          }
          assert.equal(await page.evaluate(()=>localStorage.getItem('test-study')),before,'Switching tabs never consumes questions');
          await tab(labels[2]).click();await page.getByTestId('practice-start-2').click();
          const session=await page.evaluate(()=>window.route.params.studySession);assert.equal(session.items.length,1);assert.equal(session.freePractice.stage,2);assert(session.items.every(r=>r.themeId===step.guideThemeId));
          await b(en?'Back':'戻る').click();assert.equal(await page.evaluate(()=>window.route.name),'GrammarGuide');
          await b(en?'Close lesson':'教材を閉じる').click();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
        }
        for(const [width,height,scale]of[[390,844,1],[320,568,1.4]]){
          await page.setViewportSize({width,height});await page.evaluate(({lang,scale,title})=>window.boot(lang,false,{name:'GrammarGuide',params:{themeId:1,title}},scale),{lang,scale,title:steps[0].title});
          for(const label of labels){await tab(label).click();assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${label} ${width} overflow`);if(width===390)await page.screenshot({path:path.join(work,`previews/reader-${lang}-${labels.indexOf(label)}.png`)});}
        }
        console.log('PASS '+lang+': all 36 lessons have four tabs; no footer cross-links; practice launches a continuous question and Back returns; narrow/large-text layouts.');
      }
      assert.deepEqual(errors,[]);return;
    }
    for(const lang of ['ja','en']) {
      const en=lang==='en',b=name=>page.getByRole('button',{name,exact:true}),back=()=>b(en?'Back':'戻る').click();
      const start=en?'Start practice · 15 questions':'練習を始める・15問';
      const openPractice=async()=>{await page.getByRole('tab',{name:en?'Practice':'練習問題',exact:true}).click();await b(start).click();};
      await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
      assert.equal((await page.locator('body').textContent()).includes('はじめての7ステップ'),false);
      await b(en?'Letters & sounds':'文字と音').click();
      const hit=await b(en?'Back':'戻る').boundingBox();assert(hit.width>=48&&hit.height>=48);
      const letters=await page.evaluate(()=>window.data.LETTERS_SOUNDS);
      for(let i=0;i<letters.sections.length;i++) {
        const section=letters.sections[i];await b(`${i+1}. ${section.title}`).click();
        const sound=section.samples.find(s=>s.audio);
        if(sound){await b((en?'Listen: ':'聞く：')+(sound.speech??sound.ne)).click();await page.waitForTimeout(20);}
        await b(en?'Mark as reviewed':'ここまで確認した').click();
      }
      await b(`9. ${letters.sections[8].title}`).count();
      await b(`✓ 9. ${letters.sections[8].title}`).click();
      for(const row of letters.combinations) {await b(row.consonant).click();for(const sample of row.samples)assert.equal(await b((en?'Listen: ':'聞く：')+sample.speech).count(),1);}
      assert(await page.evaluate(()=>window.events.some(e=>e[0]==='audio'&&e[1]?.uri?.includes('/learning-'))));
      await back();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).lettersRead.length),12);
      const steps=await page.evaluate(()=>window.data.LEARNING_PATH.steps),exercises=await page.evaluate(()=>window.data.LEARNING_PATH.exercises);
      const rated=new Set();let firstSession;
      for(let i=0;i<steps.length;i++) {
        const step=steps[i],themeId=step.guideThemeId;
        await page.evaluate(({themeId,title})=>window.navigate('GrammarGuide',{themeId,title}),{themeId,title:step.title});
        assert.equal(await page.getByRole('tab',{name:en?'Examples':'例題',exact:true}).count(),0);
        await openPractice();
        const session=await page.evaluate(()=>window.route.params.studySession);assert.equal(session.items.length,15);if(i===0)firstSession=session;
        for(let j=0;j<15;j++){
          const ref=session.items[j],e=exercises[ref.exerciseId],stage=session.questionStages[j];rated.add(ref.exerciseId);
          if(i===0&&j===1){
            // Returning from Home must resume the same set without drawing another five.
            const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')));
            await page.evaluate(l=>window.boot(l,false),lang);await b(en?'Continue where you left off':'前回の続きへ').click();
            const resumed=await page.evaluate(()=>window.route.params.studySession);assert.deepEqual(resumed.items,session.items);assert.equal(resumed.position,1);
            assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).practicePools),saved.practicePools);
          }
          if(j===0 || (i===0&&j===1)){
            for(const w of e.words)assert((await page.locator('body').textContent()).includes(w.meaning));
            await b(en?'See the model':'見本へ進む').click();assert((await page.locator('body').textContent()).includes(e.selection.rule));
            await b(stage===2?(en?'Choose the form':'形を選んでみる'):stage===3?(en?'Choose the meaning':'意味を選んでみる'):(en?'Start the word-order puzzle':'語順パズルへ')).click();
          }
          const next=en?'Confirmed — next':'確認した・次へ';
          if(stage===2){
            const correct=e.selection.answer??e.words[e.selection.wordIndex].text,wrong=e.selection.options.find(o=>o.form!==correct);
            await b(wrong.form+' · '+wrong.roman).click();assert.equal(await b(next).count(),0);
            const answer=e.selection.options.find(o=>o.form===correct);await b(answer.form+' · '+answer.roman).click();
          }else if(stage===3){
            await b(e.meaningChoices.find(t=>t!==e.jp)).click();assert.equal(await b(next).count(),0);await b(e.jp).click();
          }else{
            for(const w of e.words)await b(w.text).filter({visible:true}).and(page.locator('button:not([disabled])')).first().click();
            await b(en?'Check the order':'並びを確かめる').click();
          }
          if(i===0&&j===0){await page.evaluate(()=>window.failStorage=true);await b(next).click();await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('test-study')).ratings).length),0);await page.evaluate(()=>window.failStorage=false);}
          await b(next).click();
        }
        await page.getByRole('heading',{name:en?'Practice set complete':'今回の練習が終わりました',exact:true}).waitFor();
        if(i===0){await back();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');await page.evaluate(({themeId,title})=>window.navigate('GrammarGuide',{themeId,title}),{themeId,title:step.title});}
        else {await back();assert.equal(await page.evaluate(()=>window.route.name),'GrammarGuide');}
        await b(en?'Close lesson':'教材を閉じる').click();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
      }
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')));
      assert.equal(Object.keys(saved.completed).length,36);assert.equal(Object.keys(saved.ratings).length,rated.size);assert(Object.values(saved.ratings).every(r=>r.result==='supported'&&r.streak===0));
      await page.evaluate(({themeId,title})=>window.navigate('GrammarGuide',{themeId,title}),{themeId:steps[0].guideThemeId,title:steps[0].title});await openPractice();
      const nextSession=await page.evaluate(()=>window.route.params.studySession);
      for(const stage of [2,3,4]){const old=firstSession.items.filter((_,i)=>firstSession.questionStages[i]===stage).map(r=>r.exerciseId);assert(!nextSession.items.filter((_,i)=>nextSession.questionStages[i]===stage).some(r=>old.includes(r.exerciseId)));}
      await page.evaluate(l=>window.boot(l,false),lang);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study')).lettersRead.length),12);
      for(const [width,height,scale]of[[320,568,1],[390,844,1],[320,568,1.4],[844,390,1]]) {
        await page.setViewportSize({width,height});
        for(const name of ['HomeTab','LettersSounds','Practice']) {
          const params=name==='Practice'?{themeId:1,mode:'grammar',studySession:nextSession}:undefined;
          await page.evaluate(({lang,name,params,scale})=>window.boot(lang,false,{name,params},scale),{lang,name,params,scale});
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${name} overflow ${width}/${scale}`);
          if(width===390)await page.screenshot({path:path.join(work,`previews/nepali-${VERSION}-${lang}-${name}.png`)});
        }
      }
      // Legacy route still opens a real screen, and its actual Back handler returns home.
      await page.evaluate(l=>window.boot(l,false),lang);await page.evaluate(()=>window.navigate('LearningPath'));await back();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
      console.log('PASS '+lang+': 36 lessons × 15 questions, shuffled next set, resume, letters/audio controls, save failure and back round trips.');
    }
    assert.deepEqual(errors,[]);console.log('PASS: actual TSX interaction and small-screen/large-text layouts. Native iOS gestures still require device QA.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
