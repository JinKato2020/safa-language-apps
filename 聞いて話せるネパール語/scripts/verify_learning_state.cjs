const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function compile(file,req=require){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext('(function(require,module,exports){'+js+'})',{console,Date,Promise})(req,m,m.exports);return m.exports;}
const policy=compile('packages/shared/src/learning.ts');
const core=JSON.parse(fs.readFileSync(path.join(root,'聞いて話せるネパール語/expo-app/data/ota-baseline/core.json')));
const overlays=Object.fromEntries(['ja','en'].map(l=>[l,JSON.parse(fs.readFileSync(path.join(root,`聞いて話せるネパール語/expo-app/data/overlays/${l}.json`)))]));
const compose=compile('聞いて話せるネパール語/expo-app/src/pack/compose.ts').composePack;
const ne={...core,nepaliAudio:{},nepaliGrammarAudio:{}};
const data=compose(ne,{...overlays.ja,nativeLang:'ja'},{version:'test'});
const m=overlays.ja.learningPath.steps[0].items[0],now=1000000,day=86400000,key=policy.studyKey(m);
(async()=>{
// Home activity is assessed practice, not app visits. Repeats count once per local day.
const local=(y,m,d,h=12)=>new Date(y,m-1,d,h).getTime();
let activity=policy.emptyStudyState();assert.equal(policy.studyActivity(activity,local(2026,11,7)).totalDays,0);
activity=policy.rateStudy(activity,m,'again',local(2026,11,5));
activity=policy.rateStudy(activity,m,'known',local(2026,11,5,14));assert.equal(activity.activity['2026-11-05'].length,1);
activity=policy.rateStudy(activity,m,'known',local(2026,11,6));
assert.equal(policy.studyActivity(activity,local(2026,11,7)).streak,2,'yesterday streak remains available today');
assert.equal(policy.studyActivity(activity,local(2026,11,8)).streak,0,'missed day breaks streak');
activity=policy.rateStudy(activity,m,'known',local(2026,11,7));
assert.equal(policy.studyActivity(activity,local(2026,11,7)).streak,3);
assert.equal(policy.studyActivity(policy.decodeStudy(JSON.stringify(activity)),local(2026,11,7)).totalDays,3,'repeat assessments preserve previous dates');
const legacy=JSON.parse(JSON.stringify(activity));delete legacy.activity;
assert.equal(policy.studyActivity(policy.decodeStudy(JSON.stringify(legacy)),local(2026,11,7)).totalDays,1,'migration uses only confirmed latest dates');
let dst=policy.emptyStudyState();for(const day of [7,8,9])dst=policy.rateStudy(dst,m,'known',local(2026,3,day));
assert.equal(policy.studyActivity(dst,local(2026,3,9)).streak,3,'local calendar streak crosses daylight-saving boundary');
assert.equal(policy.studyActivity(dst,local(2026,3,9)).week.length,7);
let state=policy.emptyStudyState();state=policy.rateStudy(state,m,'again',now);assert.equal(policy.reviewItems(state,data,now).length,1);
state=policy.rateStudy(state,m,'known',now);assert.equal(policy.reviewItems(state,data,now).length,0);assert.equal(state.ratings[key].due,now+day);
state=policy.rateStudy(state,m,'known',now+10);assert.equal(state.ratings[key].streak,1);assert.equal(state.ratings[key].due,now+day,'same-day repetition cannot skip the schedule');
state=policy.rateStudy(state,m,'known',now+day);assert.equal(state.ratings[key].due,now+4*day);
state=policy.rateStudy(state,m,'known',now+4*day);assert.equal(state.ratings[key].due,now+11*day);
state=policy.rateStudy(state,m,'again',now+5*day);assert.equal(state.ratings[key].streak,0);
state.ratings[key].item={...m,ne:'changed'};assert.equal(policy.reviewItems(state,data,now+6*day).length,0,'changed content invalidates old confidence');
for(const lang of ['ja','en'])for(const step of overlays[lang].learningPath.steps){assert.equal(step.items.length,5);assert(step.items.every(r=>policy.resolveStudy(data,r)));assert.equal(new Set(step.items.map(policy.studyKey)).size,5);}
assert.equal(JSON.stringify(overlays.ja.learningPath.steps.map(s=>s.items)),JSON.stringify(overlays.en.learningPath.steps.map(s=>s.items)));
let disk=null,fail=false,seen;const storage={getItem:async()=>disk,setItem:async(k,v)=>{if(fail)throw Error('disk full');disk=v;}};
const store=policy.createStudyStore(storage,'x',s=>seen=s);await store.load();
const items=overlays.ja.learningPath.steps[0].items;
await Promise.all(items.map(item=>store.change(s=>policy.rateStudy(s,item,'again',now))));assert.equal(Object.keys(seen.ratings).length,5,'concurrent writes retain all marks');
const before=disk;fail=true;await assert.rejects(store.change(s=>({...s,introRead:true})));assert.equal(disk,before);assert.equal(seen.introRead,false,'failed persistence must not claim success');
fail=false;await store.change(s=>({...s,introRead:true,resume:{item:m,session:{kind:'course',items,stepId:'identity',position:2,answered:items.slice(0,2).map(policy.studyKey)}}}));
let restarted;await policy.createStudyStore(storage,'x',s=>restarted=s).load();assert.equal(restarted.resume.session.position,2);assert.equal(restarted.resume.session.answered.length,2);assert.equal(restarted.introRead,true);
assert.throws(()=>policy.decodeStudy('{broken'));
let badWrites=0;const bad=policy.createStudyStore({getItem:async()=>{throw Error('read failed')},setItem:async()=>badWrites++},'x',()=>{});await assert.rejects(bad.load());await assert.rejects(bad.change(s=>s));assert.equal(badWrites,0);
const {StackRouter,TabRouter,CommonActions,StackActions}=require('@react-navigation/routers');
const source=fs.readFileSync(path.join(root,'packages/shared/src/AppShell.tsx'),'utf8');
const names=[...source.matchAll(/<RootStack\.Screen\s+name="([^"]+)"/g)].map(m=>m[1]);const opts={routeNames:names,routeParamList:{},routeGetIdList:{}};
const router=StackRouter({initialRouteName:'MainTabs'});
for(const step of overlays.ja.learningPath.steps){let s=router.getInitialState(opts);s=router.getStateForAction(s,CommonActions.navigate('LearningPath'),opts);assert(s);
const session={kind:'course',items:step.items,stepId:step.id};
if(step.guideThemeId){s=router.getStateForAction(s,CommonActions.navigate('GrammarGuide',{themeId:step.guideThemeId,title:'test',studySession:session}),opts);s=router.getStateForAction(s,{...StackActions.replace('Practice',policy.practiceParams(step.items[0],session)),source:s.routes[s.index].key,target:s.key},opts);}
else s=router.getStateForAction(s,CommonActions.navigate('Practice',policy.practiceParams(step.items[0],session)),opts);
assert(s);assert.equal(s.routes.at(-1).name,'Practice');assert.equal(s.routes.at(-1).params.studySession.stepId,step.id);s=router.getStateForAction(s,CommonActions.goBack(),opts);assert.equal(s.routes.at(-1).name,'LearningPath');}
let settings=router.getStateForAction(router.getInitialState(opts),CommonActions.navigate('SettingsMain'),opts);assert(settings);assert.equal(settings.routes.at(-1).name,'SettingsMain');
const tab=TabRouter({initialRouteName:'HomeTab'}),tabOpts={routeNames:['HomeTab','GrammarTab','ConversationTab','ListeningTab','VocabularyTab'],routeParamList:{},routeGetIdList:{}};
for(const name of tabOpts.routeNames){const s=tab.getStateForAction(tab.getInitialState(tabOpts),CommonActions.navigate(name),tabOpts);assert(s);assert.equal(s.routes[s.index].name,name);}
console.log('PASS learning schedules, failed read/write recovery, serialized marks, restart/resume, content invalidation, JA/EN35 course items, actual course/home/settings routers.');
})().catch(e=>{console.error(e);process.exitCode=1;});
