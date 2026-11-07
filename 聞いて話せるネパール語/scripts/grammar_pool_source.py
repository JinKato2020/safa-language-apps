"""Controlled Nepali practice patterns, with explicit bilingual contextual glosses.

No word is substituted into arbitrary prose: each pattern declares its argument
types, agreement, tense and cloze answer. The builder checks all output sentences.
"""
import re
W={}
def words(rows):
    for row in rows.strip().splitlines():
        ne,roman,ja,en=row.split('|');W[ne]=(roman,ja,en)
words('''
म|ma|私|I
हामी|hāmī|私たち|we
तपाईं|tapāī̃|あなた（敬意）|you (respectful)
तपाईंहरू|tapāī̃harū|あなたたち（敬意）|you all (respectful)
उहाँ|uhā̃|あの方（敬意）|that person (respectful)
उहाँहरू|uhā̃harū|あの方々（敬意）|those people (respectful)
ऊ|ū|彼・彼女（親しい間柄）|he/she (familiar)
उनी|unī|彼・彼女（中程度の敬意）|he/she (mid-level respect)
तिमी|timī|君（親しい相手）|you (familiar)
मैले|maile|私が（動作主）|I (agent)
हामीले|hāmīle|私たちが（動作主）|we (agents)
तपाईंले|tapāī̃le|あなたが（敬意・動作主）|you (respectful agent)
उहाँले|uhā̃le|あの方が（敬意・動作主）|that person (respectful agent)
मलाई|malāī|私に・私は（気持ちや感覚）|to me / I (experiencer)
हामीलाई|hāmīlāī|私たちに・私たちは（気持ちや感覚）|to us / we (experiencers)
तपाईंलाई|tapāī̃lāī|あなたに（敬意）|to you (respectful)
उहाँलाई|uhā̃lāī|あの方に（敬意）|to that person (respectful)
आज|āja|今日|today
भोलि|bholi|明日|tomorrow
हिजो|hijo|昨日|yesterday
अहिले|ahile|今|now
पहिले|pahile|以前|previously
बिहान|bihāna|朝|in the morning
बेलुका|belukā|夕方・晩|in the evening
सधैं|sadhaĩ|いつも|always
दिनहुँ|dinahũ|毎日|every day
यहाँ|yahā̃|ここ|here
त्यहाँ|tyahā̃|そこ・あそこ|there
सँगै|sãgai|一緒に|together
पनि|pani|も|also
यो|yo|これ・この|this
त्यो|tyo|それ・あれ・その|that
यी|yī|これらの|these
ती|tī|それらの・あれらの|those
एउटा|euṭā|1つの|one/a
दुईवटा|duīvaṭā|2つの|two
मेरो|mero|私の|my/mine
घर|ghar|家|home
घरमा|gharmā|家に・家で|at home
कोठामा|koṭhāmā|部屋に・部屋で|in the room
पुस्तकालयमा|pustakālayamā|図書館に・で|at the library
विद्यालयमा|vidyālayamā|学校に・で|at school
पसलमा|pasalmā|店に・で|at the shop
बजारमा|bajāramā|市場に・で|at the market
पार्कमा|pārkamā|公園に・で|at the park
कार्यालयमा|kāryālayamā|事務所に・で|at the office
साथी|sāthī|友達|friend
सहकर्मी|sahakarmī|同僚|coworker
विद्यार्थी|vidyārthī|学生|student
शिक्षक|śikṣak|先生|teacher
यात्रु|yātru|旅行者・乗客|traveller
कलाकार|kalākār|芸術家|artist
पत्रकार|patrakār|記者|journalist
नर्स|nars|看護師|nurse
खुसी|khusī|うれしい|happy
व्यस्त|vyasta|忙しい|busy
स्वस्थ|svastha|健康な|healthy
बिरामी|birāmī|病気の・具合の悪い|ill
तयार|tayār|準備ができた|ready
थकित|thakit|疲れた|tired
शान्त|śānta|静かな・落ち着いた|calm
चिया|ciyā|お茶|tea
कफी|kaphī|コーヒー|coffee
दूध|dūdh|牛乳|milk
पानी|pānī|水|water
जुस|jus|ジュース|juice
सुप|sup|スープ|soup
तातो|tāto|熱い・温かい|hot/warm
चिसो|ciso|冷たい・寒い|cold
मिठो|miṭho|おいしい|tasty
सफा|saphā|清潔な|clean
फोहोर|phohor|ごみ・汚れた|rubbish/dirty
सस्तो|sasto|安い|cheap
महँगो|mahãgo|高価な|expensive
राम्रो|rāmro|良い|good
सानो|sāno|小さい（男性単数）|small (masculine singular)
सानी|sānī|小さい（女性単数）|small (feminine singular)
साना|sānā|小さい（複数など）|small (plural, etc.)
ठूलो|ṭhūlo|大きい（男性単数）|big (masculine singular)
ठूली|ṭhūlī|大きい（女性単数）|big (feminine singular)
ठूला|ṭhūlā|大きい（複数など）|big (plural, etc.)
नयाँ|nayā̃|新しい|new
पुरानो|purāno|古い|old
पुराना|purānā|古い（複数など）|old (plural, etc.)
छोटो|choṭo|短い|short
लामो|lāmo|長い|long
झोला|jholā|かばん|bag
कोठा|koṭhā|部屋|room
किताब|kitāb|本|book
कापी|kāpī|ノート|notebook
पत्र|patra|手紙|letter
चिठी|ciṭhī|手紙|letter
कविता|kavitā|詩|poem
कथा|kathā|物語|story
समाचार|samācār|ニュース|news
लेख|lekh|記事|article
नाम|nām|名前|name
ठेगाना|ṭhegānā|住所|address
सन्देश|sandeś|メッセージ|message
सूची|sūcī|一覧・リスト|list
नक्सा|naksā|地図|map
टिकट|ṭikaṭ|切符|ticket
कलम|kalam|ペン|pen
स्याउ|syāu|りんご|apple
केरा|kerā|バナナ|banana
रोटी|roṭī|ロティ・平焼きパン|roti/flatbread
भात|bhāt|ご飯|cooked rice
तरकारी|tarkārī|野菜料理|vegetable curry
फलफूल|phalaphūl|果物|fruit
मासु|māsu|肉|meat
खाना|khānā|食事|meal
बाटो|bāṭo|道|road
पुल|pul|橋|bridge
गाउँ|gāũ|村|village
शहर|śahar|町|town
नेपाल|nepāl|ネパール|Nepal
पोखरा|pokharā|ポカラ|Pokhara
नेपाली|nepālī|ネパール語|Nepali
अंग्रेजी|aṃgrejī|英語|English
जापानी|jāpānī|日本語|Japanese
खेल|khel|遊び・ゲーム|game
गीत|gīt|歌|song
कहिले|kahile|いつ|when
कहाँ|kahā̃|どこ|where
किन|kina|なぜ|why
कति|kati|いくら・いくつ・どれくらい|how much/how many
कसरी|kasarī|どうやって|how
को|ko|誰|who
बाट|bāṭa|〜から（移動の出発点）|from (source of movement)
मा|mā|〜に・で|in/at
सम्म|samma|〜まで|as far as/until
सँग|sãga|〜と一緒に|with
देखि|dekhi|〜から（起点）|from/since (starting point)
भन्दा|bhandā|〜より|than
कृपया|kṛpayā|どうぞ・お願いします|please
ढोका|ḍhokā|ドア|door
झ्याल|jhyāl|窓|window
बत्ती|battī|明かり・電灯|light/lamp
छाता|chātā|傘|umbrella
आवाज|āvāj|声・音|voice/sound
फोटो|phoṭo|写真|photo
यहाँबाट|yahā̃bāṭa|ここから|from here
मन|man|気持ち（मन छ＝したい）|wish (मन छ = want)
बिस्तारै|bistārai|ゆっくり|slowly
छिटो|chiṭo|速く・早く|quickly/early
राम्रोसँग|rāmrosãga|上手に・しっかり|well/carefully
फेरि|pheri|もう一度|again
मात्र|mātra|だけ|only
तर|tara|しかし・けれど|but
र|ra|と・そして|and
किनभने|kinabhane|なぜなら|because
त्यसैले|tyasaile|だから|so/therefore
लागि|lāgi|〜のために|for the purpose of
पछि|pachi|〜の後|after
अघि|aghi|〜の前|before
जो|jo|〜する人は|whoever/the person who
जहाँ|jahā̃|〜する場所に|where
जब|jaba|〜する時に|when
त्यहीँ|tyahī̃|まさにそこに|right there
तब|taba|その時|then
उसले|usle|その人が（動作主）|that person (agent)
आफू|āphū|自分（話した本人）|self (the reported speaker)
समय|samaya|時間|time
भए|bhae|あれば・なら|if there is/if
भएपछि|bhaepachi|そうなった後で|after that happens
भएर|bhaera|そうであるので|because of being
पैसा|paisā|お金|money
बच्चालाई|baccālāī|子どもを・に|the child (affected person)
विद्यार्थीलाई|vidyārthīlāī|学生を・に|the student (affected person)
साथीलाई|sāthīlāī|友達を・に|the friend (affected person)
भाइलाई|bhāilāī|弟を・に|the younger brother (affected person)
बहिनीलाई|bahinīlāī|妹を・に|the younger sister (affected person)
छोरालाई|chorālāī|息子を・に|the son (affected person)
छोरीलाई|chorīlāī|娘を・に|the daughter (affected person)
''')

def form(ne,roman,ja,en):W[ne]=(roman,ja,en);return ne
def forms(rows):
    for row in rows:form(*row)
forms([
('हुँ','hũ','です（私・何者か）','am (I; identity)'),('हौं','haũ','です（私たち・何者か）','are (we; identity)'),('हो','ho','です（何者か）','is (identity)'),
('छु','chu','います・です（私の場所や状態）','am (I; location/state)'),('छौं','chaũ','います・です（私たちの場所や状態）','are (we; location/state)'),('छ','cha','あります・です（場所や状態）','is (location/state)'),('छन्','chan','います・あります（複数など）','are (plural, etc.)'),('छौ','chau','いる・だ（親しい相手）','are (familiar you)'),
('हुनुहुन्छ','hunuhuncha','います・です（敬意）','is/are (respectful)'),('हुनुहुन्न','hunuhunna','いません・ではありません（敬意）','is/are not (respectful)'),
('हुन्छ','huncha','なります・普段そうです','becomes/is generally'),('हुँदैन','hũdaina','なりません・普段そうではありません','does not become/is not generally'),
('पर्छ','parcha','しなければならない（前の動詞と組む）','must (with preceding verb)'),('पाइन्छ','pāincha','してもよい','is allowed'),('पाइँदैन','pāĩdaina','してはいけない','is not allowed'),
('छैन','chaina','ありません・ではありません','is not/does not exist'),('छैनन्','chainan','ありません（複数）','are not'),
])
form('मेरा','merā','私のもの（複数）','mine (plural)')
STATE_JA={'खुसी':'うれしい','व्यस्त':'忙しい','स्वस्थ':'健康','बिरामी':'具合が悪い','तयार':'準備ができている','थकित':'疲れている','शान्त':'落ち着いている'}
POOLS={i:[] for i in range(1,37)}
def add(theme,text,ja,en,target,choices,ruleja,ruleen,prefix=''):
    tokens=re.findall(r'[^\s।॥?!,;:]+',text)
    assert all(t in W for t in tokens),(theme,[t for t in tokens if t not in W])
    assert target in choices and len(set(choices))==3,(theme,target,choices)
    assert all(t in W for t in choices),(theme,choices)
    full=prefix+target
    assert full in tokens,(theme,full,text)
    if theme==4 and 'सधैं' in text and target=='हुँदैन':
        ja=ja.replace('熱くありません','熱いとは限りません').replace('冷たくありません','冷たいとは限りません').replace('おいしくありません','おいしいとは限りません')
    POOLS[theme].append(dict(ne=text,ja=ja,en=en,words=[dict(text=t,roman=W[t][0],ja=W[t][1],en=W[t][2]) for t in tokens],target=target,prefix=prefix,wordIndex=tokens.index(full),choices=[dict(form=t,roman=W[t][0]) for t in choices],ruleJa=ruleja,ruleEn=ruleen))

PEOPLE=[('म','私は','I','हुँ','छु'),('हामी','私たちは','We','हौं','छौं'),('तपाईं','あなたは','You','हुनुहुन्छ','हुनुहुन्छ'),('उहाँ','あの方は','That person','हुनुहुन्छ','हुनुहुन्छ')]
ROLES=['साथी','सहकर्मी','विद्यार्थी','शिक्षक','यात्रु','कलाकार','पत्रकार','नर्स']
PLACES=['घरमा','कोठामा','पुस्तकालयमा','विद्यालयमा','पसलमा','बजारमा','पार्कमा','कार्यालयमा']
STATES=['खुसी','व्यस्त','स्वस्थ','बिरामी','तयार','थकित','शान्त']

def plural_en(noun):
    return {'story':'stories','news':'news','address':'addresses'}.get(noun,noun+'s')

def author():
    for f,r in [('थिएँ','thiẽ'),('थियौं','thiyaũ'),('थियो','thiyo')]:form(f,r,'いました（過去の補助動詞）','was/had (past auxiliary)')
    for noun in ROLES:
        for p,j,e,ho,chha in PEOPLE:
            noun_en=W[noun][2]+('s' if p=='हामी' else '')
            add(1,f'{p} {noun} {ho}।',f'{j}{W[noun][1]}です。',f'{e} {"am" if p=="म" else "is" if p=="उहाँ" else "are"} {"" if p=="हामी" else "an " if noun=="कलाकार" else "a "}{noun_en}.',ho,['हुँ','हौं','हुनुहुन्छ'],
                '何者かを言う हो の仲間：म→हुँ、हामी→हौं、तपाईं／उहाँ→हुनुहुन्छ。','For identity: म → हुँ, हामी → हौं, तपाईं/उहाँ → हुनुहुन्छ.')
    for place in PLACES:
        for p,j,e,ho,chha in PEOPLE:
            add(2,f'{p} अहिले {place} {chha}।',f'{j}今、{W[place][1].split("に")[0]}にいます。',f'{e} {"am" if p=="म" else "is" if p=="उहाँ" else "are"} {W[place][2]} now.',chha,['छु','छौं','हुनुहुन्छ'],
                '今いる場所には छ の仲間。म→छु、हामी→छौं。敬意の तपाईं／उहाँ では हुनुहुन्छ。','For location now: म → छु, हामी → छौं; respectful तपाईं/उहाँ → हुनुहुन्छ.')
    for state in STATES:
        for p,j,e,ho,chha in PEOPLE:
            add(3,f'{p} आज {state} {chha}।',f'{j}今日、{STATE_JA[state]}です。',f'{e} {"am" if p=="म" else "is" if p=="उहाँ" else "are"} {W[state][2]} today.',chha,['छु','छौं','हुनुहुन्छ'],
                '形容詞＋छ の仲間で今の状態を伝えます。私＝छु、私たち＝छौं、敬意＝हुनुहुन्छ。','An adjective + the छ family describes a current state: I → छु, we → छौं, respectful subjects → हुनुहुन्छ.')
    # Recurring states, not a one-time observation. Different nouns supply different contexts.
    routine=[('चिया','तातो'),('कफी','तातो'),('सुप','तातो'),('पानी','चिसो'),('दूध','तातो'),('जुस','चिसो'),('खाना','मिठो')]
    for noun,adj in routine:
        for adverb,jadv,eadv,negative in [('बिहान','朝は','in the morning',False),('बेलुका','晩は','in the evening',False),('सधैं','いつも','always',False),('सधैं','いつも','always',True)]:
            answer='हुँदैन'if negative else'हुन्छ'
            add(4,f'यहाँ {adverb} {noun} {adj} {answer}।',f'ここでは{jadv}{W[noun][1]}が{W[adj][1].split("・")[0]}{"くありません" if negative else "いです"}。'.replace('熱いい','熱い').replace('冷たいい','冷たい').replace('おいしいい','おいしい').replace('熱いく','熱く').replace('冷たいく','冷たく').replace('おいしいく','おいしく'),
                f'Here, the {W[noun][2]} is {"not " if negative else ""}{"always " if adverb=="सधैं" else ""}{W[adj][2].split("/")[0]}{(" "+eadv)if adverb!="सधैं"else""}.',answer,['हुन्छ','हुँदैन','छु'],
                '繰り返す状態や一般的な傾向は हुन्छ。否定は हुँदैन。「今だけ」の状態とは区別します。','Use हुन्छ for recurring or general conditions; its negative is हुँदैन. Distinguish these from a state just now.')
    # Postposition choices expose only the suffix; the attached noun remains visible.
    for place in ['घर','कोठा','पसल','बजार','विद्यालय','पुस्तकालय','कार्यालय','अस्पताल']:
        if place not in W:
            d={'पसल':('pasal','店','shop'),'बजार':('bajār','市場','market'),'विद्यालय':('vidyālaya','学校','school'),'पुस्तकालय':('pustakālaya','図書館','library'),'कार्यालय':('kāryālaya','事務所','office'),'अस्पताल':('aspatāl','病院','hospital')}[place];form(place,*d)
        for suffix in ['बाट','सम्म','मा']:
            full=place+suffix;form(full,W[place][0]+W[suffix][0],W[place][1]+{'बाट':'から','सम्म':'まで','मा':'に'}[suffix],{'बाट':'from the ','सम्म':'as far as the ','मा':'at the '}[suffix]+W[place][2])
            verb={'बाट':'आउँछु','सम्म':'जान्छु','मा':'छु'}[suffix]
            if verb not in W:form(verb,{'आउँछु':'āũchu','जान्छु':'jānchu'}[verb],{'आउँछु':'来ます（私）','जान्छु':'行きます（私）'}[verb],{'आउँछु':'come (I)','जान्छु':'go (I)'}[verb])
            add(5,f'म {full} {verb}।',f'私は{W[full][1]}'+{'बाट':'来ます。','सम्म':'行きます。','मा':'います。'}[suffix],f'I '+{'बाट':'come ','सम्म':'go ','मा':'am '}[suffix]+W[full][2]+'.',suffix,['बाट','सम्म','मा'],
                'बाट＝移動の出発点「から」、सम्म＝到達点「まで」、मा＝場所「に・で」。名詞の後ろにつけます。','बाट marks a source of movement, सम्म an endpoint, and मा a location. Attach each after the noun.',prefix=place)
    for companion in ['साथी','सहकर्मी','शिक्षक','विद्यार्थी','यात्रु','कलाकार','पत्रकार']:
        attached=companion+'सँग';form(attached,W[companion][0]+'sãga',W[companion][1]+'と一緒に','with a '+W[companion][2])
        add(5,f'म {attached} जान्छु।',f'私は{W[companion][1]}と一緒に行きます。',f'I go with a {W[companion][2]}.','सँग',['सँग','सम्म','बाट'],'一緒に行動する相手には सँग。「〜まで」の सम्म や「〜から」の बाट と区別します。','Use सँग for an accompanying person, unlike endpoint सम्म or source बाट.',prefix=companion)
    forms([('आउनुहुन्छ','āunuhuncha','来ます（敬意）','come (respectful)'),('जानुहुन्छ','jānuhuncha','行きます（敬意）','go (respectful)'),('पढ्नुहुन्छ','paḍhnuhuncha','読んだり勉強したりします（敬意）','read/study (respectful)'),('लेख्नुहुन्छ','lekhnuhuncha','書きます（敬意）','write (respectful)'),('खानुहुन्छ','khānuhuncha','食べます（敬意）','eat (respectful)'),('बस्नुहुन्छ','basnuhuncha','住みます・座ります（敬意）','live/sit (respectful)'),('सिक्नुहुन्छ','siknuhuncha','学びます（敬意）','learn (respectful)'),('काम','kām','仕事','work'),('गर्नुहुन्छ','garnuhuncha','します（敬意）','do (respectful)')])
    for phrase,jv,ev in [('आउनुहुन्छ','来ます','come'),('जानुहुन्छ','行きます','go'),('पढ्नुहुन्छ','勉強します','study'),('लेख्नुहुन्छ','書きます','write'),('खानुहुन्छ','食べます','eat'),('बस्नुहुन्छ','座ります','sit'),('काम गर्नुहुन्छ','働きます','work'),('सिक्नुहुन्छ','学びます','learn')]:
        for q,jq,eq in [('कहिले','いつ','When'),('कहाँ','どこで','Where'),('किन','なぜ','Why')]:
            jq='どこに'if q=='कहाँ'and phrase in ['आउनुहुन्छ','जानुहुन्छ','बस्नुहुन्छ']else jq
            add(6,f'तपाईं {q} {phrase}?',f'あなたは{jq}{jv}か。',f'{eq} do you {ev}?',q,['कहिले','कहाँ','किन'],
                '時は कहिले、場所は कहाँ、理由は किन。知りたい情報に合わせて疑問詞を選びます。','Choose कहिले for time, कहाँ for place, and किन for a reason.')
    for state in STATES:
        for p,j,e,ending in [('ऊ','彼・彼女は〔親しい〕','He/she (familiar)','छ'),('उनी','彼・彼女は〔中程度の敬意〕','He/she (mid-level respect)','छन्'),('तिमी','君は〔親しい〕','You (familiar)','छौ'),('उहाँ','あの方は〔敬意〕','That person (respectful)','हुनुहुन्छ')]:
            choices=[ending,*[x for x in ['छ','छन्','छौ','हुनुहुन्छ']if x!=ending][:2]]
            add(7,f'{p} {state} {ending}।',f'{j}{STATE_JA[state]}です。',f'{e} {"are"if p=="तिमी"else"is"} {W[state][2]}.',ending,choices,
                '敬意の段階をそろえます。ऊ→छ、उनी→छन्、तिमी→छौ、उहाँ→हुनुहुन्छ。उनी はここでは1人を指します。','Match respect level: ऊ → छ, उनी → छन्, तिमी → छौ, उहाँ → हुनुहुन्छ. Here उनी refers to one person.')
    # Explicit verb paradigms, rather than suffix guessing.
    actions=[
    ('किताब','本を読む','read a book','पढ','paḍh','पढ्छु/पढ्छौं/पढ्नुहुन्छ','paḍhchu/paḍhchaũ/paḍhnuhuncha','पढ्दिनँ/पढ्दैनौं/पढ्नुहुन्न','paḍhdinã/paḍhdainaũ/paḍhnuhunna','पढ्दै','paḍhdai','पढेँ/पढ्यौं/पढ्नुभयो','paḍhẽ/paḍhyaũ/paḍhnubhayo','पढिनँ/पढेनौं/पढ्नुभएन','paḍhinã/paḍhenaũ/paḍhnubhaena','पढेको/पढेकी/पढेका/पढ्नुभएको','paḍheko/paḍhekī/paḍhekā/paḍhnubhaeko'),
    ('पत्र','手紙を書く','write a letter','लेख','lekh','लेख्छु/लेख्छौं/लेख्नुहुन्छ','lekhchu/lekhchaũ/lekhnuhuncha','लेख्दिनँ/लेख्दैनौं/लेख्नुहुन्न','lekhdinã/lekhdainaũ/lekhnuhunna','लेख्दै','lekhdai','लेखेँ/लेख्यौं/लेख्नुभयो','lekhẽ/lekhyaũ/lekhnubhayo','लेखिनँ/लेखेनौं/लेख्नुभएन','lekhinã/lekhenaũ/lekhnubhaena','लेखेको/लेखेकी/लेखेका/लेख्नुभएको','lekheko/lekhekī/lekhekā/lekhnubhaeko'),
    ('दूध','牛乳を飲む','drink milk','पिउ','piu','पिउँछु/पिउँछौं/पिउनुहुन्छ','piũchu/piũchaũ/piunuhuncha','पिउँदिनँ/पिउँदैनौं/पिउनुहुन्न','piũdinã/piũdainaũ/piunuhunna','पिउँदै','piũdai','पिएँ/पियौं/पिउनुभयो','piẽ/piyaũ/piunubhayo','पिइनँ/पिएनौं/पिउनुभएन','piinã/pienaũ/piunubhaena','पिएको/पिएकी/पिएका/पिउनुभएको','pieko/piekī/piekā/piunubhaeko'),
    ('स्याउ','りんごを食べる','eat an apple','खा','khā','खान्छु/खान्छौं/खानुहुन्छ','khānchu/khānchaũ/khānuhuncha','खाँदिनँ/खाँदैनौं/खानुहुन्न','khā̃dinã/khā̃dainaũ/khānuhunna','खाँदै','khā̃dai','खाएँ/खायौं/खानुभयो','khāẽ/khāyaũ/khānubhayo','खाइनँ/खाएनौं/खानुभएन','khāinã/khāenaũ/khānubhaena','खाएको/खाएकी/खाएका/खानुभएको','khāeko/khāekī/khāekā/khānubhaeko'),
    ('झोला','かばんを買う','buy a bag','किन','kin','किन्छु/किन्छौं/किन्नुहुन्छ','kinchu/kinchaũ/kinnuhuncha','किन्दिनँ/किन्दैनौं/किन्नुहुन्न','kindinã/kindainaũ/kinnuhunna','किन्दै','kindai','किनेँ/किन्यौं/किन्नुभयो','kinẽ/kinyaũ/kinnubhayo','किनिनँ/किनेनौं/किन्नुभएन','kininã/kinenaũ/kinnubhaena','किनेको/किनेकी/किनेका/किन्नुभएको','kineko/kinekī/kinekā/kinnubhaeko'),
    ('नेपाली','ネパール語を学ぶ','learn Nepali','सिक','sik','सिक्छु/सिक्छौं/सिक्नुहुन्छ','sikchu/sikchaũ/siknuhuncha','सिक्दिनँ/सिक्दैनौं/सिक्नुहुन्न','sikdinã/sikdainaũ/siknuhunna','सिक्दै','sikdai','सिकेँ/सिक्यौं/सिक्नुभयो','sikẽ/sikyaũ/siknubhayo','सिकिनँ/सिकेनौं/सिक्नुभएन','sikinã/sikenaũ/siknubhaena','सिकेको/सिकेकी/सिकेका/सिक्नुभएको','sikeko/sikekī/sikekā/siknubhaeko'),
    ('खेल','ゲームをする','play a game','खेल','khel','खेल्छु/खेल्छौं/खेल्नुहुन्छ','khelchu/khelchaũ/khelnuhuncha','खेल्दिनँ/खेल्दैनौं/खेल्नुहुन्न','kheldinã/kheldainaũ/khelnuhunna','खेल्दै','kheldai','खेलेँ/खेल्यौं/खेल्नुभयो','khelẽ/khelyaũ/khelnubhayo','खेलिनँ/खेलेनौं/खेल्नुभएन','khelinã/khelenaũ/khelnubhaena','खेलेको/खेलेकी/खेलेका/खेल्नुभएको','kheleko/khelekī/khelekā/khelnubhaeko')]
    # Natural Japanese predicate forms are authored separately from dictionary glosses.
    jpverbs=[('読みます','読みません','読んでいます','読みました','読みませんでした','読む','読んだ'),('書きます','書きません','書いています','書きました','書きませんでした','書く','書いた'),('飲みます','飲みません','飲んでいます','飲みました','飲みませんでした','飲む','飲んだ'),('食べます','食べません','食べています','食べました','食べませんでした','食べる','食べた'),('買います','買いません','買っています','買いました','買いませんでした','買う','買った'),('学びます','学びません','学んでいます','学びました','学びませんでした','学ぶ','学んだ'),('します','しません','しています','しました','しませんでした','する','した')]
    epast=['read','written','drunk','eaten','bought','learnt','played'];esimple=['read','wrote','drank','ate','bought','learnt','played'];eing=['reading','writing','drinking','eating','buying','learning','playing']
    form('बेलुकासम्म','belukāsamma','晩までに','by the evening')
    for ai,a in enumerate(actions):
        obj,jverb,everb,stem,srom,present,prom,negative,nrom,ing,irom,past,pastrom,pastneg,pnrom,perfect,pfrom=a
        pres=present.split('/');neg=negative.split('/');pa=past.split('/');pn=pastneg.split('/');pf=perfect.split('/')
        for fs,rs,meaning,emeaning in [(present,prom,jpverbs[ai][0],everb),(negative,nrom,jpverbs[ai][1],'do not '+everb),(past,pastrom,jpverbs[ai][3],esimple[ai]+' '+everb.split(' ',1)[1]),(pastneg,pnrom,jpverbs[ai][4],'did not '+everb),(perfect,pfrom,jpverbs[ai][6]+'（完了の形）',epast[ai])]:
            for f,r in zip(fs.split('/'),rs.split('/')):form(f,r,meaning,emeaning)
        form(ing,irom,jpverbs[ai][2].replace('います',''),'ongoing '+everb)
        future=[stem+'्नेछु'if stem[-1]!='ा'and stem!='पिउ'else stem+'नेछु',stem+'्नेछौं'if stem[-1]!='ा'and stem!='पिउ'else stem+'नेछौं',stem+'्नुहुनेछ'if stem[-1]!='ा'and stem!='पिउ'else stem+'नुहुनेछ']
        # Stem endings are explicit: पढ/लेख/किन/सिक/खेल + ्न; खा/पिउ + न.
        for f,r in zip(future,[srom+'nechu',srom+'nechaũ',srom+'nuhunecha']):form(f,r,jpverbs[ai][5]+'つもりです','will '+everb)
        for pi,(p,j,e,ho,chha) in enumerate(PEOPLE):
            vi=min(pi,2);agent=['मैले','हामीले','तपाईंले','उहाँले'][pi];jobj=W[obj][1].split('・')[0]
            third=pi==3
            base_en=everb if not third else {'read a book':'reads a book','write a letter':'writes a letter','drink milk':'drinks milk','eat an apple':'eats an apple','buy a bag':'buys a bag','learn Nepali':'learns Nepali','play a game':'plays a game'}[everb]
            add(8,f'{p} बिहान {obj} {pres[vi]}।',f'{j}朝、{jobj}を{jpverbs[ai][0]}',f'{e} {base_en} in the morning.',pres[vi],pres,'現在の動作・習慣も主語で語尾が変わります。म は -छु、हामी は -छौं、敬意の主語は -नुहुन्छ。','Present actions and routines agree with the subject: म → -छु, हामी → -छौं, respectful subjects → -नुहुन्छ.')
            add(9,f'{p} बिहान {obj} {neg[vi]}।',f'{j}朝、{jobj}を{jpverbs[ai][1]}',f'{e} {"does"if third else"do"} not {everb} in the morning.',neg[vi],neg,'現在の否定を主語に合わせます。म は -दिनँ、हामी は -दैनौं の仲間、敬意の形は -नुहुन्न。母音を含む動詞では語幹の形にも注意。','Match a present negative to its subject: the -दिनँ family with म, -दैनौं with हामी, and -नुहुन्न for respect. Vowel-stem verbs also change within the stem.')
            add(10,f'{p} अहिले {obj} {ing} {chha}।',f'{j}今、{jobj}を{jpverbs[ai][2]}',f'{e} {"am"if pi==0 else"is"if third else"are"} {eing[ai]} {everb.split(" ",1)[1]} now.',chha,['छु','छौं','हुनुहुन्छ'],'進行形は -दै/-तै＋छ の仲間。後ろの形を主語に合わせます。','An ongoing action uses -दै/-तै plus the छ family, with the auxiliary agreeing with the subject.')
            add(11,f'{agent} हिजो {obj} {pa[vi]}।',f'{j}昨日、{jobj}を{jpverbs[ai][3]}',f'{e} {esimple[ai]} {everb.split(" ",1)[1]} yesterday.',agent,['मैले','हामीले','उहाँले']if pi!=2 else['तपाईंले','मैले','हामीले'],'他動詞の完了過去では動作主に ले をつけます。म→मैले、हामी→हामीले、तपाईं→तपाईंले、उहाँ→उहाँले。','Completed transitive actions mark the agent with ले: म → मैले, हामी → हामीले, तपाईं → तपाईंले, उहाँ → उहाँले.')
            add(12,f'{agent} हिजो {obj} {pn[vi]}।',f'{j}昨日、{jobj}を{jpverbs[ai][4]}',f'{e} did not {everb} yesterday.',pn[vi],pn,'過去の否定も主語に合わせます。私の -इनँ、私たちの -एनौं、敬意の -नुभएन を比べます。','Compare past negatives: the first-person -इनँ family, plural -एनौं, and respectful -नुभएन.')
            add(13,f'{p} भोलि {obj} {future[vi]}।',f'{j}明日、{jobj}を{jpverbs[ai][5]}つもりです。',f'{e} will {everb} tomorrow.',future[vi],future,'-नेछु は私、-नेछौं は私たち、-नुहुनेछ は敬意を表す未来の形です。','Future forms agree with the subject: -नेछु for I, -नेछौं for we, -नुहुनेछ for respectful subjects.')
        for gi,(agent,j,e,ending,pfindex) in enumerate([('मैले','私は〔男性話者〕','I (male speaker)','छु',0),('मैले','私は〔女性話者〕','I (female speaker)','छु',1),('हामीले','私たちは','We','छौं',2),('उहाँले','あの方は','That person','छ',3)]):
            pword=pf[pfindex];choices=[pword,*[f for f in pf if f!=pword][:2]]
            add(15,f'{agent} {obj} {pword} {ending}।',f'{j}{W[obj][1].split("・")[0]}を{jpverbs[ai][6]}ことがあります。',f'{e} {"has"if gi==3 else"have"} {epast[ai]} {everb.split(" ",1)[1]}.',pword,choices,'完了・経験は -एको＋छ の仲間。男性単数 -एको、女性単数 -एकी、複数 -एका、敬意 -नुभएको を、話す人・相手に合わせます。','Perfect/experience uses the -एको family + छ: masculine -एको, feminine -एकी, plural -एका, respectful -नुभएको.')
            aux=['थिएँ','थिएँ','थियौं','थियो'][gi];form(aux,['thiẽ','thiẽ','thiyaũ','thiyo'][gi],'いました（過去の補助動詞）','was/had (past auxiliary)')
            add(16,f'{agent} हिजो बेलुकासम्म {obj} {pword} {aux}।',f'{j}昨日の晩までに、すでに{W[obj][1].split("・")[0]}を{["読んで","書いて","飲んで","食べて","買って","学んで","して"][ai]}いました。',f'By yesterday evening, {e[0].lower()+e[1:] if gi!=0 and gi!=1 else e} had {epast[ai]} {everb.split(" ",1)[1]}.',aux,['थिएँ','थियौं','थियो'],'過去のある時点までに済んだことは、完了の形＋थियो の仲間。私は थिएँ、私たちは थियौं。敬意の -नुभएको の後ろは थियो です。','For completion before a past reference time, use a perfect form + the थियो family: I → थिएँ, we → थियौं, respectful -नुभएको → थियो.')
    for place in PLACES:
        for p,j,e,ending,roman in [('म','私は','I','बस्थें','basthẽ'),('हामी','私たちは','We','बस्थ्यौं','basthyaũ'),('तपाईं','あなたは','You','बस्नुहुन्थ्यो','basnuhunthyo'),('उहाँ','あの方は','That person','बस्नुहुन्थ्यो','basnuhunthyo')]:
            form(ending,roman,'普段いました（過去の習慣）','used to stay')
        for p,j,e,ending in [('म','私は','I','बस्थें'),('हामी','私たちは','We','बस्थ्यौं'),('तपाईं','あなたは','You','बस्नुहुन्थ्यो'),('उहाँ','あの方は','That person','बस्नुहुन्थ्यो')]:
            add(14,f'{p} पहिले {place} {ending}।',f'{j}以前、{W[place][1].split("に")[0]}で過ごしていました。',f'{e} used to stay {W[place][2]}.',ending,['बस्थें','बस्थ्यौं','बस्नुहुन्थ्यो'],'以前よくしていたことは過去の習慣形。बस्नु は म→बस्थें、हामी→बस्थ्यौं、敬意→बस्नुहुन्थ्यो。','Use the past habitual for former routines: बस्नु becomes बस्थें with म, बस्थ्यौं with हामी, and बस्नुहुन्थ्यो for respect.')
    requests=[('ढोका','खोल्नुहोस्','kholnuhos','खोल्नुहुन्छ','kholnuhuncha','खोल्छु','kholchu','ドアを開けて','open the door'),('झ्याल','खोल्नुहोस्','kholnuhos','खोल्नुहुन्छ','kholnuhuncha','खोल्छु','kholchu','窓を開けて','open the window'),('किताब','पढ्नुहोस्','paḍhnuhos','पढ्नुहुन्छ','paḍhnuhuncha','पढ्छु','paḍhchu','本を読んで','read the book'),('नाम','लेख्नुहोस्','lekhnuhos','लेख्नुहुन्छ','lekhnuhuncha','लेख्छु','lekhchu','名前を書いて','write the name'),('ठेगाना','लेख्नुहोस्','lekhnuhos','लेख्नुहुन्छ','lekhnuhuncha','लेख्छु','lekhchu','住所を書いて','write the address'),('पानी','पिउनुहोस्','piunuhos','पिउनुहुन्छ','piunuhuncha','पिउँछु','piũchu','水を飲んで','drink the water'),('खाना','खानुहोस्','khānuhos','खानुहुन्छ','khānuhuncha','खान्छु','khānchu','食事をして','eat the meal')]
    for obj,imper,ir,pres,pr,first,fr,jverb,ev in requests:
        for f,r,jj,ee in [(imper,ir,jverb+'ください','please '+ev),(pres,pr,'します（敬意）','does (respectful)'),(first,fr,'します（私）','do (I)')]:form(f,r,jj,ee)
        for adv,jaadv,enadv in [('बिस्तारै','ゆっくり','slowly'),('अहिले','今','now'),('यहाँ','ここで','here'),('फेरि','もう一度','again')]:
            add(17,f'कृपया {adv} {obj} {imper}।',f'どうぞ{jaadv}{jverb}ください。',f'Please {ev} {enadv}.',imper,[imper,pres,first],'丁寧な依頼は -नुहोस्。説明する現在形 -नुहुन्छ や私の -छु と区別します。','A polite request uses -नुहोस्. Distinguish it from descriptive -नुहुन्छ and first-person -छु.')
    invites=[('किताब','पढौं','paḍhaũ','पढ्छौं','paḍhchaũ','पढ्नुहोस्','paḍhnuhos','本を読み','read a book'),('पत्र','लेखौं','lekhaũ','लेख्छौं','lekhchaũ','लेख्नुहोस्','lekhnuhos','手紙を書き','write a letter'),('चिया','पिऔं','piaũ','पिउँछौं','piũchaũ','पिउनुहोस्','piunuhos','お茶を飲み','drink tea'),('खाना','खाऔं','khāaũ','खान्छौं','khānchaũ','खानुहोस्','khānuhos','食事をし','eat a meal'),('खेल','खेलौं','khelaũ','खेल्छौं','khelchaũ','खेल्नुहोस्','khelnuhos','ゲームをし','play a game'),('नेपाली','सिकौं','sikaũ','सिक्छौं','sikchaũ','सिक्नुहोस्','siknuhos','ネパール語を学び','learn Nepali'),('गीत','गाऔं','gāaũ','गाउँछौं','gāũchaũ','गाउनुहोस्','gāunuhos','歌を歌い','sing a song')]
    for obj,v,r,p,pr,i,ir,jv,ev in invites:
        for f,rom,jj,ee in [(v,r,jv+'ましょう','let us '+ev),(p,pr,jv+'ます（私たち）','we '+ev),(i,ir,'してください（敬意）','please do')]:form(f,rom,jj,ee)
        for adv,jaadv,enadv in [('सँगै','一緒に','together'),('यहाँ','ここで','here'),('अहिले','今','now'),('भोलि','明日','tomorrow')]:
            add(18,f'हामी {adv} {obj} {v}।',f'{jaadv}{jv}ましょう。',f'Let us {ev} {enadv}.',v,[v,p,i],'一緒にしようという誘いは -औं の形。私たちの習慣 -छौं、相手への依頼 -नुहोस् とは違います。','Use -औं for “let us”. Distinguish it from habitual “we” forms in -छौं and requests in -नुहोस्.')
    prohibitions=[('फोहोर','फाल्नुहोस्','phālnuhos','ごみを捨て','litter'),('फोटो','खिच्नुहोस्','khicnuhos','写真を撮ら','take photos'),('ढोका','खोल्नुहोस्','kholnuhos','ドアを開け','open the door'),('झ्याल','खोल्नुहोस्','kholnuhos','窓を開け','open the window'),('बत्ती','निभाउनुहोस्','nibhāunuhos','明かりを消さ','turn off the light'),('आवाज','गर्नुहोस्','garnuhos','音を立て','make noise'),('खाना','खानुहोस्','khānuhos','食事をし','eat food')]
    for obj,imp,rom,jv,ev in prohibitions:
        negative='न'+imp;form(imp,rom,'してください','please '+ev);form(negative,'na'+rom,'しないでください','please do not '+ev)
        descriptive=imp.replace('होस्','हुन्छ');form(descriptive,rom.replace('hos','huncha'),'します（敬意）','does (respectful)')
        for loc,jl,el in [('यहाँ','ここで','here'),('कोठामा','部屋で','in the room'),('विद्यालयमा','学校で','at school'),('पसलमा','店で','in the shop')]:
            add(19,f'{loc} {obj} {negative}।',f'{jl}{jv}ないでください。',f'Please do not {ev} {el}.',negative,[negative,imp,descriptive],'丁寧な禁止は、依頼形の前に न をつけた न…नुहोस्。न があるかで意味が逆になります。','A polite prohibition adds न before the request form: न…नुहोस्. Adding न reverses the meaning.')
    infinitives=[('नेपाली','पढ्न','paḍhna','ネパール語を読む','read Nepali'),('पत्र','लेख्न','lekhna','手紙を書く','write a letter'),('गीत','गाउन','gāuna','歌を歌う','sing a song'),('खाना','पकाउन','pakāuna','料理を作る','cook a meal'),('साइकल','चलाउन','calāuna','自転車に乗る','ride a bicycle'),('फोटो','खिच्न','khicna','写真を撮る','take a photo'),('अंग्रेजी','बोल्न','bolna','英語を話す','speak English')]
    form('साइकल','sāikal','自転車','bicycle')
    for obj,inf,rom,jv,ev in infinitives:
        form(inf,rom,jv+'こと','to '+ev)
    for f,r,j,e in [('सक्छु','sakchu','できます（私）','can (I)'),('सक्छौं','sakchaũ','できます（私たち）','can (we)'),('सक्नुहुन्छ','saknuhuncha','できます（敬意）','can (respectful)')]:form(f,r,j,e)
    for obj,inf,rom,jv,ev in infinitives:
        for pi,(p,j,e,_,__) in enumerate(PEOPLE):
            v=['सक्छु','सक्छौं','सक्नुहुन्छ','सक्नुहुन्छ'][pi]
            add(20,f'{p} {obj} {inf} {v}।',f'{j}{jv}ことができます。',f'{e} can {ev}.',v,['सक्छु','सक्छौं','सक्नुहुन्छ'],'能力は動詞の -न 形＋सक्नु。後ろを主語に合わせて सक्छु／सक्छौं／सक्नुहुन्छ にします。','Ability uses a verb’s -न form + सक्नु. Match the auxiliary: सक्छु, सक्छौं, or respectful सक्नुहुन्छ.')
        for aux,jend,ehead in [('पाइन्छ','てもよいです','You are allowed to'),('पाइँदैन','てはいけません','You are not allowed to'),('पर्छ','なければなりません','You must')]:
            # Complete Japanese constructions are explicit for each verb.
            je={'पढ्न':('ネパール語を読んでもよいです','ネパール語を読んではいけません','ネパール語を読まなければなりません'),'लेख्न':('手紙を書いてもよいです','手紙を書いてはいけません','手紙を書かなければなりません'),'गाउन':('歌を歌ってもよいです','歌を歌ってはいけません','歌を歌わなければなりません'),'पकाउन':('料理を作ってもよいです','料理を作ってはいけません','料理を作らなければなりません'),'चलाउन':('自転車に乗ってもよいです','自転車に乗ってはいけません','自転車に乗らなければなりません'),'खिच्न':('写真を撮ってもよいです','写真を撮ってはいけません','写真を撮らなければなりません'),'बोल्न':('英語を話してもよいです','英語を話してはいけません','英語を話さなければなりません')}[inf][['पाइन्छ','पाइँदैन','पर्छ'].index(aux)]
            add(21,f'यहाँ {obj} {inf} {aux}।','ここでは'+je+'。',f'{ehead} {ev} here.',aux,['पाइन्छ','पाइँदैन','पर्छ'],'-न＋पाइन्छ は許可、पाइँदैन は禁止、पर्छ は義務。できる能力の सक्छु とは区別します。','After -न, पाइन्छ means allowed, पाइँदैन means not allowed, and पर्छ means must. These differ from ability with सक्नु.')
        for p,j,e in [('मलाई','私は','I'),('हामीलाई','私たちは','We'),('तपाईंलाई','あなたは','You'),('उहाँलाई','あの方は','That person')]:
            add(22,f'{p} {obj} {inf} मन छ।',f'{j}{dict(zip([x[1] for x in infinitives],["ネパール語を読みたい","手紙を書きたい","歌を歌いたい","料理を作りたい","自転車に乗りたい","写真を撮りたい","英語を話したい"]))[inf]}です。',f'{e} {"wants"if p=="उहाँलाई"else"want"} to {ev}.',p,[p,*[x for x in ['मलाई','हामीलाई','उहाँलाई']if x!=p][:2]],'希望は「気持ちの持ち主＋लाई」「動詞の -न 形」「मन छ」。人を बदलえても मन छ は同じです。'.replace('बदलえて','変えて'),'For a wish, use the experiencer + लाई, a verb in -न, and मन छ. मन छ stays the same when the person changes.')
    for noun in ['झोला','कोठा','किताब','नक्सा','छाता','कलम','टिकट']:
        plural=noun+'हरू';form(plural,W[noun][0]+'harū',W[noun][1]+'（複数）',W[noun][2]+'s')
        add(23,f'यो सानो {noun} मेरो हो।',f'この小さな{W[noun][1]}は私のものです。',f'This small {W[noun][2]} is mine.','सानो',['सानो','सानी','साना'],'男性単数の名詞には सानो、女性単数には सानी、複数には साना。形の変わる形容詞を名詞に合わせます。','Match an inflecting adjective to the noun: masculine singular सानो, feminine singular सानी, plural साना.')
        form('हुन्','hun','です（複数の物）','are (plural objects)')
        add(23,f'यी साना {plural} मेरा हुन्।',f'これらの小さな{W[noun][1]}は私のものです。',f'These small {W[noun][2]}s are mine.','साना',['सानो','सानी','साना'],'यी と名詞の -हरू は複数。形容詞も साना、所有の形も मेरा にそろえます。','यी and the noun ending -हरू indicate plural. Match the adjective साना and possessive मेरा.')
    for adv,jadv,eadv in [('आज','今日','today'),('अहिले','今','now'),('यहाँ','ここで','here'),('त्यहाँ','そこで','there'),('बिहान','朝','in the morning'),('बेलुका','晩','in the evening'),('सधैं','いつも','always')]:
        form('केटी','keṭī','女の子','girl')
        add(23,f'यो सानी केटी {adv} खुसी छ।',f'この小さな女の子は{jadv}うれしそうです。',f'This little girl is {"always "if adv=="सधैं"else""}happy{(" "+eadv)if adv!="सधैं"else""}.','सानी',['सानो','सानी','साना'],'केटी（女の子）は女性単数なので、सानो ではなく सानी。','केटी (girl) is feminine singular, so use सानी rather than सानो.')
    for obj,inf,rom,jv,ev in infinitives:
        v=inf+'ुहुन्छ';vr=rom+'uhuncha';form(v,vr,jv+'（敬意）',ev+' (respectful)')
        for adv,jadv,eadv in [('बिस्तारै','ゆっくり','slowly'),('छिटो','速く','quickly'),('फेरि','もう一度','again')]:
            add(24,f'उहाँ {adv} {obj} {v}।',f'あの方は{jadv}{jv}。',f'That person {ev.split(" ",1)[0]+("es"if ev.startswith("teach")else"s")} {ev.split(" ",1)[1]} {eadv}.',adv,['बिस्तारै','छिटो','फेरि'],'副詞は動作の様子や繰り返しを示します。बिस्तारै＝ゆっくり、छिटो＝速く、फेरि＝もう一度。主語に合わせた活用はしません。','Adverbs describe manner or repetition: बिस्तारै slowly, छिटो quickly, फेरि again. They do not agree with the subject.')
    for noun in ['झोला','कोठा','किताब','नक्सा','छाता','गाउँ','घर']:
        form('त्योभन्दा','tyobhandā','あれより','than that');form('त्योजत्तिकै','tyojattikai','あれと同じくらい','as … as that');form('जत्तिकै','jattikai','同じくらい','as … as');form('सबैभन्दा','sabaibhandā','最も・一番','the most');form('अलि','ali','少し','a little');form('धेरै','dherai','とても・たくさん','very/much')
        for adj,jadj,eadj in [('सानो','小さい','smaller'),('ठूलो','大きい','bigger')]:
            add(25,f'यो {noun} त्योभन्दा {adj} छ।',f'この{W[noun][1]}はあれより{jadj}です。',f'This {W[noun][2]} is {eadj} than that one.','भन्दा',['भन्दा','सम्म','बाट'],'比較の相手＋भन्दा で「〜より」。形容詞自体を英語のような比較級に変える必要はありません。','Attach भन्दा to the comparison standard for “than”. The adjective itself does not need a comparative ending.',prefix='त्यो')
        add(25,f'यो {noun} सबैभन्दा सानो छ।',f'この{W[noun][1]}は一番小さいです。',f'This {W[noun][2]} is the smallest.','सबैभन्दा',['सबैभन्दा','अलि','धेरै'],'सबैभन्दा は「全てより」から「一番・最も」。अलि（少し）や धेरै（とても）と区別します。','सबैभन्दा literally compares with all: “the most”. Distinguish it from अलि (a little) and धेरै (very).')
        add(25,f'यो {noun} त्योजत्तिकै ठूलो छ।',f'この{W[noun][1]}はあれと同じくらい大きいです。',f'This {W[noun][2]} is as big as that one.','जत्तिकै',['जत्तिकै','भन्दा','सम्म'],'同じ程度なら जत्तिकै。त्योजत्तिकै＝あれと同じくらい。大小の差を言う भन्दा とは別です。','For equal degree use जत्तिकै: त्योजत्तिकै means “as … as that”, unlike भन्दा for a difference.',prefix='त्यो')
    for noun in ['किताब','झोला','कोठा','नक्सा','छाता','कलम','टिकट']:
        add(26,f'यो {noun} महँगो छ तर राम्रो छ।',f'この{W[noun][1]}は高いですが、良いです。',f'This {W[noun][2]} is expensive but good.','तर',['तर','र','किनभने'],'逆の方向の内容を続ける「けれど」は तर。単なる追加の र や理由の किनभने と区別します。','तर connects a contrast (“but”), unlike additive र (“and”) or reason-giving किनभने (“because”).')
    for obj in ['पत्र','कविता','कथा','समाचार','लेख','नाम','सन्देश']:
        add(26,f'म {obj} पढ्छु र लेख्छु।',f'私は{W[obj][1]}を読み、そして書きます。',f'I read and write {plural_en(W[obj][2])}.','र',['र','तर','किनभने'],'र は名詞同士だけでなく、動作や文も「そして」でつなげます。','र can connect actions and clauses as “and”, as well as connecting nouns.')
    form('बस्छु','baschu','います・過ごします（私）','stay (I)')
    for state in ['बिरामी','थकित','व्यस्त']:
        for cause_first in [True,False]:
            ne=f'म {state} छु त्यसैले म घरमा बस्छु।'if cause_first else f'म घरमा बस्छु किनभने म {state} छु।'
            jstate={'बिरामी':'具合が悪い','थकित':'疲れている','व्यस्त':'忙しい','खुसी':'うれしい'}[state]
            ja=f'私は{jstate}です。だから家で過ごします。'if cause_first else f'私は家で過ごします。なぜなら{jstate}からです。'
            en=f'I am {W[state][2]}, so I stay at home.'if cause_first else f'I stay at home because I am {W[state][2]}.'
            target='त्यसैले'if cause_first else'किनभने'
            add(26,ne,ja,en,target,['त्यसैले','किनभने','तर'],'理由→結果なら त्यसैले（だから）。結果を先に言って理由を続けるなら किनभने（なぜなら）。','Use त्यसैले for reason → result (“so”), and किनभने when a reason follows a result (“because”).')
    form('पिएपछि','piepachi','飲んだ後で','after drinking');form('पिउँदै','piũdai','飲みながら','while drinking');form('पिउन','piuna','飲むこと・飲みに','to drink')
    for drink in ['चिया','कफी','दूध','पानी','जुस','सुप']:
        for target,jpart,epart in [('पिएपछि','飲んでから','after drinking'),('पिउँदै','飲みながら','while drinking')]:
            for obj,v,jv,ev in [('किताब','पढ्छु','本を読みます','read a book'),('पत्र','लेख्छु','手紙を書きます','write a letter')]:
                add(27,f'{drink} {target} म {obj} {v}।',f'私は{W[drink][1]}を{jpart}{jv}。',f'I {ev} {epart} {W[drink][2]}.',target,['पिएपछि','पिउँदै','पिउन'],'-एपछि は先に終えた後、-दै/-तै は同時に「〜しながら」。動作の前後関係で選びます。','-एपछि means after completing an action; -दै/-तै expresses simultaneous “while”. Choose by the timing of the actions.')
    for obj,inf,rom,jv,ev in infinitives:
        purpose=inf+'को';form(purpose,rom+'ko',jv+'ことの（लागि と組む）','to '+ev+' (before लागि)')
        for p,j,e,perf,pr,aux in [('म','私は〔男性話者〕','I (male speaker)','आएको','āeko','हुँ'),('म','私は〔女性話者〕','I (female speaker)','आएकी','āekī','हुँ'),('हामी','私たちは','We','आएका','āekā','हौं'),('उहाँ','あの方は','That person','आउनुभएको','āunubhaeko','हो')]:
            form(perf,pr,'来た（完了・説明の形）','come (perfect/explanatory)')
            add(28,f'{p} {obj} {purpose} लागि यहाँ {perf} {aux}।',f'{j}{jv}ためにここへ来たのです。',f'{e} came here to {ev}.','लागि',['लागि','पछि','अघि'],'動詞の -नको लागि は「〜するために」。目的を、した後の पछि やする前の अघि と区別します。','The verb ending -नको लागि expresses purpose (“in order to”), distinct from पछि (after) and अघि (before).')
    form('सिक्छ','sikcha','学ぶ','learns');form('सिक्छौं','sikchaũ','学びます（私たち）','learn (we)');form('जान्छौं','jānchaũ','行きます（私たち）','go (we)')
    for obj,inf,rom,jv,ev in infinitives:
        # Third-person present stems are explicitly paired with their infinitive.
        verb,vr={'पढ्न':('पढ्छ','paḍhcha'),'लेख्न':('लेख्छ','lekhcha'),'गाउन':('गाउँछ','gāũcha'),'पकाउन':('पकाउँछ','pakāũcha'),'चलाउन':('चलाउँछ','calāũcha'),'खिच्न':('खिच्छ','khiccha'),'बोल्न':('बोल्छ','bolcha')}[inf];form(verb,vr,jv,ev)
        add(29,f'जो {obj} {verb} उसले सिक्छ।',f'{jv}人は学びます。',f'Whoever {ev.split(" ",1)[0]+"s"} {ev.split(" ",1)[1]} learns.','जो',['जो','जहाँ','जब'],'人を表す जो は、後ろの उसले（その人が）と対応します。場所の जहाँ、時の जब と区別します。','Relative जो refers to a person and pairs here with उसले. Distinguish place कहाँ/जहाँ and time कहिले/जब.')
        hv=inf+'ुहुन्छ'
        add(29,f'जब उहाँ {obj} {hv} तब हामी सिक्छौं।',f'あの方が{jv}時、私たちは学びます。',f'When that person {ev.split(" ",1)[0]+"s"} {ev.split(" ",1)[1]}, we learn.','जब',['जो','जहाँ','जब'],'जब…तब… は「〜する時、その時…」。人や場所ではなく、時を受ける組み合わせです。','जब … तब … pairs “when … then …”. It refers to time, not a person or place.')
    for place in ['विद्यालय','पुस्तकालय','पसल','बजार','कार्यालय','पार्क','घर']:
        if place=='पार्क':form(place,'pārk','公園','park')
        add(29,f'जहाँ {place} छ हामी त्यहीँ जान्छौं।',f'{W[place][1]}がある場所に、私たちは行きます。',f'We go to where the {W[place][2]} is.','जहाँ',['जो','जहाँ','जब'],'जहाँ…त्यहीँ… は「〜がある場所、まさにそこへ」。疑問の कहाँ と関係表現の जहाँ を混ぜません。','जहाँ … त्यहीँ … refers to a place and points back to it. Distinguish interrogative कहाँ from relative जहाँ.')
    form('फुर्सद','phursad','暇・自由な時間','free time')
    for obj,inf,rom,jv,ev in infinitives:
        future={'पढ्न':('पढ्नेछु','paḍhnechu'),'लेख्न':('लेख्नेछु','lekhnechu'),'गाउन':('गाउनेछु','gāunechu'),'पकाउन':('पकाउनेछु','pakāunechu'),'चलाउन':('चलाउनेछु','calāunechu'),'खिच्न':('खिच्नेछु','khicnechu'),'बोल्न':('बोल्नेछु','bolnechu')}[inf];form(future[0],future[1],jv+'つもりです','will '+ev)
        for condition,jc,ec in [('समय','時間','time'),('फुर्सद','暇・自由な時間','free time')]:
            for adv,jadv,eadv in [('आज','今日','today'),('भोलि','明日','tomorrow')]:
                add(30,f'{adv} {condition} भए म {obj} {future[0]}।',f'{jadv}{jc}があれば、私は{jv}つもりです。',f'If there is {ec} {eadv}, I will {ev}.','भए',['भए','भएपछि','भएर'],'条件の भए＝あれば。भएपछि はそうなった後、भएर はそうであるので。時・理由・条件を区別します。','भए introduces a condition (“if there is”). भएपछि means after that happens; भएर links a cause/circumstance.')
    form('हुनुहोला','hunuholā','でしょう（敬意・推量）','probably is/are (respectful)');form('होला','holā','でしょう（推量）','probably is');form('नहोला','naholā','ではないでしょう（推量）','probably is not')
    for state in STATES:
        for p,j,e in [('उहाँ','あの方は','That person'),('तपाईं','あなたは','You')]:
            add(31,f'{p} आज {state} हुनुहोला।',f'{j}今日、{STATE_JA[state]}でしょう。',f'{e} {"is"if p=="उहाँ"else"are"} probably {W[state][2]} today.','हुनुहोला',['हुनुहोला','हुनुहुन्छ','हुनुहुन्न'],'敬意のある人についての推量は हुनुहोला。「です」と断定する हुनुहुन्छ、「ではない」の हुनुहुन्न と違います。','Respectful conjecture uses हुनुहोला, unlike a statement of fact with हुनुहुन्छ or a negative statement with हुनुहुन्न.')
    for noun,adj in routine:
        add(31,f'यो {noun} {adj} होला।',f'この{W[noun][1]}は{W[adj][1].split("・")[0]}でしょう。',f'This {W[noun][2]} is probably {W[adj][2].split("/")[0]}.','होला',['होला','छ','छैन'],'होला は「たぶん〜だろう」という推量。現在の状態を断定する छ と確かさが違います。','होला signals a conjecture (“probably”), unlike छ for stating a current condition as fact.')
    passives=[('किताब','पढिन्छ','paḍhincha','पढ्छु','पढ्नुहुन्छ','本が読まれ','books are read'),('पत्र','लेखिन्छ','lekhincha','लेख्छु','लेख्नुहुन्छ','手紙が書かれ','letters are written'),('खाना','पकाइन्छ','pakāincha','पकाउँछु','पकाउनुहुन्छ','料理が作られ','food is cooked'),('चिया','पिइन्छ','piincha','पिउँछु','पिउनुहुन्छ','お茶が飲まれ','tea is drunk'),('रोटी','खाइन्छ','khāincha','खान्छु','खानुहुन्छ','ロティが食べられ','roti is eaten'),('नेपाली','बोलिन्छ','bolincha','बोल्छु','बोल्नुहुन्छ','ネパール語が話され','Nepali is spoken'),('खेल','खेलिन्छ','khelincha','खेल्छु','खेल्नुहुन्छ','ゲームが行われ','games are played')]
    for obj,v,rom,first,honor,jv,ev in passives:
        form(v,rom,'行われます（受身・非人称の形）',ev)
        if first not in W:
            fr={'पकाउँछु':'pakāũchu','बोल्छु':'bolchu'}[first];form(first,fr,'します（私）','do (I)')
        for place,jplace,eplace in [('यहाँ','ここで','here'),('त्यहाँ','そこで','there'),('घरमा','家で','at home'),('विद्यालयमा','学校で','at school')]:
            add(32,f'{place} {obj} {v}।',f'{jplace}{jv}ます。',f'{ev[0].upper()+ev[1:]} {eplace}.',v,[v,first,honor],'行う人を前面に出さず「〜される」と言う -इन्छ の形です。特定の私や敬意のある人がする形と区別します。','The -इन्छ form expresses what is done, without foregrounding an agent. Distinguish it from first-person and respectful active forms.')
    causers=[('हँसाउँछु','hãsāũchu','हाँस्छु','hā̃schu','हँसाउँछौं','hãsāũchaũ','笑わせます','make laugh',''),('सुताउँछु','sutāũchu','सुत्छु','sutchu','सुताउँछौं','sutāũchaũ','寝かせます','put to sleep',''),('सिकाउँछु','sikāũchu','सिक्छु','sikchu','सिकाउँछौं','sikāũchaũ','教えます','teach','नेपाली')]
    for affected in ['बच्चालाई','विद्यार्थीलाई','साथीलाई','भाइलाई','बहिनीलाई','छोरालाई','छोरीलाई']:
        for v,vr,base,br,plural,pr,jv,ev,obj in causers:
            form(v,vr,jv+'（私）',ev+' (I)');form(base,br,{'हाँस्छु':'笑います','सुत्छु':'寝ます','सिक्छु':'学びます'}[base],{'हाँस्छु':'laugh','सुत्छु':'sleep','सिक्छु':'learn'}[base]);form(plural,pr,jv+'（私たち）',ev+' (we)')
            person=W[affected][1].split('を')[0];person_en=W[affected][2].replace(' (affected person)','')
            ja='私は'+person+('にネパール語を教えます。'if obj else'を'+jv+'。')
            english=f'I teach {person_en} Nepali.'if obj else f'I make {person_en} laugh.'if v=='हँसाउँछु'else f'I put {person_en} to sleep.'
            add(33,' '.join(['म',affected,*([obj]if obj else[]),v])+'।',ja,english,v,[v,base,plural],'自分がする動詞と、人にさせる動詞を区別します。हाँस्नु→हँसाउनु、सुत्नु→सुताउनु、सिक्नु→सिकाउनु。相手は लाई で示します。','Distinguish doing from causing: हाँस्नु → हँसाउनु, सुत्नु → सुताउनु, सिक्नु → सिकाउनु. Mark the affected person with लाई.')
    form('भएको','bhaeko','であること（報告する内容）','being (reported content)');form('नभएको','nabhaeko','でないこと（報告する内容）','not being (reported content)');form('हुने','hune','なる・そうである予定の','to be/become (prospective)');form('बताउनुभयो','batāunubhayo','話しました（敬意）','said/explained (respectful)');form('भन्नुभयो','bhannubhayo','言いました（敬意）','said (respectful)')
    for state in STATES:
        for p,j,e,negative in [('उहाँले','あの方は','That person',False),('तपाईंले','あなたは','You',False),('उहाँले','あの方は','That person',True),('तपाईंले','あなたは','You',True)]:
            target='नभएको'if negative else'भएको';jstate={'खुसी':'うれしい','व्यस्त':'忙しい','स्वस्थ':'健康だ','बिरामी':'具合が悪い','तयार':'準備ができている','थकित':'疲れている','शान्त':'落ち着いている'}[state]
            jnegative={'खुसी':'うれしくない','व्यस्त':'忙しくない','स्वस्थ':'健康ではない','बिरामी':'具合は悪くない','तयार':'準備ができていない','थकित':'疲れていない','शान्त':'落ち着いていない'}[state]
            add(34,f'{p} आफू {state} {target} बताउनुभयो।',f'{j}自分は{jnegative if negative else jstate}と話しました。',f'{e} said {"they were"if p=="उहाँले"else"you were"} {"not "if negative else""}{W[state][2]}.',target,['भएको','नभएको','हुने'],'間接話法では内容を भएको でつなげます。「〜でない」は नभएको。आफू は、この文では話した本人を指します。','In this report, भएको links the content “being”; नभएको links “not being”. आफू refers to the reported speaker.')
    for obj in ['पत्र','कविता','कथा','नाम','ठेगाना','सूची','सन्देश']:
        for text,ja,en,target,choices,ruleja,ruleen in [
            (f'म दिनहुँ {obj} लेख्छु।',f'私は毎日{W[obj][1]}を書きます。',f'I write {plural_en(W[obj][2])} every day.','लेख्छु',['लेख्छु','लेख्छौं','लेख्नुहुन्छ'],'現在・私：लेख्नु→लेख्छु。','Present, I: लेख्नु → लेख्छु.'),
            (f'हामी भोलि {obj} लेख्नेछौं।',f'私たちは明日{W[obj][1]}を書くつもりです。',f'We will write {plural_en(W[obj][2])} tomorrow.','लेख्नेछौं',['लेख्नेछु','लेख्नेछौं','लेख्नुहुनेछ'],'未来・私たち：लेख्नु→लेख्नेछौं。','Future, we: लेख्नु → लेख्नेछौं.'),
            (f'उहाँले हिजो {obj} लेख्नुभयो।',f'あの方は昨日{W[obj][1]}を書きました。',f'That person wrote {plural_en(W[obj][2])} yesterday.','लेख्नुभयो',['लेखेँ','लेख्यौं','लेख्नुभयो'],'過去・敬意：लेख्नु→लेख्नुभयो。動作主には ले。','Past, respectful: लेख्नु → लेख्नुभयो. Mark the agent with ले.'),
            (f'हामी आज {obj} लेख्दैनौं।',f'私たちは今日{W[obj][1]}を書きません。',f'We do not write {plural_en(W[obj][2])} today.','लेख्दैनौं',['लेख्दिनँ','लेख्दैनौं','लेख्नुहुन्न'],'否定・私たち：लेख्नु→लेख्दैनौं。','Negative present, we: लेख्नु → लेख्दैनौं.')]:add(35,text,ja,en,target,choices,ruleja,ruleen)
    form('हुन्छु','hunchu','普段います・そうなります（私）','am usually/become (I)');form('हुन्छौं','hunchaũ','普段います・そうなります（私たち）','are usually/become (we)')
    for noun in ROLES:
        add(36,f'यहाँ हामी {noun} हौं।',f'ここでは私たちは{W[noun][1]}です。',f'Here we are {W[noun][2]}s.','हौं',['हौं','छौं','हुन्छौं'],'何者かを言う हो の仲間。हामी には हौं。場所の छौं、習慣・変化の हुन्छौं と区別します。','Identity uses the हो family: हामी takes हौं. Distinguish location छौं and habitual/change हुन्छौं.')
    for state in STATES:
        add(36,f'म अहिले {state} छु।',f'私は今、{STATE_JA[state]}です。',f'I am {W[state][2]} now.','छु',['हुँ','छु','हुन्छु'],'今の状態は छ の仲間。म には छु。何者かの हुँ、習慣・変化の हुन्छु と区別します。','A current state uses the छ family: म takes छु, unlike identity हुँ or habitual/change हुन्छु.')
    for place in PLACES:
        add(36,f'म सधैं बिहान {place} हुन्छु।',f'私はいつも朝、{W[place][1].split("に")[0]}にいます。',f'I am always {W[place][2]} in the morning.','हुन्छु',['हुँ','छु','हुन्छु'],'普段の決まった居場所は हुन्छ の仲間でも表せます。म は हुन्छु。「今ここにいる」という छु と場面を比べます。','A regular location can use the हुन्छ family: म takes हुन्छु. Contrast this habitual context with छु for a location right now.')
    return POOLS
