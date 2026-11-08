// Tests execute the real policy, storage, provider and invitation hook modules.
// No store purchases, review requests or emails leave this harness.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const root='聞いて話せるネパール語/expo-app/src/';
let now=Date.UTC(2026,10,1,12);class Clock extends Date {constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
function compile(name,imports={},globals={}){
 const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(root+name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{Date:Clock,console,setTimeout,clearTimeout,...globals})(name=>{assert(name in imports,'Unexpected import '+name);return imports[name]},module,module.exports);return module.exports;
}
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function harness(){
 const slots=[],effects=[];let i=0;
 const hooks={useState:initial=>{const index=i++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],v=>slots[index]=typeof v==='function'?v(slots[index]):v]},
 useRef:initial=>{const index=i++;return slots[index]??(slots[index]={current:initial})},
 useCallback:(fn,deps)=>{const index=i++;if(!slots[index]||deps.some((d,n)=>d!==slots[index].deps[n]))slots[index]={fn,deps};return slots[index].fn},
 useEffect:(fn,deps)=>{const index=i++;if(!slots[index]||deps.some((d,n)=>d!==slots[index].deps[n])){slots[index]?.cleanup?.();slots[index]={deps};effects.push(()=>slots[index].cleanup=fn())}}};
 return{hooks,render:fn=>{i=0;const out=fn();while(effects.length)effects.shift()();return out},unmount:()=>slots.forEach(x=>x?.cleanup?.())};
}
const tick=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r))};
function storage(){const disk=new Map();return{disk,getItem:async k=>disk.get(k)??null,setItem:async(k,v)=>{disk.set(k,v)}}}
const policy=compile('launchAccessPolicy.ts');
const open={...policy.LAUNCH_CAMPAIGN,enrollmentOpen:true,closedAt:null};
const engagement=compile('engagementPolicy.ts');
const closed={...policy.LAUNCH_CAMPAIGN,enrollmentOpen:false,closedAt:'2026-12-01T00:00:00.000Z'};
const grant={campaign:policy.LAUNCH_CAMPAIGN.id,grantedAt:new Date(now).toISOString()};
function accessModule(config,{secureFail=false,localFail=false,secureValue=null,localValue=null}={}){
 const secure=storage(),local=storage();if(secureValue)secure.disk.set('appa.free-launch.lifetime.v1',secureValue);if(localValue)local.disk.set('appa.free-launch.lifetime.v1',localValue);
 const fail=async()=>{throw Error('storage unavailable')};
 const module=compile('launchAccess.ts',{'./launchAccessPolicy':{...policy,LAUNCH_CAMPAIGN:config},'@react-native-async-storage/async-storage':{default:localFail?{getItem:fail,setItem:fail}:local},'expo-secure-store':{AFTER_FIRST_UNLOCK:1,getItemAsync:secureFail?fail:secure.getItem,setItemAsync:secureFail?fail:secure.setItem}});
 return{...module,secure,local};
}
async function providerCase({config,localGrant=false,paid=false,date=null}){
 const h=harness();let customer={originalPurchaseDate:date,entitlements:{active:paid?{all_themes:{}}:{}}},listener;let purchases=0,restores=0;const saves=[];
 const sdk={configure:()=>{},getCustomerInfo:async()=>customer,getOfferings:async()=>({all:{},current:null}),addCustomerInfoUpdateListener:fn=>listener=fn,removeCustomerInfoUpdateListener:()=>{},purchasePackage:async()=>{purchases++;return{customerInfo:customer}},restorePurchases:async()=>{restores++;return customer}};
 const module=compile('PurchasesProvider.tsx',{'react':h.hooks,'react/jsx-runtime':jsx,'react-native':{Platform:{OS:'ios'},View:'View',ActivityIndicator:'Activity'},'expo-constants':{default:{expoConfig:{extra:{revenueCatApiKeyIos:'test-public-key'}}}},'react-native-purchases':{default:sdk},'@safa/shared':{EntitlementProvider:'Entitlement'},'./launchAccess':{loadLaunchAccess:async()=>localGrant||config.enrollmentOpen,saveLaunchGrant:async g=>saves.push(g)},'./launchAccessPolicy':{...policy,LAUNCH_CAMPAIGN:config}});
 const render=()=>h.render(()=>module.PurchasesProvider({children:null}));render();await tick();
 return{value:()=>render().props.value,info:info=>{customer=info;listener(info)},counts:()=>({purchases,restores}),saves,unmount:h.unmount};
}
function invitationCase(lang='ja',raw=null,environment='production'){
 const h=harness(),store=storage(),timers=new Map();let timerId=0,reviewCalls=0,mailCalls=[],urlCalls=[],appListener,available=environment!=='testflight';
 if(raw)store.disk.set('@nepali_app/engagement_v1',raw);
 const appState={currentState:'active',addEventListener:(_,fn)=>{appListener=fn;return{remove:()=>{}}}};
 const module=compile('useEngagement.tsx',{'react':h.hooks,'react/jsx-runtime':jsx,'react-native':{Alert:{alert:()=>{}},AppState:appState,Linking:{openURL:async u=>urlCalls.push(u)},Platform:{OS:'ios'},Pressable:'Button',Text:'Text',View:'View',StyleSheet:{create:s=>s}},'@react-native-async-storage/async-storage':{default:store},'expo-store-review':{isAvailableAsync:async()=>available,requestReview:async()=>reviewCalls++},'expo-mail-composer':{isAvailableAsync:async()=>true,composeAsync:async m=>{mailCalls.push(m);return{status:'cancelled'}}},'@safa/shared':{useI18n:()=>({lang}),useScaleStyle:()=>()=>({})},'../app.json':{default:{expo:{version:'2.1.7'}}},'./engagementPolicy':engagement},{__DEV__:environment==='development',setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)});
 const render=()=>h.render(()=>module.useEngagement());render();
 function buttons(node){if(!node)return[];if(Array.isArray(node))return node.flatMap(buttons);return(node.type==='Button'?[node]:[]).concat(buttons(node.props?.children))}
 return{render,route:async name=>{render().onRouteChanged(name);await tick()},runTimers:async()=>{for(const fn of [...timers.values()])fn();timers.clear();await tick()},reviewCount:()=>reviewCalls,mailCalls,urlCalls,store,available:v=>available=v,background:()=>{appState.currentState='background';appListener('background')},press:async index=>{const b=buttons(render().banner)[index];assert(b,'Missing button'+index);await b.props.onPress();await tick()},unmount:h.unmount};
}
(async()=>{
 if(!policy.LAUNCH_CAMPAIGN.enrollmentOpen)assert(Number.isFinite(Date.parse(policy.LAUNCH_CAMPAIGN.closedAt)),'Closing enrollment requires an acquisition cutoff');
 assert(policy.parseLaunchGrant(JSON.stringify(grant)));for(const raw of [null,'bad','{}',JSON.stringify({...grant,campaign:'other'})])assert.equal(policy.parseLaunchGrant(raw),null);
 assert(policy.eligibleOriginalDownload('2026-11-30T23:59:59Z',closed.closedAt));
 for(const date of [null,'bad','2013-08-01T00:00:00Z','2026-12-01T00:00:01Z'])assert(!policy.eligibleOriginalDownload(date,closed.closedAt));
 let a=accessModule(open);assert(await a.loadLaunchAccess());assert.equal(a.secure.disk.size,1);assert.equal(a.local.disk.size,1);
 a=accessModule(closed,{secureValue:JSON.stringify(grant)});assert(await a.loadLaunchAccess());assert.equal(a.local.disk.size,1,'Repair local copy from Keychain');
 a=accessModule(closed,{secureFail:true,localValue:JSON.stringify(grant)});assert(await a.loadLaunchAccess());
 a=accessModule(closed);assert.equal(await a.loadLaunchAccess(),false,'New users pay after campaign ends');
 a=accessModule(open,{secureFail:true,localFail:true});assert(await a.loadLaunchAccess(),'Storage failure must not close current free campaign');
 let p=await providerCase({config:open});assert(p.value().isPro);assert.equal(p.value().accessKind,'launch-free');await p.value().purchase();assert.equal(p.counts().purchases,0);p.info({originalPurchaseDate:null,entitlements:{active:{}}});assert(p.value().isPro);p.unmount();
 p=await providerCase({config:closed,localGrant:true});assert(p.value().isPro);p.unmount();
 p=await providerCase({config:closed,date:'2026-11-15T00:00:00Z'});assert(p.value().isPro);assert(p.saves.length);await p.value().restore();assert.equal(p.counts().restores,1);p.unmount();
 p=await providerCase({config:closed,date:'2027-01-01T00:00:00Z'});assert.equal(p.value().isPro,false);p.unmount();
 p=await providerCase({config:closed,paid:true});assert(p.value().isPro);assert.equal(p.value().accessKind,'purchase');p.unmount();
 const first=now,local=new Date(first),thirdDay=new Date(local.getFullYear(),local.getMonth(),local.getDate()+2).getTime();
 let s=engagement.readEngagement(null,now);assert(!engagement.inviteDue(s,thirdDay-1));assert(engagement.inviteDue(s,thirdDay),'First use is calendar day1, first eligibility is day3');
 const weekly={...s,lastInvite:thirdDay+60_000};assert(!engagement.inviteDue(weekly,weekly.lastInvite+engagement.INTERVAL-1));assert(engagement.inviteDue(weekly,weekly.lastInvite+engagement.INTERVAL),'Full168hours between invitations');
 const springFirst=new Date(2026,2,7,23,30).getTime(),springThird=new Date(2026,2,9,0,1).getTime();assert(engagement.inviteDue({...s,firstSeen:springFirst},springThird),'Day3 follows the local date even across DST');
 s={...s,disabled:true};assert(!engagement.inviteDue(s,now+99*engagement.DAY));assert(!engagement.canRequestReview(s,now));
 s={...s,disabled:false,reviewAttempts:[now,now-1,now-2]};assert(!engagement.canRequestReview(s,now));assert(engagement.canRequestReview(s,now+366*engagement.DAY));
 let i=invitationCase();await tick();await i.route('Theme');assert.equal(i.render().banner,null);
 now=thirdDay-engagement.DAY;await i.route('Practice');now+=31_000;await i.route('Theme');assert.equal(i.render().banner,null,'Day2 study is quiet');
 now=thirdDay;await i.route('Theme');await i.route('SettingsTab');await i.route('Theme');assert.equal(i.render().banner,null,'Day3 launch or settings alone never displays an invitation');
 await i.route('GrammarGuide');now+=10_000;await i.route('Theme');assert.equal(i.render().banner,null,'Brief page visit is not completed study');
 await i.route('GrammarGuide');now+=31_000;await i.route('Theme');assert(i.render().banner,'Day3 lesson return displays invitation');await i.runTimers();assert.equal(i.reviewCount(),1);assert.equal(i.mailCalls.length,0,'No automatic emails');
 const firstShown=now;await i.route('Practice');now+=31_000;await i.route('Level');await i.route('Theme');await i.runTimers();assert.equal(i.render().banner,null);assert.equal(i.reviewCount(),1,'No duplicate same-cycle reviews');
 now=firstShown+6*engagement.DAY;await i.route('Practice');now+=31_000;await i.route('Level');await i.route('Theme');assert.equal(i.render().banner,null,'Six days after invitation is still quiet');
 now=firstShown+engagement.INTERVAL;await i.route('Theme');assert.equal(i.render().banner,null,'Weekly date alone does not trigger');await i.route('Practice');now+=31_000;await i.route('Level');await i.route('Theme');assert(i.render().banner,'Conversation return through Level triggers weekly invitation');await i.runTimers();assert.equal(i.reviewCount(),2);
 await i.press(0);assert.equal(i.mailCalls.length,1);assert.equal(i.mailCalls[0].recipients[0],'contact@safa-lang.com');assert(i.mailCalls[0].subject.includes('リクエスト'));assert.equal(i.reviewCount(),2,'Email never triggers review');
 await i.press(2);now+=engagement.INTERVAL;await i.route('Practice');now+=31_000;await i.route('Theme');await i.runTimers();assert.equal(i.render().banner,null);assert.equal(i.reviewCount(),2,'Opt-out applies to both reminders');i.unmount();
 now=first+20*engagement.DAY;const saved=JSON.stringify({firstSeen:first,lastInvite:0,disabled:false,reviewAttempts:[]});i=invitationCase('en',saved);await tick();await i.route('Theme');assert.equal(i.render().banner,null,'Returning after a long absence does not trigger on launch');await i.route('GrammarGuide');now+=31_000;await i.route('Theme');await i.press(0);assert(i.mailCalls[0].subject.includes('request'));i.unmount();
 i=invitationCase('ja',saved);await tick();await i.route('Practice');now+=31_000;await i.route('Theme');i.background();await i.runTimers();assert.equal(i.reviewCount(),0,'No background review');i.unmount();
 i=invitationCase('ja',saved);await tick();await i.route('Practice');now+=31_000;await i.route('Theme');await i.route('Practice');await i.runTimers();assert.equal(i.reviewCount(),0,'New study screen cancels pending review');i.unmount();
 i=invitationCase('ja',saved);await tick();await i.route('Practice');now+=31_000;await i.route('Theme');i.available(false);await i.runTimers();assert.equal(i.reviewCount(),0,'TestFlight/unavailable is not forced into App Store');i.unmount();
 i=invitationCase('ja',saved);await tick();assert(i.render().developmentTools,'Tools supplied in every build; SettingsScreen requires the explicit seven-tap gesture');i.unmount();
 i=invitationCase('ja',saved,'testflight');await tick();await i.route('SettingsTab');const original=i.store.disk.get('@nepali_app/engagement_v1');
 assert(i.render().developmentTools,'TestFlight tools use the same hidden settings gate');assert.equal(await i.render().developmentTools.showReview(),'unavailable');assert.equal(i.reviewCount(),0);
 i.render().developmentTools.showRequest();assert(i.render().banner);await i.press(2);assert.equal(i.render().banner,null);assert.equal(i.store.disk.get('@nepali_app/engagement_v1'),original,'Preview opt-out does not alter real preferences');
 i.render().developmentTools.showRequest();await i.press(1);assert.equal(i.store.disk.get('@nepali_app/engagement_v1'),original,'Preview close does not reschedule invitations');
 i.render().developmentTools.showRequest();i.available(true);assert.equal(await i.render().developmentTools.showReview(),'requested');assert.equal(i.reviewCount(),1);assert.equal(i.store.disk.get('@nepali_app/engagement_v1'),original,'Manual test does not consume production review budget');i.unmount();
 i=invitationCase('en',saved,'development');await tick();assert(i.render().developmentTools,'Development build exposes tools even when native rating is available');assert.equal(await i.render().developmentTools.showReview(),'requested');assert.equal(i.reviewCount(),1);i.unmount();
 console.log('PASS launch access: enroll, persistence repair, offline/storage failure, campaign closed, receipt restore, paid access retained, no purchase during free access.');
 console.log('PASS engagement: calendar day3 then weekly after study only; launch/settings quiet; lessons and conversation via Level;30second minimum; annual review cap; opt-out; background/navigation cancellation; ja/en email drafts.');
 console.log('PASS settings triggers: shared hidden gate for all builds, native-unavailable result, immediate request preview, no timing/preference/review-budget mutations.');
})().catch(e=>{console.error(e);process.exitCode=1});
