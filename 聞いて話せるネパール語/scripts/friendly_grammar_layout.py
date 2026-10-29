"""Scannable learning cards using the existing native reader, without UI changes."""
import copy
import re

# One memorable rule and three short, topic-specific construction steps.
QUICK = {
1: ('何・誰かを紹介するなら **हो系**。','For identity, choose the **हो set**.', ['誰の話？ → 主語を選ぶ','何者？ → 学生などの名詞を置く','主語に合う「です」で結ぶ'], ['Choose who/what','Add an identity noun','Match the identity ending']),
2: ('どこにいる・ある？ → **छ系**。','Where is it? Use the **छ set**.', ['誰・何の場所を言う？','場所を置く → घरमा＝家に','主語に合う「いる・ある」を選ぶ'], ['Choose who/what to locate','Add a place','Match the location ending']),
3: ('どんな様子？ → **形容詞＋छ系**。','Describe a quality: **adjective + छ set**.', ['何を説明する？','美しい・忙しいなどを選ぶ','対象に合うछ系で結ぶ'], ['Choose what to describe','Add a quality or condition','Match the छ ending']),
4: ('ふだんはこうなる → **हुन्छ系**。','For regular situations, use the **हुन्छ set**.', ['今の1回？ ふだんの話？','季節・時間・条件を加える','一般的な状態をहुन्छ系で結ぶ'], ['Choose a regular setting','Add time or condition','Use the matching हुन्छ form']),
5: ('名詞の後ろに、**関係の目印**を付けよう。','Add a **relationship marker after the noun**.', ['家・友達などの名詞を選ぶ','どこに？ 誰と？ を決める','मा・सँगなどを選んで動詞へ'], ['Choose the noun','Decide place, company or another role','Add its marker, then the verb']),
6: ('答えてほしい部分を、**疑問詞**に替えよう。','Replace missing information with a **question word**.', ['人・場所・時間のどれを聞く？','答えの位置を疑問詞に替える','文末の人称・敬意を確認'], ['Choose the answer type','Replace the missing part','Check the final verb']),
7: ('**呼び方と動詞はセット**で覚えよう。','Learn **pronoun and verb together**.', ['私・あなた・第三者を決める','人数と敬意を選ぶ','その呼び方に合う動詞へ'], ['Choose the person','Choose number and respect','Match the verb']),
8: ('いつもの行動は、**動作の現在形**で。','Use the **action present** for routines.', ['誰がする？','何を・いつ・どこで？','主語に合う現在形を最後に'], ['Choose the actor','Add action details','Finish with the matching present']),
9: ('「しない」は、**動作の否定形**へ。','For do not, use a **negative action verb**.', ['何をしない？','誰の否定形が必要？','動詞そのものを否定形へ'], ['Identify the action','Check the subject','Choose its negative form']),
10: ('今、動作の途中 → **-दै＋छ系**。','In progress: **-दै + छ auxiliary**.', ['進行中の動作を選ぶ','動作を-दै系にする','主語に合うछ系を加える'], ['Choose the ongoing action','Use its -दै form','Add the matching auxiliary']),
11: ('過去は、**誰が・何を・したか**に分けよう。','For past events, find **actor, object and action**.', ['終わった行動を選ぶ','他動詞なら動作主のलेを確認','主語・対象・敬意に合う過去形へ'], ['Choose a completed event','Check agent marking with ले','Choose the appropriate past form']),
12: ('しなかった → **過去の否定形**。','Did not: choose a **past negative**.', ['いつ、何をしなかった？','主語・動作主を確認','過去の否定形で結ぶ'], ['Choose the past action denied','Check the subject/agent','Finish with a past negative']),
13: ('予定は、**時間の語＋動詞**を一緒に見よう。','Read **time expression + verb** together for plans.', ['明日・来週などを決める','何をする予定？','予定を表す形を主語に合わせる'], ['Choose a future time','Choose the planned action','Match the verb to the subject']),
14: ('昔の「いつも」は、**習慣過去**。','Use the **habitual past** for former routines.', ['昔、繰り返していたことは？','以前・場所などを加える','習慣過去の形で結ぶ'], ['Choose a former routine','Add its setting','Use the habitual-past form']),
15: ('もう済んでいて今に関係する → **完了＋छ系**。','Completion relevant now: **participle + present auxiliary**.', ['今に関わる結果・経験を選ぶ','動作を完了の形へ','今につなぐ補助動詞を加える'], ['Choose a relevant result/experience','Use the completed-action form','Add a present auxiliary']),
16: ('その時には、もう済んでいた → **過去完了**。','Already completed by then: **past perfect**.', ['過去の「その時」を決める','それより前に済んだ動作は？','完了の形＋過去の補助動詞へ'], ['Choose a past reference point','Find the earlier completion','Add a past auxiliary']),
17: ('相手にお願い → **丁寧な依頼形**。','Ask the listener: use a **respectful request**.', ['何をしてほしい？','場所・方法などを加える','बस्नुहोस्などの依頼形で結ぶ'], ['Choose the requested action','Add place or manner','Use a respectful request form']),
18: ('私がしようか？ 一緒にしよう！ → **申し出・勧誘**。','Shall I? Let’s! Use an **offer or suggestion**.', ['私がする？ 一緒にする？','動作と対象を選ぶ','申し出・勧誘に合う形へ'], ['Choose an offer or shared suggestion','Choose the action','Use the matching proposal form']),
19: ('しないでください → **न＋依頼形**。','Please do not: **न + request form**.', ['止めたい動作は？','丁寧な依頼形を選ぶ','その前にनを付ける'], ['Choose the action to prevent','Choose a respectful request form','Put न before it']),
20: ('できる → **動作の-न形＋सक्नु**。','Can: **action infinitive + सक्नु**.', ['何ができる？','動作を-न形にする','できる人に合うसक्नुへ'], ['Choose the possible action','Use its infinitive form','Conjugate सक्नु for the person']),
21: ('**必要・許可・禁止**を分けよう。','Separate **necessity, permission and prohibition**.', ['必要？ してよい？','対象の動作を選ぶ','पर्छ・हुन्छなどの型を選ぶ'], ['Decide necessity or permission','Choose the action','Choose the appropriate construction']),
22: ('したい → **動作＋希望の表現**。','Want to: **action + wish expression**.', ['したい動作は？','चाहनुかमनの型を選ぶ','気持ちを持つ人に合わせる'], ['Choose the desired action','Choose चाहनु or a मन pattern','Fit the experiencer and ending']),
23: ('「良い本」は、**形容詞→名詞**の順。','Inside good book: **adjective → noun**.', ['説明する名詞を選ぶ','形容詞を前に置く','変化する形なら名詞と合わせる'], ['Choose the noun','Put the adjective before it','Check agreement where needed']),
24: ('どうする？ どのくらい？ → **副詞**を足そう。','Add an **adverb** for how, how often or how much.', ['短い文を作る','方法・頻度・程度のどれを足す？','説明する語の近くへ加える'], ['Build a short sentence','Choose manner, frequency or degree','Add the description']),
25: ('AはBより〜 → **A＋Bभन्दा＋形容詞**。','A compared with B: **A + Bभन्दा + adjective**.', ['説明するAを決める','比べる基準Bにभन्दाを付ける','形容詞と文末を加える'], ['Choose A, the item described','Mark standard B with भन्दा','Add the quality and ending']),
26: ('**並べる・順番・対比・理由**で、つなぎ方を選ぼう。','Choose the link: **addition, sequence, contrast or reason**.', ['二つの内容を分けて考える','どういう関係かを決める','र・अनि・तरなどでつなぐ'], ['Understand each piece','Choose their relationship','Link with र, अनि, तर or another form']),
27: ('**同時？ してから？** 時間の関係を見よう。','**At the same time or after?** Choose the time link.', ['二つの動作を選ぶ','同時なら-दै、後なら-एपछि系','中心の動作を最後に活用する'], ['Choose two actions','Choose overlap or succession','Conjugate the main action last']),
28: ('何をするため？ → **-न形＋को लागि**。','For an action purpose: **infinitive + को लागि**.', ['中心の行動を決める','何をするためかを選ぶ','目的のまとまりを動詞の前へ'], ['Choose the main action','Choose its purpose','Put the purpose phrase before the verb']),
29: ('「どの人・物か」を、**短い文で説明**しよう。','Use a **clause to specify a person or thing**.', ['説明したい人・物を選ぶ','その説明を名詞の前へ','できたまとまりを文に入れる'], ['Choose the noun to specify','Put its modifier before it','Use the complete phrase in a sentence']),
30: ('もし〜なら → **条件＋भने＋その場合の文**。','If: **condition + भने + consequence**.', ['どんな場合？','条件の後ろにभनेを置く','その場合どうするかを続ける'], ['Choose the condition','Add भने','Follow with the consequence']),
31: ('事実？ 自分の判断？ → **確かさ**も伝えよう。','Fact or judgment? Preserve the **degree of certainty**.', ['判断する内容を決める','意見・推測・可能性を選ぶ','判断を表す型を添える'], ['Choose the content','Choose opinion, inference or possibility','Add the corresponding expression']),
32: ('「何がされたか」を中心に → **受動**。','Focus on **what was affected**: the passive.', ['行為を受けたものは？','何をされた？','時に合う受動の形へ'], ['Choose the affected participant','Identify the action','Use the appropriate passive form']),
33: ('**させる人・する人・対象**を分けよう。','Separate **causer, actor and object**.', ['誰が誰に何をさせる？','使役動詞かलगाउनुの型を選ぶ','中心の使役動詞を活用する'], ['Identify the participants','Choose a causative pattern','Conjugate the main causative verb']),
34: ('**発言の中と外**を分けて読もう。','Separate **the quotation from the report**.', ['誰の発言？','引用する内容を置く','外側の「言った」を合わせる'], ['Identify the original speaker','Add the reported content','Match the outer speech verb']),
35: ('活用表は、**1か所ずつ比べる**道具。','Use the table to **compare one change at a time**.', ['普段・過去・完了などを選ぶ','人称に合う行を探す','肯定と否定の違いを比べる'], ['Choose the time perspective','Find the appropriate person','Compare positive and negative']),
36: ('हुनुを復習！ **हो・छ・हुन्छの3系統**。','Review हुनु: **the three sets हो, छ and हुन्छ**.', ['何者？ 居場所？ ふだん？','対応する系統を選ぶ','人称と肯定・否定を確認'], ['Choose identity, location or regular setting','Choose the appropriate set','Check person and polarity']),
}

WARNINGS = {
1:('**何者か**と**居場所**は別の話。日本語の「です」だけで選ばない。','Separate **identity** from **location**. Do not choose by the English word is alone.'),
2:('**誰がいるか・何があるか**を先に確認。持ち主だけで動詞を決めない。','First identify **who or what exists**. The possessor alone does not determine agreement.'),
3:('**良い本です**と**本は良いです**は、文の組み立てが違う。','**It is a good book** and **the book is good** have different structures.'),
4:('**हुन्छ**を、全部「なる」と訳さない。','Do not translate every **हुन्छ** as become.'),
5:('**घरमा＝家に**、**घरबाट＝家から**。目印を替えると意味も変わる。','**घरमा = at home**; **घरबाट = from home**. The marker changes the relationship.'),
6:('**कुन＝どれ**と**कस्तो＝どんな**を分けよう。','Distinguish **कुन = which** from **कस्तो = what kind**.'),
7:('**代名詞だけ**替えず、**動詞も**合わせよう。','Change the **verb too**, not just the pronoun.'),
8:('**普段する**と**今している途中**は別。','A **routine** differs from an action **in progress now**.'),
9:('動作の「しない」に、何でも**छैन**を付けない。','Do not add **छैन** to every action to mean do not.'),
10:('動作の部分と、最後の**補助動詞**を分けて見よう。','Separate the action form from the final **auxiliary**.'),
11:('過去の文に、何でも**ले**を付けない。','Not every past sentence needs **ले**.'),
12:('**しない**と**しなかった**は、動詞の形も違う。','**Do not** and **did not** need different verb forms.'),
13:('**現在形＋明日**で、これからの予定を言うこともある。','A **present form + tomorrow** can express a plan.'),
14:('**昔の習慣**と**昨日の1回**を分けよう。','Distinguish a **former routine** from **one event yesterday**.'),
15:('**完了の部分＋補助動詞**を、セットで見よう。','Read the **completed-action form + auxiliary** together.'),
16:('過去の**いつまでに**済んだのかを確認しよう。','Identify the past point **by which** it was completed.'),
17:('座るのは**相手**？ **自分**？ 依頼と申し出を分けよう。','Who sits: **the listener** or **you**? Separate a request from an offer.'),
18:('**私がする申し出**と**相手への依頼**は別。','An **offer to act yourself** differs from a **request to the listener**.'),
19:('**してはいけない**と**しなくてもよい**は別。','**Must not** and **need not** are different.'),
20:('**できる**は能力、**してよい**は許可。','**Can** as ability differs from **may** as permission.'),
21:('**必要がない**と**禁止**を混ぜない。','Do not confuse **lack of necessity** with **prohibition**.'),
22:('**したい**と**する必要がある**は別の意味。','**Want to** and **need to** have different meanings.'),
23:('形が変わる形容詞と、**変わらない形容詞**がある。','Some adjectives change; others are **invariable**.'),
24:('副詞は、**どの動作・性質**を説明するかを見よう。','Identify **which action or quality** the adverb describes.'),
25:('**भन्दा**は、比べる基準の**Bの後ろ**。','**भन्दा** follows **B, the comparison standard**.'),
26:('**並べる**と**順番にする**は、関係が違う。','**Coordination** and **sequence** are different relationships.'),
27:('**同時**と**終わってから**を混ぜない。','Distinguish **simultaneous** from **after completion**.'),
28:('**なぜ？＝理由**と**何のため？＝目的**を分けよう。','Separate **why = reason** from **what for = purpose**.'),
29:('**कहाँ＝質問**、**जहाँ＝文をつなぐ形**。役目を分けよう。','**कहाँ asks a question**; **जहाँ links a place across clauses**.'),
30:('**条件**と、その場合の**結果**を見分けよう。','Identify the **condition** and its **consequence**.'),
31:('「かもしれない」を、**事実の断言**に変えない。','Do not turn may into a **statement of fact**.'),
32:('前にある名詞が、必ず**動作をする人**とは限らない。','The first noun is not automatically **the actor**.'),
33:('**食べる人**と**食べさせる人**を分けよう。','Separate **the eater** from **the person feeding them**.'),
34:('引用の中の**私**は、元の発言者を指すことがある。','**I inside a quotation** may refer to the original speaker.'),
35:('一度に全部替えず、**1か所ずつ**比べよう。','Compare **one change at a time**, not everything at once.'),
36:('**हुनुहुन्छ**だけで決めず、文が伝える意味を見よう。','Do not classify by **हुनुहुन्छ** alone; examine the sentence’s function.'),
}

def emphasis(text):
    if '**' in text:
        return text
    # Emphasize only a few learning anchors, never whole paragraphs.
    for token in ['3系統','6人称','हो','छ','हुन्छ']:
        if token in text:
            if token in ['हो','छ','हुन्छ']:
                pattern=r'(?<![\u0900-\u097f])'+token+r'(?![\u0900-\u097f])'
                text,n=re.subn(pattern,'**'+token+'**',text,count=1)
                if n:return text
            else:return text.replace(token,'**'+token+'**',1)
    return text

def short_paragraphs(text,lang):
    if not text:return []
    # Preserve explicit steps, sentence order and every word of the explanation.
    lines=text.split('\n')
    out=[]
    for line in lines:
        sentences=re.findall(r'.+?(?:。|$)',line) if lang=='ja' else re.split(r'(?<=[.!?])\s+(?=[A-Z])',line)
        for sentence in sentences:
            if sentence.strip():out.append({'type':'p','text':emphasis(sentence.strip())})
    return out

def detail_blocks(blocks,lang):
    result=[]
    for old in blocks:
        b=copy.deepcopy(old)
        if b.get('type')=='note':
            b['type']='p';b['text']=('**ここもチェック**\n' if lang=='ja' else '**Also check**\n')+b.get('text','').replace('⚠️','').replace('⚠','').strip()
        if b.get('type')=='p' and not b.get('beginnerIntroEnd'):
            text=b.get('text','')
            # Full construction rules are already taught above. Keep only the
            # sentence-specific comments instead of repeating the same rule.
            prefix='しくみ：' if lang=='ja' else 'How it works: '
            if text.startswith(prefix):
                from revise_grammar_curriculum import RULES
                for rule in RULES.values():
                    base=prefix+rule[2 if lang=='ja' else 3]
                    if text.startswith(base):
                        text=text[len(base):].strip()
                        if text:text=('**この文のポイント**\n' if lang=='ja' else '**In this sentence**\n')+text
                        break
            result.extend(short_paragraphs(text,lang))
        elif b.get('type')=='table':
            b['headers']=[emphasis(x) for x in b['headers']]
            b['rows']=[[emphasis(x) for x in row] for row in b['rows']]
            result.append(b)
        else:
            if b.get('text'):b['text']=emphasis(b['text'])
            result.append(b)
    return result

def make_lesson(theme,lang,example,roman,translation,fields,deep_hunu):
    ja=lang=='ja';rule_ja,rule_en,steps_ja,steps_en=QUICK[theme]
    h=lambda text:{'type':'h','text':text}
    p=lambda text:{'type':'p','text':text}
    bs=[{'type':'goal','text':('**ここだけ覚えよう**\n'+rule_ja) if ja else ('**Remember this**\n'+rule_en)},
        h('① 例文でつかもう' if ja else '① Start with one example'),
        p('**'+example+'**'),p(roman),p(translation),
        h('② **3ステップ**で作ろう' if ja else '② Build it in **3 steps**')]
    for i,step in enumerate(steps_ja if ja else steps_en,1):bs.append(p(f'**{i}**  '+step))
    first=WARNINGS[theme][0 if ja else 1]
    bs.extend([h('まちがい注意' if ja else 'Watch out'),{'type':'p','text':emphasis(first)},
               h('③ できたかチェック' if ja else '③ Quick check')])
    check=fields[5][0 if ja else 1]
    for line in check.split('\n'):
        for prefix in ['確認：','答え：','Check:','Answer:']:
            if line.startswith(prefix):line='**'+prefix+'**'+line[len(prefix):];break
        bs.extend(short_paragraphs(line,lang))
    # The key map comes before the optional long-form explanation.
    if theme in [1,2,3,4,36]:
        bs.extend([h('हुनुの地図：覚えるのは **3系統**' if ja else 'Your हुनु map: **3 sets**'),
          {'type':'table','headers':['形と役割','学ぶテーマ'] if ja else ['Form and role','Topic'],
           'rows':[['**हो**\n'+('何・誰か' if ja else 'identity'),'**1**'],
                   ['**छ**\n'+('存在・居場所／性質・状態' if ja else 'location / quality'),'**2・3**'],
                   ['**हुन्छ**\n'+('ふだん・条件・出来事' if ja else 'regular situations / occurrences'),'**4**']]},
          p('人称を合わせると形が変わるよ。たとえば「私」は **हुँ・छु・हुन्छु**。' if ja else 'The forms change with the person: with I, compare **हुँ・छु・हुन्छु**.')])
    bs.append(h('もっと知りたいときに：くわしい説明' if ja else 'When you want to know more'))
    labels=['何を言える？','文の型をじっくり','組み立て方を確認','例文のしくみ','似た表現と比べよう'] if ja else ['What can you say?','Look at the pattern','Check the construction','How the example works','Compare related patterns']
    for i in range(5):
        bs.append(h(labels[i]));bs.extend(short_paragraphs(fields[i][0 if ja else 1],lang))
    bs.extend(detail_blocks(deep_hunu,lang))
    return bs
