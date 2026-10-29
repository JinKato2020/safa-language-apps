"""Original beginner explanations, paired Japanese/English, for all 36 lessons.

Each lesson teaches its purpose, terms, construction steps, one existing example,
contrasts and a check with an explained answer. No practice/audio is changed.
"""
import copy

TITLES = {
 '1': ('हुनु① हो：何・誰であるか', 'हुनु 1: हो — identity and classification'),
 '2': ('हुनु② छ：ある・いる（存在と居場所）', 'हुनु 2: छ — existence and location'),
 '3': ('हुनु② छ：性質・状態を説明する', 'हुनु 2: छ — qualities and conditions'),
 '4': ('हुनु③ हुन्छ：ふだん・成り行き・変化', 'हुनु 3: हुन्छ — regular situations, occurrences and change'),
 '34': ('発言を伝える：引用と間接話法', 'Reporting speech: quotation and indirect reports'),
 '36': ('हुनुの活用：人物紹介・居場所と3系統の復習', 'हुनु review: identity, location and the three sets'),
}

HEADINGS = [
 ('何を伝えるための文法か', 'What this grammar helps you say'),
 ('言葉の意味と文の型', 'Terms and sentence pattern'),
 ('文を作る順番', 'Build the sentence step by step'),
 ('例文を分けて読む', 'Read an example in parts'),
 ('否定・疑問と、似た言い方との違い', 'Negatives, questions and related patterns'),
 ('自分で確かめる：問題と理由付きの答え', 'Check your understanding: question and explained answer'),
]

def pick(pair, lang):
    return pair[0 if lang == 'ja' else 1]

def paragraph(text):
    return {'type': 'p', 'text': text}

def heading(text):
    return {'type': 'h', 'text': text}

def table(headers, rows):
    return {'type': 'table', 'headers': headers, 'rows': rows}

def hunu_blocks(theme, lang):
    """Map functions first; then show the matching personal paradigm locally."""
    bs = [heading(pick(('हुनुの3系統と、このテーマの位置', 'The three sets of हुनु and where this topic fits'), lang)),
          paragraph(pick((
            'हुनु（hunu／フヌ）は辞書で引く形で、「ある・いる・である・なる・起こる」などに関わる動詞です。हो・छ・हुन्छは別々の無関係な動詞ではなく、使う場面の違う活用の代表形です。これら3語を文末に置けば終わりではなく、主語と敬意に合わせて形も選びます。ここでの3系統は現在の基本を学ぶ入口で、過去のथियो・भयोなど、ほかの形もあります。',
            'हुनु (hunu) is a dictionary form used for being, existing, becoming or occurring. हो, छ and हुन्छ represent related sets used for different functions, not three unrelated verbs. Choose both the intended function and the form matching the subject and respect. These sets introduce the present system; other forms include past थियो and भयो.'), lang)),
          table(pick((['代表形・読み', '何を伝えるか', '対応する教材'], ['Form and reading', 'Information supplied', 'Corresponding lesson']), lang), [
            ['हो / ho', pick(('何・誰であるか：名前・職業・種類', 'Identity/classification: name, occupation, category'), lang), pick(('テーマ1', 'Topic 1'), lang)],
            ['छ / cha', pick(('ある・いる／どんな性質・状態か', 'Existence/location or a quality/condition'), lang), pick(('テーマ2＝存在と居場所、テーマ3＝性質と状態', 'Topic 2: existence/location; topic 3: qualities/conditions'), lang)],
            ['हुन्छ / huncha', pick(('ふだん・条件に伴う状態、出来事・成り行き', 'Regular/conditional states, occurrences and outcomes'), lang), pick(('テーマ4。許可は21、禁止は19にも関連', 'Topic 4; also permission in 21 and prohibition in 19'), lang)],
          ]),
          paragraph(pick((
            {1:'このテーマは①हो系です。「何・誰か」を名詞で紹介します。',2:'このテーマは②छ系のうち、存在と居場所です。「どこに・何があるか」を学びます。',3:'このテーマは②छ系のうち、性質と状態です。「どんな様子か」を学びます。',4:'このテーマは③हुन्छ系です。「ふだん・ある条件なら・出来事が起きる」を学びます。',36:'この付録は3系統を見渡す復習です。詳しい説明はテーマ1〜4、過去の動作や否定との区別はテーマ11・12も参照します。'}[theme],
            {1:'This topic teaches set 1, identity/classification with हो.',2:'This topic teaches existence and location within set 2, छ.',3:'This topic teaches qualities and conditions within set 2, छ.',4:'This topic teaches set 3, regular situations, conditions and occurrences with हुन्छ.',36:'This appendix reviews the three sets. Study their explanations in topics 1–4 and compare past events/negatives in topics 11–12.'}[theme]), lang)),
          table(pick((['同じ「私」で比較する', '意味', 'なぜその系統か'], ['Compare with the same subject', 'Meaning', 'Why this set?']), lang), [
            ['म विद्यार्थी हुँ।\nma vidyārthī hũ',pick(('私は学生です。', 'I am a student.'),lang),pick(('何者かを紹介するのでहो系：テーマ1', 'Identity, so the हो set: topic 1'),lang)],
            ['म घरमा छु।\nma gharmā chu',pick(('私は家にいます。', 'I am at home.'),lang),pick(('居場所を述べるのでछ系：テーマ2', 'Location, so the छ set: topic 2'),lang)],
            ['म बिहान घरमा हुन्छु।\nma bihān gharmā hunchu',pick(('私は朝はふだん家にいます。', 'I am usually at home in the morning.'),lang),pick(('繰り返す時間の一般的な話なのでहुन्छ系：テーマ4', 'A regular time setting, so the हुन्छ set: topic 4'),lang)],
          ]),
          {'type':'note','text':pick((
            '「私は」だけでは形が決まりません。学生か、家にいるか、ふだん家にいるかで、हुँ・छु・हुन्छुと変わります。またहो＝永久、छ＝一時的と決め付けません。何を伝え、どういう場面で述べるかが選ぶ理由です。',
            'The subject I alone does not select the form: identity, location and a regular setting give हुँ, छु and हुन्छु. Do not reduce हो versus छ to permanent versus temporary. Choose by construction and intended meaning.'),lang)}]
    family = {1:0,2:1,3:1,4:2,36:0}[theme]
    forms = [
      ['म / ma', [('हुँ / hũ','होइनँ / hoinã'),('छु / chu','छैनँ / chainã'),('हुन्छु / hunchu','हुँदिनँ / hũdinã')]],
      ['हामी / hāmī', [('हौं / haũ','होइनौं / hoinaũ'),('छौं / chaũ','छैनौं / chainaũ'),('हुन्छौं / hunchaũ','हुँदैनौं / hũdainaũ')]],
      ['तपाईं / tapāĩ', [('हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna')]*3],
      ['तपाईंहरू / tapāĩharū', [('हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna')]*3],
      ['उहाँ / uhā̃', [('हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna')]*3],
      ['उहाँहरू / uhā̃harū', [('हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna')]*3],
    ]
    names = [('私','I'),('私たち','we'),('あなた','you'),('あなたたち','you plural'),('彼・彼女','he/she'),('彼ら・彼女ら','they')]
    families = [0,1,2] if theme==36 else [family]
    for f in families:
        label=['हो','छ','हुन्छ'][f]
        bs += [heading(pick((f'{label}系：基本6人称の肯定と否定', f'{label} set: six basic person groups, positive and negative'),lang)),
               table(pick((['人称と読み','肯定と読み','否定と読み'],['Person and reading','Positive and reading','Negative and reading']),lang),
                     [[pick(names[i],lang)+'\n'+name,*pairs[f]] for i,(name,pairs) in enumerate(forms)])]
    bs += [paragraph(pick((
        '丁寧なあなた・彼・彼女とその複数形では、3系統ともहुनुहुन्छ（肯定）／हुनुहुन्न（否定）になります。同じ見た目でも、「学生です」「家にいます」「朝はふだん家にいます」の役割は違います。物を述べる基本形は、हो系がहो／होइन、छ系がछ／छैन、हुन्छ系がहुन्छ／हुँदैनで、複数の物などは対応する別の形も使います。ここではまず基本6人称を確実にしましょう。',
        'Respectful you/he/she and their plurals share हुनुहुन्छ/हुनुहुन्न across the three functions. Identical spelling does not erase the difference between identity, location and a regular setting. Basic ordinary singular forms are हो/होइन, छ/छैन and हुन्छ/हुँदैन; ordinary plurals have corresponding forms too. First learn the six basic person groups shown here.'),lang))]
    return bs

def lesson_blocks(theme, lang, example, roman, translation):
    assert len(LESSONS[theme]) == 6
    bs = [heading(pick(('基本の考え方と文の作り方', 'Meaning and sentence construction'),lang))]
    for index,pair in enumerate(LESSONS[theme]):
        bs.append(heading(pick(HEADINGS[index],lang)))
        if index==3:
            bs.append(table(pick((['ネパール語','読み','意味'],['Nepali','Reading','Meaning']),lang),[[example,roman,translation]]))
        bs.append(paragraph(pick(pair,lang)))
    if theme in [1,2,3,4,36]:
        bs.append(heading(pick(TITLES[str(theme)],lang)))
        bs.extend(hunu_blocks(theme,lang))
    return bs

def expand_guides(guides, examples, readings, translations):
    """Replace only the short intro; preserve existing inventories and analyses."""
    result=copy.deepcopy(guides)
    for lang,topics in result.items():
        for key,old in topics.items():
            theme=int(key)
            # On a second pass, strip the last generated introduction as a unit.
            # Existing inventory/analysis blocks begin at this stable marker.
            begin=next((i for i,b in enumerate(old) if b.get('beginnerIntroEnd')),None)
            if begin is not None:
                retained=old[begin+1:]
                goal=next((b for b in old if b.get('type')=='goal'),None)
            else:
                goal=next((b for b in old if b.get('type')=='goal'),None)
                retained=old[3:] if theme<35 else [b for b in old if b is not goal]
            # Existing short personal tables are replaced by the explained table.
            filtered=[];skip_table=False
            obsolete={'基本6人称の肯定・否定','Positive and negative forms for six basic person groups',
                      'हुन्छの基本6人称と否定','Six basic person groups with हुन्छ and its negatives'}
            for b in retained:
                if b.get('type')=='h' and b.get('text') in obsolete:
                    skip_table=True;continue
                if skip_table and b.get('type')=='table':
                    skip_table=False;continue
                filtered.append(b)
            intro=lesson_blocks(theme,lang,examples[key][0],readings[key][0],translations[lang][key][0])
            # A zero-length paragraph is the saved, invisible insertion boundary.
            # Its index is stored in the teacher's source, not shown as a label.
            topics[key]=([goal] if goal else [])+intro+[{'type':'p','text':'','beginnerIntroEnd':True}]+filtered
    return result

# idea, pattern, steps, worked example, contrasts, question and explained answer.
# The worked sentence itself comes from the existing, voiced practice set.
LESSONS = {
1: [
('「私は学生です」「これは本です」のように、人や物の正体・職業・種類を伝える文です。「何であるか」を説明する、と考えましょう。ここで学ぶहो（ホ）は、हुनु（フヌ）という動詞の一つの活用の系統です。活用とは、同じ動詞が「私」「あなた」などに合わせて形を変えることです。हुनुをそのまま文末に置くのではなく、このテーマではहुँ・हो・हुनुहुन्छなどを選びます。',
 'Use this pattern to identify or classify someone or something: I am a student; this is a book. हो is one set of forms of the dictionary verb हुनु. Conjugation means changing a verb to fit the person or situation. Do not put dictionary हुनु at the end of every sentence. This lesson uses forms such as हुँ, हो and respectful हुनुहुन्छ.'),
('基本の型は「説明する人・物＋何であるか＋हो系の形」です。「説明する人・物」を主語と呼びます。विद्यार्थीは学生、किताबは本のように、名前や種類を表す語を名詞と呼びます。日本語の「は」に当たる語を毎回足す必要はありません。文末の形は、主語がमならहुँ、物を指すयोならहो、丁寧なतपाईं・उहाँとその複数形ならहुनुहुन्छです。',
 'The basic order is person/thing + identity + a हो-family form. The person or thing being described is the subject. Words naming people or things, such as विद्यार्थी, student, are nouns. With म use हुँ; with an ordinary thing indicated by यो use हो. Respectful तपाईं and उहाँ, including their plurals, take हुनुहुन्छ.'),
('1. 誰・何について話すかを決めます。まず「私」ならमを置きます。\n2. 職業・立場・種類を表す名詞を置きます。「学生」ならविद्यार्थीです。\n3. 主語に合う形で結びます。मに合うहुँを選ぶと「म＋विद्यार्थी＋हुँ」になります。\n4. 人だけを替える場合も、最後の形を確認します。「彼・彼女」はउहाँなので、उहाँ विद्यार्थी हुनुहुन्छになります。',
 '1. Choose the subject: म, I.\n2. Add the identity noun: विद्यार्थी, student.\n3. Finish with the matching form, हुँ. The parts give म विद्यार्थी हुँ.\n4. If the subject changes, check the verb too. Respectful he/she is उहाँ, so say उहाँ विद्यार्थी हुनुहुन्छ.'),
('म＝私、विद्यार्थी＝学生、हुँ＝私に合う「です」です。「私・学生・です」と後ろまで読むと、文のしくみが分かります。हुँを「学生」の一部として暗記しないことが大切です。職業の名詞を替えても、主語がमなら文末はहुँのままです。下の活用表は、主語を替えたときに最後がどう変わるかを確かめるための表です。',
 'Read the parts as म, I; विद्यार्थी, student; हुँ, am. हुँ is the verb, not part of the word student. If only the occupation changes, keep हुँ with म. The table below shows what changes when the subject changes.'),
('否定はहोの後ろに「ない」を足すのではなく、होइन系に替えます。私ならहोइनँ、物ならहोइन、丁寧な人ならहुनुहुन्नです。はい・いいえで答える質問は、文頭にकेを添える方法があります。「家にいる」は正体の説明ではなく場所の話なのでテーマ2、「忙しい」は状態の話なのでテーマ3です。「ずっと変わらないならहो」と覚えると間違えます。職業は変わることがあっても、この型で紹介できます。',
 'For a negative choose the होइन family: होइनँ with I, होइन with an ordinary thing, or respectful हुनुहुन्न. Initial के can introduce a yes/no question. Location belongs to topic 2 and condition to topic 3. Do not define हो as something that can never change: an occupation can change and still be introduced with this identity pattern.'),
('確認：「私は学生です」と「私は家にいます」は同じ系統でしょうか？\n答え：違います。学生は「何であるか」なのでテーマ1のहुँ。घरमा（家に）は場所なのでテーマ2のछुです。どちらも日本語では「私は〜」でも、後ろで伝える内容を見て選びます。',
 'Check: do I am a student and I am at home use the same set?\nAnswer: no. Student gives identity, so use topic 1 and हुँ. घरमा gives location, so use topic 2 and छु. Choose by the information being supplied, not just by the English word am.')],
2: [
('ここでは「どこにいる・あるか」と「そこに何があるか」を伝えます。हुनुのछ（チャ）系の使い方です。机に本がある、私は家にいる、という場面を思い浮かべましょう。テーマ1の「それは何か」という紹介とは、知りたい情報が違います。人だけでなく、物にもこの系統を使います。',
 'This lesson describes where someone or something is, or what is present in a place. It uses the छ set of हुनु. Imagine a book on a table or yourself at home. The information is different from topic 1, which identifies what something is. The existence/location pattern applies to both people and things.'),
('知っている人・物の場所を言う基本の型は「人・物＋場所＋छ系の形」です。घरは家、माは「〜に・で」を表す後ろに付く形なので、घरमाで「家に」です。「主語」は場所を説明される人・物です。私ならछु、私たちならछौं、丁寧なあなた・彼・彼女ならहुनुहुन्छを使います。単数の物はछ、複数の物はछन्が基本です。',
 'To locate a known subject, use person/thing + place + a छ-family form. घर is house; मा adds at/in, giving घरमा. The subject is the person or thing being located. Use छु with I, छौं with we, and हुनुहुन्छ with respectful you/he/she. An ordinary singular thing takes छ and plural things generally take छन्.'),
('1. 居場所を伝える人・物を決めます。私ならमです。\n2. 場所を置きます。家ならघरमा、ここならयहाँです。\n3. 主語に合うछ系の形を選びます。मにはछुです。\n4. 新しく「何かがある」と紹介するときは、場所を先に出す形も使います。まず何の存在を話題にしているかを確認しましょう。',
 '1. Choose what you are locating: म, I.\n2. Add a place such as घरमा, at home, or यहाँ, here.\n3. Choose the matching छ form; म takes छु.\n4. To introduce something present, a location may come first. Identify what exists before deciding its agreement.'),
('म＝私、घरमा＝家に、छु＝います、です。「私は何ですか」への答えではなく、「私はどこにいますか」への答えになっています。घरमाをひとかたまりとして読んだ後、घर＋माに分けると、「家」と「家に」の違いも理解できます。このमाなどをまとめて学ぶのがテーマ5です。',
 'म means I, घरमा at home, and छु am present. The sentence answers where I am, not what I am. Read घरमा as a unit, then separate घर + मा to see how house becomes at home. Topic 5 teaches such noun-following markers in detail.'),
('いない・ないはछैन系で、私ならछैनँ、物ならछैनです。丁寧な人の否定はहुनुहुन्नになります。場所を尋ねるकहाँ（どこ）は、答えの場所と同じ位置に置けます。होとछは丁寧な人について話すとどちらもहुनुहुन्छになるので、見た目だけでは区別できません。「学生です」ならテーマ1、「家にいます」ならこのテーマの働きです。',
 'Negate with the छैन family: छैनँ for I and छैन for an ordinary thing; respectful people take हुनुहुन्न. कहाँ, where, can replace the location. Both identity and location use हुनुहुन्छ with respectful people. The identical spelling does not make their functions identical: student gives identity; at home gives location.'),
('確認：「私はペンを持っています」のमसँग कलम छでは、最後をछुにしますか？\n答え：しません。この文で存在するのはペンです。मसँगは「私のところに」という持ち主を示し、कलम（ペン）に合うछを使います。人の居場所と所持の文を混ぜず、所持はテーマ5で確認しましょう。',
 'Check: in मसँग कलम छ, I have a pen, should the ending be छु because I is mentioned?\nAnswer: no. The thing present is कलम, a pen. मसँग marks the possessor. Use छ for the pen; study possession in topic 5.')],
3: [
('テーマ2と同じछ系を使い、人や物が「どんな様子・状態か」を説明します。「この花は美しい」「今日は忙しい」のような文です。形容詞とは、美しい・古い・冷たいなどの性質や状態を表す言葉です。テーマ1の「学生・本」という名前や種類と、テーマ3の「美しい・冷たい」という説明を分けて考えましょう。',
 'Use the छ family again, now to describe a quality or condition: a flower is beautiful; someone is busy. An adjective describes a quality such as beautiful, old or cold. Separate an identity noun such as student or book in topic 1 from a description such as beautiful or cold here.'),
('基本の型は「説明する対象＋性質・状態を表す語＋छ系の形」です。योはこの・これ、फूलは花、सुन्दरは美しい、です。「この花」をयो फूलとまとめ、その後にसुन्दर、最後にछを置きます。説明する対象が私ならछु、丁寧な人ならहुनुहुन्छです。形容詞が名詞の前に入る場合との違いはテーマ23で学びます。',
 'Use subject + descriptive word + a छ-family form. यो indicates this; फूल is flower; सुन्दर is beautiful. Group यो फूल as this flower, then add सुन्दर and छ. With I use छु; with a respectful person use हुनुहुन्छ. Topic 23 compares this with an adjective placed inside a noun phrase.'),
('1. 何・誰を説明するかを決めます。「この花」ならयो फूलです。\n2. 伝えたい性質を選びます。「美しい」ならसुन्दरです。\n3. 対象に合う文末を付けます。花は一つの物なのでछです。\n4. 状態の説明なのか、名詞で正体を紹介しているのかを見直します。日本語でどちらも「です」になることに惑わされないようにしましょう。',
 '1. Choose the subject: यो फूल, this flower.\n2. Choose a quality: सुन्दर, beautiful.\n3. Add the matching ending; a single flower takes छ.\n4. Check whether you are describing it or identifying it with a noun. A shared translation such as is does not choose the Nepali construction.'),
('यो फूल＝この花、सुन्दर＝美しい、छ＝そのような状態です、という組み立てです。「花」という名詞をもう一つ述べているのではなく、花の様子を説明しています。सुन्दरだけで相手に意味が伝わる場面もありますが、教材では文の作り方を覚えるため、主語から文末までそろえて練習します。',
 'यो फूल names the subject, सुन्दर describes it, and छ completes the description. You are not assigning a second identity; you are describing the flower. Although a single adjective may work as a short response in conversation, practice the complete sentence to understand the structure.'),
('否定ではसुन्दरを変えず、最後をछैन系にします。丁寧な人の状態ならहुनुहुन्नです。どんな様子かを尋ねるときはकस्तोなどを使いますが、名詞に合わせた形の変化はテーマ23も確認します。「छは一時的なもの専用」と覚えるのは不十分です。ある物の性質を説明する場合にも使え、一般論として言う場合のहुन्छとの違いはテーマ4で学びます。',
 'For a negative keep the adjective and use a छैन-family ending, or respectful हुनुहुन्न. Questions about a quality can use कस्तो and its related forms; see topic 23 for agreement. Do not define छ as temporary only: it can describe a particular thing’s quality. Topic 4 contrasts this with a general statement using हुन्छ.'),
('確認：「これは良い本です」と「この本は良いです」は、何が違いますか？\n答え：前者は「良い本」という名詞のまとまりで正体を述べるので、テーマ1のहो系です。後者は本の性質を述べるのでछ系です。日本語訳の「良い」だけでなく、文全体で何を説明しているかを見ます。',
 'Check: compare this is a good book with this book is good.\nAnswer: the first identifies it with the noun phrase good book and uses the हो pattern. The second describes the book and uses the छ pattern. Look at the whole construction, not just the adjective.')],
4: [
('ここではहुनुのहुन्छ（フンチャ）系を学びます。「そのときだけの様子」ではなく、「ふだんはそうだ」「その条件ならそうなる」「出来事が起こる」などを伝える形です。テーマ2・3のछ系と比べることが大切です。हुन्छには、ふだんの状態だけでなく、これから行われる予定や「それでよい」という応答になる使い方もあります。一つの日本語に固定せず、場面ごとに理解します。',
 'This lesson teaches the हुन्छ set of हुनु: what is generally true, what happens under certain conditions, or what occurs. Compare it with the छ set in topics 2–3. हुन्छ also appears with scheduled events and in an accepting response. It does not have just one translation such as become.'),
('基本の型は「いつ・どんな条件で＋状態や出来事＋हुन्छ系の形」です。今見ている一つの状態を述べるछに対し、季節・毎朝などを添えたहुन्छは繰り返しや一般的な様子を述べられます。主語が私ならहुन्छु、私たちならहुन्छौंです。丁寧な人についてはहुनुहुन्छとなり、हो系・छ系と形が重なります。形だけでなく、時間の語と伝える意味で判断します。',
 'A useful pattern is time/condition + state or event + a हुन्छ-family form. A season or repeated time often gives a regular setting, unlike a particular state described with छ. Use हुन्छु with I and हुन्छौं with we. Respectful हुनुहुन्छ overlaps in spelling with the identity and location sets, so use context and meaning to distinguish them.'),
('1. 「今の一回」なのか、「ふだん・条件・これからの出来事」なのかを考えます。\n2. 季節や時間を示す言葉を置きます。जाडोमाは「冬に」です。\n3. どんな状態かを加えます。चिसोは「寒い・冷たい」です。\n4. 一般的な季節の様子としてहुन्छで結びます。「今日寒い」と言いたいなら、今日を表す語とछ系を使い分けます。',
 '1. Decide whether you mean one present situation or something regular, conditional or upcoming.\n2. Add a setting: जाडोमा, in winter.\n3. Add the condition: चिसो, cold.\n4. Use हुन्छ to state the general seasonal pattern. For today’s particular weather, use a today expression with the छ set.'),
('जाडोमा＝冬に、चिसो＝寒い、हुन्छ＝一般にそうなる・そういう状態になる、です。「冬は寒いものだ」という一般的な話として読めます。練習の日本語訳が「寒くなります」でも、毎回「以前は暖かかったが変化した」という意味に限りません。文中の季節が、いま一回の観察ではなく一般的な話だと教えてくれます。',
 'जाडोमा means in winter, चिसो cold, and हुन्छ presents that regular condition. The sense is winter is generally cold. Even when translated becomes cold, it need not describe one change from a previously warm state. The seasonal expression signals the general setting.'),
('否定の基本はहुँदैन系です。私ならहुँदिनँ、私たちならहुँदैनौं、丁寧な人ならहुनुहुन्नです。変化・出来事の過去にभयोがありますが、職業など「〜になる」にはबन्नुを使う場合もあります。हुन्छを見たら何でも「なる」と訳さないでください。許可の「〜してよい」はテーマ21、禁止の「〜してはいけない」はテーマ19、未来の言い方はテーマ13につながります。',
 'The negative uses the हुँदैन set: हुँदिनँ for I, हुँदैनौं for we, and respectful हुनुहुन्न. भयो can describe a past change or occurrence, while becoming a professional may use बन्नु. Do not translate every हुन्छ as become. See topic 21 for permission, 19 for prohibition and 13 for future expressions.'),
('確認：「今日ここは静かだ」と「ここは朝、ふだん静かだ」では、なぜ形を変えますか？\n答え：前者はそのときの状態なのでछ系、後者は繰り返す時間帯の一般的な様子なのでहुन्छ系が合います。まず「いつ・一回か、ふだんか」を決めると、形を選ぶ理由が分かります。',
 'Check: why distinguish it is quiet here today from it is generally quiet here in the morning?\nAnswer: the first describes that situation with छ; the second describes a regular pattern with हुन्छ. First decide what kind of time perspective you intend.')],
5: [
('「家に」「家から」「友達と」の「に・から・と」に注目しましょう。これらは人や場所が文の中でどんな役目を持つかを示します。ネパール語では名詞の後ろの形で関係を示すので、後置詞と呼びます。難しい名前より、「名詞の後ろに意味の目印を付ける」と考えると分かりやすくなります。',
 'Compare at home, from home and with a friend. At, from and with show a relationship. Nepali usually marks such relationships after a noun, so these forms are called postpositions. Think of adding a relationship label after the person, place or thing.'),
('基本の組み立ては「誰が＋名詞と関係の目印＋動詞」です。घरは家、घरमाは家に・家で、घरबाटは家からです。मा・बाटのように前の語に続けて書く形と、को लागिのように語を組み合わせる形があります。日本語の「に」も場所・相手・時刻で働きが違うため、一つのネパール語だけで全部を言おうとしないことが大切です。',
 'Build subject + noun with its relationship marker + verb. घर is house, घरमा at home, and घरबाट from home. Some markers attach directly; others form phrases such as को लागि. A single English or Japanese preposition/particle can have several functions, so choose by the relationship, not by a one-word translation.'),
('1. まず動作を決めます。「住む」ならबस्नुです。\n2. 「誰が」「どこに」を分けます。私はम、家にはघरमाです。\n3. まとめて動詞の前に置き、主語に合う現在形बस्छुで結びます。\n4. 出発点を言いたければबाट、一緒に行く相手ならसँगのように、伝えたい関係を替えて考えます。',
 '1. Choose an action, such as बस्नु, live.\n2. Separate who from where: म and घरमा.\n3. Put them before the verb and use बस्छु with I.\n4. For a starting point choose बाट; for company choose सँग. Name the relationship before choosing its marker.'),
('म＝私、घरमा＝家に、बस्छु＝住んでいます、です。घरだけだと家という名前ですが、माが付くことで住む場所だと分かります。後ろの動詞が「来た」に変われば、「どこから来たか」のबाटも使えます。同じ名詞でも後ろの目印が変わると、文の中の役割が変わります。',
 'म is I, घरमा at home, and बस्छु live. The attached मा identifies the location of living. With a coming action, बाट can instead identify the starting point. The same noun can fill different roles when its following marker changes.'),
('सँग＋छの所持は「持ち主のところに物がある」という作りなので、持ち主だけを見て動詞を変えません。को・की・काは後ろの名詞との結び付きも確認します。लेは何でも日本語の「が」に当てる形ではなく、過去の動作主などはテーマ11で学びます。方向・比較・時間・目的の詳しい表現は、このテーマの振り分け表からテーマ25〜28などへ進みます。',
 'Possession with सँग + छ presents an object with its possessor; the possessor alone does not determine agreement. को/की/का also depend on the following noun. ले is not a universal subject marker; see topic 11. Use the allocation table below to find comparison, time and purpose forms in topics 25–28 and elsewhere.'),
('確認：घरमाとघरबाटは、どちらも「家」という意味だから交換できますか？\n答え：できません。前者は場所、後者は出発点です。訳語の「てにをは」を丸暗記する前に、「どこで・どこから・誰と」のどれを伝えるかを声に出して確認しましょう。',
 'Check: can घरमा and घरबाट be exchanged because both mention a house?\nAnswer: no. One marks location; the other a starting point. Say the intended relationship aloud—where, from where, with whom—before choosing the form.')],
6: [
('質問は、文の中の分からない部分を相手に教えてもらうために作ります。「誰」「どこ」「いつ」のように、答えてほしい情報の種類を示す言葉が疑問詞です。まず質問文を丸暗記するのではなく、「答えには人・場所・時刻のどれが入るか」を考えると、疑問詞を選ぶ理由が分かります。',
 'A question asks someone to supply missing information. Question words identify the type of answer: a person, place, time and so on. Before memorizing a whole question, decide what kind of information its answer must contain.'),
('基本は「答えの文の一部を疑問詞に替える」です。人はको、物はके、場所はकहाँ、時はकहिलेです。「どの本」のように選ぶときはकुन、「どんな本」のように性質を聞くときはकस्तोを使います。誰に・誰のはकसलाई・कसकोのように形が変わります。疑問詞を置いても、最後の動詞の人称・敬意・時制は必要です。',
 'Replace a statement’s missing part with a question word: को for a person, के for a thing, कहाँ for place and कहिले for time. कुन selects which item; कस्तो asks what kind. Case-marked forms include कसलाई and कसको. A question word does not remove the need for correct person, respect and tense on the verb.'),
('1. 「これは本です」のような答えの型を思い浮かべます。\n2. 分からないのが本という正体なら、その部分をकेにします。\n3. これはयो、正体を尋ねる文末はहोなので、यो के हो?となります。\n4. 答えるときは、केの位置に分かった名詞を置きます。質問と答えを同じ組み立てで練習しましょう。',
 '1. Imagine the answer pattern: this is a book.\n2. Replace the unknown identity with के.\n3. Keep यो, this, and identity हो, giving यो के हो?\n4. To answer, put the known identity back where के was. Practice questions and answers as a pair.'),
('यो＝これ、के＝何、हो＝です、なので「これは何ですか」です。केが分からない正体の位置に入っています。「これはどこにありますか」なら知りたいのは場所になり、कहाँとछ系を考えます。疑問詞だけを交換するのでなく、答えたい文の種類も確認することが大切です。',
 'यो means this, के what, and हो is the identity ending: what is this? के occupies the missing identity. Asking where it is instead needs a location question with कहाँ and the छ set. Choose both the question word and the kind of sentence it belongs to.'),
('文頭のकेは「はい・いいえ」で答える質問にも使われます。そのकेと「何」を表すकेは役割が違います。कति जनाは人数、कति वटाは物の個数、कति बजेは時刻、कति पटकは回数です。数字を求める質問でも単位が違います。すべての質問を英語のように疑問詞を先頭へ移動して作る必要はありません。',
 'Initial के can also mark a yes/no question; that role differs from what. कति जना counts people, कति वटा objects, कति बजे asks clock time, and कति पटक counts occasions. Numerical questions still need the correct unit. Nepali does not require moving every question word to the front as English often does.'),
('確認：「どの本を選ぶか」と「本がどんな性質か」は同じ質問ですか？\n答え：違います。選択はकुन、性質はकस्तोです。下の質問と答えの表で、疑問詞が何を求め、その答えがどこに入るかを一組ずつ確かめてください。',
 'Check: are which book and what kind of book the same question?\nAnswer: no. कुन asks for selection; कस्तो for a quality or kind. In the table below, identify what each word asks for and where its answer fits.')],
7: [
('代名詞は、名前を毎回言う代わりに使う「私・あなた・彼・彼女」などの語です。ネパール語では、何人かだけでなく相手との親しさや敬意も形に表れます。敬意とは、その人を丁寧に扱う言葉の使い方です。この教材の基本はम・हामी・तपाईं・तपाईंहरू・उहाँ・उहाँहरूです。別の呼び方を使う場面と違いを、このテーマでまとめて学びます。',
 'Pronouns stand in for names: I, you, he/she and they. Nepali pronouns show familiarity and respect as well as person and number. The basic set in this course is म, हामी, तपाईं, तपाईंहरू, उहाँ and उहाँहरू. This lesson explains other forms and the relationships they express.'),
('文は「呼び方に合う代名詞＋内容＋その呼び方に合う動詞」で作ります。उ・उनीは男性と女性を機械的に分ける二つの語ではありません。低い敬意・中程度の敬意など、相手との関係の違いがあります。उहाँは高い敬意を表し、男女どちらにも使えます。हरूを加えたउहाँहरूは複数で、動詞は同じ敬意の形を使います。',
 'Choose a pronoun and a matching verb together. उ and उनी are not simply male versus female pronouns; they differ in social register. Respectful उहाँ can refer to either gender. Add हरू for respectful plural उहाँहरू and retain respectful verb agreement.'),
('1. 話す人が自分ならम、複数の自分たちならहामीです。\n2. 相手にはまず丁寧なतपाईं・तपाईंहरूを選びます。第三者の基本はउहाँ・उहाँहरूです。\n3. その代名詞に合う動詞を表で選びます。私ならगर्छु、丁寧な人ならगर्नुहुन्छです。\n4. 親しい形を学ぶときは、代名詞だけでなく動詞まで一緒に練習します。',
 '1. Choose म for yourself or हामी for your group.\n2. Start with respectful तपाईं/तपाईंहरू for addressees and उहाँ/उहाँहरू for third persons.\n3. Match the verb: गर्छु with I, गर्नुहुन्छ with a respectful person.\n4. Learn familiar pronouns together with their different verb forms.'),
('म＝私、काम＝仕事、गर्छु＝します、で「私は働きます」です。काम गर्नुで仕事をする、という組み合わせになります。自分を丁寧に呼ぶためにगर्नुहुन्छを選ぶのではありません。人称と敬意は主語に合わせます。下の表で、同じकामでも「誰がするか」が変わると最後が変わることを確認しましょう。',
 'म is I, काम work, and गर्छु do: I work. काम गर्नु is the combination do work. Do not use गर्नुहुन्छ simply to make your own statement sound polite. Agreement follows the subject’s person and register. Compare the endings with the same action below.'),
('तँはとても親しい関係などの低い敬意の形で、相手によって失礼になります。तिमीは親しい形ですが、常に目下だけを指すわけではありません。उनी自体も女性専用ではなく、性を示すछिन्などの動詞とは分けます。後置詞が付くと形が変わる場合があるので、下の基本形・〜に・〜の・動作主の表を使い、同じ人を指す形のつながりを学びます。',
 'तँ is very familiar/low-register and can be offensive; तिमी is familiar but not simply for inferiors. उनी is not female-only; explicitly feminine verb forms are a separate issue. Case markers may change a pronoun’s shape. Use the table to connect its basic, object, possessive and agent forms.'),
('確認：「彼女」と訳しているから、いつでもउनीを選べばよいですか？\n答え：いいえ。まず関係と敬意を考えます。この教材の基本は性別にかかわらずउहाँです。उ・उनी・तँ・तिमीの違いを比較する練習はここで行い、通常のテーマでは基本の6区分を使います。',
 'Check: should every she automatically become उनी?\nAnswer: no. First consider the relationship and respect. The course defaults to उहाँ for either gender. Compare उ/उनी and familiar second-person forms here; ordinary topics use the basic six groups.')],
8: [
('「毎朝起きる」「本を読む」のように、日常の行動や習慣を伝えます。動詞とは、する・読む・行くなどの動作や状態を表す語です。現在形という名前でも、必ず「いま動作の途中」という意味になるわけではありません。今やっている最中を言う進行形はテーマ10で分けて学びます。',
 'Describe everyday actions and habits such as getting up or reading. A verb expresses an action or state. A present form does not automatically mean an action is in progress at this moment; topic 10 teaches that distinction.'),
('基本語順は「誰が＋何を・いつ・どこで＋動詞」です。辞書で引く形はगर्नु・पढ्नुのような-नुで終わる形です。辞書形から文で使う形へ変えることを活用と呼びます。गर्नु→गर्छु、पढ्नु→पढ्छुのように、主語に合う形を覚えます。どの動詞も文字を同じように切れば作れる、という規則ではありません。',
 'The usual order is subject + object/time/place + verb. Dictionary forms include गर्नु and पढ्नु. Conjugation gives a sentence form such as गर्छु or पढ्छु for I. Learn the appropriate stem and ending; do not assume one identical letter-removal rule works for every verb.'),
('1. 誰がするかを決めます。私ならमです。\n2. 動作を選びます。「仕事をする」はकाम गर्नुという組み合わせです。\n3. 主語に合う現在形にして、काम गर्छुとします。\n4. 毎日・朝などの言葉を動詞の前に加えると、いつ・どのくらい繰り返す行動かを伝えられます。',
 '1. Choose the subject, for example म.\n2. Choose an action: काम गर्नु, do work.\n3. Conjugate it with I: काम गर्छु.\n4. Add a time or frequency expression before the verb to explain when or how regularly it happens.'),
('म＝私、काम＝仕事、गर्छु＝する、なので「私は働きます」です。कामは仕事内容を示す名詞で、形を変える中心はगर्नुです。主語をउहाँへ替えるとगर्नुहुन्छになります。主語はそのままで「読む」に替えるなら、動詞そのものをपढ्नुから作り直します。',
 'म is I, काम work, and गर्छु do. The noun काम supplies the activity; गर्नु is the part being conjugated. With उहाँ use गर्नुहुन्छ. If the action changes to read while the subject stays I, choose a form of पढ्नु instead.'),
('「しません」はテーマ9で学ぶ動作動詞の否定にします。名詞の「ではない」のहोइनや、存在の「ない」のछैनを、どの動詞にも付けるわけではありません。質問では動詞の人称・敬意を保ち、必要ならकेや疑問詞を使います。भोलिなどと現在形を組み合わせて未来の予定を言う場合もあり、テーマ13で整理します。',
 'Action negatives are taught in topic 9; do not attach identity होइन or existence छैन to every action verb. Questions retain appropriate person and respect and may use के or a question word. A present form with भोलि can also state a future plan; see topic 13.'),
('確認：「私は毎日働きます」と「私は今働いているところです」は同じことですか？\n答え：前者は習慣、後者は進行中の動作です。まずどちらを伝えたいかを決め、現在形とテーマ10の進行形を選び分けましょう。',
 'Check: are I work every day and I am working now the same?\nAnswer: the first is a routine; the second an ongoing action. Decide the intended meaning before choosing this present pattern or the progressive in topic 10.')],
9: [
('「今日は働かない」「肉を食べない」のように、行動をしないことを伝えます。ここで否定するのは「学生ではない」という正体でも、「家にいない」という存在でもなく、動作です。否定の対象をはっきりさせると、होइन・छैनを何にでも使ってしまう間違いを防げます。',
 'Say that an action does not happen: not working today or not eating meat. This is action negation, not identity or absence. Identify what is being denied before choosing the negative form.'),
('基本の型は「誰が＋内容＋動作動詞の否定形」です。गर्छु（私はする）に対してगर्दिनँ（私はしない）、पढ्छुに対してपढ्दिनँのように、動詞の形そのものを変えます。丁寧な人ならगर्नुहुन्छ→गर्नुहुन्नです。मの否定に現れるँは鼻に響く音の目印で、飾りではありません。読みも一緒に確認します。',
 'Use subject + details + a negative action verb. Compare गर्छु with गर्दिनँ and पढ्छु with पढ्दिनँ. Respectful गर्नुहुन्छ becomes गर्नुहुन्न. The nasal sign in first-person negatives is meaningful pronunciation, not decoration.'),
('1. まず肯定の文を作り、どの動詞を否定するかを見つけます。\n2. 主語を確認します。मなら私の否定形を使います。\n3. する動作をしない形へ替えます。काम गर्छुならकाम गर्दिनँです。\n4. 今日・夜などの範囲を添えると、いつもしないのか、そのときだけしないのかが分かります。',
 '1. Identify the affirmative action being denied.\n2. Check the subject.\n3. Choose its negative form: काम गर्छु becomes काम गर्दिनँ with I.\n4. Add today, at night or another setting to distinguish a particular decision from a regular habit.'),
('म＝私、आज＝今日、काम＝仕事、गर्दिनँ＝しません、です。「今日」という範囲なので、毎日働かないと断言しているわけではありません。否定の文でも語順の骨組みは保ち、最後の動詞を主語に合わせて変えることが中心です。',
 'म is I, आज today, काम work and गर्दिनँ do not do. Today limits the statement; it does not claim never to work. The basic word order remains, while the final verb carries the negative and personal agreement.'),
('「しませんか」という形は、事実を確認する質問にもなります。日本語では同じ語尾が誘いに使われることもありますが、ネパール語の否定疑問を何でも誘いと考えないでください。誘いはテーマ18です。また「しなかった」は過去の否定なのでテーマ12の形を使います。',
 'A negative question can check whether someone does not do something; it is not automatically an invitation. Topic 18 teaches invitations. Did not do is past negative and requires the forms in topic 12, not just this present negative.'),
('確認：「しない」と「しなかった」は、時間の語だけ替えればよいですか？\n答え：いいえ。現在の否定と過去の否定では動詞の形も変わります。まず「いつの不実行か」を確認し、गर्दिनँと過去の形を分けて覚えましょう。',
 'Check: can do not and did not be distinguished just by changing the time word?\nAnswer: no. The verb form changes too. Identify when the action fails to happen and learn present and past negatives separately.')],
10: [
('「今、読んでいる途中です」のように、ある時点で続いている動作を伝えます。これを進行と呼びます。テーマ8の「普段読む」という習慣と分けましょう。日本語の「住んでいる」は習慣的な居住も表すため、日本語に「〜ている」があるという理由だけで進行形にするのは危険です。',
 'A progressive presents an action in progress at a time, such as reading now. Contrast it with the routine present in topic 8. Do not choose it merely because a translation contains a continuing-looking expression; living somewhere can use an ordinary present form.'),
('基本は「動作を表す-दै／-्दैの形＋छ系の形」です。गर्दैはしている途中、पढ्दैは読んでいる途中を表し、最後のछ系が誰の動作かを示します。私ならगर्दै छु、丁寧な人ならगर्दै हुनुहुन्छです。続けて書く例と分けて書く例がありますが、文を理解するときはこの二つの部品に分けます。',
 'Use an action form in -दै/-्दै plus a छ-family auxiliary. गर्दै indicates doing in progress; पढ्दै reading in progress. The auxiliary matches the person: गर्दै छु with I, गर्दै हुनुहुन्छ respectfully. Whether written together or apart, identify the action part and auxiliary.'),
('1. 誰が何をしている最中かを決めます。\n2. 動作を進行の形にします。गर्नुならगर्दैです。\n3. 主語に合うछ系を加えます。मにはछुです。\n4. अहिले（今）などを添えて、いま進行中だと分かる場面にします。',
 '1. Choose who is doing what.\n2. Form the progressive action: गर्नु gives गर्दै.\n3. Add the matching छ auxiliary; म takes छु.\n4. Add अहिले, now, when you want to make the current setting explicit.'),
('म＝私、अहिले＝今、काम＝仕事、गर्दैछु＝しているところです、です。最後はगर्दै＋छुに分けられます。「私」という主語に合うのは後ろのछुで、仕事をするという動作の中身はकाम गर्दैが受け持ちます。二つの働きを別々に見ましょう。',
 'म is I, अहिले now, काम work, and गर्दैछु am doing. Split the ending into गर्दै + छु. The action phrase supplies what is happening; छु supplies the auxiliary agreeing with I. Recognize both jobs rather than memorizing one opaque ending.'),
('否定では最後をछैन系へ替えます。動作部分だけにहोइनを付けません。गरिरहेको छुのような別の進行形もあり、-रहेकोを含む部分と補助動詞に分けて理解します。जाँदै छुは場面により移動中や近い予定を表すので、今なのかこれからなのかは時間の言葉と会話の状況も確認します。',
 'Negate the final auxiliary with the छैन set; do not append होइन to the action. Another progressive uses a -रहेको form plus an auxiliary, as in गरिरहेको छु. जाँदै छु may describe movement in progress or an imminent plan, so check time expressions and context.'),
('確認：गर्दै छुのछुは、単に「家にいる」の「いる」だけでしょうか？\n答え：ここでは進行する動作を支える補助動詞です。同じछ系でも、テーマ2では居場所、ここでは動作の進行という役割になります。',
 'Check: does छु in गर्दै छु only mean being located somewhere?\nAnswer: here it is an auxiliary supporting the progressive action. The same set has different roles: location in topic 2, progressive support here.')],
11: [
('昨日したことなど、終わった行動を話します。とくに「誰が本を読んだか」のように、動作をした人とその対象を区別します。対象を持つ「読む・書く・食べる」などを他動詞と呼びます。「行く・来る」のように、同じ作りで対象を取らない動詞もあります。過去なら何でも同じ印を付ける、と覚えないようにします。',
 'Describe completed actions and distinguish their actor from the object affected. Read, write and eat commonly take objects and are called transitive verbs. Go and come do not follow that same object pattern. Not every past subject takes the same marker.'),
('基本は「動作主＋लेの付いた形＋対象・時＋過去形」です。動作主は、その動作を行った人のことです。完了した他動詞の文では、मがमैले、तपाईंがतपाईंले、उहाँがउहाँलेとなる形を学びます。この働きを能格と呼びますが、まず「この文では誰が何をしたかを示す印」と理解しましょう。動詞の一致は、敬意や対象などによっても違います。',
 'A useful pattern is agent with ले + object/time + past verb. The agent is the doer. Learn म→मैले, तपाईं→तपाईंले and उहाँ→उहाँले in completed transitive clauses. The term ergative names this marking. Agreement can also involve respect and the object; it is not a simple translation of an English subject marker.'),
('1. 出来事が過去に完了したかを確かめます。\n2. 「誰が何をしたか」を分け、लेが必要な型かを確認します。\n3. 私が仕事をしたならमैले、昨日はहिजो、仕事はकामです。\n4. 動詞を過去の形गरेँへ替え、最後に置きます。',
 '1. Establish a completed past event.\n2. Identify actor and object and decide whether this is a ले pattern.\n3. Use मैले for I in this work-doing example, हिजो for yesterday, and काम for work.\n4. Finish with past गरेँ.'),
('मैले＝私が、हिजो＝昨日、काम＝仕事、गरेँ＝しました、です。現在のम काम गर्छुに、単に昨日を足しただけではありません。主語の形と動詞の形の両方が変わっています。下の例題では、どの動詞が対象を取り、どこにलेが現れるかを比べます。',
 'मैले marks I as agent, हिजो yesterday, काम work and गरेँ did. Compared with म काम गर्छु, both the pronoun form and verb change. It is not enough to add yesterday. Compare object-taking actions and the occurrence of ले below.'),
('「私は行きました」のような移動の文に、過去というだけでमैलेを付けません。過去の否定はテーマ12、過去にある・いたという状態はथियो系です。भयोはहुनुの出来事・変化に関わる過去形ですが、खानुなど別の動詞の過去を全部भयोに置き換えることはできません。',
 'Do not use मैले merely because a going sentence is past. Topic 12 covers past negatives, while past existence/location uses the थियो set. भयो can be a past occurrence/change form of हुनु; it is not a replacement for every other verb’s past.'),
('確認：過去の文には、必ずलेが必要ですか？\n答え：いいえ。動詞の種類と文の作りを見ます。時を表す「昨日」だけで決めず、誰が・何を・どうしたかに分けてから形を選びましょう。',
 'Check: does every past sentence require ले?\nAnswer: no. Look at the verb and clause structure, not just yesterday. Identify actor, object and action before choosing the marking.')],
12: [
('「昨日は読まなかった」「コーヒーを飲まなかった」のように、過去の行動が行われなかったことを伝えます。過去とは、話している時点より前のことです。テーマ9の「ふだんしない・今日はしない」と区別し、時間と否定をどちらも動詞に表す必要があります。',
 'Describe an action that did not happen in the past. Past means before the time of speaking. Unlike the present negatives in topic 9, the verb must express both past time and negation.'),
('基本の型は「誰が＋対象・時＋過去の否定形」です。私のする動作ならगरेँ（した）に対してगरिनँ（しなかった）です。丁寧な人はगर्नुभयो→गर्नुभएनになります。完了した他動詞の作りでは、否定にしてもमैले・उहाँलेなどの形を確認します。「行動をしなかった」からといって、文の組み立てが全部なくなるわけではありません。',
 'Use subject/agent + object/time + a past negative verb. Compare गरेँ with गरिनँ for I, and respectful गर्नुभयो with गर्नुभएन. In completed transitive patterns, retain appropriate agent marking such as मैले or उहाँले even when the action is denied.'),
('1. まず肯定の過去の文を思い浮かべます。\n2. 否定する動詞と、主語・動作主を確認します。\n3. 私が仕事をしなかったなら、मैले・कामを残し、गरेँをगरिनँへ替えます。\n4. हिजो（昨日）などを添え、どの過去の場面かをはっきりさせます。',
 '1. Start from the affirmative past pattern.\n2. Identify the verb and its subject/agent.\n3. Keep मैले and काम in this example but replace गरेँ with गरिनँ.\n4. Add हिजो, yesterday, to locate the event being denied.'),
('मैले＝私が、हिजो＝昨日、काम＝仕事、गरिनँ＝しませんでした、です。現在の否定गर्दिनँと見比べると、同じ「しない」でも形が違うと分かります。म・मैलेの使い分けも含めて一文で確認し、語尾の似た見た目だけで覚えないようにしましょう。',
 'मैले marks I as agent, हिजो yesterday, काम work and गरिनँ did not do. Compare it with present गर्दिनँ. Learn the whole clause, including the subject form, rather than relying on similar-looking negative endings.'),
('存在・状態が「なかった・いなかった」のथिएन系は、動作の過去否定とは別です。「読まなかった」にथिएनを機械的に足しません。また「しなくてよかった」は、出来事の否定ではなく必要がなかったという意味になるので、義務・必要を扱うテーマ21と分けて考えます。',
 'Past absence/state negatives use the थिएन family; they are not mechanically appended to read or work. Did not need to do something describes lack of necessity, not merely a denied event; compare the obligation patterns in topic 21.'),
('確認：「昨日しなかった」を言うのに、現在の否定形とहिजोだけで足りますか？\n答え：足りません。主語に合う過去の否定形も必要です。現在の否定・過去の否定・存在の否定を、それぞれ何を否定しているかで分けましょう。',
 'Check: is a present negative plus yesterday enough?\nAnswer: no. Choose the matching past negative verb. Separate present action negatives, past action negatives and absence by what they deny.')],
}

LESSONS.update({
13: [
('これからの行動や予定を伝えます。未来とは、話している時点より後のことです。ネパール語では未来専用の形だけでなく、現在形に「明日・来週」などを添えて予定を言うこともあります。日本語の「行きます」も今後の予定を言えるように、動詞の形と時間の言葉を一緒に読んで意味を決めます。',
 'Describe actions and plans after the time of speaking. Nepali can use a present form with tomorrow or next week as well as an explicit future form. Read the verb together with its time expression; the form alone does not always determine the intended time.'),
('よく使う型は「誰が＋これからの時＋内容＋現在形」です。भोलिは明日、अर्को हप्ताは来週です。さらにगर्नेछु・जानेछुのように未来を示す形もあります。丁寧な形はगर्नुहुनेछなどです。「予定」「そのつもり」「たぶんそうだ」は同じではなく、推測の強さを付ける言い方はテーマ31で学びます。',
 'A common pattern is subject + future time + details + present verb. भोलि is tomorrow; अर्को हप्ता next week. Explicit future forms include गर्नेछु and जानेछु, with respectful forms such as गर्नुहुनेछ. A plan, an intention and a prediction are not identical; topic 31 covers degrees of uncertainty.'),
('1. これからいつのことかを決めます。明日ならभोलिです。\n2. 誰が何をする予定かを並べます。\n3. 予定を述べる現在形か、未来を明示する形かを選びます。\n4. 主語に合う人称・敬意にします。明日でも、मとउहाँで同じ語尾にはなりません。',
 '1. Choose a future time, such as भोलि.\n2. Identify who plans to do what.\n3. Choose a present-form plan or an explicit future form.\n4. Match person and respect; tomorrow does not make म and उहाँ take the same ending.'),
('म＝私、भोलि＝明日、काम＝仕事、गर्छु＝します、です。गर्छुの形はテーマ8と同じでも、भोलिがあるのでこれからの予定として読みます。「私は今働いている最中」という進行の意味ではありません。どの時間を示す語があるかを最初に探すと、意味を取り違えにくくなります。',
 'म is I, भोलि tomorrow, काम work and गर्छु do. The verb has the form learned in topic 8, but भोलि gives a future setting. This is not an action in progress now. Look for time expressions before interpreting the whole sentence.'),
('否定の予定も、選んだ型に合う否定形にします。明日という語を入れても、現在の肯定のまま「しない」にはなりません。またहुन्छは、会議がある・出来事が起こるなど未来の出来事にも使われますが、普通の動作動詞をすべてहुन्छへ置き換えません。हुनुの一般的な働きはテーマ4へ戻って確認します。',
 'A negative plan needs the negative appropriate to its pattern; tomorrow does not negate an affirmative verb. हुन्छ can describe a future occurrence such as a meeting, but does not replace all ordinary action verbs. Review its functions in topic 4.'),
('確認：गर्छुを見たら、必ず「現在の習慣」と決めてよいですか？\n答え：決められません。भोलिなど未来の時間があれば予定を表せます。動詞・時間の語・場面の三つを合わせて考えましょう。',
 'Check: must गर्छु always refer to a present routine?\nAnswer: no. With a future time expression it can state a plan. Consider the verb, time words and conversational setting together.')],
14: [
('「以前はよくここで働いていた」のように、過去に繰り返していた行動を伝えます。単に昨日一回したことと、昔の習慣を区別しましょう。習慣とは、何度も行っていたいつもの行動です。この形だけで「今は絶対しない」とまで断言するわけではなく、今との違いは文脈で補います。',
 'Describe repeated past actions or former routines, rather than one completed event yesterday. A habit is an action done regularly. This form presents the past pattern; whether it has completely stopped now depends on context.'),
('基本の型は「誰が＋以前の時間・場所＋習慣過去の動詞」です。पहिलेは以前、当時のことを話す目印になります。गर्नुの私の形はगर्थें、丁寧な人の形はगर्नुहुन्थ्योなどです。一回の過去गरेँとは違う形です。動作の習慣と、単に「家にいた」という過去の状態も分けて考えます。',
 'Use subject + past setting + habitual-past verb. पहिले means before/formerly. With गर्नु, compare first-person गर्थें and respectful गर्नुहुन्थ्यो with single-event गरेँ. A past routine is also different from merely being at a location in the past.'),
('1. 一回の出来事ではなく、当時繰り返していたことを選びます。\n2. 誰が・どこで・何をしていたかを並べます。\n3. पहिलेなどで昔の話だと示します。\n4. 主語に合う習慣過去の形を文末に置きます。',
 '1. Choose a former repeated action, not one event.\n2. Identify who did what and where.\n3. Add a past-setting word such as पहिले.\n4. Finish with the appropriate habitual-past form.'),
('म＝私、पहिले＝以前、यहाँ＝ここで、काम गर्थें＝仕事をしていました、です。ここでは仕事をしていた時期の習慣を説明しています。काम गरेँなら、完了した一回の出来事として読むことになります。場所のयहाँは、動詞の前でどこにその習慣があったかを補っています。',
 'म is I, पहिले formerly, यहाँ here and काम गर्थें used to work. The sentence describes a former work routine. काम गरेँ instead presents a completed event. यहाँ identifies where that past pattern took place.'),
('否定は習慣過去に合う否定の形を学びます。現在の否定にपहिलेを足すだけで済ませません。また「昨日そのとき働いている最中だった」という過去進行や、「その時までに終えていた」というテーマ16の過去完了とは、時間の見方が違います。繰り返しか、途中か、すでに完了かを確認しましょう。',
 'Learn the matching habitual-past negative rather than adding formerly to a present negative. Distinguish a repeated routine from an action in progress at a past moment and from something already completed by that moment in topic 16.'),
('確認：昔、毎朝お茶を飲んでいたことと、昨日一杯飲んだことは同じ過去形で考えますか？\n答え：ここでは分けます。繰り返しの習慣はこのテーマ、一回の完了した出来事はテーマ11の見方です。',
 'Check: is a former daily tea habit viewed like drinking one cup yesterday?\nAnswer: distinguish them here. This topic presents a repeated pattern; topic 11 presents a completed event.')],
15: [
('「もう仕事を済ませている」「食べた経験がある」のように、過去の行動を今につなげて伝えます。完了とは、動作が終わったことを表す見方です。経験として読めるか、今の結果を述べているかは、何をしたかや時間の言葉、会話の流れで変わります。どの文も必ず「〜したことがある」と訳すわけではありません。',
 'Connect an earlier action with the present: work already completed, or experience of eating something. Completion views the action as finished. Whether a sentence expresses experience or a present result depends on the action, time expressions and context; not every example means have ever.'),
('基本は「-एकोなどの完了を表す部分＋छ系の補助動詞」です。補助動詞は、別の動詞と組んで時や状態を支える語です。गरेको छुなら、गरेकोがしたこと、छुが今の私に結び付ける部分です。丁寧な動作にはगर्नुभएकोのような形があります。後ろの補助動詞だけを見ず、前の動作の形も含めて敬意と一致を確認します。',
 'The pattern combines a completed-action participle, often in -एको, with a छ-family auxiliary. An auxiliary supports the main action’s time or state. In गरेको छु, गरेको supplies having done and छु connects it to I now. Respectful actions can use गर्नुभएको; examine both parts for agreement.'),
('1. 今に関係する結果や経験を伝えたいかを決めます。\n2. 動作を、したことを表す形にします。गर्नुならगरेकोなどです。\n3. 必要な主語・動作主と対象を置きます。\n4. 今につなぐछ系を加え、した出来事と現在の関係を一文で表します。',
 '1. Decide what past result or experience matters now.\n2. Choose the completed-action form, such as गरेको from गर्नु.\n3. Add the subject/agent and object.\n4. Use the appropriate present auxiliary to connect that completion with the present.'),
('मैले＝私が、यो काम＝この仕事、गरेको छु＝して済ませています、です。「この仕事をした」という出来事を、今の完了した状態として述べています。गरेकोとछुは別々の仕事をしており、छुだけでは「仕事を済ませた」という意味は出ません。',
 'मैले marks I as agent, यो काम this work, and गरेको छु have done. The past action is presented as a completion relevant now. गरेको and छु have different jobs; छु alone does not convey that the work has been completed.'),
('否定は、この複合した型のどの部分で否定するかを下の例で確かめます。単純過去の否定と混ぜません。「昨日した」と日時を中心に報告するテーマ11、「その時には済ませていた」と過去の基準を置くテーマ16とも比較します。日本語の「〜た」だけで一つの形に決めないようにします。',
 'Study the negative of this compound pattern below rather than mixing it with a simple past negative. Compare topic 11’s event report and topic 16’s completion before a past reference point. A shared translation such as did does not make these perspectives identical.'),
('確認：「もう仕事が終わっている」と「昨日その仕事をした」は、何に注目していますか？\n答え：前者は今の結果、後者は過去の出来事の報告です。この違いが、複合した完了の形を使う理由になります。',
 'Check: what differs between the work is already finished and I did the work yesterday?\nAnswer: one foregrounds the result now; the other reports a past event. That perspective motivates the perfect construction.')],
16: [
('過去のある時点を基準にして、「その時までにはもう終わっていた」と伝えます。基準の時とは、「友達が来たとき」「家に着いたとき」のように、話の中で比べる時点です。過去完了は単なる「とても昔」のことではありません。二つの過去の前後関係を分かりやすくする形です。',
 'Choose a past reference point, such as a friend’s arrival, and say something was already completed by then. Past perfect does not mean merely a very long time ago. It helps place one completion before another past situation.'),
('基本は「完了を表す部分＋थियो系の過去の補助動詞」です。テーマ15のगरेको छुに対して、गरेको थिएँなら基準が過去へ移ります。私ならथिएँ、文の敬意・一致に合った別の形も使います。動作を終えた部分と、いつを基準にするかを示す後ろの部分を分けて読みます。',
 'Combine a completed-action participle with a past auxiliary in the थियो set. Compare गरेको छु with गरेको थिएँ: the reference shifts to the past. First-person थिएँ and other endings depend on the construction’s agreement. Separate the completed action from the auxiliary setting its time perspective.'),
('1. いつを基準に話すかを、前の文や時間の言葉で決めます。\n2. その基準より前に済んでいた行動を選びます。\n3. 動作を完了の形にします。\n4. 過去の補助動詞で結びます。単に二つの動作を起きた順に並べるのとは違います。',
 '1. Establish a past reference point in context.\n2. Choose an action completed before it.\n3. Use the completed-action form.\n4. Add a past auxiliary. This is different from simply listing two events in chronological order.'),
('मैले＝私が、यो काम＝この仕事、गरेको थिएँ＝その時にはして済ませていました、です。何の「その時」かは、前後の会話で補います。前のテーマのगरेको छुと並べると、現在の完了した状態を言うのか、過去のある時点での完了を言うのかの違いが見えます。',
 'मैले marks I as agent, यो काम this work and गरेको थिएँ had done. Context supplies the past point meant by then. Compare गरेको छु: it connects completion to now, while गरेको थिएँ connects it to a past reference point.'),
('「〜ていた」という日本語だけでは、習慣・進行・完了を区別できません。毎朝していたならテーマ14、あるとき作業の途中だったなら進行の見方、すでに済んでいたならここです。否定も、その時までに済んでいなかったという範囲を確認してから、複合形の否定を使います。',
 'A translation such as was doing is not enough to choose the construction. Distinguish a former habit, an action in progress, and prior completion. A negative here concerns something not completed by that past reference point; use the compound pattern’s negative.'),
('確認：過去完了に必要な「もう一つの時間」は、何でしょうか？\n答え：完了していたかどうかを比べる、過去の基準時点です。話のどこがその基準かを指せるようにしてから文を作りましょう。',
 'Check: what is the second time involved in a past perfect?\nAnswer: the past reference point against which completion is assessed. Locate that point in the story before forming the sentence.')],
17: [
('相手に座る・見る・話すなどの行動をお願いする文です。「相手が座ります」と事実を述べる文とは違い、聞いている相手にしてほしい行動を直接伝えます。依頼はお願い、命令は強く指示する言い方です。言葉の形だけでなく、声の調子や場面によっても受け取り方が変わります。',
 'Ask the listener to sit, look or speak. Unlike a statement that someone sits, a request directs an action to the listener. Requests and commands differ in force, and tone and setting also affect how they sound.'),
('まず使う基本は「場所・対象・方法＋丁寧な依頼の動詞」です。बस्नुहोस्は座ってください、हेर्नुहोस्は見てくださいです。主語の「あなた」は分かっているので、省くことが多くあります。辞書形बस्नुをそのまま置くのでなく、依頼の形としてबस्नुहोस्を覚えます。より親しい言い方の比較はテーマ7の敬意と結び付けます。',
 'Start with place/object/manner + a respectful request form, such as बस्नुहोस् or हेर्नुहोस्. The listener is understood, so you is often omitted. Learn बस्नुहोस् as a request form rather than using dictionary बस्नु unchanged. Relate more familiar forms to the register distinctions in topic 7.'),
('1. 相手に何をしてほしいかを一つ選びます。\n2. 必要なら場所や方法を先に置きます。ここならयहाँです。\n3. 動詞を丁寧な依頼形にして最後に置きます。\n4. 自分がする提案ならテーマ18、しないでほしいならテーマ19と区別します。',
 '1. Choose the requested action.\n2. Add a place or manner such as यहाँ, here.\n3. Finish with the respectful request form.\n4. Distinguish this from offering your own action in topic 18 and asking someone not to act in topic 19.'),
('यहाँ＝ここに、बस्नुहोस्＝座ってください、です。誰が座るかは相手だと分かるため、短い二つの部品で文ができます。場所を替えるときも動詞の依頼の形は保ちます。「私がここに座っています」という報告とは、相手への働きかけかどうかが違います。',
 'यहाँ means here and बस्नुहोस् please sit. The listener is the understood actor, so these two parts form a request. Keep the request form when changing the location. This is an instruction to someone, not a report that you are sitting here.'),
('日本語の「ください」を一語だけ訳して、普通の現在形の後ろに付ける作りではありません。動詞自体を依頼の形にします。丁寧な形でも、場面によっては指示として強く聞こえるため、相手との関係に合わせます。疑問文や、できるかを尋ねる形でやわらかくお願いする場合は、テーマ20とも関連します。',
 'Do not form every request by adding a separate please-word after an ordinary present verb. The verb itself changes. Even a respectful form can sound directive in context. Ability questions can also help soften a request; compare topic 20.'),
('確認：「相手に座ってほしい」と「自分が座ってよいか聞く」は同じ形ですか？\n答え：違います。前者はこのテーマの依頼、後者はテーマ18などで扱う許可を求める言い方です。動作をするのが誰かを先に決めましょう。',
 'Check: is asking someone to sit the same as asking whether you may sit?\nAnswer: no. First identify the actor. The former is a request here; the latter uses an offer/permission-seeking pattern such as topic 18.')],
18: [
('「私が開けましょうか」「一緒に行きましょう」のように、自分の行動を提案したり、相手を誘ったりします。事実として「開けます」と言うのか、相手の意向を確かめながら申し出るのかを区別しましょう。自分一人の申し出と、みんなで行う提案では、動詞の形も異なります。',
 'Offer your own action or suggest doing something together. Distinguish reporting that you will open something from asking whether you should do it. A singular offer and a shared suggestion use different forms.'),
('私がする申し出・許可を求める文には、बसूँ?・खोलूँ?などの形があります。一緒にする勧誘には、जाऔंなどの形を使います。これは単純に現在形へ疑問符を付ける規則ではありません。動詞ごとの形と、「私がする」「私たちでしよう」という働きを組にして覚えます。',
 'First-person offers or permission-seeking questions include बसूँ? and खोलूँ? Shared suggestions use forms such as जाऔं. These are not simply ordinary present verbs plus a question mark. Learn the verb form together with its singular-offer or shared-suggestion function.'),
('1. 自分がする申し出か、一緒にする誘いかを決めます。\n2. 動作と場所・対象を選びます。\n3. 私一人の申し出なら、その動詞の一人称の申し出の形にします。\n4. 相手の返事を求めるときは、質問の調子で伝えます。',
 '1. Choose an individual offer or a shared suggestion.\n2. Add the action and necessary details.\n3. For your own offer use the appropriate first-person proposal form.\n4. Use question intonation when seeking the other person’s response.'),
('म＝私、यहाँ＝ここに、बसूँ?＝座ってもよいですか、という場面の文です。座るのは聞き手ではなく私です。テーマ17のबस्नुहोस्は相手に座るように言う形なので、動詞が似ていても、行動する人と相手への働きかけが違います。',
 'म is I, यहाँ here, and बसूँ? asks in this setting whether I may sit. I am the actor, not the listener. Contrast topic 17’s बस्नुहोस्, which asks the listener to sit. Similar verbs can perform different conversational jobs.'),
('「あなたがしてください」と言いたい場面で、自分の申し出の形を使わないようにします。また「〜するつもりです」という予定の報告はテーマ13です。許可の一般的な条件を述べる「〜してよい」はテーマ21で学びます。このテーマでは、会話の中で自分から行動を申し出る働きに注目します。',
 'Do not use your own offer form when you want the listener to act. A statement of plans belongs to topic 13; general permission rules belong to topic 21. Here focus on proposing an action within a conversation.'),
('確認：ドアを開けるのは誰か、という質問がなぜ大切ですか？\n答え：私が開ける申し出か、相手に開けてもらう依頼かで形が変わるからです。日本語訳の「〜ましょうか」だけでなく、役割を確認します。',
 'Check: why identify who opens the door?\nAnswer: offering to open it yourself and requesting that the listener open it require different forms. Decide the roles before translating an ending.')],
19: [
('「ここに座らないでください」「入ってはいけません」のように、行動をやめてもらったり、禁止を伝えたりします。禁止とは、しないように求めることです。「私はしません」という自分の行動の説明とは別です。誰に、どの行動を止めてほしいのかを考えます。',
 'Ask someone not to act or state a prohibition. This directs behavior, unlike reporting that you yourself do not do something. Identify who is being addressed and which action must be avoided.'),
('丁寧な「〜しないでください」は、動詞の前にनを置いた依頼形を使います。बस्नुहोस्に対してनबस्नुहोस्、खोल्नुहोस्に対してनखोल्नुहोस्です。規則として「〜してはいけない」を表す-नु हुँदैनの型もあります。前者は相手への働きかけ、後者は許されない行為を述べる型として区別します。',
 'A respectful negative request places न before the request verb: बस्नुहोस् becomes नबस्नुहोस्. A rule-like prohibition can use -नु हुँदैन. Distinguish directly asking the listener not to act from stating that an action is not allowed.'),
('1. 止めたい動作を選びます。\n2. 直接「〜しないでください」と頼むか、禁止の規則を述べるかを決めます。\n3. 直接の依頼なら、丁寧な依頼形の前にनを付けます。\n4. 場所や方法を先に加え、どこで何をしないでほしいかを明確にします。',
 '1. Choose the action to prevent.\n2. Decide between a direct negative request and a prohibition rule.\n3. For a direct request place न before the respectful request form.\n4. Add place or manner to make its scope clear.'),
('तल＝下へ、नहेर्नुहोस्＝見ないでください、です。हेर्नुहोस्という「見てください」を、नで否定する作りです。文中のनは日本語の「しないで」の働きをする重要な部品で、場所のतलを否定しているわけではありません。',
 'तल means down and नहेर्नुहोस् please do not look. न negates the requested action हेर्नुहोस्. It is an essential part of the negative request, not a denial of the place or direction.'),
('नが付いた文を見て、現在の否定形と同じだと思わないでください。また-नु हुँदैनのहुँदैनは、テーマ4で学ぶहुनुの形が禁止の構文に入ったものです。「〜する必要がない」という義務の否定とは違い、後者を禁止と訳すと意味が逆になることがあります。テーマ21と対比します。',
 'A negative request is not an ordinary present negative. In -नु हुँदैन, the हुनु form learned in topic 4 participates in a prohibition construction. This differs from not needing to act in topic 21; confusing the two can reverse the intended instruction.'),
('確認：「しなくてもよい」と「してはいけない」は同じですか？\n答え：違います。前者は必要がない、後者は禁止です。動作をしないという結果だけでなく、必要・許可・禁止のどれを言うかを見ます。',
 'Check: are need not do and must not do the same?\nAnswer: no. One removes necessity; the other prohibits. Decide whether you mean necessity, permission or prohibition.')],
20: [
('「ネパール語を話せる」「今日は来られない」のように、できることや可能性を伝えます。能力とは練習や知識によってできること、状況による可能とは時間などの条件が整ってできることです。どちらもसक्नुを使えますが、何が可能なのかは文の内容から読み取ります。',
 'State ability or practical possibility: speaking Nepali or being able to come today. Ability may come from skill; situational possibility from available time or conditions. सक्नु can express both, with context supplying the reason.'),
('基本は「する動作の-न形＋सक्नुの活用」です。बोल्नु（話す）はबोल्न、गर्नु（する）はगर्नのような形で、सक्नुの前に置きます。私ならसक्छु、丁寧な人ならसक्नुहुन्छです。文の最後のसक्नु側が、誰のできることか、肯定か否定かを表します。',
 'Use the action in its -न infinitive form before a conjugated सक्नु: बोल्नु gives बोल्न, गर्नु gives गर्न. Use सक्छु with I and सक्नुहुन्छ respectfully. The final सक्नु form carries the person and positive/negative meaning.'),
('1. 何ができるかを動作で決めます。\n2. その動作をसक्नुの前に置く形にします。話すならबोल्नです。\n3. 必要なら、何語を・何を、という内容を加えます。\n4. できる人に合うसक्नुの形で結びます。',
 '1. Choose the action that is possible.\n2. Put it in the form used before सक्नु, such as बोल्न.\n3. Add details such as the language spoken.\n4. Finish with the सक्नु form matching the person.'),
('म＝私、नेपाली＝ネパール語、बोल्न＝話すこと、सक्छु＝できます、です。二つの動詞が並びますが、両方を普通の現在形にはしません。話すという内容はबोल्न、可能かどうかはसक्छुと、役割を分けています。',
 'म is I, नेपाली Nepali, बोल्न speak and सक्छु can. Two verb-related parts appear, but both do not receive ordinary present endings. बोल्न supplies the action; सक्छु supplies ability/possibility and agreement.'),
('否定はसक्दिनँ・सक्नुहुन्नなど、सक्नुの側を変えます。前の動作に現在の否定形を入れてからसक्छुを足す作りではありません。「できる」と「してよい」は違うので、許可はテーマ21と区別します。「できるか」と尋ねる文が、場面によって依頼として使われることもあります。',
 'Negate the सक्नु part, using forms such as सक्दिनँ or respectful सक्नुहुन्न. Do not place a finite negative action before सक्छु. Can as ability differs from may as permission in topic 21. An ability question can also serve as a request in context.'),
('確認：話せる文では、बोल्नとसक्छुのどちらが「できる」を表しますか？\n答え：सक्छुです。बोल्नは、何ができるかという動作を指定しています。二つの役割を説明できるようにしましょう。',
 'Check: which part of बोल्न सक्छु means can?\nAnswer: सक्छु. बोल्न specifies the possible action. Be able to explain the job of each part.')],
21: [
('「行かなければならない」「ここで待ってよい」のように、必要や許可を伝えます。義務はしなければならないこと、許可はしてよいことです。どちらも実際にその行動をしたかどうかとは別の話です。まず必要・許可・禁止のどれを伝えるかをはっきりさせます。',
 'State necessity or permission: having to go or being allowed to wait. Obligation means an action is required; permission means it is allowed. Neither alone says whether the action actually happened.'),
('義務の基本は「動作の-नु形＋पर्छ」です。जानु पर्छなら行く必要がある、です。この型ではमैलेなど、義務を負う人を表す形を使う例を学びます。लेがあるから過去という意味にはなりません。許可の「〜してよい」は、動作の-न形＋हुन्छという別の型です。動詞の前半と、必要・許可を示す後半を分けます。',
 'Obligation commonly uses an action in -नु + पर्छ, as in जानु पर्छ. This course includes मैले-type forms for the person bearing the obligation; ले does not by itself mean past. Permission uses an action in -न + हुन्छ. Separate the action from the part expressing necessity or permission.'),
('1. 必要なのか、許されるのかを決めます。\n2. その対象になる動作を選びます。\n3. 義務なら-नु＋पर्छ、許可なら-न＋हुन्छの型を選びます。\n4. 誰についての必要・許可かと、時間・場所を加えます。',
 '1. Decide between requirement and permission.\n2. Choose the relevant action.\n3. Use the obligation or permission pattern with its appropriate preceding verb form.\n4. Add the person concerned, time and place.'),
('मैले＝私が、भोलि＝明日、अफिस＝会社、जानु पर्छ＝行かなければなりません、です。明日の義務なので、मैलेのलेを見て「過去だ」と判断しません。ここではपर्छが必要を述べ、जानुが必要な動作を表しています。',
 'मैले identifies the person with the obligation, भोलि tomorrow, अफिस the office and जानु पर्छ must go. This is a future obligation, so ले cannot be treated as a past-time label. पर्छ expresses necessity and जानु supplies the required action.'),
('義務を否定するपर्दैनは、必要がないという意味です。禁止のहुँदैनとは分けます。また「できる」は能力や状況の可能で、許可とは別なのでテーマ20へ戻って確認します。ここでのहुन्छは「許される」という構文の一部で、何でも「〜になる」と訳すと意味が崩れます。',
 'The negative पर्दैन removes necessity; it is not prohibition with हुँदैन. Ability or practical possibility belongs to topic 20. In permission expressions, हुन्छ participates in the meaning allowed; translating it mechanically as become would be misleading.'),
('確認：「会社へ行く必要がない」と「会社へ行ってはいけない」は同じ指示ですか？\n答え：違います。前者は行ってもよいが義務がない、後者は行くことを禁じています。最後の型の違いで、相手の行動への意味が変わります。',
 'Check: are need not go and must not go the same instruction?\nAnswer: no. One removes the requirement while the other forbids going. The final construction changes what is being said about the action.')],
22: [
('自分の希望や、何かをしたい気分を伝えます。「したい」は実際にするという予定や、できるという能力とは違います。希望とはそうしたいと思うことです。まず望んでいる行動と、その気持ちを持っている人を分けて考えます。',
 'Express a wish or an inclination to act. Wanting is different from a plan to do it or the ability to do it. Identify the desired action and the person experiencing the wish.'),
('「誰が＋動作の-न形＋चाहनुの活用」が一つの基本です。जान चाहन्छुなら行きたいです、となります。もう一つ、मलाईのように気持ちを持つ人を示し、「動作＋मन छ／मन लाग्छ」と言う型があります。मनは心・気持ちです。二つの型は主語の置き方や最後の動詞が違うので、部品を混ぜずに学びます。',
 'One pattern is subject + action infinitive in -न + a form of चाहनु, as in जान चाहन्छु. Another marks the experiencer with मलाई and uses action + मन छ or मन लाग्छ. मन means mind/feeling. These patterns organize the experiencer and final verb differently; do not mix their parts arbitrarily.'),
('1. したい行動を選びます。行くならजानुです。\n2. चाहनुを使うなら、前に置く動作をजानにします。\n3. 私の希望ならचाहन्छुで結びます。\n4. 気分を述べるमनの型を選ぶ場合は、誰にそういう気持ちがあるかを示す形から組み立てます。',
 '1. Choose the desired action, such as जानु.\n2. Before चाहनु use जान.\n3. With I finish with चाहन्छु.\n4. If choosing the मन pattern instead, start from the experiencer form appropriate to that construction.'),
('म＝私、नेपाल＝ネパールへ、जान＝行くこと、चाहन्छु＝望みます、です。जानが希望する動作、चाहन्छुが希望を表す最後の動詞です。「行きます」と断言する現在形のजान्छुとは違い、行きたいという気持ちを伝えています。',
 'म is I, नेपाल Nepal, जान go and चाहन्छु want. जान supplies the desired action; चाहन्छु expresses the wish and agreement. Unlike जान्छु as a statement of going, this reports a wish.'),
('否定は、選んだ型の最後の動詞・状態を否定します。下の例で、行くことを望まないのか、今そういう気分がないのかを確かめます。「〜したい」と「〜する必要がある」は別なので、テーマ21のपर्छに置き換えません。丁寧な人の希望は、その型に合う敬意の形を使います。',
 'Negate the final verb or state appropriate to the chosen pattern. Distinguish not wanting an action from not feeling like it now. Wanting is not needing; do not replace it with topic 21’s पर्छ. Respectful subjects require agreement within the chosen construction.'),
('確認：जान चाहन्छुの「行く」と「望む」は、それぞれどの部分ですか？\n答え：जानが行く動作、चाहन्छुが望む気持ちです。どちらか一つだけを見ず、二つが組になって希望を表すと説明できれば大丈夫です。',
 'Check: which parts of जान चाहन्छु express go and want?\nAnswer: जान supplies going and चाहन्छु wanting. Explain how the two parts work together rather than interpreting either in isolation.')],
23: [
('「良い本」「かわいい女の子」のように、名詞の中へ説明の言葉を入れます。名詞は人や物の名前、形容詞はその性質を表す言葉でした。ここでは形容詞をどこに置くかと、説明する名詞に合わせて形が変わる場合を学びます。形を合わせることを一致と呼びます。',
 'Build noun phrases such as a good book. A noun names someone or something; an adjective describes a quality. Learn where the adjective goes and when its form matches the noun. Such matching is called agreement.'),
('基本は「形容詞＋名詞」の順です。राम्रो किताबなら良い本というまとまりになります。राम्रो・राम्री・राम्राのように形が変わる形容詞と、सुन्दरのように通常形が変わらないものがあります。日本語に文法上の性がないからといって、ネパール語でも性・数を考えなくてよいわけではありません。逆に、すべての形容詞を同じように変えてもいけません。',
 'The ordinary order is adjective + noun, as in राम्रो किताब. Some adjectives vary, such as राम्रो/राम्री/राम्रा; others such as सुन्दर are generally invariable. Learn Nepali agreement rather than assuming it works like English or Japanese, but do not force every adjective to change.'),
('1. 説明したい名詞を決めます。\n2. その前に性質を表す形容詞を置きます。\n3. 変化する形容詞なら、名詞の性・数などに合う形を選びます。\n4. できた名詞のまとまり全体を使って、正体の紹介や別の文を作ります。',
 '1. Choose the noun.\n2. Put its adjective before it.\n3. If that adjective varies, choose a form appropriate to the noun.\n4. Use the complete noun phrase in an identity sentence or another construction.'),
('यो＝これ、राम्रो किताब＝良い本、हो＝です、です。文全体は「これは何か」を良い本という名詞のまとまりで答えているのでहोです。यो किताब राम्रो छなら、この本の性質を後ろから説明するテーマ3の文です。語の並べ方で文の役割も変わります。',
 'यो is this, राम्रो किताब a good book, and हो the identity ending. The noun phrase supplies what this is. Contrast यो किताब राम्रो छ, which describes the book’s quality in topic 3. The arrangement changes the grammatical job.'),
('形容詞の性・数と、代名詞の敬意は別々に確認します。基本の彼・彼女にはउहाँを使っても、後ろの名詞を説明する形容詞は、その名詞との結び付きで考えます。所有を示すको・की・काにも後ろの名詞との一致があるので、テーマ5と比べます。名詞の前と文末の説明を混ぜないようにしましょう。',
 'Check adjective agreement separately from pronoun respect. Using respectful उहाँ does not remove the need to consider the noun being described. Possessive को/की/का also relate to a following noun; compare topic 5. Distinguish an adjective inside a noun phrase from a whole sentence’s description.'),
('確認：「良い本」の中で、名詞と形容詞はどちらが先ですか？\n答え：形容詞のराम्रोが先、名詞のकिताबが後です。そのまとまりを一つの部品として、文の中へ入れましょう。',
 'Check: which comes first inside good book?\nAnswer: adjective राम्रो precedes noun किताब. Treat the phrase as one unit when placing it into a larger sentence.')],
24: [
('「ゆっくり歩く」「いつも来る」「とても大きい」のように、動作の仕方・回数の多さ・程度を加えます。このように動作や性質の説明を補う語を副詞と呼びます。「大きい家」の大きいは家を説明する形容詞ですが、「ゆっくり歩く」のゆっくりは歩く動作を説明しています。',
 'Add manner, frequency or degree: walk slowly, always come, very big. Such words are often called adverbs. Contrast an adjective describing a house with an adverb describing how someone walks.'),
('基本は「誰が＋方法・頻度など＋動詞」です。बिस्तारैはゆっくり、छिटोは速く・早く、सधैंはいつも、प्रायःはたいてい、です。धेरैは多く・とてもと、何を説明するかで訳し方が変わります。言葉を見つけたら、後ろのどの動作・性質を説明しているか線で結ぶつもりで読みましょう。',
 'Use subject + manner/frequency expression + verb. बिस्तारै means slowly, छिटो quickly/early, सधैं always and प्रायः usually. धेरै may mean much/many or very depending on what it modifies. Identify the action or quality the word describes.'),
('1. まず副詞のない短い文を作ります。\n2. どの情報を加えたいか選びます。速さか、頻度か、程度かを分けます。\n3. 動作を説明する言葉を動詞の前へ加えます。\n4. 主語や動作を替えていなければ、動詞の人称・敬意は元のままです。',
 '1. Form a short sentence without the added description.\n2. Choose manner, frequency or degree.\n3. Put the action-description before the verb.\n4. Keep the same personal agreement if the subject and action have not changed.'),
('म＝私、बिस्तारै＝ゆっくり、हिँड्छु＝歩きます、です。बिस्तारैが説明するのは私という人の性質ではなく、歩く速さです。副詞を取り除いても「私は歩きます」という文の骨組みが残ります。まず骨組みを作ってから情報を足す感覚を覚えましょう。',
 'म is I, बिस्तारै slowly and हिँड्छु walk. Slowly describes the manner of walking, not I as a permanent personal quality. Removing it leaves the basic sentence I walk. Build that skeleton before adding details.'),
('कति＋形容詞などは、質問だけでなく驚きや感動を表す場合があります。疑問符・声の調子・場面も見ます。また「いつも」と「ときどき」では頻度が大きく違うので、似た位置に入る語でも意味を区別します。副詞を足せば進行形になるわけではなく、習慣と進行はテーマ8・10の区別を保ちます。',
 'कति plus a descriptive word can express an exclamation as well as a question; use intonation and context. Distinguish frequency meanings even when words occupy similar positions. Adding an adverb does not itself make a verb progressive; retain the distinction in topics 8 and 10.'),
('確認：बिस्तारैは、「誰が」「何を」「どのように」のどれを説明しますか？\n答え：「どのように」です。どの語がどの情報を加えるかを言えると、知らない長い文でも骨組みを見つけやすくなります。',
 'Check: does बिस्तारै explain who, what or how?\nAnswer: how. Identifying each word’s information type helps reveal the skeleton of longer sentences.')],
})

LESSONS.update({
25: [
('「この家はあの家より大きい」のように、二つ以上を比べて違いや似ている点を伝えます。比較では、説明したいものと、比べる基準になるものを分けることが大切です。「より大きい」だけでなく、「何と比べて大きいか」まで考えると、文の順序が決めやすくなります。',
 'Compare things and describe differences or similarities. Separate the item being described from the standard it is compared against. Decide bigger than what, not just bigger, before arranging the sentence.'),
('基本の型は「A＋Bभन्दा＋形容詞＋文末」です。Aを説明し、Bを基準にします。भन्दाはBの後ろです。「いちばん」はसबभन्दा・सबैभन्दाなどを使い、何の集団の中で一番かをमध्येなどで示せます。似ていると言うजस्तै・जस्तोの型は、大小を比較するभन्दाと働きが違います。',
 'Use A + Bभन्दा + adjective + ending. A is described; B is the standard. भन्दा follows B. Superlatives use forms such as सबैभन्दा, and मध्ये can identify the comparison group. Similarity with जस्तै/जस्तो is different from an inequality with भन्दा.'),
('1. 何を説明したいか、Aを決めます。\n2. 何と比べるか、Bを決めます。\n3. Bの後ろにभन्दाを付けます。\n4. 大きい・安いなどの形容詞と、Aに合う文末を続けます。',
 '1. Choose A, the item described.\n2. Choose B, the standard.\n3. Put भन्दा after B.\n4. Add the quality and an ending appropriate to A.'),
('यो घर＝この家、त्यो घरभन्दा＝あの家より、ठूलो छ＝大きいです、です。よりの目印はあの家の後ろに付き、最後に説明されているのはこの家です。AとBを逆にすると、どちらが大きいと言っているかも変わります。日本語訳を見ずに二つの家の役割を指してみましょう。',
 'यो घर is this house, त्यो घरभन्दा than that house, and ठूलो छ is bigger. The marker attaches to the standard, while the sentence describes this house. Reversing the two houses changes which one is said to be larger.'),
('否定では、比較の目印を消すのでなく、形容詞を述べる最後の形を否定します。最上級の範囲を示さずに何でも「世界で一番」と訳さないようにします。またजस्तोは性・数などで形が変わることがあるため、テーマ23の一致と、テーマ29の関係表現も確認します。',
 'Negate the descriptive ending rather than deleting the comparison marker. Do not silently expand an unspecified superlative group to the whole world. जस्तो can vary with agreement; review topic 23 and its relative-expression uses in topic 29.'),
('確認：AはBより大きい、という文のभन्दाはAとBのどちらの後ろですか？\n答え：基準のBの後ろです。先に「どちらを説明するか」を決めれば、逆の意味にする間違いを減らせます。',
 'Check: in A is bigger than B, which item is followed by भन्दा?\nAnswer: B, the standard. First identify the item being described to avoid reversing the comparison.')],
26: [
('言葉や文をつないで、二つのもの・順番・反対の内容・理由を伝えます。接続とは、情報同士の関係を示してつなぐことです。単に長い文にするのでなく、「同じように並べたい」「その後が起きた」「反対の内容だ」など、どんな関係を示したいかを先に決めます。',
 'Connect items or clauses to express addition, sequence, contrast or reason. Connecting is not merely making a sentence longer: first decide the relationship between the pieces of information.'),
('रは名詞などを並べる「と・そして」、अनिは順序を示す「それから」、तरは対比の「でも」です。पनिは「も」を加えます。किनभनेは理由を導きます。節とは、一つの出来事や状態を述べる文のまとまりです。二つの節をつなぐときも、それぞれの中の主語・動詞・後置詞の関係を保ちます。',
 'र coordinates items, अनि marks sequence, तर contrast, and पनि adds also. किनभने introduces a reason. A clause describes an event or state. When clauses are linked, each still needs its own appropriate subject, verb and case relationships.'),
('1. つなぐ二つの内容を、いったん別々に考えます。\n2. 並列・順序・対比・理由のどれかを決めます。\n3. その関係に合う言葉でつなぎます。\n4. つないだ後も、どの動詞がどの人や物について述べているかを確認します。',
 '1. Understand each piece separately.\n2. Choose addition, sequence, contrast or reason.\n3. Link them with the corresponding expression.\n4. Recheck which verb belongs to which person or thing.'),
('मलाई＝私には、चिया र कफी＝お茶とコーヒー、मन पर्छ＝好ましく思えます、で「私はお茶とコーヒーが好きです」です。ここでरがつなぐのは二つの飲み物です。主語と動詞を二回繰り返さず、一つの文の中の対象を並べています。',
 'मलाई marks the experiencer, चिया र कफी tea and coffee, and मन पर्छ liking. र joins two drinks inside one clause. It does not require repeating the experiencer and predicate for each drink.'),
('रとअनिを何でも交換しません。並べるだけなのか、先に一つをして次へ進むのかが違います。理由と目的も別です。理由は「なぜそうなのか」、目的は「何を実現したいか」で、目的はテーマ28です。का बाबजुदのような「〜にもかかわらず」では、予想と反する関係を表します。',
 'Do not exchange र and अनि indiscriminately: coordination and sequence differ. A reason explains why; a purpose states an intended outcome, taught in topic 28. Expressions such as का बाबजुद mark a result contrary to expectation.'),
('確認：「お茶とコーヒー」と「家に帰って、それから寝る」は同じつなぎ方でしょうか？\n答え：前者は物の並列、後者は行動の順序です。日本語の「そして」だけで選ばず、情報同士の関係を確認しましょう。',
 'Check: are tea and coffee and go home, then sleep the same relationship?\nAnswer: one coordinates items; the other orders actions. Choose by the relationship, not a single translated conjunction.')],
27: [
('「音楽を聴きながら勉強する」と「お茶を飲んでから行く」では、二つの動作の時間関係が違います。前者は同時、後者は一つを済ませて次です。このテーマでは、一つ一つの動作を理解した後で、重なるのか順番があるのかを言葉で示します。',
 'Listening while studying overlaps two actions; drinking tea before leaving orders them. Understand each action first, then express whether they overlap or one follows the other.'),
('同時は「-दै系の動作＋中心になる動作」、後の動作へつなぐ場合は「-एपछिなどの形＋次の動作」が基本です。-दैはテーマ10の進行にも現れますが、ここでは別の動作をしながらという関係を作ります。最後の動詞が文全体の人称・敬意・時を示す中心になります。',
 'For overlap use a -दै action form with the main action; for sequence use an appropriate completed-action form with पछि before the next action. -दै also appears in topic 10, but here links simultaneous actions. The final main verb carries the sentence’s personal and temporal information.'),
('1. 二つの動作を選びます。\n2. 同時か、終えてからかを決めます。\n3. 背景・先行の動作を、それに合うつなぐ形へ変えます。\n4. 中心の動作を後ろに置き、主語に合う形で結びます。動詞ごとの形は下の例で確認します。',
 '1. Choose two actions.\n2. Decide overlap or succession.\n3. Put the background/earlier action in the appropriate linking form.\n4. Conjugate the final main action for the subject. Learn the actual linking forms through the examples.'),
('म＝私、संगीत＝音楽、सुन्दै＝聴きながら、पढ्छु＝勉強します、です。聴くことと勉強することが重なります。सुन्दैは背景の動作をつなぎ、最後のपढ्छुが「私がする」という文末を受け持ちます。一つの動作に二重の普通の現在形を付ける作りではありません。',
 'म is I, संगीत music, सुन्दै while listening and पढ्छु study. The actions overlap. सुन्दै links the background action; final पढ्छु supplies the finite ending agreeing with I. Both actions do not receive independent ordinary-present endings here.'),
('「授業の後」のような名詞＋पछिと、動作を終えてからという動詞の形は区別します。どの過去形にもそのままपछिを足せるわけではありません。अघि・पहिलेは前、भित्रは期間内などを示します。主語が二つの節で違う場合など、ここで扱う短い同時動作の型を何にでも広げないようにします。',
 'Noun + पछि, after class, differs from a verb construction meaning after doing. Do not append पछि to every past verb unchanged. अघि/पहिले mark before, and भित्र can mark within a period. Do not assume the simple shared-actor overlap pattern fits every pair of clauses with different actors.'),
('確認：同時に聴いて勉強する文で、どちらが最後の活用を持ちますか？\n答え：中心の動作のपढ्छुです。二つの動作を見つけたら、つなぐ形と文末の形に分けて読みましょう。',
 'Check: which action has the final finite ending in the listening/studying example?\nAnswer: the main action पढ्छु. Separate the linking form from the final verb when reading two-action sentences.')],
28: [
('「勉強するために図書館へ行く」「子どものために買う」のように、目的や利益を受ける人を伝えます。目的は、その行動で実現したいことです。すでに起きた理由とは違います。行くという動作と、行って何をしたいのかを分けて考えると、長い文も二つの部品にできます。',
 'Express an intended outcome or beneficiary: go to the library to study, buy something for a child. A purpose is what the action aims to achieve, unlike an already-existing reason. Separate going from what the person intends to do there.'),
('人・物のためは「名詞＋को／का लागि」など、動作のためは「-न形＋को लागि」が基本です。पढ्नको लागिは勉強するために、となります。動作を言う前半と、実際にする中心の行動を分けます。目的の後に過去形が来れば、ある目的で行ったという過去の文も作れます。目的そのものが文全体を未来形にするわけではありません。',
 'Beneficiaries use noun phrases with को/का लागि; action purposes use an infinitive in -न + को लागि, as in पढ्नको लागि. Separate the intended action from the main action. A past main verb can describe going for that purpose; a purpose phrase does not by itself make the sentence future.'),
('1. 中心の行動を決めます。図書館へ行く、などです。\n2. 何をするためか、または誰のためかを決めます。\n3. 動作の目的なら、その動詞を目的の型にします。\n4. 目的のまとまりを中心の動詞の前へ置き、人称・時制は最後の動詞で表します。',
 '1. Choose the main action, such as going to a library.\n2. Identify the intended action or beneficiary.\n3. Put an action purpose in the appropriate purpose form.\n4. Place it before the main verb, which carries person and tense.'),
('म＝私、पढ्नको लागि＝勉強するために、पुस्तकालय＝図書館へ、जान्छु＝行きます、です。「勉強したいこと」が目的で、「図書館へ行くこと」が中心の行動です。先に目的のまとまりを見つけると、何をしに行く文なのかが分かります。',
 'म is I, पढ्नको लागि in order to study, पुस्तकालय the library and जान्छु go. Studying is the intended action; going is the main action. Identify the purpose phrase as a unit before reading the final verb.'),
('移動の目的ではपढ्न जान्छुのような短い-न形の型も使います。毎回को लागिが必須というわけではありません。निम्ति・निमित्तも「〜のために」に関係しますが、名詞との結び付きや言い方の硬さを例で確認します。理由を述べる「〜ので」はテーマ26と分けます。',
 'Motion purposes can also use a shorter infinitive, as in पढ्न जान्छु; को लागि is not always obligatory. Related निम्ति/निमित्त expressions have their own combinations and register. Distinguish purpose from the reason constructions in topic 26.'),
('確認：「雨が降ったので帰る」と「勉強するために行く」は、同じ関係ですか？\n答え：前者は理由、後者は目的です。過去にある事情と、これから実現したい行動を分けて選びましょう。',
 'Check: is going home because it rains the same relationship as going somewhere to study?\nAnswer: one gives a reason; the other an intended outcome. Choose the construction by that relationship.')],
29: [
('人や物を一語だけでなく、短い文で説明します。「ここに住む人」の「ここに住む」が、人を説明する部分です。このように名詞を説明するまとまりや、二つの節で同じ人・場所・時を結ぶ表現を学びます。関係表現という名前より、「どの人か・どの場所かを詳しく伝える仕組み」と考えましょう。',
 'Describe a person or thing with a clause, as in the person who lives here. Also link two clauses referring to the same person, place or time. Think of relative expressions as a way to specify which person or setting you mean.'),
('作り方は二つあります。一つは「説明する-ने／-एकोなどのまとまり＋名詞」で、説明を名詞の前に置きます。もう一つはजो・जुन・जहाँ・जबなどで節を導き、後ろで対応する人・物・場所・時を受ける形です。前者は名詞の中の説明、後者は二つの節の対応と考えると区別できます。',
 'There are two useful patterns: a modifying clause, often in -ने/-एको, before a noun; or linked clauses introduced by forms such as जो, जुन, जहाँ and जब. The first builds a noun phrase; the second connects corresponding information across clauses.'),
('1. 説明したい名詞を決めます。人ならमान्छेです。\n2. その名詞が何をするかを短い説明にします。ここに住む、ならयहाँ बस्नेです。\n3. 説明を名詞の前に置き、यहाँ बस्ने मान्छेとまとめます。\n4. できたまとまり全体を、一人の人を表す部品として文の中へ入れます。',
 '1. Choose the noun, such as मान्छे, person.\n2. Build its description: यहाँ बस्ने, living here.\n3. Put the description before the noun.\n4. Use the complete noun phrase as one participant in the larger sentence.'),
('यहाँ बस्ने मान्छे＝ここに住む人、मेरो साथी＝私の友達、हो＝です、です。最初のまとまり全体が、誰について話しているかを示します。बस्नेのところで一つの独立した文を終えるのではなく、後ろのमान्छेまで読んで、その人を説明するまとまりだと捉えます。',
 'यहाँ बस्ने मान्छे means the person who lives here; मेरो साथी my friend; हो completes the identity statement. Read through बस्ने to मान्छे to recognize the entire subject phrase rather than treating बस्ने as a separate finished sentence.'),
('जोは人、जेは内容、जहाँは場所、जताは方向、जब・जहिलेは時、जसरीは方法、जतिは量・程度などを結びます。जसले・जसलाई・जसकोは、節の中の動作主・相手・持ち主に合う形です。疑問詞をそのまま並べる作りではなく、各節で何の役割かを見ます。疑問詞はテーマ6、条件のभनेはテーマ30と比べます。',
 'Relative forms cover people, content, place, direction, time, manner and quantity. जसले, जसलाई and जसको reflect agent, object/recipient and possession within their clause. Do not simply string question words together: identify each clause’s roles. Compare questions in topic 6 and conditions in topic 30.'),
('確認：「どこに住んでいますか」と「住んでいる場所」は同じ働きですか？\n答え：前者は相手に情報を尋ね、後者は文の中で場所を説明・結合します。尋ねるのか、説明してつなぐのかを先に決めましょう。',
 'Check: do where do you live? and the place where you live do the same job?\nAnswer: one requests information; the other describes or links a place inside a statement. Decide question versus description first.')],
30: [
('「雨が降ったら家にいる」のように、ある場合を想定し、その場合にどうするかを伝えます。これが条件の文です。「もし〜なら」の前半と、「その場合は〜」の後半に分けて考えます。条件の内容が、今の状態なのか、これから起きる出来事なのかも確認します。',
 'Imagine a condition and state what follows: if it rains, stay home. Separate if X from then Y. Also decide whether X is a current state or an event that may occur.'),
('基本は「条件になる節＋भने＋その場合の節」です。यदिを前に添えると「もし」を明示できますが、省略されることもあります。節とは一つの出来事や状態を述べるまとまりです。前後それぞれの節で、誰が何をするのか、どの時点の状態かに合う形を使います。',
 'Use condition clause + भने + consequence clause. यदि can explicitly add if but is often optional. Each clause describes its own event or state and needs the forms appropriate to its participant and time perspective.'),
('1. どんな場合を想定するかを決めます。\n2. その条件を短い節にし、後ろにभनेを置きます。\n3. その場合にすることを、別の節で後ろへ続けます。\n4. 「何が条件で、何が結果か」を逆にしていないか確認します。',
 '1. Choose the imagined situation.\n2. Form a short condition clause and add भने.\n3. Follow it with the consequence clause.\n4. Recheck which part is the condition and which is the result.'),
('पानी पर्यो भने＝雨が降ったら、म घरमा बस्छु＝私は家にいます、です。前半は天気の条件、後半はその場合の私の行動です。前半の形だけを見て、必ず「すでに雨が降った」という一回の過去の報告だと決めず、भनेを含む条件のまとまりで読みます。',
 'पानी पर्यो भने gives the rain condition; म घरमा बस्छु the response. Do not interpret the first verb in isolation as necessarily reporting an already-completed event. Read it together with भने as the condition.'),
('व्यस्त हुनुहुन्छ भनेのように状態を条件にする場合もあります。जब…तबは時の対応を表し、いつも仮定条件と同じにはできません。またभनेには、発言を表す動詞の形として現れる場合もあるので、何かを条件にしているのか、誰かが言ったのかを見分けます。発言はテーマ34です。',
 'A state can also be a condition, as in being busy. Temporal जब…तब is not always interchangeable with an if-condition. भने can also appear as a speech-verb form, so distinguish introducing a condition from reporting that someone said something in topic 34.'),
('確認：条件のभनेの後ろには、何を置きますか？\n答え：その条件の場合にどうなるか・どうするかの文です。「もし」だけ覚えるのでなく、前半と後半の関係を説明してみましょう。',
 'Check: what follows conditional भने?\nAnswer: the clause stating what happens or what someone does under that condition. Explain the relationship, not just the translation if.')],
31: [
('「そう思う」「たぶんそうだ」「そうかもしれない」のように、事実をそのまま断言せず、自分の判断を添えます。意見は自分の考え、推量は手掛かりから考えた予想、可能性はそうなる場合があり得ることです。何を知っていて、どこからが判断なのかを分けるのがこのテーマの中心です。',
 'Add an opinion, inference or possibility rather than presenting something as an unquestioned fact. Separate what is known from what is judged or predicted. The expressions differ in the kind and strength of that judgment.'),
('内容の節にजस्तो लाग्छを続けると「〜のように思える」と述べられます。मलाई लाग्छは私にはそう思えるという入り方です。होलाは推測、हुन सक्छはあり得るという可能性などを表します。-एको हुनु पर्छは状況からの推測になることがあり、動作の-नु पर्छという義務と同じ意味ではありません。',
 'A content clause followed by जस्तो लाग्छ can mean it seems/I think. मलाई लाग्छ introduces an impression. होला can express supposition and हुन सक्छ possibility. A completed-action form with हुनु पर्छ may express an inference, unlike an action in -नु + पर्छ expressing obligation.'),
('1. まず何についての判断かを短い文にします。\n2. 意見・予想・可能性のどれを添えたいかを決めます。\n3. 選んだ型で内容の節を受けます。\n4. 訳すときも「と思う・かもしれない」などを残し、事実の断言に変えないようにします。',
 '1. Identify the content being judged.\n2. Choose an opinion, prediction or possibility.\n3. Combine the content with the corresponding expression.\n4. Preserve that qualification in translation rather than turning it into a fact.'),
('भोलि＝明日、पानी पर्छ＝雨が降る、जस्तो लाग्छ＝ように思えます、です。「明日雨が降る」という内容全体について、自分の見方を述べています。जस्तो लाग्छが雨の程度を表しているのではなく、その内容への判断を添えている点を確認します。',
 'भोलि is tomorrow, पानी पर्छ it rains, and जस्तो लाग्छ it seems/I think. The final expression comments on the whole proposition about tomorrow’s rain, not the amount or manner of rain.'),
('否定が内容にかかるのか、思うこと自体にかかるのかで意味が違います。「来ないと思う」と「来るとは思わない」を、機械的に同じ順に並べません。またहुन सक्छのहुनは、可能を表すसक्नुの前に置くहुनुの形で、文末にहोを足す必要はありません。テーマ20と構造を比べます。',
 'Negating the content and negating the judgment are not automatically identical. Track what is being denied. In हुन सक्छ, हुन is the form of हुनु before सक्नु; there is no need to add a separate हो at the end. Compare the possibility structure in topic 20.'),
('確認：「彼は来ます」と「彼は来るかもしれません」は同じ確かさですか？\n答え：違います。後者は可能性にとどめています。文を訳すときに、話し手がどこまで確かだと言っているかも残しましょう。',
 'Check: are he will come and he may come equally certain?\nAnswer: no. The latter leaves it as a possibility. Preserve the speaker’s degree of commitment when interpreting the sentence.')],
32: [
('「誰かがドアを開けた」ではなく、「ドアが開けられた」と、行為を受ける側から出来事を述べます。これを受動と呼びます。行為をした人が分からない、または今は重要でない場合にも使えます。単に日本語に「れる」があるという理由で、すべて同じネパール語の型へ入れるのではありません。',
 'A passive presents an event from the affected participant: the door was opened rather than someone opened the door. It is useful when the actor is unknown or not central. Not every passive-looking translation fits one identical Nepali pattern.'),
('まず「何が影響を受けたか」を前に出し、動詞を受動の形にします。खोलियोは開けられた、लेखियोは書かれた、です。一般的に行われることを示すलेखिन्छなどの形もあります。単純な自動詞、例えば物が自然に変化することと、行為を受けたことは、動詞の選び方から分けて学びます。',
 'Foreground the affected participant and choose a passive verb form, such as खोलियो or लेखियो. General/passive patterns also include लेखिन्छ. Distinguish the chosen passive construction from an ordinary intransitive change; do not identify them only through an English translation.'),
('1. 何がされたか、行為を受けるものを決めます。\n2. 元の動作を確認します。開ける、書く、などです。\n3. 伝えたい時に合う受動の形を選びます。\n4. 動作主を示す必要があるかも考え、不要なら無理に付けません。',
 '1. Identify what is affected.\n2. Identify the original action, such as opening or writing.\n3. Select a passive form appropriate to the time intended.\n4. Decide whether the actor needs to be mentioned.'),
('ढोका＝ドア、खोलियो＝開けられました、です。誰がしたかより、ドアに起きた出来事を中心にしています。主語らしい名詞が前にあっても、必ずその名詞が動作をする人とは限りません。「誰がしたか」と「何がされたか」を分けることが大切です。',
 'ढोका is door and खोलियो was opened. The sentence foregrounds what happened to the door. A noun in subject position is not automatically the actor. Separate who did it from what was affected.'),
('否定のलेखिएनは書かれなかったという出来事の否定です。存在しなかったというछैन系と混ぜません。द्वाराは動作主、मार्फतは経由・仲介を示す場合があります。またधेरै हिँडियोのような非人称的な表現は、「物が誰かに歩かれた」と直訳する物の受動とは違います。',
 'Negative लेखिएन denies the writing event; it is not simple absence with छैन. द्वारा can mark an actor and मार्फत an intermediary. Impersonal expressions such as धेरै हिँडियो do not mean a literal object was walked by someone.'),
('確認：受動の文の中心は、必ず動作をした人ですか？\n答え：違います。行為を受けるものや出来事に注目します。まずその中心を決めると、動作主を省く理由も理解できます。',
 'Check: must the actor be the center of a passive sentence?\nAnswer: no. The affected participant or event is foregrounded. Identify that focus to understand why the actor may be omitted.')],
33: [
('「子どもに食べさせる」「人に手紙を書いてもらう」のように、ある人が別の人の動作を引き起こすことを伝えます。これを使役と呼びます。強制だけでなく、教える・手伝って食べさせるなどにも関係します。何人が関わり、それぞれ誰が何をするかを先に整理しましょう。',
 'Describe one person causing or arranging another’s action. A causative is not always coercive: teaching or feeding can also involve causing an action. Identify all participants and their roles before forming the sentence.'),
('元の動詞と使役の動詞を対で覚えます。खानुは食べる、खुवाउनुは食べさせる・食べ物を与える、सिक्नुは学ぶ、सिकाउनुは教える、です。もう一つ「動作の-न形＋लगाउनु」で、させる・するようにさせる型もあります。すべての動詞へ同じ文字を足すだけの規則とは考えません。',
 'Learn base/causative pairs: खानु eat and खुवाउनु feed; सिक्नु learn and सिकाउनु teach. Another pattern uses an action infinitive in -न before लगाउनु. Do not assume every causative is formed by adding the same letters.'),
('1. させる人、動作をする人、対象を分けます。\n2. 使役動詞そのものを使うか、लगाउनुの型を使うかを選びます。\n3. 誰に動作をしてもらうかをलाईなどで示します。\n4. 中心の使役動詞を、させる人や時制・敬意に合う形へ変えます。',
 '1. Separate causer, person acting and object.\n2. Choose a causative verb or the लगाउनु pattern.\n3. Mark the relevant participant with forms such as लाई.\n4. Conjugate the main causative verb for the intended time and agreement.'),
('आमाले＝母が、बच्चालाई＝子どもに、खाना＝ご飯、खुवाउनुहुन्छ＝食べさせます、です。食べるのは子どもですが、食べさせる働きかけをするのは母です。文末はその中心の行動を述べています。人物が二人出てきたら、どちらの動作を文末が表しているかを確認します。',
 'आमाले marks mother as causer, बच्चालाई the child, खाना food and खुवाउनुहुन्छ respectfully feeds. The child eats, but the mother causes or provides that action. Identify whose main action the final causative verb describes.'),
('「自分が食べる」と「人に食べさせる」を同じ動詞のまま日本語訳だけ変えないようにします。過去の他動詞の動作主はテーマ11、相手を示すलाईはテーマ5と関連します。「させてもらう」など日本語の複雑な待遇の意味を、短い使役形だけですべて表せるとは限りません。',
 'Do not keep a base verb unchanged and merely translate it as causative. Review past transitive agents in topic 11 and लाई in topic 5. Complex permission/benefit meanings in Japanese are not all encoded by a single short causative form.'),
('確認：「母が子どもに食べさせる」文で、食べる人と使役の中心になる人は同じですか？\n答え：違います。食べるのは子ども、食べさせるのは母です。この役割分担を説明してから文を組み立てましょう。',
 'Check: in mother feeds the child, are the eater and causer the same person?\nAnswer: no. The child eats; mother feeds. Explain the role division before arranging the sentence.')],
34: [
('誰かが言った内容を、別の人に伝えます。直接引用は発言をその人の言葉として示すこと、間接話法は内容を報告する立場から組み直すことです。このテーマの短い例題には直接引用に近い文もあるので、全部を一種類と決めず、元の発言と外側の「言った」を分けて読みます。',
 'Report what someone said. Direct quotation preserves the speaker’s words; indirect reporting reorganizes the content from the reporter’s perspective. The short exercises include direct-like quotations, so separate the reported content from the outer speech verb.'),
('基本は「発言した人＋発言内容＋言う動詞」です。丁寧な人の「言いました」はभन्नुभयोです。引用の中の私・ここ・明日は、元の発言者を基準にする場合があります。外側のउहाँलेと、引用内の一人称の動詞が違う形でも、別の役割なので直ちに間違いではありません。',
 'Use speaker + reported content + speech verb, such as respectful भन्नुभयो. I, here and tomorrow inside a quotation may retain the original speaker’s viewpoint. The outer respectful subject and an inner first-person verb have different roles and need not share the same ending.'),
('1. 元の人が何と言ったかを確認します。\n2. その言葉を引用するのか、内容として言い直すのかを決めます。\n3. 発言者を示し、内容のまとまりを置きます。\n4. 外側の言う動詞を、発言した人の敬意と過去などの時制に合わせます。',
 '1. Identify the original utterance.\n2. Choose quotation or indirect reporting.\n3. Add the speaker and content.\n4. Match the outer speech verb to the speaker’s register and time of speaking.'),
('उहाँले＝彼・彼女が、जाँदिनँ＝私は行かない、भन्नुभयो＝言いました、です。जाँदिनँの一人称は発言した本人の言葉です。外側のभन्नुभयोは、その人が言ったという報告です。文の中と外を同じ主語の一つの動詞として直そうとすると、引用の意味が崩れます。',
 'उहाँले marks the speaker, जाँदिनँ means I will/do not go in that speaker’s words, and भन्नुभयो reports said. The inner first-person negative belongs to the quoted utterance; the outer respectful past belongs to the report. Keep those layers separate.'),
('間接話法ではआफू（自分）や内容を受ける形を使う場合があり、下の直接・間接の比較表で変わる部分を確認します。元の「明日」が報告時の明日と同じ日とは限りません。また条件のभनेと、発言に関係する言う動詞の形は、同じように見えても文中の働きが違います。条件はテーマ30です。',
 'Indirect reports can use आफू, self, and content-clause constructions; compare the table below. The original tomorrow may not be tomorrow at reporting time. Distinguish conditional भने in topic 30 from speech-verb forms by their role in the sentence.'),
('確認：引用内の「私」は、いつでも今この文を読んでいる自分でしょうか？\n答え：違います。元の発言をした人を指す場合があります。誰の言葉の中なのかを確かめることが、発言を正しく伝える第一歩です。',
 'Check: does I inside a quotation always refer to the current reader or reporter?\nAnswer: no. It can refer to the original speaker. Identify whose words you are inside before interpreting pronouns and time expressions.')],
35: [
('この付録は「手紙を書く」という同じ動作を使い、人称・時制・否定で形がどう変わるかを調べる参照用の教材です。同じ文を大量に暗記することが目的ではありません。変わる部分を探し、別の動詞にも文の組み立て方を応用するために使います。基本の6人称を先に確認し、親しい相手への形はテーマ7を学んでから比べましょう。',
 'This appendix uses writing a letter to compare person, tense and negation. It is a reference, not a demand to memorize many near-identical sentences. Find what changes and transfer the construction principles to other verbs. Start with the basic six person groups; use topic 7 before comparing familiar forms.'),
('लेख्नुは書くという辞書形です。लेख्छुは私が書く、लेख्दिनँは私が書かない、लेखेँは私が書いた、というように、文で使う形が変わります。過去の完了した他動詞ではमからमैलेへの変化も見ます。丁寧な動作の形と、名詞・対象に関わる一致を、表の一つの列だけでなく文全体で確かめます。',
 'लेख्नु is the dictionary form write. Compare लेख्छु, लेख्दिनँ and लेखेँ for I write, do not write and wrote. Completed transitive clauses can also change म to मैले. Examine the whole sentence for respectful forms and object-related agreement, not only one isolated ending.'),
('1. まず普段・一回の過去・完了・昔の習慣・予定のどれかを決めます。\n2. その小見出しの表を開きます。\n3. 基本の人称を選び、主語と最後の形を一緒に読みます。\n4. 最後に肯定と否定を比べ、変わった部分を言葉で説明します。',
 '1. Choose routine, past event, completion, former habit or plan.\n2. Find that subsection.\n3. Read the subject and verb together for the intended person.\n4. Compare its positive and negative and explain the change.'),
('म＝私、चिठी＝手紙、लेख्छु＝書きます、です。लेख्छुの形は、語の途中から適当に作ったものではなく、लेख्नुの私に合う現在形です。同じ私でも、昨日書いた文では主語のमैलेと過去の形を一緒に確認します。手紙という対象があることも忘れずに読みます。',
 'म is I, चिठी letter and लेख्छु write. लेख्छु is the appropriate present form of लेख्नु, not an arbitrary fragment. For yesterday’s completed writing, check both मैले and the past verb. Keep track of the letter as object too.'),
('人称を替える練習と、時制を替える練習を一度に混ぜないようにします。まず一つだけ替え、何が変わったかを見てから次へ進みます。表の否定形を見つけたら、それがしない・しなかった・その時まで済んでいなかったのどれかも確認します。詳しい意味の違いはテーマ8〜16へ戻れます。',
 'Change one variable at a time: person first or tense first, not everything at once. Identify whether a negative means do not, did not, or had not completed by then. Topics 8–16 explain the time perspectives behind the reference forms.'),
('確認：表で見つけた動詞だけを入れ替えれば、いつでも正しい文になりますか？\n答え：なりません。主語の形、対象、時制、敬意も対応が必要です。表は答えを探す道具と、変化の理由を確認する道具の両方として使いましょう。',
 'Check: does swapping only a verb from the table always give a correct sentence?\nAnswer: no. Subject form, object, tense and respect must fit. Use the table to understand the correspondences, not just to copy endings.')],
36: [
('この付録はहुनुの形を、人物紹介と居場所の文で確かめる教材です。繋辞という言葉は、名詞などと主語を結び「〜である」と述べる動詞の働きを指します。難しい名称を覚えるより、「何者か」「どこにいるか」「どんな状態か」を見分け、文末の形を選べることを目標にします。',
 'This appendix reviews forms of हुनु through identity and location sentences. Copula is the grammatical term for a linking verb used in identification or description. Focus on choosing by function—identity, location or condition—rather than memorizing the terminology alone.'),
('हुनुは辞書の形、हो・छ・हुन्छはそれぞれの系統を代表する形です。人物紹介のहोはテーマ1、居場所のछはテーマ2、性質・状態のछはテーマ3、一般的な状態や出来事のहुन्छはテーマ4に対応します。この付録の既存の表は主に人物紹介・所在とその過去の比較です。3系統の全体像は、下の対応表と各テーマで確認します。',
 'हुनु is the dictionary form; हो, छ and हुन्छ represent the three sets. Study identity in topic 1, location in 2, qualities/conditions in 3, and general states or occurrences in 4. The reference tables mainly compare identity/location and their past forms; use the overview and corresponding lessons for the complete picture.'),
('1. 名前・職業を述べるのか、居場所・状態を述べるのかを決めます。\n2. 今のことか、過去のことか、ふだんのことかを確認します。\n3. 基本の人称と敬意に合う行を探します。\n4. 肯定・否定の列を選び、主語から文末まで一文で読みます。',
 '1. Choose identity, location or condition.\n2. Decide present, past or regular perspective.\n3. Find the matching person and respect level.\n4. Select positive or negative and read the whole sentence.'),
('म＝私、लेखक＝著者、हुँ＝私に合う「です」です。人物紹介なのでहो系です。語尾だけでなく、लेखकという名詞で「何者か」を述べていると説明できるようにします。同じ私でも「図書館にいます」では場所を示す語とछुを使い、型の働きが変わります。',
 'म is I, लेखक author and हुँ am. This uses the identity set because लेखक supplies a category. Explain that function, not just the ending. With I am at the library, a place expression and छु instead perform the location function.'),
('丁寧なतपाईं・उहाँとその複数形では、3系統がहुनुहुन्छという同じ見た目になることがあります。何系統かは主語だけで決められず、後ろで何を述べるかと場面から判断します。また過去のथियो系と、変化・出来事のभयोをすべて一対一で同じ意味と考えないようにします。',
 'Respectful तपाईं/उहाँ and their plurals can use the identical form हुनुहुन्छ across all three functions. The subject alone does not identify the set; use the rest of the construction and context. Past थियो forms and occurrence/change भयो are not interchangeable in every situation.'),
('確認：हुनुहुन्छという形が見えれば、必ず「家にいます」の意味ですか？\n答え：いいえ。職業の紹介、状態、一般的なことなどにも使われます。何を伝える文かを先に読み、テーマ1〜4のどこに対応するかを自分で指せるようにしましょう。',
 'Check: does हुनुहुन्छ always mean is at home?\nAnswer: no. It can support identity, condition and regular situations too. Identify the intended function and point to the corresponding lesson in topics 1–4.')],
})
