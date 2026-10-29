"""Expand lessons only; preserve all examples, dictionaries and audio pointers."""
from pathlib import Path
import argparse
import copy
import csv
import hashlib
import json
from beginner_grammar_lessons import LESSONS, HEADINGS, expand_guides

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / '聞いて話せるネパール語'
SRC = APP / '文法教材'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def markdown(guides, titles, lang):
    lines=['# '+('ネパール語文法教材：基礎から分かる解説' if lang=='ja' else 'Nepali grammar: explanations from the basics'),'']
    for key,blocks in guides.items():
        lines.extend(['## '+key+' '+titles[key],''])
        for block in blocks:
            if block['type']=='table':
                lines.extend(['| '+' | '.join(block['headers'])+' |','| '+' | '.join('---' for _ in block['headers'])+' |'])
                lines.extend('| '+' | '.join(str(x).replace('\n','<br>').replace('|','／') for x in row)+' |' for row in block['rows'])
            elif block.get('text'):
                lines.append(('### ' if block['type']=='h' else '')+block['text'])
            lines.append('')
    return '\n'.join(lines)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--previous-dir', type=Path, required=True)
    p.add_argument('--output-dir', type=Path, required=True)
    p.add_argument('--revision', type=int, required=True)
    a=p.parse_args()
    old=read(a.previous_dir/'catalog.json'); cat=copy.deepcopy(old)
    assert a.revision>old['core']['version']
    core=read(a.previous_dir/old['core']['url'].rsplit('/',1)[1])
    overlays={e['l1']:read(a.previous_dir/e['url'].rsplit('/',1)[1]) for e in old['packs']}
    assert set(overlays)=={'ja','en'}
    assert set(LESSONS)==set(range(1,37))
    readings={str(k):[] for k in range(1,37)}
    with (SRC/'文法練習例文_v2.csv').open(encoding='utf-8-sig',newline='') as f:
        for row in csv.DictReader(f):
            readings[{'A':'35','B':'36'}.get(row['theme_no'],row['theme_no'])].append(row['roman'])
    guides=expand_guides({l:o['grammarGuide'] for l,o in overlays.items()}, core['grammarNe'], readings,
                         {l:o['grammarL1'] for l,o in overlays.items()})
    # Expanding a saved lesson twice must not duplicate its introduction.
    assert guides==expand_guides(guides,core['grammarNe'],readings,{l:o['grammarL1'] for l,o in overlays.items()})
    prefix='https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-v2/'
    a.output_dir.mkdir(parents=True,exist_ok=True)
    core['curriculumRevision']=a.revision
    name=f'core-{a.revision}.json';write(a.output_dir/name,core)
    cat['core'].update(version=a.revision,url=prefix+name)
    for lang,o in overlays.items():
        o.update(grammarGuide=guides[lang],version=a.revision,curriculumRevision=a.revision)
        name=f'overlay-{lang}-{a.revision}.json';write(a.output_dir/name,o)
        e=next(e for e in cat['packs'] if e['l1']==lang)
        e.update(version=a.revision,url=prefix+name,sizeBytes=(a.output_dir/name).stat().st_size)
        write(APP/f'expo-app/data/overlays/{lang}.json',o)
        write(APP/f'expo-app/src/grammarGuide.{lang}.json',guides[lang])
        (SRC/('文法教材_v2_ja_ドラフト.md' if lang=='ja' else 'grammar_guide_v2_en.md')).write_text(
            markdown(guides[lang],o['grammarThemeNames'],lang),encoding='utf-8')
    for old_entry,new_entry in zip([old['core'],*old['packs']],[cat['core'],*cat['packs']]):
        for key in ['audioZip','audioVersion','audioZipBytes']:
            assert old_entry[key]==new_entry[key],key
    write(a.output_dir/'catalog.json',cat)
    for name in ['grammar_pack_v2_catalog.json','grammar_pack_v3_catalog.json']:
        write(SRC/name,cat)
    stats={str(k):{'jaCharacters':sum(len(pair[0]) for pair in fields),
                    'enWords':sum(len(pair[1].split()) for pair in fields),
                    'teachingSections':len(fields)} for k,fields in LESSONS.items()}
    report={'packVersion':a.revision,'previousVersion':old['core']['version'],'topics':36,
            'languages':['ja','en'],'examplesUnchanged':sum(map(len,core['grammarNe'].values())),
            'audioChanged':False,'clientCodeChanged':False,'appRebuilt':False,
            'hunuTopicMapping':{'हो':[1],'छ':[2,3],'हुन्छ':[4],'review':[36]},
            'basicThirdPerson':['उहाँ','उहाँहरू'],'familiarThirdPersonTopic':7,
            'lessonIntroductions':stats,'sections':{'ja':['ここだけ覚えよう','例文1つ','3ステップ','まちがい注意','できたかチェック','もっと知りたいときに'], 'en':['Remember this','One example','3 steps','Watch out','Quick check','When you want to know more']},
            'layout':{'existingNativeBlocksOnly':True,'boldLearningAnchors':True,'yellowWarningCards':False,'warningSymbols':False,'detailedExplanationPosition':'after quick learning sequence','repeatedRules':'sentence-specific comments retained; duplicated full rules removed'},
            'audioReferencesPreserved':{'core':old['core'],**{e['l1']:e for e in old['packs']}},
            'payloadSHA256':{x.name:sha(x) for x in a.output_dir.iterdir() if x.is_file()},
            'verificationSources':[
                'https://pressbooks.bccampus.ca/nepali/chapter/chapter-5-unit-4-grammar-focus/',
                'https://pressbooks.bccampus.ca/nepali/chapter/chapter-6-unit-4-grammar-focus/',
                'https://pressbooks.bccampus.ca/nepali/chapter/chapter-13-unit-4-grammar-focus/',
                'https://pahar.in/pahar/Books%20and%20Articles/Nepal/1979%20Intermediate%20Nepali%20Structure%20by%20Verma%20s.pdf']}
    write(SRC/'教材解説拡充_検証結果.json',report)
    print(f'Expanded all36 topics in ja/en; {report["examplesUnchanged"]} exercises and all audio pointers unchanged')
    print('Japanese introduction characters:',min(x['jaCharacters'] for x in stats.values()),'–',max(x['jaCharacters'] for x in stats.values()))

if __name__=='__main__':
    main()
