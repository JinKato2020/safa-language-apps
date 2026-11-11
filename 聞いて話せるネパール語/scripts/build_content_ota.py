"""Build immutable, hashed content chunks. Publish manifest.json only after all assets."""
import argparse, hashlib, json, zipfile, shutil, urllib.request, urllib.error, re
from pathlib import Path
APP=Path(__file__).resolve().parents[1]
BASE='https://content.safa-lang.com/nepali/'

def assert_asset_name(name):
    assert re.fullmatch(r'(?:content-[a-f0-9]{64}\.json|audio-[a-z]+-(?:delta-)?[a-f0-9]{64}\.zip|audio-(?:core|en|ja)-\d+\.zip|learning/[a-f0-9]{64}\.mp3|images/[a-f0-9]{64}\.(?:jpg|jpeg|png|webp))', name), f'Unexpected release file: {name}'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,obj):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def archive_index(entry,archives):
    path=archives/entry['audioZip'].rsplit('/',1)[1];raw=path.read_bytes()
    out={'version':entry['audioVersion'],'zip':{'url':entry['audioZip'],'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)},'files':{}}
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            if name.endswith('.mp3'):
                data=z.read(name);assert '/' not in name and '\\' not in name
                out['files'][name]={'sha256':hashlib.sha256(data).hexdigest(),'md5':hashlib.md5(data).hexdigest(),'bytes':len(data)}
    assert out['files']
    return out

def stage_media(output, value, images=None):
    """Move downloadable lesson media to the CAE shared R2 domain by content hash.

    Source translation masters keep their original media identities. Only the
    transport URL changes in the release payload; bundled media remains usable.
    """
    if images is None:
        images={hashlib.sha256(p.read_bytes()).hexdigest():p for p in (APP/'expo-app/assets/culture').glob('*') if p.is_file()}
    if isinstance(value,dict):
        sha=value.get('sha256')
        if sha and 'url' in value:
            source=APP/f'expo-app/assets/learning-audio/learning-{sha}.mp3'
            assert source.is_file(),f'Missing local learning audio: {sha}'
            assert hashlib.sha256(source.read_bytes()).hexdigest()==sha and source.stat().st_size==value['bytes']
            name=f'learning/{sha}.mp3';target=output/name
            if not target.exists():target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
            value['url']=BASE+name
        if sha and 'uri' in value:
            source=images.get(sha);assert source is not None,f'Missing local lesson image: {sha}'
            name=f'images/{sha}{source.suffix.lower()}';target=output/name
            if not target.exists():target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
            value['uri']=BASE+name
        for child in value.values():stage_media(output,child,images)
    elif isinstance(value,list):
        for child in value:stage_media(output,child,images)

def inventory(output):
    result={}
    for p in sorted(output.rglob('*')):
        if not p.is_file() or p.name in ('manifest.json','_manifest.json','_assets.json'):continue
        name=p.relative_to(output).as_posix();assert_asset_name(name)
        assert p.resolve().is_relative_to(output.resolve()),name
        result[name]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':p.stat().st_size}
    return result

def prepare_media(output):
    output.mkdir(parents=True,exist_ok=True)
    for lang in ['ja','en','ko','ar']:stage_media(output,read(APP/f'expo-app/data/overlays/{lang}.json'))
    files=inventory(output);write(output/'_assets.json',{'appId':'nepali','files':files})
    print(f'Media prepared: {len(files)} immutable files, {sum(f["size"] for f in files.values())} bytes')

def stage_archive(entry,output,archives=None):
    """Preserve existing compressed recordings and reuse local verified updates."""
    for metadata in [entry['zip'],*([entry['delta']['zip']] if entry.get('delta') else [])]:
        name=metadata['url'].rsplit('/',1)[1];target=output/name
        if not target.exists():
            local=archives/name if archives else None
            if local and local.exists():shutil.copyfile(local,target)
            else:
                urls=list(dict.fromkeys([BASE+name,metadata['url']]))
                for i,url in enumerate(urls):
                    try:
                        request=urllib.request.Request(url,headers={'User-Agent':'Safa-content-release/1.0'})
                        with urllib.request.urlopen(request,timeout=120) as response:target.write_bytes(response.read())
                        break
                    except urllib.error.HTTPError as error:
                        if error.code!=404 or i==len(urls)-1:raise
        assert target.stat().st_size==metadata['bytes'] and hashlib.sha256(target.read_bytes()).hexdigest()==metadata['sha256'],name
        metadata['url']=BASE+name
def mother_language_archive(output,overlay,lang):
    """Package verified masters without re-encoding; same flat MP3 contract."""
    source,voice={'ko':('korean','ko-KR-SunHiNeural'),'ar':('arabic','ar-SA-ZariyahNeural')}[lang]
    manifest=read(APP/f'文法教材/{source}_audio_manifest.json')
    assert manifest['voice']==voice
    expected={f'{mode}/{key}-{i+1}.mp3':text
              for mode,section in [('conv','examplesL1'),('gram','grammarL1')]
              for key,rows in overlay[section].items() for i,text in enumerate(rows)}
    assert set(expected)==set(manifest['items']) and len(expected)==2328
    temporary=output/f'audio-{lang}.zip'
    with zipfile.ZipFile(temporary,'w',zipfile.ZIP_STORED) as archive:
        for name,text in sorted(expected.items()):
            meta=manifest['items'][name];data=(APP/f'audio/{lang}'/name).read_bytes()
            assert meta['text']==text and meta['voice']==manifest['voice'],name
            assert hashlib.sha256(data).hexdigest()==meta['sha256'] and len(data)==meta['bytes'],name
            info=zipfile.ZipInfo(name.split('/')[-1],(2026,1,1,0,0,0))
            archive.writestr(info,data)
    name=f'audio-{lang}-'+hashlib.sha256(temporary.read_bytes()).hexdigest()+'.zip'
    temporary.replace(output/name)
    return archive_index({'audioVersion':1,'audioZip':BASE+name},output)
def build(output,version,archives=None,audio_updates=None):
    output.mkdir(parents=True,exist_ok=True)
    catalog=read(APP/'文法教材/grammar_pack_v3_catalog.json')
    index_path=APP/'文法教材/ota_audio_index.json'
    if archives:
        audio={'_core':archive_index(catalog['core'],archives),**{e['l1']:archive_index(e,archives) for e in catalog['packs']}}
        write(index_path,audio)
    else:audio=read(index_path)
    for lang,e in [('_core',catalog['core']),*((e['l1'],e)for e in catalog['packs'])]:
        assert audio[lang]['zip']['url']==e['audioZip'] and audio[lang]['version']==e['audioVersion'],'Rebuild audio index with --archives for changed recordings'
        stage_archive(audio[lang],output,audio_updates)
    def chunk(value):
        raw=(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode();sha=hashlib.sha256(raw).hexdigest();name=f'content-{sha}.json';(output/name).write_bytes(raw)
        return {'sha256':sha,'bytes':len(raw),'url':BASE+name}
    core=read(APP/'expo-app/data/ota-baseline/core.json');core.pop('curriculumRevision',None)
    manifest={'appId':'nepali','schema':1,'version':version,'core':chunk(core),'audio':audio['_core'],'languages':{}}
    for lang in ['ja','en','ko','ar']:
        overlay=read(APP/f'expo-app/data/overlays/{lang}.json');guides=overlay.pop('grammarGuide');overlay.pop('version',None);overlay.pop('curriculumRevision',None)
        stage_media(output,overlay);stage_media(output,guides)
        if lang in ('ko','ar'):audio[lang]=mother_language_archive(output,overlay,lang)
        for k in core['grammarNe']:assert len(core['grammarNe'][k])==len(overlay['grammarL1'][k])
        for k in core['examplesNe']:assert len(core['examplesNe'][k])==len(overlay['examplesL1'][k])
        manifest['languages'][lang]={'overlay':chunk(overlay),'guides':{k:chunk(v)for k,v in guides.items()},'audio':audio[lang]}
    manifest['files']=inventory(output)
    write(output/'manifest.json',manifest)
    write(output/'_manifest.json',manifest)
    chunk_count = 1 + sum(1 + len(entry['guides']) for entry in manifest['languages'].values())
    print(f'OTA {version}: {chunk_count} text chunks; unchanged hashes are reused; audio references preserved.')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--version',type=int);p.add_argument('--archives',type=Path);p.add_argument('--audio-updates',type=Path);p.add_argument('--media-only',action='store_true')
    a=p.parse_args()
    if a.media_only:prepare_media(a.output)
    else:
        assert a.version is not None,'--version is required for a release'
        build(a.output,a.version,a.archives,a.audio_updates)
