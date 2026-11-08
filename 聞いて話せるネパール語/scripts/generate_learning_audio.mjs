// Same Azure voice, rate and format as _regen_colored_appa.mjs. No keys are logged.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
async function persistJson(file,value){
  if(fs.existsSync(file)&&JSON.stringify(read(file))===JSON.stringify(value))return;
  const temp=file+'.next-'+process.pid;
  fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n');
  for(let attempt=0;;attempt++){
    try{fs.renameSync(temp,file);return;}
    catch(error){if(attempt>=9)throw error;await new Promise(r=>setTimeout(r,100*(attempt+1)));}
  }
}
const env={};
for(const p of [path.join(app,'../聞いて話せる日本語/.env'),path.join(app,'.env')])if(fs.existsSync(p))for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const key=env.AZURE_SPEECH_KEY,region=env.AZURE_SPEECH_REGION;
if(!key||!region)throw Error('Azure speech configuration is missing.');
const file=path.join(app,'文法教材/beginner_learning_path.json'),paths=read(file);
const grammarFile=path.join(app,'文法教材/grammar_practice.json'),lettersFile=path.join(app,'文法教材/letters_sounds.json');
const grammar=fs.existsSync(grammarFile)?read(grammarFile):null,letters=fs.existsSync(lettersFile)?read(lettersFile):null;
const letterSamples=p=>[...p.sections.flatMap(s=>s.samples),...p.combinations.flatMap(r=>r.samples)].flatMap(s=>[s,...(s.examples??[])]).filter(s=>s.audio);
const manifestFile=path.join(app,'文法教材/learning_audio_manifest.json');
const manifest=fs.existsSync(manifestFile)?read(manifestFile):{};
const pronunciationSourceFile=path.join(app,'文法教材/letter_audio_sources.json');
const pronunciationSources=fs.existsSync(pronunciationSourceFile)?read(pronunciationSourceFile):{};
const dir=path.join(app,'expo-app/assets/learning-audio');fs.mkdirSync(dir,{recursive:true});
const samples=[...paths.ja.intro.flatMap(b=>b.samples??[]),...Object.values(paths.ja.exercises),...Object.values(grammar?.ja.exercises??{}),...(letters?letterSamples(letters.ja):[])];
const texts=[...new Set(samples.map(s=>s.speech??s.ne))],esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
console.log(JSON.stringify({requestedClips:texts.length,newCharacters:texts.filter(t=>!manifest[t]).reduce((n,t)=>n+t.length,0)}));
for(const text of texts){
  const prior=manifest[text],priorFile=prior&&path.join(dir,`learning-${prior.sha256}.mp3`);
  if(priorFile&&fs.existsSync(priorFile)&&crypto.createHash('sha256').update(fs.readFileSync(priorFile)).digest('hex')===prior.sha256)continue;
  const reviewed=pronunciationSources[text];
  if(reviewed?.userApprovedWholeClip){
    const source=path.join(app,'文法教材',reviewed.source),bytes=fs.readFileSync(source);
    const sha=crypto.createHash('sha256').update(bytes).digest('hex');
    if(sha!==reviewed.sha256||sha!==prior?.sha256||bytes.length!==prior.bytes)throw Error('Reviewed pronunciation source mismatch: '+text);
    fs.writeFileSync(priorFile,bytes);continue;
  }
  let bytes;
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3','User-Agent':'safa-tts'},body:`<speak version="1.0" xml:lang="ne-NP"><voice name="ne-NP-HemkalaNeural"><prosody rate="0%">${esc(text)}</prosody></voice></speak>`});
    if(response.status===429&&attempt<2){await new Promise(r=>setTimeout(r,2000));continue;}
    if(!response.ok)throw Error('Speech synthesis HTTP '+response.status);
    bytes=Buffer.from(await response.arrayBuffer());break;
  }
  if(!bytes||bytes.length<500)throw Error('Empty speech output');
  const sha256=crypto.createHash('sha256').update(bytes).digest('hex'),name=`learning-${sha256}.mp3`;
  fs.writeFileSync(path.join(dir,name),bytes);
  // Release assets are limited to 1,000 per release. Stable hash buckets leave
  // room for future lesson revisions; existing immutable URLs are preserved.
  manifest[text]={url:`https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-learning-${sha256[0]}/`+name,sha256,bytes:bytes.length};
  await persistJson(manifestFile,manifest);
  if(texts.indexOf(text)%20===0)console.log('Recorded '+(texts.indexOf(text)+1)+' / '+texts.length);
}
for(const p of Object.values(paths))for(const s of [...p.intro.flatMap(b=>b.samples??[]),...Object.values(p.exercises)])s.audio=manifest[s.ne];
await persistJson(file,paths);
if(grammar){for(const p of Object.values(grammar))for(const s of Object.values(p.exercises))s.audio=manifest[s.ne];await persistJson(grammarFile,grammar);}
if(letters){for(const p of Object.values(letters))for(const s of letterSamples(p))s.audio=manifest[s.speech??s.ne];await persistJson(lettersFile,letters);}
fs.writeFileSync(path.join(app,'expo-app/src/introAudio.ts'),'// Generated from learning_audio_manifest.json. Immutable recordings.\nexport const INTRO_AUDIO: Record<string, number> = {\n'+texts.map(t=>`  '${manifest[t].sha256}': require('../assets/learning-audio/learning-${manifest[t].sha256}.mp3'),`).join('\n')+'\n};\n');
await persistJson(manifestFile,Object.fromEntries(texts.map(t=>[t,manifest[t]])));
console.log(JSON.stringify({clips:texts.length,bytes:texts.reduce((n,t)=>n+manifest[t].bytes,0),voice:'ne-NP-HemkalaNeural',rate:'0%'}));
