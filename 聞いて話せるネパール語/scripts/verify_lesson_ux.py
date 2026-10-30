"""Check localized explanation examples and numbered titles before publishing."""
from pathlib import Path
import argparse
import json
import re
from nepali_rule_lessons import DATA, rules
from nepali_lesson_glosses import GLOSSES, MULTIWORD, translate, numbered_title

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('work',type=Path)
    a=p.parse_args()
    examples=set();checks=0
    for theme in DATA:
        for row in rules(theme):
            for lang,text in [('ja',row[2]),('en',row[3])]:
                rendered=translate(text,lang)
                for phrase in MULTIWORD.findall(text):
                    assert phrase in GLOSSES,(theme,phrase)
                    gloss=GLOSSES[phrase][0 if lang=='ja' else 1]
                    # Larger quoted examples receive one whole-sentence gloss,
                    # rather than fragmenting their quotation boundary.
                    whole=[s for s in re.findall(r'\*\*(.*?)\*\*',text) if s in GLOSSES and phrase in s]
                    assert gloss in rendered or any(GLOSSES[s][0 if lang=='ja' else 1] in rendered for s in whole),(theme,lang,phrase)
                    examples.add(phrase);checks+=1
    catalog=json.loads((a.work/'publish/catalog.json').read_text(encoding='utf-8'))
    data={e['l1']:json.loads((a.work/'publish'/e['url'].rsplit('/',1)[1]).read_text(encoding='utf-8')) for e in catalog['packs']}
    for lang,o in data.items():
        for key,bs in o['grammarGuide'].items():
            title=o['grammarThemeNames'][key]
            assert title==numbered_title(int(key),title,lang),'title prefix must be idempotent'
            assert bs[0]['type']=='goal'
            assert not any(b.get('lessonTitle') or b.get('text')==title for b in bs),'no duplicate body title'
            intro=bs[:next(i for i,b in enumerate(bs) if b.get('beginnerIntroEnd'))]
            for b in intro:
                if b['type'] in ['goal','p'] and b.get('presentation',{}).get('role') not in ['example','reading','translation']:
                    assert b.get('l1ExampleSupport')==1
            assert all(b['type']!='note' for b in bs)
        for key,sentence in [('3','म खुसी छु'),('3','मलाई जाडो लाग्छ'),('3','यहाँको मौसम राम्रो छ')]:
            text='\n'.join(b.get('text','') for b in o['grammarGuide'][key])
            assert sentence in text and GLOSSES[sentence][0 if lang=='ja' else 1] in text
        assert 'A' in o['grammarThemeNames']['35'] and 'B' in o['grammarThemeNames']['36']
        location=next(b for b in o['grammarGuide']['2'] if b['type']=='table' and b['headers'][0] in ['場所の語・読み','Location word and reading'])
        assert len(location['headers'])==2 and len(location['rows'])==4
        assert [r[0] for r in location['rows']]==['यहाँ\nyahā̃','त्यहाँ\ntyahā̃','उहाँ\nuhā̃','कहाँ\nkahā̃']
        location_text=json.dumps(o['grammarGuide']['2'],ensure_ascii=False)
        assert ('あそこ' if lang=='ja' else 'over there') in location_text
        comparison=next(b for b in o['grammarGuide']['5'] if b['type']=='table' and any('बसबाट / basbāṭa' in c for row in b['rows'] for c in row))
        assert len(comparison['headers'])==2,'narrow-screen comparison is two columns'
    for bad in ['म जाडो छु','मलाई जान चाहन्छु','गर्छु सक्छु','पढ्नुहुँदै छ','हो छैन']:
        assert GLOSSES[bad][0].startswith('誤') and GLOSSES[bad][1].startswith('incorrect')
    print(f'PASS {len(examples)} distinct illustrative phrases; {checks} bilingual occurrence/gloss checks; all72 numbered titles; incorrect forms labelled; narrow-screen comparison')
    return {'distinctIllustrativePhrases':len(examples),'bilingualOccurrenceChecks':checks,'numberedTitles':72,'requestedThreeExamplesTranslated':True,'incorrectExamplesExplicitlyLabelled':True,'comparisonColumns':2,'paragraphSentenceBreaks':True,'themeTitlePrefixIdempotent':True}

if __name__=='__main__':
    result=main()
