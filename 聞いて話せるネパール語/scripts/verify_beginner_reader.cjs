// Actual reader TSX rendered with DOM adapters; not an iOS device test.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const ts = require('typescript');
const ROOT = path.resolve(__dirname, '../..');
const work = path.resolve(process.argv[2] || '.work-reader');
fs.mkdirSync(work, { recursive: true });
const source = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const transpile = text => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const policyModule = { exports: {} };
vm.runInNewContext(`(function(exports){${transpile(source('packages/shared/src/grammarReading.ts'))}\n})`)(policyModule.exports);
const policy = policyModule.exports;
const data = {};
const review = [];
for (const lang of ['ja', 'en']) {
  const overlay = JSON.parse(source(`聞いて話せるネパール語/expo-app/data/overlays/${lang}.json`));
  data[lang] = { guides: overlay.grammarGuide, titles: overlay.grammarThemeNames };
  assert.equal(Object.keys(overlay.grammarGuide).length, 36);
  for (const [id, blocks] of Object.entries(overlay.grammarGuide)) {
    const sections = policy.partitionLesson(blocks), output = Object.values(sections).flat();
    const expected = blocks.filter(b => !b.beginnerIntroEnd);
    assert.equal(output.length, expected.length);
    for (const b of expected) assert.equal(output.filter(x => x === b).length, 1, `${lang}/${id}: no lost or duplicated blocks`);
    assert.equal(sections.rules[0].type, 'goal');
    assert(sections.rules.some(b => b.type === 'h' && b.text.startsWith('1. ')));
    for (const part of ['reference', 'examples']) {
      const groups = policy.readingGroups(sections[part], policy.readingCopy(lang).extra);
      assert.equal(groups.flatMap(g => g.blocks).length + sections[part].filter(b => b.type === 'h').length, sections[part].length);
    }
    for (const b of blocks) {
      if (b.type === 'table') assert(b.rows.every(row => row.length === b.headers.length));
      if (b.text) assert.equal((b.text.match(/\*\*/g) || []).length % 2, 0, `${lang}/${id}: paired emphasis`);
    }
    assert(!JSON.stringify(blocks).includes('⚠'));
    review.push({ lang, id, total: expected.length, initial: sections.rules.length, examples: policy.readingGroups(sections.examples, '').length });
  }
}
const legacy = [{ type: 'p', text: 'Legacy lesson' }];
assert.equal(policy.partitionLesson(legacy).rules, legacy);

// Small local CommonJS bundle for React itself and the transpiled real reader.
// No network, dependencies, or replacement product UI required for the preview.
const packageFile = (pkg, name) => fs.readFileSync(path.join(path.dirname(require.resolve(pkg + '/package.json')), 'cjs', name), 'utf8');
const modules = {
  react: packageFile('react', 'react.production.js'),
  'react/jsx-runtime': packageFile('react', 'react-jsx-runtime.production.js'),
  'react-dom': packageFile('react-dom', 'react-dom.production.js'),
  'react-dom/client': packageFile('react-dom', 'react-dom-client.production.js'),
  scheduler: packageFile('scheduler', 'scheduler.production.js'),
  '../grammarReading': transpile(source('packages/shared/src/grammarReading.ts')),
  '../grammarPresentation': transpile(source('packages/shared/src/grammarPresentation.ts')),
  '../theme': transpile(source('packages/shared/src/theme.ts')),
  reader: transpile(source('packages/shared/src/screens/GrammarGuideScreen.tsx') + '\nexport {Table, LessonBlocks};'),
};
const images = {};
for (const lang of ['ja','en']) for (const blocks of Object.values(data[lang].guides)) for (const b of blocks) if (b.image) {
  images[b.image.sha256] = 'file:///' + path.join(ROOT, '聞いて話せるネパール語/expo-app/assets/culture', b.image.uri.split('/').pop()).replaceAll('\\', '/');
}
const harness = `
const modules=${JSON.stringify(modules)}, cache={};
const data=${JSON.stringify(data)}, images=${JSON.stringify(images)};
window.caseInfo={lang:'ja',id:'1',scale:1};
window.nav=[];
function require(name){if(cache[name])return cache[name].exports; const module={exports:{}};cache[name]=module;new Function('require','module','exports','process',modules[name])(require,module,module.exports,{env:{NODE_ENV:'production'}});return module.exports;}
const React=require('react');
const h=React.createElement;
const flat=s=>Object.assign({},...(Array.isArray(s)?s.flat(Infinity):[s]).filter(Boolean));
function css(style,view){const s=flat(style),out=view?{display:'flex',flexDirection:'column',borderStyle:'solid',borderWidth:0,flexShrink:0,minWidth:0}:{};
for(const[k,v]of Object.entries(s)){
if(k==='paddingHorizontal'){out.paddingLeft=v;out.paddingRight=v}else if(k==='paddingVertical'){out.paddingTop=v;out.paddingBottom=v}
else if(k==='marginHorizontal'){out.marginLeft=v;out.marginRight=v}else if(k==='marginVertical'){out.marginTop=v;out.marginBottom=v}
else if(k==='lineHeight')out[k]=v+'px';else out[k]=v;
}return out;}
function View(p){const ref=React.useRef(null);React.useEffect(()=>{if(!p.onLayout)return;const ro=new ResizeObserver(()=>p.onLayout({nativeEvent:{layout:{width:ref.current.clientWidth,height:ref.current.clientHeight}}}));ro.observe(ref.current);return()=>ro.disconnect()},[p.onLayout]);return h('div',{ref,style:css(p.style,true)},p.children);}
function Text(p){const s=css(p.style);if(s.fontSize){s.fontSize*=window.caseInfo.scale;if(s.lineHeight)s.lineHeight=parseFloat(s.lineHeight)*window.caseInfo.scale+'px';s.display='block';}return h('span',{style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',...s},role:p.accessibilityRole==='header'?'heading':undefined},p.children);}
function Pressable(p){return h('button',{onClick:p.onPress,role:p.accessibilityRole==='tab'?'tab':undefined,'aria-label':p.accessibilityLabel,'aria-selected':p.accessibilityState?.selected,'aria-expanded':p.accessibilityState?.expanded,style:{font:'inherit',textAlign:'left',cursor:'pointer',...css(p.style,true)}},p.children);}
const ScrollView=React.forwardRef((p,ref)=>{const el=React.useRef(null);React.useImperativeHandle(ref,()=>({scrollTo:({y})=>el.current.scrollTo(0,y)}));return h('div',{ref:el,'data-scroll':true,style:{overflowY:'auto',flex:1,minHeight:0}},h('div',{style:css(p.contentContainerStyle,true)},p.children));});
function NativeImage(p){return h('img',{src:p.source.uri,alt:p.accessibilityLabel,onError:p.onError,style:{objectFit:'contain',...css(p.style)}});}
cache['react-native']={exports:{View,Text,Pressable,ScrollView,Image:NativeImage,StyleSheet:{create:x=>x},useWindowDimensions:()=>({width:innerWidth,height:innerHeight,fontScale:window.caseInfo.scale})}};
cache['../Text']={exports:{Text}};
cache['../SettingsContext']={exports:{useScaleStyle:()=> (fontSize,lineHeight)=>({fontSize,lineHeight}),useGlobalScaleStyle:()=> (fontSize)=>({fontSize})}};
cache['../i18n']={exports:{useI18n:()=>({lang:window.caseInfo.lang})}};
cache['react-native-safe-area-context']={exports:{useSafeAreaInsets:()=>({top:0,bottom:0})}};
cache['@react-navigation/native']={exports:{useNavigation:()=>({goBack:()=>window.nav.push(['back']),replace:(...x)=>window.nav.push(x)}),useRoute:()=>({params:{themeId:Number(window.caseInfo.id),title:data[window.caseInfo.lang].titles[window.caseInfo.id]}})}};
const resolveImage=async image=>({uri:images[image.sha256]});
cache['../grammarGuide']={exports:{useGrammarGuide:()=>data[window.caseInfo.lang].guides,useGrammarGuideImageResolver:()=>resolveImage}};
const ui=require('reader'),policy=require('../grammarReading'),root=require('react-dom/client').createRoot(document.getElementById('root'));
window.renderCase=async (c,kind='screen')=>{window.caseInfo=c;window.nav=[];let component;
if(kind==='all'){component=h(ui.LessonBlocks,{blocks:data[c.lang].guides[c.id].filter(b=>!b.beginnerIntroEnd),ss:(fontSize,lineHeight)=>({fontSize,lineHeight})});component=h('main',{style:{padding:24,maxWidth:760,margin:'auto'}},component)}
else component=h(ui.default,{key:JSON.stringify(c)});
require('react-dom').flushSync(()=>root.render(component));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));};
window.readingData=data;
window.renderCase(window.caseInfo);
`;
fs.writeFileSync(path.join(work, 'reader.js'), harness);
fs.writeFileSync(path.join(work, 'reader.html'), '<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,"Nirmala UI","Yu Gothic UI",sans-serif}#root{height:100vh;display:flex;flex-direction:column}button{background:none}</style><div id="root"></div><script src="reader.js"></script>');

(async () => {
  const {chromium} = require('C:/Users/jwpsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const results=[];
  try {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('file:///'+path.join(work,'reader.html').replaceAll('\\','/'));
    for(const lang of ['ja','en'])for(const [width,height,scale] of [[320,568,1],[390,844,1],[320,568,1.4],[844,390,1],[1024,768,1.4]]) {
      await page.setViewportSize({width,height});
      for(const id of Object.keys(data[lang].guides)) {
        const c={lang,id,scale};
        await page.evaluate(c=>window.renderCase(c,'all'),c);
        const overflow=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(x=>x.clientWidth>0 && x.scrollWidth>x.clientWidth+2).length);
        assert.equal(overflow,0,JSON.stringify(c)+' full lesson overflow');
        await page.evaluate(c=>window.renderCase(c),c);
        const layout=await page.evaluate(()=>({scrollHeight:document.querySelector('[data-scroll]').clientHeight,buttons:[...document.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth}));
        assert(!layout.overflow);assert(layout.scrollHeight>=100,JSON.stringify(c)+' reading area');assert(layout.buttons.every(n=>n>=44),JSON.stringify(c)+' touch area');
        results.push({...c,width,height,allContentFits:true,...layout});
      }
    }
    // Exercise every reference/example disclosure for all72 lessons.
    await page.setViewportSize({width:390,height:844});
    let opened=0;
    for(const lang of ['ja','en']) for(const id of Object.keys(data[lang].guides)) {
      await page.evaluate(c=>window.renderCase(c),{lang,id,scale:1});
      for(const key of ['reference','examples','breaks']) {
        const label=policy.readingCopy(lang)[key];const tab=page.getByRole('tab').filter({hasText:label});if(!await tab.count())continue;
        await tab.click();assert.equal(await page.locator('[data-scroll]').evaluate(x=>x.scrollTop),0);
        const toggles=page.locator('button[aria-expanded]');
        for(let i=0;i<await toggles.count();i++) {await toggles.nth(i).click();assert.equal(await toggles.nth(i).getAttribute('aria-expanded'),'true');await toggles.nth(i).click();assert.equal(await toggles.nth(i).getAttribute('aria-expanded'),'false');opened++;}
      }
      await page.getByRole('button',{name:policy.readingCopy(lang).practice+' →',exact:true}).click();
      assert.deepEqual(await page.evaluate(()=>window.nav.at(-1)),['Practice',{themeId:Number(id),mode:'grammar'}]);
      await page.getByRole('button',{name:policy.readingCopy(lang).close,exact:true}).click();
      assert.deepEqual(await page.evaluate(()=>window.nav.at(-1)),['back']);
    }
    const shots=[['ja','1','rules'],['ja','6','reference'],['ja','2','examples'],['en','5','reference']];
    fs.mkdirSync(path.join(ROOT,'docs/previews'),{recursive:true});
    for(const [lang,id,part] of shots){await page.evaluate(c=>window.renderCase(c),{lang,id,scale:1});if(part!=='rules')await page.getByRole('tab').filter({hasText:policy.readingCopy(lang)[part]}).click();if(part==='examples')await page.locator('button[aria-expanded]').first().click();await page.screenshot({path:path.join(ROOT,`docs/previews/nepali-reader-2.1.10-${lang}-${id}.png`)});}
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(work,'results.json'),JSON.stringify({review,layouts:results.length,allContentPreserved:true,accordionToggles:opened,practiceAndCloseRoutes:72,browserErrors:errors,nativeDeviceVerified:false},null,2));
    console.log('PASS',results.length,'full lesson + reader layouts;',opened,'disclosures; all72 contents preserved; practice/close routes; no browser errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
