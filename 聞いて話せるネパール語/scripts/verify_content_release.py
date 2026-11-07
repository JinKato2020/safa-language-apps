import argparse,hashlib,json
from pathlib import Path

def read(path):return json.loads(path.read_text(encoding='utf-8'))
def verify(folder):
    m=read(folder/'manifest.json');assert m['schema']==1
    def payload(entry):
        p=folder/entry['url'].rsplit('/',1)[1];data=p.read_bytes()
        assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],p
        return json.loads(data)
    core=payload(m['core']);stats={}
    for lang,l in m['languages'].items():
        o=payload(l['overlay']);guides={k:payload(v)for k,v in l['guides'].items()}
        assert o['l1']==lang
        for a,b in [('examplesNe','examplesL1'),('grammarNe','grammarL1'),('wordsNe','wordsL1')]:
            assert set(core[a])==set(o[b])
            for key,rows in core[a].items():assert len(rows)==len(o[b][key]) and all(isinstance(s,str) and s for s in rows+o[b][key])
        assert set(guides)==set(core['grammarNe'])==set(o['grammarThemeNames'])
        for theme,rows in core['grammarNe'].items():
            text=json.dumps(guides[theme],ensure_ascii=False).replace('**','')
            if o.get('learningPathV2'):
                assert not any(b.get('type')=='h' and __import__('re').fullmatch(r'例題\d+|Exercise\s+\d+',b.get('text','')) for b in guides[theme])
            else:
                for i,ne in enumerate(rows):assert ne in text and o['grammarL1'][theme][i] in text
        for audio,refs in [(m['audio'],core.get('grammarAudioRefs')),(l['audio'],o.get('grammarAudioRefs'))]:
            for key,rows in core['examplesNe'].items():
                for i in range(len(rows)):assert f'{key}-{i+1}.mp3' in audio['files']
            for key,rows in core['grammarNe'].items():
                for i in range(len(rows)):
                    sid=f'{key}-{i+1}';ref=refs.get(sid) if refs is not None else sid
                    if ref is not None:assert ref+'.mp3' in audio['files'],(lang,sid,ref)
        for step in o['learningPath']['steps']:
            for r in step['items']:
                rows=core['grammarNe'][str(r['themeId'])] if r['mode']=='grammar' else core['examplesNe'][f"{r['themeId']}-{r['levelId']}"]
                assert rows[r['index']]==r['ne']
        if o.get('learningPathV2'):
            path=o['learningPathV2']
            assert len(path['exercises'])==21
            for step in path['steps']:
                for r in step['items']:assert path['exercises'][r['exerciseId']]['ne']==r['ne']
            for item in [*path['exercises'].values(),*(s for b in path['intro'] for s in b['samples'])]:
                a=item['audio'];assert a['bytes']>0 and len(a['sha256'])==64 and a['url'].startswith('https://')
        stats[lang]={'guides':len(guides),'courseSteps':len(o['learningPath']['steps']),'audioFiles':len(l['audio']['files'])}
    print(json.dumps({'version':m['version'],'languages':stats,'conversation':sum(map(len,core['examplesNe'].values())),'grammar':sum(map(len,core['grammarNe'].values())),'words':sum(map(len,core['wordsNe'].values()))}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('folder',type=Path);a=p.parse_args();verify(a.folder)
