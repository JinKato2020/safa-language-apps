// Render the actual native lesson Block component with DOM adapters for visual QA.
// This is a browser preview, not a claim of native device verification.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const ROOT=path.resolve(__dirname,'../..'),work=path.resolve(process.argv[2]||'.work-color');
function compile(source,customRequire){
 const module={exports:{}};const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{console})(customRequire,module,module.exports);return module.exports;
}
const presentation=compile(fs.readFileSync(path.join(ROOT,'packages/shared/src/grammarPresentation.ts'),'utf8'),()=>{throw Error('Unexpected import')});
function luminance(hex){return hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [tone,p] of Object.entries(presentation.guidePalettes)){
 assert(contrast(p.ink,p.soft)>=4.5,tone+' body contrast');assert(contrast(p.accent,p.soft)>=4.5,tone+' emphasis contrast');assert(contrast('#ffffff',p.accent)>=4.5,tone+' badge contrast');
}
assert.equal(presentation.guidePalette('__proto__'),undefined);assert.equal(presentation.guidePalette('unknown'),undefined);
assert.equal(presentation.guideStep('**3**  Complete this').number,'3');assert.equal(presentation.guideStep('ordinary text'),null);
function flatten(style){return Object.assign({},...(Array.isArray(style)?style.flat(Infinity):[style]).filter(Boolean))}
function css(style,isView){
 const s=flatten(style),out=isView?{display:'flex',flexDirection:'column',borderStyle:'solid',borderWidth:0}:{};
 for(const [key,value] of Object.entries(s)){
  if(key==='paddingHorizontal'){out.paddingLeft=value;out.paddingRight=value}
  else if(key==='paddingVertical'){out.paddingTop=value;out.paddingBottom=value}
  else if(key==='marginHorizontal'){out.marginLeft=value;out.marginRight=value}
  else if(key==='marginVertical'){out.marginTop=value;out.marginBottom=value}
  else if(key==='lineHeight')out.lineHeight=value+'px';
  else out[key]=value;
 }
 if(!isView&&s.fontSize){out.display='block';out.whiteSpace='pre-wrap';out.overflowWrap='anywhere'}
 return out;
}
const View=props=>React.createElement('div',{style:css(props.style,true)},props.children);
const Text=props=>React.createElement('span',{style:css(props.style,false)},props.children);
const theme=compile(fs.readFileSync(path.join(ROOT,'packages/shared/src/theme.ts'),'utf8'),()=>{throw Error('Unexpected theme import')});
const file=path.join(ROOT,'packages/shared/src/screens/GrammarGuideScreen.tsx');
const ui=compile(fs.readFileSync(file,'utf8')+'\nexport { Block };',name=>{
 if(name==='react')return React;if(name==='react/jsx-runtime')return require('react/jsx-runtime');
 if(name==='react-native')return{View,ScrollView:View,Pressable:View,StyleSheet:{create:x=>x}};
 if(name==='../Text')return{Text};if(name==='../theme')return theme;if(name==='../grammarPresentation')return presentation;
 if(['react-native-safe-area-context','@react-navigation/native','../SettingsContext','../grammarGuide'].includes(name))return{};
 throw Error(name);
});
const ss=scale=>(fontSize,lineHeight)=>({fontSize:fontSize*scale,...(lineHeight?{lineHeight:lineHeight*scale}:{})});
const render=(b,scale=1)=>renderToStaticMarkup(React.createElement(ui.Block,{b,ss:ss(scale)}));
for(const b of [{type:'p',text:'**plain** body'},{type:'h',text:'Heading'},{type:'goal',text:'Goal'},{type:'table',headers:['A'],rows:[['B']]}]){
 assert.equal(render(b),render({...b,presentation:{tone:'invalid'}}),'Unknown tones retain legacy UI');
}
const cat=JSON.parse(fs.readFileSync(path.join(work,'publish/catalog.json'),'utf8'));
const data={};let blocks=0;
for(const lang of ['ja','en']){
 const entry=cat.packs.find(x=>x.l1===lang);data[lang]=JSON.parse(fs.readFileSync(path.join(work,'publish',entry.url.split('/').pop()),'utf8'));
 for(const list of Object.values(data[lang].grammarGuide)){
  for(const b of list){
   if(b.beginnerIntroEnd)continue;
   assert(presentation.guidePalette(b.presentation?.tone),'Missing semantic palette');assert.notEqual(b.type,'note');
   if(b.presentation?.role==='step'){const html=render(b);assert(html.includes('border-radius:14px'));assert(!html.includes('**'));}
   blocks++;
  }
  const intro=list.slice(0,list.findIndex(b=>b.beginnerIntroEnd));const html=intro.map(b=>render(b)).join('');
  for(const tone of ['blue','green','violet','rose','teal'])assert(html.includes(presentation.guidePalettes[tone].soft),tone);
  assert(!html.includes('⚠'));assert(!html.includes('#fff8e1'));assert(!html.includes('**'));
 }
}
const samples=[['ja','1',390,1],['ja','5',320,1.4],['en','29',390,1]];
const pages=samples.map(([lang,id,width,scale])=>{
 const all=data[lang].grammarGuide[id];const end=all.findIndex(b=>b.beginnerIntroEnd);
 return `<section style="width:${width}px"><header>${lang.toUpperCase()} · ${id} · ${width}px · ${scale}×</header><main>${all.slice(0,end).map(b=>render(b,scale)).join('')}</main></section>`;
});
const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#eef2f6;display:flex;gap:16px;align-items:flex-start;font-family:Arial,'Nirmala UI','Yu Gothic UI',sans-serif}section{flex:none;background:white;min-height:1500px}header{background:#fff;border-bottom:1px solid #e4e4e7;padding:16px;font-weight:700}main{padding:24px}</style>${pages.join('')}`;
fs.writeFileSync(path.join(work,'preview.html'),html);
console.log('PASS 5 palette contrasts >=4.5:1, numbered badges, uncolored/invalid metadata fallback, all72 semantic lesson layouts:',blocks,'blocks');
console.log('Preview uses actual TSX Block with DOM adapters at390px and320px/1.4x font.');
