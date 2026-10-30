"""Build curriculum v3 from reviewed content and the immutable recording registry."""
from revise_grammar_curriculum import *
import os
from standard_third_person import normalize_row, lexicon_forms, PRONOUN
from beginner_grammar_lessons import expand_guides

saved_catalog = SRC/'grammar_pack_v3_catalog.json'
PACK_REVISION = int(os.environ.get('GRAMMAR_PACK_REVISION', str(read(saved_catalog)['core']['version'] + 1 if saved_catalog.exists() else 1200)))
new_recording_file = SRC/'grammar_recordings_v3.json'
new_recordings = read(new_recording_file)['recordings'] if new_recording_file.exists() else {}

REGISTRY = SRC / 'grammar_recording_texts_v2.json'
if not REGISTRY.exists():
    registry = {}
    for r in csv.DictReader((SRC/'文法練習例文_v2.csv').open(encoding='utf-8-sig', newline='')):
        theme = {'A':'35','B':'36'}.get(r['theme_no'], r['theme_no'])
        registry[f"{theme}-{r['no']}"] = {k:r[k] for k in ['ne','roman','ja','en']}
    write(REGISTRY, registry)
bank = read(REGISTRY)
core = read(WORK/'live/core.json')
overlays = {lang:read(WORK/f'live/overlay-{lang}.json') for lang in ['ja','en']}
original_core = copy.deepcopy(core)
old_guides = {lang:copy.deepcopy(overlays[lang]['grammarGuide']) for lang in overlays}

lessons = {str(k):[] for k in range(1,37)}
for k, ids in KEEP.items():
    for n in ids:
        source = f'{k}-{n}'; row=copy.deepcopy(bank[source])
        # Register exceptions in the social-register lesson and reference appendices,
        # not as the default subjects of every grammar topic.
        if k != 7 and re.search(r'तँ|तिमी|तिम्र|तैले|तेरो|उहाँ|(?:^|\s)उ(?:\s|$)|(?:^|\s)उस(?:ले|लाई|को|सँग)',row['ne']):
            continue
        row['audio_ref']=source; lessons[str(k)].append(row)
for k in [35,36]:
    for source,row in bank.items():
        if source.startswith(f'{k}-'):
            lessons[str(k)].append({**copy.deepcopy(row),'audio_ref':source})
# Move possession to the postposition lesson and retain the exact recordings.
for n in [14,15,16,17]:
    source=f'2-{n}'
    if n==16: continue  # low-respect third person is taught in topic 7
    lessons['5'].append({**copy.deepcopy(bank[source]),'audio_ref':source})
for line in NEW_TSV.strip().splitlines():
    k,ne,roman,ja,en=line.split('|')
    # Reuse a recording only when both the Nepali and translation are identical.
    ref=next((i for i,r in bank.items() if all(r[f]==v for f,v in [('ne',ne),('ja',ja),('en',en)])),None)
    if ref is None:
        ref=next((i for i,r in new_recordings.items() if all(r[f]==v for f,v in [('ne',ne),('ja',ja),('en',en)])),None)
    lessons[k].append(dict(ne=ne,roman=roman,ja=ja,en=en,audio_ref=ref))

# Standard lesson subjects are respectful third person. Topic7 retains comparisons.
for theme, rows in lessons.items():
    if theme == '7': continue
    for i, original in enumerate(rows):
        row = normalize_row(original)
        if row['ne'] != original['ne']:
            row['audio_ref'] = next((id for id, r in {**bank, **new_recordings}.items()
                if all(row[f] == r[f] for f in ['ne','ja','en'])), None)
        rows[i] = row

tokens=lambda ne: re.findall(r'[^\s।,?？！!：:;“”"\'‘’()]+',ne)
unknown={}
for k,rows in lessons.items():
    for r in rows:
        if r['audio_ref'] is None:
            for word in tokens(r['ne']):
                if word not in overlays['ja']['grammarVocab']:
                    unknown.setdefault(word,[]).append(r['ne'])
write(WORK/'unknown_words.json',unknown)
if '--preflight' in __import__('sys').argv:
    print('Examples by topic:',{k:len(v) for k,v in lessons.items()})
    print('Unknown new words:',json.dumps(unknown,ensure_ascii=False))
    raise SystemExit(0)

def block(kind,text):return {'type':kind,'text':text}
def table(headers,rows):return {'type':'table','headers':headers,'rows':rows}
def bilingual(ja,en,lang):return ja if lang=='ja' else en

def inventory_table(text,lang):
    rows=[]
    for line in text.strip().splitlines():
        form,roman,ja,en,example=line.split('|')
        rows.append([form+'\n'+roman,bilingual(ja,en,lang),example])
    return table(bilingual(['形と読み','意味・使い方','短い組み合わせ'],['Form and reading','Meaning and use','Short construction'],lang),rows)

REL_EXTRA = {
 'जसको किताब हो, उसलाई दिनुहोस्।':('jasko kitāb ho, uslāī dinuhos','その本の持ち主に渡してください','Give it to the person whose book it is.'),
 'जुन झोलामा किताब छ, त्यो मेरो हो।':('jun jholāmā kitāb cha, tyo mero ho','本が入っているかばんは私のものです','The bag that has a book in it is mine.'),
 'जहाँबाट आउनुभयो, त्यहाँबाट फेरि आउनुहोस्।':('jahā̃bāṭa āunubhayo, tyahā̃bāṭa pheri āunuhos','来られた所から、もう一度来てください','Come again from the place you came from.'),
 'जसो भन्नुहुन्छ, त्यसो गर्छु।':('jaso bhannuhuncha, tyaso garchu','おっしゃる通りにします','I will do as you say.'),
 'जस्तो चाहिन्छ, त्यस्तो छान्नुहोस्।':('jasto cāhincha, tyasto chānnuhos','必要な種類のものを選んでください','Choose the kind that you need.'),
 'जत्रो चाहिन्छ, त्यत्रो लिनुहोस्।':('jatro cāhincha, tyatro linuhos','必要な大きさのものを取ってください','Take the size that you need.'),
 'जुनसुकै किताब लिनुहोस्।':('junsukai kitāb linuhos','どの本でも取ってください','Take any book.'),
 'जहिलेसुकै आउनुहोस्।':('jahilesukai āunuhos','いつでも来てください','Come whenever you like.'),
}

def relative_example(example,lang):
    original=example
    # Relative examples use the same respectful subjects as the practice.
    source=next((dict(ne=ne,roman=roman,ja=ja,en=en) for line in NEW_TSV.strip().splitlines()
        for k,ne,roman,ja,en in [line.split('|')] if ne==example),None)
    if source:
        source=normalize_row(source);example=source['ne']
    match=next((r for rs in lessons.values() for r in rs if r['ne']==example),None)
    if match:return example+'\n'+match['roman']+'\n'+match[lang]
    roman,ja,en=REL_EXTRA[original]
    row=normalize_row(dict(ne=original,roman=roman,ja=ja,en=en))
    return row['ne']+'\n'+row['roman']+'\n'+row[lang]

# Content assembly follows below; all active examples are explicitly represented
# in the guide, with vocabulary, a structural explanation and a reconstruction task.
lexicon={}
for line in (SRC/'grammar_v3_lexicon.tsv').read_text('utf-8').splitlines():
    if line.strip():
        ne,roman,ja,en=line.split('\t');lexicon[ne]=dict(rom=roman,ja=ja,en=en)
lexicon.update(lexicon_forms())
assert set(unknown)<=set(lexicon), f'Unreviewed new vocabulary: {set(unknown)-set(lexicon)}'

new_vocab={lang:{} for lang in overlays}
for k,rows in lessons.items():
    for n,r in enumerate(rows,1):
        r['id']=f'{k}-{n}'
        for lang in overlays:
            old=overlays[lang]['grammarVocab']
            for word in dict.fromkeys(tokens(r['ne'])):
                v=copy.deepcopy(old.get(word,{}))
                exact=[c for c in v.get('contexts',[]) if c.get('sentence_id')==r['audio_ref']]
                # For an unchanged recording use the reviewed sentence-specific meaning.
                # A new word is explicitly reviewed above; other reused words retain their base meaning.
                if exact:
                    meaning=exact[0]['ja'];roman=v.get('rom','')
                elif word in lexicon:
                    meaning=lexicon[word][lang];roman=lexicon[word]['rom']
                else:
                    assert v,word
                    meaning=v['base_meaning'];roman=v.get('rom','')
                # Respectful copulas serve identity, qualities, location and
                # progressive clauses; teach the meaning in this sentence.
                if k != '7' and 'उहाँ' in r['ne'] and word in ['हुनुहुन्छ','हुनुहुन्न']:
                    identity = k in ['1','3','23'] or any(n in r['ne'] for n in ['लेखक','लेखिका','मेरो साथी'])
                    if word == 'हुनुहुन्छ':
                        meaning = bilingual('です（敬意）' if identity else 'います（敬意）', 'is/are (respectful)' if identity else 'is/are present (respectful)', lang)
                    else:
                        meaning = bilingual('ではありません（敬意）' if identity else 'いません（敬意）', 'is/are not (respectful)' if identity else 'is/are not present (respectful)', lang)
                dest=new_vocab[lang].setdefault(word,dict(rom=roman,base_form=v.get('base_form',word),base_meaning=meaning,contexts=[]))
                dest['contexts'].append({'sentence_id':r['id'],'ja':meaning})
for lang in new_vocab:
    for word in ['उ','ऊ','उनी','उनीहरू','उसलाई','उनलाई']:
        if word in new_vocab[lang]:new_vocab[lang][word]['base_meaning']=lexicon[word][lang]

titles={lang:copy.deepcopy(overlays[lang]['grammarThemeNames']) for lang in overlays}
for lang in titles:
    titles[lang]['2']=bilingual('छ：ある・いる（存在と居場所）','छ: existence and location',lang)
    titles[lang]['5']=bilingual('場所・相手・関係を表す言葉（後置詞）','Postpositions: place, participants and relationships',lang)
    titles[lang]['6']=bilingual('疑問詞と質問の作り方','Question words and how to ask',lang)
    titles[lang]['7']=bilingual('人称・親しさ・敬意と動詞の形','Pronouns, familiarity, respect and verb agreement',lang)
    titles[lang]['29']=bilingual('人・物・場所・時をつなぐ関係表現','Relative expressions: people, things, place and time',lang)

P_BASIC=[
 ['म / ma','हुँ / hũ','होइनँ / hoinã','छु / chu','छैनँ / chainã'],
 ['हामी / hāmī','हौं / haũ','होइनौं / hoinaũ','छौं / chaũ','छैनौं / chainaũ'],
 ['तपाईं / tapāĩ','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],
 ['तपाईंहरू / tapāĩharū','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],
 ['उहाँ / uhā̃','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],
 ['उहाँहरू / uhā̃harū','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],
]
P_NAMES=[('私','I'),('私たち','we'),('あなた','you'),('あなたたち','you plural'),('彼・彼女','he/she'),('彼ら・彼女たち','they')]

REFS={
 1:[5,7],2:[1,5,7],3:[1,2,23],4:[2,8,11],5:[2,6,7,11,25,26,27,28,32],6:[1,2,5,7,11,23,27,28],7:[1,2,5,8],
 8:[5,7,9],9:[7,8],10:[2,7,8],11:[5,7,8],12:[9,11],13:[7,8],14:[7,11],15:[2,11,23],16:[11,15,27],
 17:[5,7],18:[7,8,19],19:[7,17,21],20:[7,8,9],21:[5,19,20],22:[5,8,9],23:[1,3,5],24:[3,8,6],
 25:[3,5,23],26:[5,8,11],27:[5,8,11,29],28:[5,6,8,11],29:[1,2,5,6,7,8,11,15,17,23,25,27,30],
 30:[2,3,9,11,17,18,29],31:[2,3,11,15,21,26],32:[5,11,15],33:[5,8,11,12],34:[1,5,7,8,9,11,14,26],
}

FORM_TABLE_TOPICS=set(range(8,17))|{20,22}
def word_table(r,lang):
    result=[]
    for word in dict.fromkeys(tokens(r['ne'])):
        v=new_vocab[lang][word]
        m=next(c['ja'] for c in v['contexts'] if c['sentence_id']==r['id'])
        result.append([word,v['rom'],m])
    return table(bilingual(['語・形','読み','この文での意味'],['Word or form','Reading','Meaning in this sentence'],lang),result)

def construction(r,k,lang):
    # Every selected exercise gets its own explicit lexical analysis, followed by
    # the relevant construction rule, not merely an unexplained answer sentence.
    rules=RULES[k][2 if lang=='ja' else 3]
    found=[]
    for marker,jp,en in [('सँग','同伴・相手、または所持','company/participant or possession'),('बाट','出発点・手段','source or means'),('देखि','起点','starting point'),('सम्म','到達点・期限','endpoint or deadline'),('भित्र','内部、または時間の以内','inside or within a period'),('भन्दा','比較の基準','standard of comparison'),('मार्फत','仲介・経由','intermediary'),('द्वारा','動作主','agent')]:
        if marker in r['ne']:
            found.append(marker+' = '+bilingual(jp,en,lang))
    if k==29:
        for line in REL.strip().splitlines():
            form,roman,jp,en,example=line.split('|')
            lead=re.split(r'[…・]',form)[0]
            if lead in tokens(r['ne']):found.append(form+' = '+bilingual(jp,en,lang))
    if '?' in r['ne']:
        found.append(bilingual('疑問文です。答えたい情報を疑問詞の位置に置き、文末を人称に合わせます。','This is a question. Supply the missing information and keep person agreement on the final verb.',lang))
    return rules + ('\n'+' / '.join(found) if found else '')

guides={lang:{} for lang in overlays}
for lang in overlays:
    for k in range(1,37):
        key=str(k)
        if k>=35:
            guides[lang][key]=copy.deepcopy(old_guides[lang][key])
            guides[lang][key].insert(1,block('note',bilingual('この付録は活用を比較する参照表です。通常の例題は基本6人称と多様な場面を中心にします。親しさ・敬意の違いはテーマ7、हो・छの基本はテーマ1・2でも説明しています。','This appendix is a conjugation reference. Ordinary exercises prioritize six basic person groups and varied situations. See topic 7 for respect/familiarity and topics 1–2 for हो/छ.',lang)))
            continue
        goal=RULES[k][0 if lang=='ja' else 1];rule=RULES[k][2 if lang=='ja' else 3]
        bs=[block('goal',goal),block('h',bilingual('基本の考え方と文の作り方','Meaning and sentence construction',lang)),block('p',rule)]
        if k in [1,2]:
            ix=1 if k==1 else 3
            bs += [block('h',bilingual('基本6人称の肯定・否定','Positive and negative forms for six basic person groups',lang)),table(bilingual(['人称と読み','肯定と読み','否定と読み'],['Person and reading','Positive and reading','Negative and reading'],lang),[[bilingual(*P_NAMES[i],lang)+'\n'+r[0],r[ix],r[ix+1]] for i,r in enumerate(P_BASIC)]),block('note',bilingual('基本の彼・彼女はउहाँ、彼ら・彼女らはउहाँहरूです。どちらも敬意のある動詞形を使い、性別で動詞を分けません。親しい関係の言い方はテーマ7で学びます。होइनँ・छैनँの鼻音も区別しましょう。','Use उहाँ for he/she and उहाँहरू for they as the basic forms. Both take respectful verb agreement without a masculine/feminine distinction. Familiar forms are taught in topic 7. Note the nasal first-person negatives होइनँ/छैनँ.',lang))]
        if k==4:
            bs += [block('h',bilingual('हुन्छの基本6人称と否定','Six basic person groups with हुन्छ and its negatives',lang)),table(bilingual(['人称','肯定と読み','否定と読み'],['Person','Positive and reading','Negative and reading'],lang),[
             ['म / ma','हुन्छु / hunchu','हुँदिनँ / hũdinã'],['हामी / hāmī','हुन्छौं / hunchaũ','हुँदैनौं / hũdainaũ'],['तपाईं / tapāĩ','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],['तपाईंहरू / tapāĩharū','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],['उहाँ / uhā̃','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'],['उहाँहरू / uhā̃harū','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna']])]
        if k==5:
            groups=collections.defaultdict(list)
            for line in POST.strip().splitlines():
                group,rest=line.split('|',1);groups[group].append(rest)
            group_en={'基本':'Core forms','同伴と所持':'Company and possession','方向と位置':'Direction and position','範囲':'Extent','関係表現':'Further relationships'}
            for group,lines in groups.items():bs += [block('h',bilingual(group,group_en[group],lang)),inventory_table('\n'.join(lines),lang)]
            bs += [block('note',bilingual('मसँग कलम छは「私のところにペンがある」→「私はペンを持っている」。持ち主が私でも文末をछुにしません。साथीसँग जान्छुでは一緒に行く相手を示します。','मसँग कलम छ literally places a pen with me and means I have a pen. The possessor being I does not change छ to छु. In साथीसँग जान्छु, सँग instead marks company.',lang)),block('p',bilingual('को・की・काは後ろの名詞との一致です。मेरो・हाम्रो・तपाईंकोは「私の・私たちの・あなたの」。मに後置詞が付くとमलाई・मैले等になり、उहाँにはउहाँलाई・उहाँले、उहाँहरूにはउहाँहरूलाई・उहाँहरूले等があります。形と関係を一緒に覚えます。','को/की/का agree with the following noun. मेरो, हाम्रो and तपाईंको mean my, our and your. Pronouns can change before case markers: म→मलाई/मैले, उहाँ→उहाँलाई/उहाँले, उहाँहरू→उहाँहरूलाई/उहाँहरूले. Learn the form with its role.',lang))]
        if k==6:
            bs.append(block('h',bilingual('基本語と、後置詞・数量語との組み合わせ','Core words and combinations with postpositions and counters',lang)))
            qrows=[line.split('|') for line in QUESTIONS.strip().splitlines()]
            bs.append(table(bilingual(['形と読み','尋ねること'],['Form and reading','Information requested'],lang),[[a[0]+'\n'+a[1],a[2 if lang=='ja' else 3]] for a in qrows]))
            bs.append(block('p',bilingual('कसलाई・कसले・कसकोは「誰」に関係する変化形。कोसँगは「誰と」です。कति जनाは人数、कति वटाは物の個数、कति बजेは時刻、कति पटकは回数です。कस्तोは性質、कुनは選択なので同じ「どんな・どの」と訳して済ませません。','कसलाई, कसले and कसको are case forms related to who; कोसँग means with whom. कति जना counts people, कति वटा objects, कति बजे asks clock time, and कति पटक counts occasions. कस्तो asks for a quality and कुन a selection; they are not interchangeable.',lang)))
            bs.append(block('h',bilingual('質問と答えを一緒に練習する','Practice questions with their answers',lang)))
            for a in qrows:
                bs += [block('h',a[0]),table(bilingual(['役割','ネパール語と読み','意味'],['Role','Nepali and reading','Meaning'],lang),[[bilingual('質問','Question',lang),a[4]+'\n'+a[5],a[6 if lang=='ja' else 7]],[bilingual('答え','Answer',lang),a[8]+'\n'+a[9],a[10 if lang=='ja' else 11]]])]
            bs.append(block('note',bilingual('「今何時」はकति बज्यो?、「何時に行く」はकति बजे जानुहुन्छ?。年齢はतपाईंको उमेर कति वर्ष भयो?（おいくつですか）。このभयो・आउनुभयो等は過去の形で、詳しい活用はテーマ11。日本語と違う言い方を短い文ごと理解します。','Compare कति बज्यो? (what time now) with कति बजे जानुहुन्छ? (at what time will you go). Age can be asked as तपाईंको उमेर कति वर्ष भयो? Forms such as भयो/आउनुभयो are past forms; see topic 11. Learn these natural constructions rather than translating word by word.',lang)))
        if k==7:
            bs += [block('h',bilingual('उ・उनी・उहाँは性別ではなく敬意を区別する','उ, उनी and उहाँ distinguish respect, not male versus female',lang)),table(bilingual(['代名詞と読み','場面・敬意','हो／छ／動作の例'],['Pronoun and reading','Register','Examples with हो/छ/action'],lang),[
             ['उ / u',bilingual('低い敬意。男女どちらも指せる','Low respect; can refer to either gender',lang),'हो / ho; छ / cha; गर्छ / garcha'],
             ['उनी / unī',bilingual('中程度の敬意。女性専用ではない','Medium respect; not female-only',lang),'हुन् / hun; छन् / chan; गर्छन् / garchan'],
             ['उहाँ / uhā̃',bilingual('高い敬意。男女どちらにも使う','High respect; for either gender',lang),'हुनुहुन्छ / hunuhuncha; गर्नुहुन्छ / garnuhuncha'],
             ['तँ / tã',bilingual('非常に親しい関係等。失礼になる場合もある','Very close/informal; can be offensive',lang),'होस् / hos; छस् / chas; गर्छस् / garchas'],
             ['तिमी / timī',bilingual('親しい相手。単純に目下専用ではない','Familiar, not simply for social inferiors',lang),'हौ / hau; छौ / chau; गर्छौ / garchau'],
             ['तपाईं / tapāĩ',bilingual('丁寧なあなた','Respectful you',lang),'हुनुहुन्छ / hunuhuncha; गर्नुहुन्छ / garnuhuncha'],
            ]),block('p',bilingual('女性を明示する動詞にはछिन्・गर्छिन्・गइन्等があります。उनी自体が「彼女専用」なのではありません。उनीहरूは彼ら・彼女たち、उहाँहरूは敬意の高い複数です。तपाईंहरूはあなたたちで、動詞の丁寧さは保ちます。','Explicitly feminine verbs include छिन्, गर्छिन् and गइन्. This does not make उनी a female-only pronoun. उनीहरू refers to they; उहाँहरू is respectful plural. तपाईंहरू is respectful plural you and retains respectful verb agreement.',lang)),table(bilingual(['基本形','〜に・〜を','〜の／〜が'],['Base','To/object','Possessive/agent'],lang),[['उ / u','उसलाई / uslāī','उसको / usko; उसले / usle'],['उनी / unī','उनलाई / unlāī','उनको / unko; उनले / unle'],['उनीहरू / unīharū','उनीहरूलाई / unīharūlāī','उनीहरूको / unīharūko; उनीहरूले / unīharūle'],['म / ma','मलाई / malāī','मेरो / mero; मैले / maile'],['हामी / hāmī','हामीलाई / hāmīlāī','हाम्रो / hāmro; हामीले / hāmīle']])]
            bs.append(block('note',bilingual('उとऊはここでは同じ低い敬意の三人称の表記として扱います。आफूは文中の主語などを受ける「自分」、आफ्नोは「自分の」です。日本語の彼・彼女を機械的に別の代名詞へ振り分けません。','उ and ऊ here represent spellings of the same low-respect third-person pronoun. आफू refers back as self; आफ्नो means own. Do not mechanically assign different pronouns to English he and she.',lang)))
        if k in FORM_TABLE_TOPICS:
            rs=[]
            for n,jp,en in [(1,'私','I'),(9,'私たち','we'),(5,'あなた','you'),(5,'あなたたち','you plural'),(7,'彼・彼女','he/she'),(10,'彼ら・彼女たち','they')]:
                old=bank.get(f'{k}-{n}')
                if old:
                    old=normalize_row(old)
                    ne=old['ne'];rom=old['roman'];meaning=old[lang]
                    if jp=='あなたたち':ne=ne.replace('तपाईं','तपाईंहरू');rom=rom.replace('tapāĩ','tapāĩharū')
                    rs.append([bilingual(jp,en,lang),ne+'\n'+rom,meaning])
            bs += [block('h',bilingual('活用を比較するための表','A reference table for comparing personal forms',lang)),table(bilingual(['人称','形と読み','意味'],['Person','Form and reading','Meaning'],lang),rs),block('note',bilingual('表の反復は活用の比較用です。下の練習では、主語だけでなく内容や場面を変えます。より詳しい形は付録A・B、敬意の違いはテーマ7を参照してください。','Repetition in this table is for comparing agreement. The practice below varies situations and content. See appendices A/B for fuller forms and topic 7 for respect.',lang))]
        if k in [11,12]:
            indexes=[41,49,45,45,47,50] if k==11 else [51,59,55,55,57,60]
            prs=[]
            for i,n in enumerate(indexes):
                r=normalize_row(bank[f'36-{n}']);ne=r['ne'];rom=r['roman']
                if i==3:ne=ne.replace('तपाईं','तपाईंहरू');rom=rom.replace('tapāĩ','tapāĩharū')
                prs.append([bilingual(*P_NAMES[i],lang),ne+'\n'+rom,r[lang]])
            bs += [block('h',bilingual('ある・いるの過去はथियो系','Past existence uses the थियो family',lang)),table(bilingual(['人称','過去の形と読み','意味'],['Person','Past form and reading','Meaning'],lang),prs)]
        if k in EXTRA_ROWS:bs += [block('h',bilingual('このテーマで扱う関連表現','Related forms taught in this topic',lang)),inventory_table(EXTRA_ROWS[k],lang)]
        if k==34:
            bs += [block('h',bilingual('そのまま引用する形と、内容を伝える形','Direct quotation and indirect reporting',lang)),table(bilingual(['方法','例と読み','意味'],['Method','Example and reading','Meaning'],lang),[
             [bilingual('直接引用','Direct quotation',lang),'उहाँले “म बिरामी छु” भन्नुभयो।\nuhā̃le “ma birāmī chu” bhannubhayo',bilingual('彼女は「私は病気です」と言いました','She said, “I am ill.”',lang)],
             [bilingual('間接話法','Indirect reporting',lang),'उहाँले आफू बिरामी भएको बताउनुभयो।\nuhā̃le āphū birāmī bhaeko batāunubhayo',bilingual('彼女は自分が病気だと伝えました','She said that she was ill.',lang)]
            ]),block('p',bilingual('直接引用のमは発言者本人です。間接話法ではआफू（自分）で主語を受け、बिरामी（病気の）＋भएको（そうであることを表す形）で内容をまとめています。बताउनुभयोはबताउनु（伝える）の敬意のある過去形。引用した言葉をただ代名詞だけ替えるのでなく、誰の立場で何を伝えているかを確認します。','In direct speech, म refers to the original speaker. Indirect reporting uses आफू, self, to refer back to the subject and बिरामी, ill, + भएको to package the reported state. बताउनुभयो is the respectful past of बताउनु, tell/report. Track perspective and clause structure rather than simply replacing a pronoun.',lang))]
        if k==29:
            bs += [block('h',bilingual('前から説明する形と、二つの節を結ぶ形','Noun-modifying clauses and relative–correlative clauses',lang)),block('p',bilingual('ネパールへ行く人ならनेपाल जाने मान्छे、昨日来た人ならहिजो आएको मान्छेのように、説明を名詞の前に置きます。一方、जो यहाँ बस्नुहुन्छ, उहाँ मेरो साथी हुनुहुन्छでは、जोで人を導き、後半のउहाँが同じ人を受けます。節は一つの出来事や状態を述べる部分です。二つの節で、それぞれの役割に合う後置詞と動詞を選びます。','Place a modifier before its noun: नेपाल जाने मान्छे, a person who goes to Nepal; हिजो आएको मान्छे, a person who came yesterday. In जो यहाँ बस्नुहुन्छ, उहाँ मेरो साथी हुनुहुन्छ, जो introduces a person and उहाँ resumes that person. A clause describes an event/state. Each clause uses the case marking and verb appropriate to its own role.',lang)),table(bilingual(['関係表現と読み','働き','短い例'],['Relative form and reading','Function','Short example'],lang),[[a[0]+'\n'+a[1],a[2 if lang=='ja' else 3],relative_example(a[4],lang)] for a in (line.split('|') for line in REL.strip().splitlines())]),block('note',bilingual('को・कहाँ・कहिले等は質問、जो・जहाँ・जब等は文をつなぐ形です。जब…तबは時の関係、यदि…भनेは条件で、常に置き換えられません。जहिलेは反復する時を導くほか、文脈により使い方が変わります。जस्तो・जत्रोの性・数の変化はテーマ23も参照。','को/कहाँ/कहिले ask questions; जो/जहाँ/जब link information. Temporal जब…तब is not always interchangeable with conditional यदि…भने. जहिले can introduce recurring times and its use depends on context. See topic 23 for agreement of जस्तो/जत्रो.',lang))]
        # Retain the earlier cautions, now alongside explicit rules and complete exercise explanations.
        for old in old_guides[lang][key]:
            if k==2 and old.get('type')=='note':continue  # possession is taught in topic 5
            if old.get('type')=='note' and old['text'] not in [x.get('text') for x in bs]:bs.append(copy.deepcopy(old))
        bs += [block('h',bilingual('例題を解く前に確認すること','Before attempting the exercises',lang)),block('p',bilingual('語順は多くの場合「誰が＋何を・どこで・いつ＋動詞」です。名詞は物や人の名前、形容詞は性質、動詞は動作・状態を表します。人称は誰について話すか、時制はいつのことか、敬意は相手への接し方です。人称・性・数・敬意で変わる形は、この教材の表とテーマ7、付録A・Bで確認できます。','The usual order is subject + object/place/time + verb. Nouns name entities, adjectives describe qualities, and verbs express actions or states. Person identifies who, tense when, and respect the social relationship. Check person/gender/number/respect agreement in the tables, topic 7 and appendices A/B.',lang))]
        if any(r['audio_ref'] is None for r in lessons[key]):
            bs.append(block('note',bilingual('音声のある例題は再生して確認できます。音声なしの例題はテキストで練習しましょう。','Play the recorded examples to check them. Exercises without a recording can be practiced as text.',lang)))
        else:
            bs.append(block('note',bilingual('例題の音声を聞いて語順と表現を確認し、自分でも声に出して練習しましょう。','Listen to the examples to check word order and expressions, then practice saying them aloud yourself.',lang)))
        bs.append(block('h',bilingual('例題と解答のしくみ','Exercises, answers and how they work',lang)))
        for n,r in enumerate(lessons[key],1):
            bs += [block('h',bilingual(f'例題{n}',f'Exercise {n}',lang)),block('p',r[lang]+'\n'+r['ne']+'\n'+r['roman']),word_table(r,lang),block('p',bilingual('しくみ：','How it works: ',lang)+construction(r,k,lang))]
        bs += [block('h',bilingual('自分で組み立てる練習','Build your own sentence',lang)),block('p',bilingual('上の例題から一つ選び、日本語だけを見て文を作りましょう。次に名詞・場所・時を一つ替え、後置詞と動詞がどう変わるかを説明してください。主語だけを替えて終わらず、伝えたい内容を替えて練習します。','Choose an example and reconstruct it from the translation. Change a noun, place or time and explain any required changes to the postposition or verb. Change the intended message, not only the subject.',lang)),block('h',bilingual('復習する教材','Review topics',lang)),block('p',' / '.join(f'{n}: {titles[lang][str(n)]}' for n in REFS[k]))]
        guides[lang][key]=bs

# Carry the same respectful examples into retained reference tables and notes.
replacements = {}
for original in bank.values():
    revised = normalize_row(original)
    if revised['ne'] != original['ne']:
        replacements[original['ne']] = revised['ne']
        replacements[original['roman']] = revised['roman']
for line in NEW_TSV.strip().splitlines():
    theme,ne,roman,ja,en=line.split('|')
    if theme=='7':continue
    original=dict(ne=ne,roman=roman,ja=ja,en=en)
    revised=normalize_row(original)
    if revised['ne']!=ne:
        replacements[ne]=revised['ne'];replacements[roman]=revised['roman']
def normalize_guide(value):
    if isinstance(value,str):
        for before,after in sorted(replacements.items(),key=lambda x:-len(x[0])):
            value=value.replace(before,after)
        return value
    if isinstance(value,list):return [normalize_guide(v) for v in value]
    if isinstance(value,dict):return {k:normalize_guide(v) for k,v in value.items()}
    return value
for lang in guides:
    for key in guides[lang]:
        if key!='7':guides[lang][key]=normalize_guide(guides[lang][key])

guides=expand_guides(guides,
    {k:[r['ne'] for r in rs] for k,rs in lessons.items()},
    {k:[r['roman'] for r in rs] for k,rs in lessons.items()},
    {lang:{k:[r[lang] for r in rs] for k,rs in lessons.items()} for lang in overlays},titles)

from nepali_lesson_glosses import numbered_title
titles={lang:{k:numbered_title(int(k),v,lang) for k,v in names.items()} for lang,names in titles.items()}

rows=[];audio_refs={}
for k,items in lessons.items():
    core['grammarNe'][k]=[r['ne'] for r in items]
    for n,r in enumerate(items,1):
        audio_refs[r['id']]=r['audio_ref']
        rows.append([{'35':'A','36':'B'}.get(k,k),titles['ja'][k],n,r['ne'],r['roman'],r['ja'],r['en']])
core['grammarAudioRefs']=audio_refs
core['curriculumRevision']=PACK_REVISION
for theme in core['grammarThemes']:
    k=str(theme['id']);theme['name']=titles['ja'][k];theme['exampleCount']=len(lessons[k])
for lang,o in overlays.items():
    o['curriculumRevision']=PACK_REVISION
    o['grammarL1']={k:[r[lang] for r in items] for k,items in lessons.items()}
    o['grammarAudioRefs']=audio_refs
    o['grammarTextOnlyLabel']=bilingual('テキスト練習（音声なし）','Text practice (no audio)',lang)
    o['grammarVocab']=new_vocab[lang];o['grammarGuide']=guides[lang];o['grammarThemeNames']=titles[lang];o['version']=PACK_REVISION
    write(WORK/f'release/overlay-{lang}.json',o)
    write(APP/f'expo-app/data/overlays/{lang}.json',o)
    write(APP/f'expo-app/src/grammarGuide.{lang}.json',guides[lang])
    write(APP/f'expo-app/data/grammar-vocab-context{".en" if lang=="en" else ""}.json',new_vocab[lang])
write(WORK/'release/core.json',core)
write(APP/'expo-app/data/grammarThemes.json',core['grammarThemes'])
write(APP/'expo-app/data/grammarExamples.json',{k:[{'jp':r['ja'],'ne':r['ne']} for r in items] for k,items in lessons.items()})
write(APP/'expo-app/data/grammarAudioRefs.json',audio_refs)
write(WORK/'xlsx-rows.json',rows)
with (SRC/'文法練習例文_v2.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['theme_no','theme_title','no','ne','roman','ja','en']);w.writerows(rows)
for lang,name in [('ja','文法教材_v2_ja_ドラフト.md'),('en','grammar_guide_v2_en.md')]:
    out=['# '+bilingual('ネパール語文法教材 改訂版','Nepali grammar revised curriculum',lang),'']
    for k,bs in guides[lang].items():
        out += ['## '+k+' '+titles[lang][k],'']
        for b in bs:
            if b['type']=='table':
                out += ['| '+' | '.join(b['headers'])+' |','| '+' | '.join(['---']*len(b['headers']))+' |']
                out += ['| '+' | '.join(str(c).replace('\n','<br>').replace('|','／') for c in r)+' |' for r in b['rows']]
            else:out += [('### ' if b['type']=='h' else '')+b['text']]
            out.append('')
    (SRC/name).write_text('\n'.join(out),encoding='utf-8')
report={'version':PACK_REVISION,'topics':36,'examples':len(rows),'mainExamples':sum(len(v) for k,v in lessons.items() if int(k)<35),'reusedRecordings':sum(v in bank for v in audio_refs.values() if v is not None),'generatedRecordings':sum(v in new_recordings for v in audio_refs.values() if v is not None),'recordedExamples':sum(v is not None for v in audio_refs.values()),'textOnly':sum(v is None for v in audio_refs.values()),'byTopic':{k:len(v) for k,v in lessons.items()},'dictionaryWords':len(new_vocab['ja']),'dictionaryContexts':sum(len(v['contexts']) for v in new_vocab['ja'].values())}
write(WORK/'report.json',report)
catalog=copy.deepcopy(read(saved_catalog) if saved_catalog.exists() else read(WORK/'live/catalog.json'))
for entry in [catalog['core'],*catalog['packs']]:
    entry['version']=PACK_REVISION
    filename='core.json' if entry is catalog['core'] else f"overlay-{entry['l1']}.json"
    entry['url']='https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-v3/'+filename.replace('.json',f'-{PACK_REVISION}.json')
    entry['audioZip']=entry['audioZip'].replace('/packs-appa-v2/','/packs-appa-v3/')
    if 'sizeBytes' in entry:entry['sizeBytes']=(WORK/'release'/filename).stat().st_size
write(WORK/'release/catalog.json',catalog)
write(SRC/'grammar_pack_v3_catalog.json',catalog)
print(json.dumps(report,ensure_ascii=False))
