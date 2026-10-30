"""Verify localized, contextual supplements without changing voiced exercises."""
from pathlib import Path
import argparse
import collections
import json
import re
from nepali_lesson_breaks import CARDS,SOURCES,extra_blocks

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('work',type=Path);a=p.parse_args()
    def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
    old=read(a.work/'live/catalog.json');new=read(a.work/'publish/catalog.json')
    kinds=collections.Counter();ids=set();examples=0
    for theme,cards in CARDS.items():
        assert len(cards)<=2,'Keep breaks brief and optional to read'
        for card in cards:
            assert card['id'] not in ids;ids.add(card['id']);kinds[card['kind']]+=1
            assert card['sources'] and all(k in SOURCES for k in card['sources'])
            assert len(card['body'][0])<=220 and len(card['body'][1].split())<=85
            if card['kind']=='culture':
                assert not card['examples'],'Culture breaks evoke Nepal rather than adding drills'
                assert not re.search(r'[\u0900-\u097f]',card['body'][0]),'No script drill in culture prose'
            for ne,roman,ja,en in card['examples']:
                assert all([ne,roman,ja,en]) and re.search(r'[\u0900-\u097f]',ne)
                assert not re.search(r'[\u0900-\u097f]',roman)
                assert re.search(r'[ぁ-んァ-ン一-龯]',ja)
                examples+=1
    for lang in ['ja','en']:
        before=read(a.work/'live'/next(e['url'].rsplit('/',1)[1] for e in old['packs'] if e['l1']==lang))
        after=read(a.work/'publish'/next(e['url'].rsplit('/',1)[1] for e in new['packs'] if e['l1']==lang))
        assert before['grammarThemeNames']==after['grammarThemeNames']
        for key,bs in after['grammarGuide'].items():
            base=[b for b in bs if not b.get('lessonSupplement')]
            if key=='2':
                # Intentional locative correction; preserve the original lesson
                # after its generated introduction, including all exercises.
                boundary=next(i for i,b in enumerate(base) if b.get('beginnerIntroEnd'))
                oldbs=before['grammarGuide'][key]
                oldboundary=next(i for i,b in enumerate(oldbs) if b.get('beginnerIntroEnd'))
                assert base[boundary:]==oldbs[oldboundary:]
                text=json.dumps(base,ensure_ascii=False)
                for phrase in ['उहाँ किताब छ','उहाँ शिक्षक हुनुहुन्छ','उ त्यहाँ']:assert phrase in text
            else:
                assert base==before['grammarGuide'][key],('Existing guide changed',lang,key)
            actual=[b for b in bs if b.get('lessonSupplement')]
            assert actual==extra_blocks(int(key),lang)
            for b in actual:
                assert b['type'] in ['h','p'] and b.get('l1ExampleSupport')==1
                assert b['presentation']['tone'] in ['green','teal','violet']
                assert '⚠' not in b['text']
            boundary=next(i for i,b in enumerate(bs) if b.get('beginnerIntroEnd'))
            assert all(not b.get('lessonSupplement') for b in bs[boundary+1:]),'No supplements duplicated among practice exercises'
        mil='\n'.join(b.get('text','') for b in after['grammarGuide']['21'] if b.get('lessonSupplement',{}).get('id')=='milcha-permission')
        for form in ['मिल्छ','मिल्दैन','सक्नु','यहाँ बस्न मिल्छ?']:assert form in mil
        assert ('許可' if lang=='ja' else 'permission') in mil
    print(f'PASS {kinds["culture"]} culture breaks, {kinds["spoken"]} speech notes, {examples} glossed/romanized reading examples per language; topic2 location corrected, all other base guides retained')
    return {'cultureBreaks':kinds['culture'],'speechNotes':kinds['spoken'],'readingExamplesPerLanguage':examples,'themesWithSupplements':len(CARDS),'existingGuideBlocksExactlyPreservedExceptTheme2Intro':True,'allExamplesHaveRomanJaEn':True,'cultureSeparateFromLanguageDrills':True,'milchaPermissionFeasibilityExplained':True,'sourcesByCard':{c['id']:[SOURCES[s] for s in c['sources']] for cards in CARDS.values() for c in cards}}

if __name__=='__main__':main()
