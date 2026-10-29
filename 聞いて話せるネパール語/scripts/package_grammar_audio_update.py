"""Package a data-only audio update for the existing 2.1.4 reader.

No app source/version change and no iOS/Android build. Payload asset names are
immutable; catalog.json is the only mutable release pointer, uploaded last.
"""
from pathlib import Path
from zipfile import ZipFile,ZIP_STORED
import argparse,json,hashlib,shutil

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'聞いて話せるネパール語'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--previous-dir',type=Path,required=True);ap.add_argument('--base-audio-dir',type=Path,required=True);ap.add_argument('--payload-dir',type=Path,default=ROOT/'.work-grammar-redesign/release');ap.add_argument('--output-dir',type=Path,required=True);a=ap.parse_args()
 old=read(a.previous_dir/'catalog.json');cat=read(a.payload_dir/'catalog.json');core=read(a.payload_dir/'core.json');ledger=read(APP/'文法教材/grammar_recordings_v3.json')['recordings'];revision=core['curriculumRevision']
 assert revision>old['core']['version']
 assert all(ref is not None for ref in core['grammarAudioRefs'].values()),'Unrecorded exercises remain'
 a.output_dir.mkdir(parents=True,exist_ok=True)
 prefix='https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-v3/'
 checked={};asset_files={}
 for lang,zipname in [('ne','audio-core.zip'),('ja','audio-ja.zip'),('en','audio-en.zip')]:
  oldentry=old['core'] if lang=='ne' else next(p for p in old['packs'] if p['l1']==lang)
  entry=cat['core'] if lang=='ne' else next(p for p in cat['packs'] if p['l1']==lang)
  current=APP/'dist-packs'/zipname;base=a.base_audio_dir/zipname
  with ZipFile(base) as previous,ZipFile(current) as updated:
   old_names=set(previous.namelist());new_names=set(updated.namelist());assert old_names<=new_names
   for name in old_names:assert previous.read(name)==updated.read(name),f'Existing recording changed: {lang}/{name}'
   added=new_names-old_names
   assert added=={f'{id}.mp3' for id in ledger},(lang,len(added))
   assert all(x.compress_type==ZIP_STORED for x in updated.infolist())
   assert updated.testzip() is None
   for ref in core['grammarAudioRefs'].values():assert f'{ref}.mp3' in new_names,(lang,ref)
   checked[lang]={'unchangedFiles':len(old_names),'addedFiles':len(added),'totalFiles':len(new_names),'archiveSHA256':sha(current)}
  version=int(oldentry['audioVersion'])+1;name=zipname.replace('.zip',f'-{version}.zip');target=a.output_dir/name;shutil.copyfile(current,target)
  entry.update(audioVersion=version,audioZip=prefix+name,audioZipBytes=target.stat().st_size)
  for key in ['deltaZip','deltaZipBytes','deltaBaseVersion']:entry.pop(key,None)
  asset_files[name]=sha(target)
 for name in ['core.json','overlay-ja.json','overlay-en.json']:
  payload=read(a.payload_dir/name);assert payload.get('curriculumRevision')==revision
  versioned=name.replace('.json',f'-{revision}.json');target=a.output_dir/versioned;shutil.copyfile(a.payload_dir/name,target);asset_files[versioned]=sha(target)
  if name=='core.json':assert cat['core']['url']==prefix+versioned
  else:
   lang=payload['l1'];entry=next(p for p in cat['packs'] if p['l1']==lang);assert entry['url']==prefix+versioned;entry['sizeBytes']=target.stat().st_size
 write(a.payload_dir/'catalog.json',cat);write(a.output_dir/'catalog.json',cat);write(APP/'文法教材/grammar_pack_v3_catalog.json',cat)
 result={'appVersion':'2.1.4','appRebuilt':False,'packVersion':revision,'recordedExercises':len(core['grammarAudioRefs']),'newExamples':len(ledger),'generatedAudioFiles':len(ledger)*3,'languages':['ne','ja','en'],'audioArchives':checked,'immutableAssets':asset_files,'catalogSHA256':sha(a.output_dir/'catalog.json')}
 write(APP/'文法教材/音声追加_検証結果.json',result)
 print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
