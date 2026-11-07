"""Package 20 independently checked sentences per grammar theme (3 task pools)."""
import collections, hashlib, json
from pathlib import Path
from grammar_pool_source import author
APP=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def natural(s,lang):
    if lang=='ja':
        s=s.replace('いるです','います').replace('暇・自由な時間','自由な時間').replace('一覧・リスト','リスト').replace('旅行者・乗客','旅行者')
        return s if s.endswith(('。','？','?'))else s+'。'
    return s.replace('a artist','an artist').replace('from the home','from home').replace('at the home','at home').replace('as far as the home','all the way home').replace('Where do you come?','Where are you coming to?')
def build():
    audio=read(APP/'文法教材/learning_audio_manifest.json');core=read(APP/'expo-app/data/ota-baseline/core.json')
    existing={s for k in ['grammarNe','examplesNe']for rows in core[k].values()for s in rows}
    pools=author();selected={};seen=set(existing)
    for theme,rows in pools.items():
        buckets=collections.OrderedDict()
        for row in rows:
            if row['ne']not in seen:buckets.setdefault((row['target'],row['ruleJa']),[]).append(row)
        candidates=[]
        while any(buckets.values()):
            for bucket in buckets.values():
                if bucket:
                    row=bucket.pop(0)
                    if row['ne']not in seen:
                        candidates.append(row);seen.add(row['ne'])
        assert len(candidates)>=20,(theme,len(candidates))
        selected[theme]=candidates[:20]
    result={}
    for lang in ['ja','en']:
        o=read(APP/f'expo-app/data/overlays/{lang}.json')
        path=dict(title='文法の3ステップ練習'if lang=='ja'else'Three-step grammar practice',description='各種類20問から5問ずつ。形 → 意味 → 語順。'if lang=='ja'else'Five questions from each pool of 20: form → meaning → word order.',intro=[],exercises={},steps=[])
        for theme,rows in selected.items():
            refs=[];rules=[]
            for index,row in enumerate(rows):
                ne=row['ne'];id=f'grammar-{theme:02}-'+hashlib.sha256(ne.encode()).hexdigest()[:10]
                translation=natural(row[lang],lang);rule=row['ruleJa'if lang=='ja'else'ruleEn'];rules.append(rule)
                # Closest other translations keep distractors within the current lesson.
                tokens={w['text']for w in row['words']}
                others=sorted((r for r in rows if natural(r[lang],lang)!=translation),key=lambda r:-len(tokens & {w['text']for w in r['words']}))
                meanings=list(dict.fromkeys([translation,*[natural(r[lang],lang)for r in others]]))[:3];assert len(meanings)==3
                selection=dict(wordIndex=row['wordIndex'],answer=row['target'],prefix=row['prefix'],prompt='訳とルールに合う形を選ぼう。'if lang=='ja'else'Choose the form that matches the translation and rule.',rule=rule,options=[dict(subject='',meaning='',**c)for c in row['choices']])
                words=[dict(text=w['text'],roman=w['roman'],meaning=natural(w[lang],lang).removesuffix('。'))for w in row['words']]
                path['exercises'][id]=dict(ne=ne,jp=translation,words=words,audio=audio.get(ne,{'url':'','sha256':'','bytes':0}),meaningChoices=meanings,selection=selection)
                refs.append(dict(mode='grammar',themeId=theme,index=index,ne=ne,exerciseId=id))
            path['steps'].append(dict(id=f'grammar-{theme:02}',title=o['grammarThemeNames'][str(theme)],goal='\n'.join(dict.fromkeys(rules)),guideThemeId=theme,items=refs))
        result[lang]=path
    write(APP/'文法教材/grammar_practice.json',result)
    print('Prepared 36 themes x 20 sentences x 3 tasks = 2160 questions per language.')
if __name__=='__main__':build()
