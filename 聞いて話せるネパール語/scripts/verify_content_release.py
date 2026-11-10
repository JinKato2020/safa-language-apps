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
            if o.get('learningPathV3') or o.get('learningPathV2'):
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
        for step in o.get('learningPath',{}).get('steps',[]):
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
        if o.get('learningPathV3'):
            path=o['learningPathV3'];assert len(path['steps'])==36 and len(path['exercises'])==720
            for step in path['steps']:
                assert len(step['items'])==20 and len({r['exerciseId'] for r in step['items']})==20
                for r in step['items']:
                    e=path['exercises'][r['exerciseId']];q=e['selection'];answer=q.get('answer',e['words'][q['wordIndex']]['text'])
                    assert e['ne']==r['ne'] and q.get('prefix','')+answer==e['words'][q['wordIndex']]['text']
                    assert len(q['options'])==3 and sum(c['form']==answer for c in q['options'])==1
                    assert len(set(e['meaningChoices']))==3 and e['jp'] in e['meaningChoices']
                    a=e['audio'];assert a['bytes']>0 and len(a['sha256'])==64
            letters=o['lettersSounds'];assert len(letters['combinations'])==33
            assert all(len(row['samples'])==11 for row in letters['combinations'])
            conjuncts=letters.get('conjunctCombinations',[])
            bases=[s for section in letters['sections'] if section['id']=='conjuncts' for s in section['samples'] if s.get('audio')]
            assert len(conjuncts)==len(bases)==30
            for row,base in zip(conjuncts,bases):
                assert row['consonant']==base['ne'] and len(row['samples'])==11
                assert [s['ne'] for s in row['samples']]==[base['ne']+sign for sign in ['', 'ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ']]
            for s in [s for section in letters['sections'] for s in section['samples'] if s.get('audio')]+[s for row in letters['combinations']+conjuncts for s in row['samples']]:
                assert s['audio']['bytes']>0 and len(s['audio']['sha256'])==64
                if s['id'].startswith(('v-','c-','conj-')):
                    assert len(s.get('examples',[]))==2
                    for word in s['examples']:
                        assert s['ne'] in word['ne'] and word['roman'] and word['meaning']
                        assert word['audio']['bytes']>0 and len(word['audio']['sha256'])==64
        if o.get('nepaliDictionary'):
            d=o['nepaliDictionary'];assert d['schema']==1 and d['entries']
            assert len({e['id']for e in d['entries']})==len(d['entries'])
            assert len({e['ne']for e in d['entries']})==len(d['entries'])
            sources=[s for e in d['entries']for s in e['sources']]
            assert len(sources)==len(set(sources))
            original=[s for s in sources if __import__('re').fullmatch(r'\d+:\d+',s)]
            assert len(original)==d['sourceRowCount']
            assert set(original)=={f'{cat}:{i+1}' for cat,rows in core['wordsNe'].items()for i in range(len(rows))}
            for e in d['entries']:
                for s in e['sources']:
                    assert s.split(':')[0]in core['wordsNe']
                    assert s in original or s==f"{s.split(':')[0]}:dictionary:{e['id']}"
            for e in d['entries']:
                assert e['roman'] and e['senses'] and all(s['ja'] and s['en'] and s['pos']for s in e['senses'])
                assert all(str(t)in guides for t in e['themes'])
                a=e['audio'];assert a['bytes']>0 and len(a['sha256'])==64 and a['url'].startswith('https://')
                assert all(x['ne'] and x['ja'] and x['en']for x in e['examples'])
                if lang=='ko':
                    assert all(s.get('ko') for s in e['senses'])
                    assert all(x.get('ko') for x in e['examples'])
                    if e.get('note'):assert e['note'].get('ko')
        stats[lang]={'guides':len(guides),'courseSteps':len(o.get('learningPathV3',o.get('learningPath',{})).get('steps',[])),'practiceQuestions':len(o.get('learningPathV3',{}).get('exercises',{}))*3,'audioFiles':len(l['audio']['files'])}
    print(json.dumps({'version':m['version'],'languages':stats,'conversation':sum(map(len,core['examplesNe'].values())),'grammar':sum(map(len,core['grammarNe'].values())),'words':sum(map(len,core['wordsNe'].values()))}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('folder',type=Path);a=p.parse_args();verify(a.folder)
