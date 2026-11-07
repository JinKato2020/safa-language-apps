"""Reviewed sentence-specific copula meanings; never infer from a reused ID alone."""
import argparse, copy, json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / '文法教材/grammar_context_corrections.json'
CORRECTIONS = json.loads(SOURCE.read_text(encoding='utf-8'))['entries']
INDEX = {(e['sentence_id'], e['word'], e['ne']): e for e in CORRECTIONS}

def corrected_meaning(sid, word, ne, lang, fallback):
    e = INDEX.get((sid, word, ne))
    return e[lang] if e else fallback

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def package(previous, output, revision):
    read = lambda p: json.loads(p.read_text(encoding='utf-8'))
    old = read(previous/'catalog.json'); catalog = copy.deepcopy(old)
    assert revision > old['core']['version']
    core = read(previous/old['core']['url'].rsplit('/',1)[1])
    core['curriculumRevision'] = revision
    prefix = old['core']['url'].rsplit('/',1)[0]+'/'
    name=f'core-{revision}.json'; write(output/name,core)
    catalog['core'].update(version=revision,url=prefix+name)
    counts={}
    for entry in catalog['packs']:
        lang=entry['l1']; overlay=read(previous/entry['url'].rsplit('/',1)[1]); changes=0
        for e in CORRECTIONS:
            theme,no=e['sentence_id'].split('-')
            assert core['grammarNe'][theme][int(no)-1]==e['ne'], e['sentence_id']
            contexts=overlay['grammarVocab'][e['word']]['contexts']
            matches=[c for c in contexts if c['sentence_id']==e['sentence_id']]
            assert len(matches)==1,(e['word'], e['sentence_id'])
            changes += matches[0]['ja'] != e[lang]
            matches[0]['ja']=e[lang]
        # Example word tables follow the exact Nepali sentence, not a row number.
        by_sentence={}
        for e in CORRECTIONS:
            by_sentence.setdefault(e['ne'],{})[e['word']]=e[lang]
        for blocks in overlay['grammarGuide'].values():
            current=None
            for b in blocks:
                if b.get('type')=='h': current=None
                if b.get('text') in by_sentence: current=by_sentence[b['text']]
                if current and b['type']=='table' and b['headers'] in [['語・形','読み','この文での意味'],['Word or form','Reading','Meaning in this sentence']]:
                    for row in b['rows']:
                        if row[0] in current: row[2]=current[row[0]]
        overlay.update(version=revision,curriculumRevision=revision)
        overlay['learningPath']=read(APP/'文法教材/beginner_learning_path.json')[lang]
        strings=read(APP/f'expo-app/src/i18n/{lang}.json')
        overlay['contentNames']={'themes':strings['themes'],'levels':strings['levels'],'categories':strings['vocabCategories']}
        overlay['posterLessons']=read(APP/'文法教材/ota_poster_lessons.json')
        name=f'overlay-{lang}-{revision}.json';write(output/name,overlay)
        entry.update(version=revision,url=prefix+name,sizeBytes=(output/name).stat().st_size)
        write(APP/f'expo-app/data/overlays/{lang}.json',overlay)
        write(APP/f'expo-app/src/grammarGuide.{lang}.json',overlay['grammarGuide'])
        from package_beginner_grammar_update import markdown
        master='文法教材_v2_ja_ドラフト.md' if lang=='ja' else 'grammar_guide_v2_en.md'
        (APP/'文法教材'/master).write_text(markdown(overlay['grammarGuide'],overlay['grammarThemeNames'],lang),encoding='utf-8')
        # Older screens still using the bundled strings get the same fallback labels.
        p=APP/f'expo-app/src/i18n/{lang}.json'; strings=read(p)
        strings['grammarThemes']=overlay['grammarThemeNames'];write(p,strings)
        counts[lang]=changes
    write(output/'catalog.json',catalog)
    for name in ['grammar_pack_v2_catalog.json','grammar_pack_v3_catalog.json']:write(APP/'文法教材'/name,catalog)
    print(json.dumps({'reviewedContexts':len(CORRECTIONS),'changed':counts,'revision':revision}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('previous',type=Path);p.add_argument('output',type=Path);p.add_argument('--revision',type=int,default=1214)
    a=p.parse_args();package(a.previous,a.output,a.revision)
