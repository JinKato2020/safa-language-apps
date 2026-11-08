// Actual TSX screens and persistence provider through DOM adapters. Native gestures/audio are not simulated as device proof.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const VERSION=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../expo-app/app.json'),'utf8')).expo.version;
const ROOT=path.resolve(__dirname,'../..'),work=path.resolve(process.argv[2]||'.work-beginner/ui');fs.mkdirSync(work,{recursive:true});fs.mkdirSync(path.join(work,'previews'),{recursive:true});
const source=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const modules={};for(const[p,file]of[['react','react.production.js'],['react/jsx-runtime','react-jsx-runtime.production.js'],['react-dom','react-dom.production.js'],['react-dom/client','react-dom-client.production.js'],['scheduler','scheduler.production.js']])modules[p]=fs.readFileSync(path.join(path.dirname(require.resolve(p.split('/')[0]+'/package.json')),'cjs',file),'utf8');
for(const name of ['practicePool','freePractice','guidedPractice','LearningSound','learning','learningCopy','LearningContext','LearningLaunch','StudyHeader','themeLabels','theme','l1','transliterate','grammarReading','grammarPresentation'])modules[name]=compile(source(`packages/shared/src/${name}.${['LearningContext','LearningLaunch','LearningSound','StudyHeader'].includes(name)?'tsx':'ts'}`));
for(const name of ['FreePracticeScreen','GuidedPracticeScreen','ExampleStudyScreen','LearningHomeScreen','LettersSoundsScreen','PracticeScreen','GrammarGuideScreen','GrammarLibraryScreen','ThemeScreen'])modules[name]=compile(source(`packages/shared/src/screens/${name}.tsx`));
modules.entitlement=compile(source('packages/shared/src/entitlement.tsx'));
modules.compose=compile(source('聞いて話せるネパール語/expo-app/src/pack/compose.ts'));
const core=JSON.parse(source('聞いて話せるネパール語/expo-app/data/ota-baseline/core.json'));
const overlays={},strings={};for(const lang of ['ja','en']){overlays[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/data/overlays/${lang}.json`));strings[lang]=JSON.parse(source(`聞いて話せるネパール語/expo-app/src/i18n/${lang}.json`));}
const code=`
const modules=${JSON.stringify(modules)},cache={},overlays=${JSON.stringify(overlays)},strings=${JSON.stringify(strings)},core=${JSON.stringify(core)};
function require(n){if(n.startsWith('.'))n=n.split('/').pop();if(cache[n])return cache[n].exports;const m={exports:{}};cache[n]=m;if(!modules[n])throw Error('Missing '+n);new Function('require','module','exports','process',modules[n])(require,m,m.exports,{env:{NODE_ENV:'production'}});return m.exports;}
const React=require('react'),h=React.createElement;window.caseInfo={lang:'ja',scale:1};window.route={name:'HomeTab'};window.events=[];window.failStorage=false;
const flat=s=>Object.assign({},...(Array.isArray(s)?s.flat(Infinity):[s]).filter(Boolean));
function css(style,view=false){const s=flat(style),out=view?{position:'relative',display:'flex',flexDirection:'column',flexShrink:0,minWidth:0,minHeight:0,borderWidth:0,borderStyle:'solid'}:{};for(const[k,v]of Object.entries(s)){
if(k==='paddingHorizontal'){out.paddingLeft=v;out.paddingRight=v;}else if(k==='paddingVertical'){out.paddingTop=v;out.paddingBottom=v;}else if(k==='marginHorizontal'){out.marginLeft=v;out.marginRight=v;}else if(k==='marginVertical'){out.marginTop=v;out.marginBottom=v;}else if(k==='lineHeight')out[k]=v*window.caseInfo.scale+'px';else if(k==='fontSize')out[k]=v*window.caseInfo.scale;else out[k]=v;}return out;}
function View(p){const ref=React.useRef(null);React.useEffect(()=>{if(!p.onLayout)return;const r=new ResizeObserver(()=>p.onLayout({nativeEvent:{layout:{width:ref.current.clientWidth,height:ref.current.clientHeight}}}));r.observe(ref.current);return()=>r.disconnect();},[p.onLayout]);return h('div',{ref,'data-testid':p.testID,style:css(p.style,true)},p.children);}
function Text(p){return h('span',{'data-testid':p.testID,role:p.accessibilityRole==='header'?'heading':undefined,style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',...css(p.style)}},p.children);}
function Pressable(p){return h('button',{'aria-label':p.accessibilityLabel,'aria-expanded':p.accessibilityState?.expanded,'aria-selected':p.accessibilityState?.selected,disabled:p.disabled,onClick:p.onPress,'data-testid':p.testID,role:p.accessibilityRole==='tab'?'tab':undefined,style:{font:'inherit',textAlign:'left',...css(typeof p.style==='function'?p.style({pressed:false}):p.style,true)}},typeof p.children==='function'?p.children({pressed:false}):p.children);}
const ScrollView=React.forwardRef((p,ref)=>{const el=React.useRef(null);React.useImperativeHandle(ref,()=>({scrollTo:({y})=>el.current.scrollTo(0,y)}));return h('div',{ref:el,style:{overflowY:p.horizontal?'hidden':'auto',overflowX:p.horizontal?'auto':'hidden',flex:p.horizontal?'0 0 auto':1,minHeight:0,...css(p.style,true)}},h('div',{style:{...css(p.contentContainerStyle,true),...(p.horizontal?{flexDirection:'row',width:'max-content'}:{})}},p.children));});
const heroPath=${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))};
const Image=p=>h('img',{src:p.source===1?heroPath:p.source?.uri,style:{objectFit:p.resizeMode==='contain'?'contain':undefined,...css(p.style)}});Image.resolveAssetSource=()=>({width:1200,height:400});
cache['react-native']={exports:{AppState:{addEventListener:()=>({remove:()=>{}})},View,Text,Pressable,ScrollView,FlatList:p=>h(ScrollView,{style:p.style,contentContainerStyle:p.contentContainerStyle},p.ListHeaderComponent,p.data.map((item,index)=>h(React.Fragment,{key:p.keyExtractor(item)},p.renderItem({item,index})))),Image,Animated:{View},StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:innerWidth,height:innerHeight,fontScale:window.caseInfo.scale})}};
cache.Text={exports:{Text}};cache.SettingsContext={exports:{useSettings:()=>({practiceDirection:'ja2ne',romaji:true}),useScaleStyle:()=> (fontSize,lineHeight)=>({fontSize,lineHeight}),useGlobalScaleStyle:()=>fontSize=>({fontSize})}};
cache.i18n={exports:{useI18n:()=>({lang:window.caseInfo.lang,t:(key,vars={})=>{let s=key.split('.').reduce((v,k)=>v?.[k],strings[window.caseInfo.lang])??key;for(const[k,v]of Object.entries(vars))s=String(s).replace('{'+k+'}',v);return s;}})}};
cache.AppDataContext={exports:{useAppData:()=>window.data}};
const realEntitlement=require('entitlement');cache.entitlement={exports:{...realEntitlement,useEntitlement:()=>window.testEntitlement??{isPro:true,freeThemes:Infinity}}};
cache['react-native-safe-area-context']={exports:{useSafeAreaInsets:()=>({top:20,bottom:0,left:0,right:0})}};
cache['react-native-svg']={exports:{__esModule:true,default:()=>null,Line:()=>null,Path:()=>null,Polyline:()=>null}};
cache.useCardFlip={exports:{useCardFlip:()=>({flip:cb=>cb(),animatedStyle:{}})}};
cache.useHorizontalSwipe={exports:{useHorizontalSwipe:()=>({})}};
cache['expo-audio']={exports:{useAudioPlayer:src=>{const p=React.useMemo(()=>({source:src,seekTo:async()=>{},pause:()=>window.activeAudio.delete(p),play:()=>{window.activeAudio.add(p);window.events.push(['audio',src]);}}),[src]);React.useEffect(()=>()=>window.activeAudio.delete(p),[p]);return p;},useAudioPlayerStatus:p=>({isLoaded:!!p.source,playing:false,didJustFinish:window.audioEnded})}};
cache['@react-native-async-storage/async-storage']={exports:{getItem:async k=>localStorage.getItem(k),setItem:async(k,v)=>{if(window.failStorage)throw Error('full');localStorage.setItem(k,v);}}};
const nav={setParams:params=>{window.route={...window.route,params:{...window.route.params,...params}};window.redraw();},isFocused:()=>true,canGoBack:()=>window.stack.length>0,navigate:(name,params)=>{window.events.push(['navigate',name,params]);window.stack.push(window.route);window.route={name,params};window.redraw();},replace:(name,params)=>{window.events.push(['replace',name,params]);window.route={name,params};window.redraw();},goBack:()=>{window.route=window.stack.pop()??{name:'HomeTab'};window.redraw();},setOptions:options=>{const next={...window.screenOptions,...options};if(JSON.stringify(next)===JSON.stringify(window.screenOptions))return;window.screenOptions=next;window.redraw?.();}};
cache['@react-navigation/native']={exports:{useNavigation:()=>nav,useRoute:()=>window.route,useFocusEffect:cb=>React.useEffect(cb,[cb])}};
cache.heroImages={exports:{useHeroImage:()=>1,ModeHero:()=>h('img',{src:${JSON.stringify('file:///'+path.join(ROOT,'聞いて話せるネパール語/expo-app/assets/hero/grammar.jpg').replaceAll('\\','/'))},style:{width:'100%',aspectRatio:'3/1',objectFit:'contain',borderRadius:16}})}};
cache.grammarGuide={exports:{useGrammarGuide:()=>window.data.GRAMMAR_GUIDE,useGrammarGuideImageResolver:()=>async()=>null}};
const root=require('react-dom/client').createRoot(document.getElementById('root')),Provider=require('LearningContext').LearningProvider;let generation=0;
const AudioProvider=require('LearningSound').LearningAudioProvider,resolveAudio=async a=>({uri:a.url});
const names={HomeTab:'LearningHomeScreen',LearningPath:'LettersSoundsScreen',LettersSounds:'LettersSoundsScreen',Practice:'PracticeScreen',GrammarGuide:'GrammarGuideScreen',GrammarLibrary:'GrammarLibraryScreen',Theme:'ThemeScreen'};
function Frame(){const[count,setCount]=React.useState(0);window.redraw=()=>setCount(x=>x+1);const name=names[window.route.name];return h(React.Fragment,null,['Practice','LettersSounds','LearningPath','GrammarLibrary'].includes(window.route.name)?h(require('StudyHeader').default,{navigation:nav,options:{title:window.screenOptions?.title??window.route.name}}):null,name?h(require(name).default,{key:window.route.name+JSON.stringify(window.route.params??{})}):h('div',null,window.route.name));}
window.boot=async(lang='ja',clear=false,route={name:'HomeTab'},scale=1)=>{if(clear)localStorage.clear();window.caseInfo={lang,scale};window.route=route;window.stack=[];window.events=[];window.activeAudio=new Set();window.audioEnded=false;
const neAudio={},neGram={},l1Audio={},l1Gram={};for(const[k,rows]of Object.entries(core.examplesNe))rows.forEach((_,i)=>{neAudio[k+'-'+(i+1)]='ne/'+k+'-'+(i+1);l1Audio[k+'-'+(i+1)]=lang+'/'+k+'-'+(i+1);});for(const[k,id]of Object.entries(core.grammarAudioRefs??Object.fromEntries(Object.entries(core.grammarNe).flatMap(([t,rows])=>rows.map((_,i)=>[t+'-'+(i+1),t+'-'+(i+1)]))))){if(id){neGram[id]='ne/'+id;l1Gram[id]=lang+'/'+id;}}
window.data=require('compose').composePack({...core,nepaliAudio:neAudio,nepaliGrammarAudio:neGram},{...overlays[lang],nativeLang:lang,l1Audio,l1GrammarAudio:l1Gram},{version:'test'});
require('react-dom').flushSync(()=>root.render(h(Provider,{storageKey:'test-study',key:++generation},h(AudioProvider,{resolve:resolveAudio},h(Frame)))));await new Promise(r=>setTimeout(r,30));};
window.navigate=nav.navigate;window.boot();
`;
fs.writeFileSync(path.join(work,'index.js'),code);fs.writeFileSync(path.join(work,'index.html'),'<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,"Nirmala UI","Yu Gothic UI",sans-serif}#root{height:100vh;display:flex;flex-direction:column}button{background:none;cursor:pointer}</style><div id="root"></div><script src="index.js"></script>');
(async()=>{
  const {chromium}=require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try {
    const page=await browser.newPage();page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('file:///'+path.join(work,'index.html').replaceAll('\\','/'));
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
              await by('free-check').click();assert.equal(await by('free-next').count(),0);
              assert((await page.locator('body').textContent()).includes(en?'One of the words does not fit':'この文に合わない語'));
              await by('free-remove-0').click();assert.equal(await by('free-check').isDisabled(),true);
              if(await by('free-reset').count())await by('free-reset').click();
              for(let i=0;i<e.words.length;i++)await by('free-token-word-'+i).click();
              await by('free-check').click();
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
          if(i===0){await by('free-audio').click();await page.waitForFunction(()=>window.activeAudio.size===1);}
          await next();assert.equal((await session()).freePractice.answered,i+1);assert.equal(await page.evaluate(()=>window.stack.length),2);assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
        }
        assert.equal(new Set(seen.slice(0,20)).size,20);assert.notEqual(seen[19],seen[20]);
        const before=await session();await by('free-mode-4').click();await by('free-bank').waitFor();assert.equal((await session()).freePractice.answered,25);
        await by('free-hint').click();await by('free-hints').waitFor();await by('free-hint').click();assert.equal(await by('free-hints').count(),0);
        const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-study'))),resumed=await session();
        await page.evaluate(l=>window.boot(l,false),lang);await b(en?'Continue where you left off':'前回の続きへ').click();assert.deepEqual(await session(),resumed);
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
    if(process.argv.includes('--letters-only')){
      for(const lang of ['ja','en']){
        const en=lang==='en',b=name=>page.getByRole('button',{name,exact:true}),by=id=>page.getByTestId(id);
        await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);await page.evaluate(()=>window.navigate('LettersSounds'));
        const letters=await page.evaluate(()=>window.data.LETTERS_SOUNDS);
        assert.equal(await page.locator('[data-testid^="letters-category-"]').count(),6);
        await page.screenshot({path:path.join(work,`previews/letters-${lang}-library.png`),fullPage:true});
        const sectionCategory=id=>['start','vowels','combinations','conjuncts'].includes(id)?id:['marks','numbers'].includes(id)?'marks':'consonants';
        const play=async(id,url)=>{const before=await page.evaluate(()=>window.events.filter(e=>e[0]==='audio').length);await by(id).click();await page.waitForFunction(({before,url})=>window.events.filter(e=>e[0]==='audio').length===before+1&&window.events.filter(e=>e[0]==='audio').at(-1)[1].uri===url,{before,url});assert.equal(await page.evaluate(()=>window.activeAudio.size),1,'Only one audio player may be active');};
        let total=0;
        for(const section of letters.sections.filter(s=>s.id!=='combinations')){
          await by('letters-category-'+sectionCategory(section.id)).click();
          if(['bare','marks','numbers','velar','affricate','retroflex','dental','labial','other'].includes(section.id))await by('letters-section-'+section.id).click();
          const samples=section.samples.filter(s=>s.audio);
          assert.equal(await by('letters-sound-chart').getByRole('button').count(),samples.length,'All sounds must be on the chart without pagination');
          assert.equal(await by('letters-next').count(),0);
          if(section.id==='bare'){assert.equal(section.samples.length,33);assert.equal(samples.length,2);assert.equal(await page.locator('[data-testid^="letters-symbol-"]').count(),31);assert.deepEqual(samples.map(x=>x.ne),['क्','स्']);for(const s of section.samples.filter(x=>!x.audio))assert.equal(await by('letters-symbol-'+s.id).getByRole('button').count(),0);}
          if(['bare','vowels','conjuncts'].includes(section.id))await page.screenshot({path:path.join(work,`previews/letters-${lang}-${section.id}.png`)});
          for(const s of samples){
            const id='letters-play-'+s.id;
            assert.equal(await by(id).getAttribute('aria-label'),`${en?'Play sound':'音を聞く'}: ${s.speech??s.ne}`);
            await play(id,s.audio.url);
            assert.equal(await by(id).getAttribute('aria-selected'),'true');
            if(s.examples){
              assert.equal(s.examples.length,2);
              if(await by('letters-details').getAttribute('aria-expanded')!=='true')await by('letters-details').click();
              for(let j=0;j<2;j++){assert.equal(await by('letters-play-word-'+j).getAttribute('aria-label'),`${en?'Play word':'単語を聞く'}: ${s.examples[j].ne}`);await play('letters-play-word-'+j,s.examples[j].audio.url);}total++;
            }
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${s.id} overflow`);
          }
          await b(en?'Mark section as reviewed':'この項目を確認済みにする').click();await b(en?'Reviewed ✓':'確認済み ✓').waitFor();
          await by('letters-library').click();assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
        }
        assert.equal(total,74);
        await by('letters-category-combinations').click();
        for(const row of letters.combinations){
          await b(`${en?'Consonant':'子音'} ${row.consonant}`).click();
          assert.equal(await page.evaluate(()=>window.activeAudio.size),0,'Changing consonant stops playback');
          assert.equal(await by('letters-sound-chart').getByRole('button').count(),11);
          for(const s of row.samples){assert.equal(await by('letters-play-'+s.id).getAttribute('aria-label'),`${en?'Play sound':'音を聞く'}: ${s.speech??s.ne}`);await play('letters-play-'+s.id,s.audio.url);}
        }
        await b(en?'Stop':'停止').click();assert.equal(await page.evaluate(()=>window.activeAudio.size),0);
        await by('letters-library').click();await by('letters-category-vowels').click();
        const vowel=letters.sections.find(s=>s.id==='vowels').samples[0];
        await play('letters-play-'+vowel.id,vowel.audio.url);await play('letters-play-'+vowel.id,vowel.audio.url);
        await page.evaluate(()=>{window.audioEnded=true;window.redraw();});await page.waitForFunction(()=>window.activeAudio.size===0);await page.evaluate(()=>{window.audioEnded=false;});
        await by('letters-library').click();await b(en?'Back':'戻る').click();assert.equal(await page.evaluate(()=>window.route.name),'HomeTab');
        for(const[width,height,scale]of[[390,844,1],[320,568,1.4]]){
          await page.setViewportSize({width,height});await page.evaluate(({lang,scale})=>window.boot(lang,false,{name:'LettersSounds'},scale),{lang,scale});
          assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),'Library overflow');
          for(const category of ['vowels','consonants','combinations','conjuncts','marks']){
            await by('letters-category-'+category).click();
            assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),`${lang} ${category} narrow/large text overflow`);
            const tiles=await by('letters-sound-chart').getByRole('button').all();for(const tile of tiles){const box=await tile.boundingBox();assert(box.width>=44&&box.height>=44,'Touch target below 44px');}
            if(width===390&&['vowels','combinations'].includes(category)){
              const first=await tiles[0].boundingBox(),last=await tiles.at(-1).boundingBox();assert(first.y>=0&&last.y+last.height<height-68,'All 11 sounds should fit together in the standard viewport');
              await page.screenshot({path:path.join(work,`previews/letters-${lang}-${category}.png`)});
            }
            if(width===390&&category==='combinations')await page.screenshot({path:path.join(work,`previews/letters-${lang}-combinations.png`)});
            await by('letters-library').click();
          }
        }
        console.log(`PASS ${lang}: 74 letters with two words, all 363 vowel routes, grouped charts, tap/replay/stop/end/back, save, 44px targets and 320px/large text.`);
      }
      assert.deepEqual(errors,[]);return;
    }
    if(process.argv.includes('--lesson-navigation')){
      for(const lang of ['ja','en']){
        const en=lang==='en',by=id=>page.getByTestId(id),b=name=>page.getByRole('button',{name,exact:true});
        await page.setViewportSize({width:390,height:844});await page.evaluate(l=>window.boot(l,true),lang);
        await by('home-grammar-lessons').waitFor();
        assert(await page.evaluate(()=>document.querySelector('[data-testid="home-letters"]').nextElementSibling===document.querySelector('[data-testid="home-grammar-lessons"]')),'Lessons card must be immediately below letters');
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
