// Same Azure voice, rate and format as _regen_colored_appa.mjs. No keys are logged.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const env={};
for(const p of [path.join(app,'../聞いて話せる日本語/.env'),path.join(app,'.env')])if(fs.existsSync(p))for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const key=env.AZURE_SPEECH_KEY,region=env.AZURE_SPEECH_REGION;
if(!key||!region)throw Error('Azure speech configuration is missing.');
const file=path.join(app,'文法教材/beginner_learning_path.json'),paths=read(file);
const manifestFile=path.join(app,'文法教材/learning_audio_manifest.json');
const manifest=fs.existsSync(manifestFile)?read(manifestFile):{};
const dir=path.join(app,'expo-app/assets/learning-audio');fs.mkdirSync(dir,{recursive:true});
const samples=[...paths.ja.intro.flatMap(b=>b.samples??[]),...Object.values(paths.ja.exercises)];
const texts=[...new Set(samples.map(s=>s.ne))],esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
for(const text of texts){
  const prior=manifest[text],priorFile=prior&&path.join(dir,`learning-${prior.sha256}.mp3`);
  if(priorFile&&fs.existsSync(priorFile)&&crypto.createHash('sha256').update(fs.readFileSync(priorFile)).digest('hex')===prior.sha256)continue;
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
  manifest[text]={url:'https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-ota/'+name,sha256,bytes:bytes.length};
  fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  console.log('Recorded '+(texts.indexOf(text)+1)+' / '+texts.length);
}
for(const p of Object.values(paths))for(const s of [...p.intro.flatMap(b=>b.samples??[]),...Object.values(p.exercises)])s.audio=manifest[s.ne];
fs.writeFileSync(file,JSON.stringify(paths,null,2)+'\n');
fs.writeFileSync(path.join(app,'expo-app/src/introAudio.ts'),'// Generated from learning_audio_manifest.json. Immutable recordings.\nexport const INTRO_AUDIO: Record<string, number> = {\n'+texts.map(t=>`  '${manifest[t].sha256}': require('../assets/learning-audio/learning-${manifest[t].sha256}.mp3'),`).join('\n')+'\n};\n');
console.log(JSON.stringify({clips:texts.length,bytes:texts.reduce((n,t)=>n+manifest[t].bytes,0),voice:'ne-NP-HemkalaNeural',rate:'0%'}));
