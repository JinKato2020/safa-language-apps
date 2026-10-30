// Exercise the actual App A resolver with an in-memory device filesystem.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
const source=fs.readFileSync('聞いて話せるネパール語/expo-app/src/guideImageCache.ts','utf8');
function create({offline=false,status=200,empty=false}={}){
 const disk=new Map(),requests=[];const bundled='a'.repeat(64);
 const FS={documentDirectory:'file:///app/',getInfoAsync:async uri=>({exists:disk.has(uri),size:disk.get(uri)||0}),makeDirectoryAsync:async()=>{},
  downloadAsync:async(url,uri)=>{requests.push(url);if(offline)throw Error('offline');disk.set(uri,empty?0:100);return{status}},
  moveAsync:async({from,to})=>{disk.set(to,disk.get(from));disk.delete(from)},deleteAsync:async uri=>disk.delete(uri)};
 const module={exports:{}};const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${js}\n})`,{Map,Promise})(name=>name==='expo-file-system/legacy'?FS:name==='./cultureImages'?{CULTURE_IMAGES:{[bundled]:42}}:(()=>{throw Error(name)})(),module,module.exports);
 return{resolve:module.exports.resolveGuideImage,disk,requests,bundled};
}
const media=sha=>({id:'example',sha256:sha,uri:'https://example.test/image.jpg',width:960,height:640,alt:'Scene',caption:'AI-generated'});
(async()=>{
 let r=create({offline:true});assert.equal(await r.resolve(media(r.bundled)),42);assert.equal(r.requests.length,0);
 assert.equal(await r.resolve(media('invalid')),null);assert.equal(r.requests.length,0);
 const hash='b'.repeat(64);r=create();const both=await Promise.all([r.resolve(media(hash)),r.resolve(media(hash))]);
 assert.equal(r.requests.length,1);assert.equal(both[0].uri,both[1].uri);assert(![...r.disk.keys()].some(x=>x.endsWith('.part')));
 await r.resolve(media(hash));assert.equal(r.requests.length,1,'Cached image avoids download');
 const cached=create({offline:true});cached.disk.set(both[0].uri,100);assert.equal((await cached.resolve(media(hash))).uri,both[0].uri);assert.equal(cached.requests.length,0);
 r=create({status:403});assert.equal(await r.resolve(media(hash)),null);assert.equal(r.disk.size,0);await r.resolve(media(hash));assert.equal(r.requests.length,2,'Failure can retry');
 r=create({empty:true});assert.equal(await r.resolve(media(hash)),null);assert.equal(r.disk.size,0);
 r=create({offline:true});assert.equal(await r.resolve(media(hash)),null);assert.equal(r.disk.size,0);
 console.log('PASS image resolver: bundled offline, cached offline, deduplicated downloads, revision hash keys, failed/empty download cleanup and retry; no dependency added.');
})().catch(e=>{console.error(e);process.exitCode=1});
