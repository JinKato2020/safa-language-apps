"""Original beginner explanations, paired Japanese/English, for all 36 lessons.

Each lesson teaches actual Nepali forms and contrasts with an existing example.
No practice/audio is changed.
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
    from nepali_rule_lessons import lesson_blocks as make_lesson
    return make_lesson(theme,lang,example,roman,translation,
        hunu_blocks(theme,lang) if theme in [1,2,3,4,36] else [])


def expand_guides(guides, examples, readings, translations, theme_names=None):
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
            # The native top bar already shows the numbered theme title.
            # Start the body with the takeaway rather than repeating that title.
            # A zero-length paragraph is the saved, invisible insertion boundary.
            # Its index is stored in the teacher's source, not shown as a label.
            from friendly_grammar_layout import detail_blocks
            from nepali_rule_lessons import clean_retained, presentation
            from nepali_lesson_glosses import support_blocks
            from nepali_lesson_breaks import extra_blocks
            body=support_blocks(presentation(intro+[{'type':'p','text':'','beginnerIntroEnd':True}]+clean_retained(detail_blocks(filtered,lang),lang),lang),lang)
            boundary=next(i for i,b in enumerate(body) if b.get('beginnerIntroEnd'))
            body[boundary:boundary]=extra_blocks(theme,lang)
            topics[key]=body
    return result

# Compatibility export for packaging reports; original rule text lives in one file.
from nepali_rule_lessons import DATA, rules
LESSONS = {k: [(r[2], r[3]) for r in rules(k)] for k in DATA}
