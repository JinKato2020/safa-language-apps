// Use installed React Navigation routers and the REAL AppShell route registry.
// A mocked replace() call alone cannot prove that a target is reachable.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {StackRouter,TabRouter,StackActions,CommonActions}=require('@react-navigation/routers');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'packages/shared/src/AppShell.tsx'),'utf8');
const names=stack=>[...source.matchAll(new RegExp('<'+stack+'\\.Screen\\s+name="([^"]+)"','g'))].map(m=>m[1]);
const opts=routeNames=>({routeNames,routeParamList:{},routeGetIdList:{}});
function checkGuideAction(name,params) {
  const gram=StackRouter({initialRouteName:'Theme'}),tab=TabRouter({initialRouteName:'GrammarTab'}),router=StackRouter({initialRouteName:'MainTabs'});
  const options=opts(names('RootStack'));
  let tabs=tab.getInitialState(opts(['GrammarTab','ConversationTab','ListeningTab','VocabularyTab','SettingsTab']));
  tabs.routes[0].state=gram.getInitialState(opts(names('GramStack')));
  let state=router.getInitialState(options);state.routes[0].state=tabs;
  state=router.getStateForAction(state,CommonActions.navigate('GrammarGuide',{themeId:params.themeId,title:'Lesson'}),options);
  assert(state,'Opening guide');
  const action={...StackActions.replace(name,params),source:state.routes[state.index].key,target:state.key};
  // Exactly reproduces 2.1.10: a root REPLACE cannot search children for Practice.
  const legacyOptions=opts(names('RootStack').filter(n=>n!=='Practice'));
  const old={...state,routeNames:legacyOptions.routeNames};
  assert.equal(router.getStateForAction(old,action,legacyOptions),null,'Old registration reproduces unhandled action');
  const next=router.getStateForAction(state,action,options);
  assert(next,'Button must produce a handled transition in the real root router');
  assert.equal(next.routes[next.index].name,'Practice');assert.deepEqual(next.routes[next.index].params,params);
  assert.equal(next.routes.length,2,'No duplicate MainTabs or obsolete guide');
  assert.equal(next.routes[0].state,tabs,'Existing tab states preserved');
  const back=router.getStateForAction(next,CommonActions.goBack(),options);
  assert(back);assert.equal(back.routes[back.index].name,'MainTabs');assert.equal(back.routes[0].state.routes[0].state.routes[0].name,'Theme');
  return true;
}
module.exports={checkGuideAction};
if(require.main===module){
  assert(/<RootStack\.Screen\s+name="Practice"\s+component=\{PracticeScreen\}/.test(source),'Root must mount the actual practice screen');
  for(let themeId=1;themeId<=36;themeId++)checkGuideAction('Practice',{themeId,mode:'grammar'});
  console.log('PASS36 real-router guide → practice → grammar-list scenarios;2.1.10 unhandled action reproduced; tab state and back stack preserved.');
}
