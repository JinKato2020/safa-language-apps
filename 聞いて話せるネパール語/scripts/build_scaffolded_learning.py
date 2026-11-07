"""Author the independent beginner practice bank and package the streamlined guides."""
import argparse, copy, json, re
from pathlib import Path
APP=Path(__file__).resolve().parents[1]
SRC=APP/'文法教材'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def clean_guide(blocks):
    result=[];skip=False
    removed={'復習する教材','Review topics','自分で組み立てる練習','Build your own sentence','例題と解答のしくみ','Exercises, answers and how they work','例題を解く前に確認すること','Before attempting the exercises'}
    for b in blocks:
        if b.get('type')=='h': skip=b.get('text') in removed or bool(re.fullmatch(r'例題\d+|Exercise\s+\d+',b.get('text','')))
        if b.get('lessonSupplement') or b.get('beginnerIntroEnd'): skip=False
        if not skip: result.append(b)
    return result
def prepare():
    source=read(SRC/'learning_practice_source.json'); paths=read(SRC/'beginner_learning_path.json')
    audio=read(SRC/'learning_audio_manifest.json') if (SRC/'learning_audio_manifest.json').exists() else {}
    core=read(APP/'expo-app/data/ota-baseline/core.json')
    existing={s for section in ['grammarNe','examplesNe'] for rows in core[section].values() for s in rows}
    assert len({r[1] for r in source['sentences']})==len(source['sentences'])
    assert not (existing & {r[1] for r in source['sentences']}), 'New practice must not duplicate the example bank: '+str(existing & {r[1] for r in source['sentences']})
    def clip(ne): return audio.get(ne,{'url':'','sha256':'','bytes':0})
    def sample(id,ne,roman,ja,en,lang): return dict(id=id,ne=ne,roman=roman,meaning=ja if lang=='ja' else en,audio=clip(ne))
    intros=[
      ('文字・読み・意味を音と一緒に','Text, reading and meaning together','まず一文を聞いてみよう。読めない文字があっても、読みと訳を手がかりにできます。','Start by listening to one sentence. Use its reading and translation to follow unfamiliar letters.', [('sentence-i','म विद्यार्थी हुँ।','ma vidyārthī hũ','私は学生です。','I am a student.')]),
      ('अ と आ を聞き比べよう','Listen to अ and आ','a と ā は母音の違いを表す読みの目印です。ā をいつも2倍長くする、とは決めず、口の開きと響きの違いを聞いてみよう。','a and ā mark different vowels in this reading system. Listen to the vowel quality; do not assume ā must always be twice as long.', [('vowel-a','अ','a','母音の音','vowel sound'),('vowel-aa','आ','ā','母音の音','vowel sound')]),
      ('क と ख：息の強さ','क and ख: the puff of air','ख（kha）は、क（ka）より強く息を出します。h を別の音として足すのでなく、一つの子音として聞こう。','ख (kha) has a stronger puff of air than क (ka). Listen to it as one consonant, not a separate k followed by h.', [('ka','क','ka','文字の音','letter sound'),('kha','ख','kha','文字の音','letter sound')]),
      ('त と ट：舌先の位置','त and ट: tongue position','त（ta）は舌先を上の歯に、ट（ṭa）は舌先を少し後ろに寄せて出します。点のある ṭ は別の文字の音です。','For त (ta), the tongue tip touches the upper teeth. For ट (ṭa), it is farther back. The dot in ṭ distinguishes the sounds.', [('ta','त','ta','文字の音','letter sound'),('tta','ट','ṭa','文字の音','letter sound')]),
      ('波線は、鼻に響く母音','A tilde marks a nasal vowel','यहाँ の ā̃、हुँ の ũ は、母音を鼻にも響かせます。最後に別の「ン」を足す音ではありません。','The ā̃ in यहाँ and ũ in हुँ are nasal vowels. Let the vowel resonate through the nose; do not add a separate n.', [('here','यहाँ','yahā̃','ここ','here'),('am','हुँ','hũ','です（私・何者かを言う形）','am (identifying myself)')]),
      ('主語が変わると、文末も変わる','The subject changes the ending','म（私）には हुँ、तपाईं（あなた・敬意）には हुनुहुन्छ。まずは音と一緒に、この組み合わせを確かめよう。','म (I) takes हुँ; respectful तपाईं (you) takes हुनुहुन्छ. Listen to the two complete sentences.', [('sentence-i','म विद्यार्थी हुँ।','ma vidyārthī hũ','私は学生です。','I am a student.'),('sentence-you','तपाईं विद्यार्थी हुनुहुन्छ।','tapāī̃ vidyārthī hunuhuncha','あなたは学生です。','You are a student.')])]
    for lang,path in paths.items():
        l=1 if lang=='ja' else 2
        path['description']='1ステップ3文。ことばを知る → 活用を選ぶ → 意味を選ぶ → 語順パズル。活用を扱わない文は意味選択から。順番は自由、見本はいつでも確認できます。' if lang=='ja' else 'Three new sentences per step. Meet the words, choose a form, choose a meaning, then build the model. Sentences without a conjugation task start with meaning. Explore in any order and use hints freely.'
        path['intro']=[dict(title=b[0 if lang=='ja' else 1],body=b[2 if lang=='ja' else 3],samples=[sample(*s,lang)for s in b[4]])for b in intros]
        path['exercises']={}
        for step in path['steps']: step['items']=[]
        for group,ne,ja,en,family in source['sentences']:
            step=path['steps'][group-1];index=len(step['items']);id=f'practice-{group:02}-{index+1:02}'
            tokens=re.findall(r'[^\s।॥?!,;:「」『』（）()"“”]+',ne)
            assert all(t in source['words'] for t in tokens),(ne,[t for t in tokens if t not in source['words']])
            words=[dict(text=t,roman=source['words'][t][0],meaning=source['words'][t][l])for t in tokens]
            for w in words:
                if w['text']=='हुनुहुन्छ':w['meaning']=({1:'です（敬意）',2:'います（敬意）',3:'～の状態です（敬意）'}.get(group,'普段います（敬意）')if lang=='ja' else {1:'is (respectful; identity)',2:'are (respectful; location)',3:'are (respectful; state)'}.get(group,'is/are usually (respectful)'))
            if group==7:
                for w in words:
                    if w['text']=='छु':w['meaning']='～しています（सिक्दै छु＝学んでいます）' if lang=='ja' else 'am (sikdai chu = am learning)'
            exercise=dict(ne=ne,jp=ja if lang=='ja' else en,words=words,audio=clip(ne))
            if family:
                family_names={'ho':('हो の仲間：何者かを言う','ho family: identity'),'chha':('छ の仲間：場所・今の状態','chha family: location or current state'),'hunchha':('हुन्छ の仲間：普段・繰り返すこと','hunchha family: usual or repeated situations')}
                values={'ho':['हुँ','हौं','हुनुहुन्छ'],'chha':['छु','छौं','हुनुहुन्छ'],'hunchha':['हुन्छु','हुन्छौं','हुनुहुन्छ']}[family]
                exercise['forms']=[dict(subject=s,form=f,roman=source['words'][f][0],meaning=source['words'][f][l])for s,f in zip(['म · 私','हामी · 私たち','तपाईं / उहाँ · あなた／あの方（敬意）'] if lang=='ja' else ['म · I','हामी · we','तपाईं / उहाँ · you / that person (respectful)'],values)]
                exercise['family']=family_names[family][0 if lang=='ja' else 1]
            path['exercises'][id]=exercise
            step['items'].append(dict(mode='grammar',themeId=group,index=index,ne=ne,exerciseId=id))
    write(SRC/'beginner_learning_path.json',paths)
    print('Prepared 21 independent exercises and 10 unique pronunciation clips, JA/EN.')
def package(revision):
    from package_beginner_grammar_update import markdown
    paths=read(SRC/'beginner_learning_path.json')
    assert all(e['audio']['bytes']>0 for p in paths.values() for e in p['exercises'].values())
    core_path=APP/'expo-app/data/ota-baseline/core.json';core=read(core_path);core['curriculumRevision']=revision;write(core_path,core)
    for lang in ['ja','en']:
        p=APP/f'expo-app/data/overlays/{lang}.json';o=read(p)
        o.update(learningPathV2=paths[lang],version=revision,curriculumRevision=revision)
        o['grammarGuide']={k:clean_guide(b)for k,b in o['grammarGuide'].items()}
        write(p,o);write(APP/f'expo-app/src/grammarGuide.{lang}.json',o['grammarGuide'])
        master='文法教材_v2_ja_ドラフト.md' if lang=='ja' else 'grammar_guide_v2_en.md'
        (SRC/master).write_text(markdown(o['grammarGuide'],o['grammarThemeNames'],lang),encoding='utf-8')
    print('Packaged streamlined guides and learning path',revision)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--package',type=int);a=p.parse_args()
    if a.package:package(a.package)
    else:prepare()
