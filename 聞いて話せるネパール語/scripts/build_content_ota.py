"""Build immutable, hashed content chunks. Publish manifest.json only after all assets."""
import argparse, hashlib, json, zipfile
from pathlib import Path
APP=Path(__file__).resolve().parents[1]
BASE='https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-ota/'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,obj):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
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
def korean_archive(output,overlay):
    """Package verified Korean masters without re-encoding; same flat MP3 contract."""
    manifest=read(APP/'文法教材/korean_audio_manifest.json')
    assert manifest['voice']=='ko-KR-SunHiNeural'
    expected={f'{mode}/{key}-{i+1}.mp3':text
              for mode,section in [('conv','examplesL1'),('gram','grammarL1')]
              for key,rows in overlay[section].items() for i,text in enumerate(rows)}
    assert set(expected)==set(manifest['items']) and len(expected)==2328
    temporary=output/'audio-ko.zip'
    with zipfile.ZipFile(temporary,'w',zipfile.ZIP_STORED) as archive:
        for name,text in sorted(expected.items()):
            meta=manifest['items'][name];data=(APP/'audio/ko'/name).read_bytes()
            assert meta['text']==text and meta['voice']==manifest['voice'],name
            assert hashlib.sha256(data).hexdigest()==meta['sha256'] and len(data)==meta['bytes'],name
            info=zipfile.ZipInfo(name.split('/')[-1],(2026,1,1,0,0,0))
            archive.writestr(info,data)
    name='audio-ko-'+hashlib.sha256(temporary.read_bytes()).hexdigest()+'.zip'
    temporary.replace(output/name)
    return archive_index({'audioVersion':1,'audioZip':BASE+name},output)
def build(output,version,archives=None):
    output.mkdir(parents=True,exist_ok=True)
    catalog=read(APP/'文法教材/grammar_pack_v3_catalog.json')
    index_path=APP/'文法教材/ota_audio_index.json'
    if archives:
        audio={'_core':archive_index(catalog['core'],archives),**{e['l1']:archive_index(e,archives) for e in catalog['packs']}}
        write(index_path,audio)
    else:audio=read(index_path)
    for lang,e in [('_core',catalog['core']),*((e['l1'],e)for e in catalog['packs'])]:
        assert audio[lang]['zip']['url']==e['audioZip'] and audio[lang]['version']==e['audioVersion'],'Rebuild audio index with --archives for changed recordings'
    def chunk(value):
        raw=(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode();sha=hashlib.sha256(raw).hexdigest();name=f'content-{sha}.json';(output/name).write_bytes(raw)
        return {'sha256':sha,'bytes':len(raw),'url':BASE+name}
    core=read(APP/'expo-app/data/ota-baseline/core.json');core.pop('curriculumRevision',None)
    manifest={'schema':1,'version':version,'core':chunk(core),'audio':audio['_core'],'languages':{}}
    for lang in ['ja','en','ko']:
        overlay=read(APP/f'expo-app/data/overlays/{lang}.json');guides=overlay.pop('grammarGuide');overlay.pop('version',None);overlay.pop('curriculumRevision',None)
        if lang=='ko':audio[lang]=korean_archive(output,overlay)
        for k in core['grammarNe']:assert len(core['grammarNe'][k])==len(overlay['grammarL1'][k])
        for k in core['examplesNe']:assert len(core['examplesNe'][k])==len(overlay['examplesL1'][k])
        manifest['languages'][lang]={'overlay':chunk(overlay),'guides':{k:chunk(v)for k,v in guides.items()},'audio':audio[lang]}
    write(output/'manifest.json',manifest)
    chunk_count = 1 + sum(1 + len(entry['guides']) for entry in manifest['languages'].values())
    print(f'OTA {version}: {chunk_count} text chunks; unchanged hashes are reused; audio references preserved.')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--version',type=int,required=True);p.add_argument('--archives',type=Path)
    a=p.parse_args();build(a.output,a.version,a.archives)
