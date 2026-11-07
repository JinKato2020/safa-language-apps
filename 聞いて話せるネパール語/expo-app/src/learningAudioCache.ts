import * as FileSystem from 'expo-file-system/legacy';
import type { LearningAudio, LearningAudioResolver } from '@safa/shared';
import { contentHash } from './content/otaModel';
import { INTRO_AUDIO } from './introAudio';

const pending = new Map<string, ReturnType<LearningAudioResolver>>();
async function readClip(audio: LearningAudio) {
  if (!/^[a-f0-9]{64}$/.test(audio.sha256) || !Number.isSafeInteger(audio.bytes) || audio.bytes < 1 || audio.bytes > 512000) return null;
  if (INTRO_AUDIO[audio.sha256]) return INTRO_AUDIO[audio.sha256];
  if (!/^https:\/\//.test(audio.url) || !FileSystem.documentDirectory) return null;
  const dir=FileSystem.documentDirectory+'intro-audio/', uri=dir+audio.sha256+'.mp3', temp=uri+'.part';
  async function valid(file: string) {
    const info=await FileSystem.getInfoAsync(file);
    if (!info.exists || info.size!==audio.bytes) return false;
    const raw=atob(await FileSystem.readAsStringAsync(file,{encoding:FileSystem.EncodingType.Base64}));
    const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return contentHash(bytes)===audio.sha256;
  }
  if(await valid(uri))return {uri};
  await FileSystem.makeDirectoryAsync(dir,{intermediates:true});
  try {
    const response=await FileSystem.downloadAsync(audio.url,temp);
    if(response.status!==200 || !await valid(temp))return null;
    await FileSystem.deleteAsync(uri,{idempotent:true});
    await FileSystem.moveAsync({from:temp,to:uri});return {uri};
  } finally { await FileSystem.deleteAsync(temp,{idempotent:true}).catch(()=>{}); }
}
export const resolveLearningAudio: LearningAudioResolver = audio => {
  const key=audio.sha256, current=pending.get(key);if(current)return current;
  const job=readClip(audio).catch(()=>null).finally(()=>pending.delete(key));pending.set(key,job);return job;
};
