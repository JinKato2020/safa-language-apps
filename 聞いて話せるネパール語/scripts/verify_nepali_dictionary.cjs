// Real search and real bilingual payload: coverage, meanings, inflections, OTA and audio.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),app=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
function load(p){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name.startsWith('.')?load(path.resolve(path.dirname(p),name+'.ts')):require(name),m,m.exports);return m.exports;}
const search=load(path.join(root,'packages/shared/src/nepaliDictionary.ts'));
const model=load(path.join(app,'expo-app/src/content/otaModel.ts'));
const dictionary=read(path.join(app,'文法教材/nepali_dictionary.json')),core=read(path.join(app,'expo-app/data/ota-baseline/core.json'));
const entries=dictionary.entries,index=search.indexDictionary(entries),find=q=>search.searchDictionary(index,q),entry=ne=>entries.find(e=>e.ne===ne);
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
assert.equal(new Set(entries.map(e=>e.ne)).size,entries.length);
const sources=entries.flatMap(e=>e.sources), originalSources=sources.filter(s=>/^\d+:\d+$/.test(s));
assert.equal(originalSources.length,dictionary.sourceRowCount);assert.equal(new Set(sources).size,sources.length);
assert(entries.length>=1900,'Basic vocabulary roughly doubles the original dictionary');
for(const e of entries)for(const s of e.sources)assert(/^\d+:\d+$/.test(s)||s===`${s.split(':')[0]}:dictionary:${e.id}`);
for(const s of sources)assert(core.wordsNe[s.split(':')[0]],s);
for(const[cat,rows]of Object.entries(core.wordsNe))rows.forEach((_,i)=>assert(sources.includes(`${cat}:${i+1}`)));
for(const e of entries){
  assert(find(e.ne).some(v=>v.id===e.id));assert(find(e.roman).some(v=>v.id===e.id));
  for(const f of e.forms)assert(find(f).some(v=>v.id===e.id),`${f} → ${e.ne}`);
  assert(e.senses.every(s=>search.dictionaryPos[s.pos]));
  const bytes=fs.readFileSync(path.join(app,`expo-app/assets/learning-audio/learning-${e.audio.sha256}.mp3`));
  assert.equal(bytes.length,e.audio.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),e.audio.sha256);
}
for(const[q,ne]of Object.entries({'ghar':'घर','ＧＨＡＲ':'घर','家':'घर','house':'घर','गर्छु':'गर्नु','garchhu':'गर्नु','garchu':'गर्नु','chhu':'हुनु','hunchha':'हुनु','छु':'हुनु','पर्‍यो':'पर्नु','पर्यो':'पर्नु','राम्री':'राम्रो','tapain':'तपाईं','tapaaiin':'तपाईं','sanga':'सँग','thaha paaunu':'थाहा पाउनु'}))assert.equal(find(q)[0]?.ne,ne,q);
assert.notEqual(search.dictionaryKey('मा'),search.dictionaryKey('म'));assert.notEqual(search.dictionaryKey('पानी'),search.dictionaryKey('पनि'));
assert.equal(find('zzzz-no-match').length,0);
const family=search.searchDictionary(index,'',11);
for(const ne of ['मामा','माइजू','फुपू','दाइ'])assert(family.some(e=>e.ne===ne),ne);
assert(!family.some(e=>e.ne==='मर्नु'));
for(const[q,ne]of Object.entries({'死ぬ':'मर्नु','殺す':'मार्नु','捨てる':'फाल्नु','मर्‍यो':'मर्नु','मार्‍यो':'मार्नु','चाहिन्छ':'चाहिनु','savaa':'सवा','मन्जन':'मञ्जन'}))assert.equal(find(q)[0]?.ne,ne,q);
assert(entry('फाल्नु').senses.some(s=>s.ja.includes('捨てる')));
assert(entry('छ').senses.some(s=>s.en==='six'));assert(entry('सत्र').senses.some(s=>s.en==='seventeen'));
for(const[e,bad]of [['जानु','持ち帰り'],['भतिज','いとこ'],['सिलाई','仕立て屋'],['स्मरण','命日'],['कलगी','ガチョウ'],['मिठो खाना','デザート'],['खैरो','灰色']])assert(!entry(e).senses.some(s=>s.ja.includes(bad)),e);
assert(entry('बस्नु').senses.length===2);assert(entry('पानी').senses.length===2);assert(entry('को').senses.length===2);
assert(entry('पर्नु').note.ja.includes('जानुपर्छ'));assert(entry('थाहा पाउनु').note.en.includes('change'));
for(const lang of ['ja','en']){
  const overlay=read(path.join(app,`expo-app/data/overlays/${lang}.json`));assert.deepEqual(overlay.nepaliDictionary,dictionary);model.validateContent(core,overlay,lang);
  const old={...overlay};delete old.nepaliDictionary;model.validateContent(core,old,lang);
  for(const mutate of [d=>d.entries.push(d.entries[0]),d=>delete d.entries[0].audio,d=>d.entries[0].senses[0].en='',d=>d.entries[0].themes.push(999),d=>d.entries[0].audio.sha256='broken']){
    const invalid=structuredClone(overlay);mutate(invalid.nepaliDictionary);assert.throws(()=>model.validateContent(core,invalid,lang));
  }
}
console.log(`PASS ${entries.length} entries / all 1,000 source rows; JA/EN meanings; every reading and form searchable; ranking, nasal aliases, filters, audio hashes and OTA rejection/fallback.`);
