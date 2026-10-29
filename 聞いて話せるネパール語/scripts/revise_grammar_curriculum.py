"""Build the reviewed bilingual curriculum; reuse recordings by immutable source ID.

This is authoring data. package_positional_grammar_update.py pairs texts with
theme-index audio for existing readers. This script never generates audio.
"""
from pathlib import Path
import csv, json, re, copy, collections

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / '聞いて話せるネパール語'
WORK = ROOT / '.work-grammar-redesign'
SRC = APP / '文法教材'

def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p, d):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# One explicit explanation of the grammar needed by each topic, in both UI languages.
RULES = {
1: ('人や物が何かを伝える', 'Identify people and things',
 '「人・物＋職業・種類＋होの活用」が基本です。名詞は「学生」「本」のような人・物の名前です。म विद्यार्थी हुँでは、मが私、विद्यार्थीが学生、हुँが私に合う「です」です。場所や体調にはछを使います。文頭のकेで「〜ですか」と尋ねられます。否定はहोइन系です。',
 'Use person/thing + identity noun + a form of हो. A noun names a person or thing, such as student or book. In म विद्यार्थी हुँ, म means I, विद्यार्थी means student, and हुँ agrees with I. Use छ for location or condition instead. Initial के can mark a yes/no question. Use the होइन family for negatives.'),
2: ('何がどこにあるか、誰がどこにいるかを伝える','Say what or who is present and where',
 '「人・物＋場所＋छの活用」で所在を述べます。घरमाは家に、यहाँはここに、त्यहाँはそこに、कहाँはどこに、です。「場所＋物＋छ」なら物の存在を伝えます。人が主語なら人称と敬意に合う形を選び、複数の物にはछन्を使います。所持を表すसँग＋छはテーマ5で学びます。',
 'Use person/thing + location + a form of छ. घरमा means at home; यहाँ, त्यहाँ and कहाँ mean here, there and where. Location + thing + छ introduces something present. Match a human subject in person and respect; use छन् for plural things. Possession with सँग + छ is taught in topic 5.'),
3: ('物の性質と人の今の状態を説明する','Describe qualities and current conditions',
 '「対象＋形容詞＋छの活用」です。形容詞は大きい・冷たい・忙しいなどの性質や状態を表す語です。यो पानी चिसो छはこの水は冷たい、です。否定はछैन系で、होइनを使う名詞の同定と分けます。खुसी・तयारのような状態にも使います。गर्मीのような名詞による気候の表現もあります。',
 'Use subject + adjective + a form of छ. Adjectives express qualities or conditions such as big, cold or busy. यो पानी चिसो छ means this water is cold. Use the छैन negative family, distinct from identity with होइन. खुसी and तयार describe being happy and ready. Weather expressions can also use nouns such as गर्मी.'),
4: ('今の状態、一般的なこと、変化を区別する','Distinguish current state, regular situations and change',
 'छは今の状態、हुन्छは一般的・反復的な状態や成り行きに使います。आज चिसो छは今日は寒い、जाडोमा चिसो हुन्छは冬は寒くなる／寒いものだ、です。否定はहुँदैनです。भयोはなる・起こるの過去、बन्नुは職業などになる場合の動詞です。हुन्छをすべて「なる」と直訳しません。',
 'छ describes a current condition; हुन्छ can express a regular situation or what happens. आज चिसो छ means it is cold today; जाडोमा चिसो हुन्छ describes winter generally. The negative is हुँदैन. भयो expresses a past change or occurrence. बन्नु is used for becoming something such as a professional. Do not translate every हुन्छ as become.'),
5: ('名詞の後ろの形で場所・相手・関係を示す','Mark place, participants and relationships after nouns',
 '後置詞は名詞の後ろに置き、場所・相手・出発点などを示す形です。घर＋मा＝घरमा（家に）、घर＋बाट＝घरबाट（家から）のように意味が変わります。日本語の一つの助詞に一つの形が対応するとは限りません。下の小節で、意味・結び付く形・実際の短い例を学びます。',
 'Postpositions follow nouns and express place, participants, starting points and other relationships. घर + मा gives घरमा, at home; घर + बाट gives घरबाट, from home. An English preposition does not always map to one Nepali form. The sections below teach meanings, combinations and short examples.'),
6: ('欲しい情報に合う疑問詞で尋ね、答える','Choose the right question word and answer it',
 '疑問詞は「誰」「何」「どこ」など、知りたい情報を示す語です。まず答えの種類を決め、その部分を疑問詞に置き換えます。文末の動詞は人称・時制に合わせます。कुनは選ぶもの、कस्तोは性質、कसरीは方法、किनは理由を尋ねます。文頭のकेによる「はい・いいえ」の質問と、物を尋ねるकेを区別しましょう。',
 'A question word identifies missing information: who, what, where and so on. Decide what kind of answer you need and replace that part of a statement with a question word. Keep the final verb appropriate to person and tense. कुन asks for a selection, कस्तो a quality, कसरी a method and किन a reason. Distinguish initial yes/no के from what के.'),
7: ('相手との関係に合う代名詞と動詞を選ぶ','Choose pronouns and verbs for the social relationship',
 '通常の練習はम・हामी・तपाईं・तपाईंहरू・उहाँ・उहाँहरूを基本にします。तँは非常に親しい相手などに使う低い敬意の形で、相手によって失礼になります。तिमीは親しい相手への形です。तपाईंは丁寧です。相手をどう呼ぶかに合わせ、動詞も変えます。「君」を常に目下専用と考えません。',
 'Ordinary practice prioritizes म, हामी, तपाईं, तपाईंहरू, उहाँ and उहाँहरू. तँ has low respect and can sound rude outside very close relationships. तिमी is familiar; तपाईं is respectful. Verb agreement changes with the form chosen. Familiar does not simply mean speaking to someone inferior.'),
8: ('日常の行動や習慣を現在形で述べる','Describe everyday actions and routines',
 '基本語順は「誰が＋何を・いつ・どこで＋動詞」です。辞書形の-नुを外し、動詞に合う現在語幹と人称語尾を使います。गर्नु→गर्छु、पढ्नु→पढ्छु、खानु→खान्छुのように語幹ごと覚えます。時刻や毎日などを添えると習慣を説明できます。',
 'Use subject + object/time/place + verb. Replace dictionary -नु with the appropriate present stem and personal ending. Learn stems through forms such as गर्नु→गर्छु, पढ्नु→पढ्छु and खानु→खान्छु. Adding every day or a time describes a routine.'),
9: ('しないことや習慣の否定を伝える','Describe actions you do not do',
 '動作動詞の否定はगर्दिनँ・खाँदिनँのような否定形です。文末にछैनを足すだけでは作れません。गर्छु→गर्दिनँ、गर्नुहुन्छ→गर्नुहुन्न、गर्छन्→गर्दैनन्のように人称と敬意を合わせます。मは鼻音を含む形、彼女を明示する形ではगर्दिनन्などになります。',
 'Action negatives use negative verb forms such as गर्दिनँ and खाँदिनँ, not an added छैन. Match person and respect: गर्छु→गर्दिनँ, गर्नुहुन्छ→गर्नुहुन्न, गर्छन्→गर्दैनन्. First-person forms have nasal endings; an explicitly feminine form can use गर्दिनन्.'),
10: ('今進行している動作を説明する','Describe an action in progress',
 '「動詞語幹＋दै／्दै＋छの活用」が基本です。पढ्दै छुは読んでいます、खाँदै छुは食べています、です。गर्दै छुとगरिरहेको छुはどちらも進行を表せます。否定は最後をछैन系にします。जाँदै छुは文脈によって今向かっていることや近い予定を表すため、時を示す語にも注意します。',
 'Use a verb stem with दै/्दै + a form of छ: पढ्दै छु, I am reading; खाँदै छु, I am eating. Both गर्दै छु and गरिरहेको छु can express ongoing action. Negate the final auxiliary with the छैन family. जाँदै छु can describe going now or an imminent arrangement, depending on time expressions and context.'),
11: ('終わった行動と動作主のलेを理解する','Describe completed actions and the agent marker ले',
 '対象を取る動詞を他動詞と呼びます。本を読む・手紙を書くなどの完了した出来事では、主語がमैले・उहाँले等になり、動詞の一致にも注意します。行く・来る・寝るなどの自動詞は、過去でも一律にलेを付けません。गर्नु→गरेँ、जानु→गएँ、आउनु→आएँなど不規則な語幹も学びます。',
 'Transitive verbs take an object, as in read a book or write a letter. Completed transitive events often mark the agent with मैले or उहाँले, and verb agreement also matters. Do not add ले to every past subject: go, come and sleep are intransitive. Learn irregular past stems such as गर्नु→गरेँ, जानु→गएँ and आउनु→आएँ.'),
12: ('過去にしなかったことを伝える','Say what did not happen in the past',
 '過去の否定はगरेनँ・गएनँなどで、現在のगर्दिनँとは異なります。人称・敬意によりगरेनँ・गरेनन्・गर्नुभएन等を選びます。完了した他動詞では否定でもलेの仕組みを確認します。存在の過去の否定थिएनは動作動詞の否定とは別です。',
 'Past negatives such as गरेनँ and गएनँ differ from present गर्दिनँ. Choose person/respect forms such as गरेनँ, गरेनन् and गर्नुभएन. Check agent marking even in a negated completed transitive event. Past nonexistence with थिएन is a separate copula construction.'),
13: ('これからの行動や予定を述べる','Talk about future actions and plans',
 '未来形ではगर्नेछु・जानेछु等を使います。नेを含む語幹に人称に合うछ系の形が続きます。丁寧形はगर्नुहुनेछなどです。भोलि（明日）などの時間語と現在形で予定を述べる場合もあります。未来形を使わない文でも予定を表せることを区別して学びます。',
 'Future forms include गर्नेछु and जानेछु: a ने stem with personal छ-family endings. A respectful form is गर्नुहुनेछ. Time words such as भोलि can also allow a present form to describe a plan. Distinguish the dedicated future form from other ways of expressing a future arrangement.'),
14: ('以前の習慣を今と区別して述べる','Describe former habits',
 'गर्थें・बस्थेंのような形で、昔よくしていたことを述べます。一度だけ完了したगरेँと、以前の習慣गर्थेंを区別します。否定にはगर्दिनथें等を使い、敬意に合うगर्नुहुन्थ्यो等も確認します。पहिलेは以前、सानो छँदाは幼い頃に、です。',
 'Forms such as गर्थें and बस्थें describe former habits. Contrast a single completed गरेँ with habitual गर्थें. Negatives include गर्दिनथें; respectful forms include गर्नुहुन्थ्यो. पहिले means formerly, and सानो छँदा means when young.'),
15: ('過去の経験や今に残る結果を述べる','Describe experience and present results',
 '「-एको／-एकी／-एका＋छの活用」が基本です。गरेको छुはした結果が今あること、खाएको छुは文脈によって食べた経験を表します。केकोような所有の疑問詞とは区別します。否定は最後をछैन系にし、अझै（まだ）等で意味を補います。थाकेको छुのように今の状態を表す使い方もあります。',
 'Use -एको/-एकी/-एका with the छ family. गरेको छु can describe a current result; खाएको छु can express experience in context. Distinguish these participial endings from unrelated question forms such as केको. Negate the auxiliary with the छैन family and use words such as अझै, still. थाकेको छु describes a resulting state: I am tired.'),
16: ('過去のある時点より前に済んだことを述べる','Describe something completed before a past reference point',
 '「-एको等＋थियो系」で、過去の時点にすでに成立していたことを述べます。गरेको थिएँは私はその時すでにしていた、です。現在完了のछを過去のथियो系に替えます。否定はथिइनँ・थिएन等です。जबや-दा等で示す基準の出来事と、どちらが先かを確認します。',
 'Use -एको and related forms with the थियो family for a result already established at a past time. गरेको थिएँ means I had done it. Compare present-perfect छ with past-reference थियो forms. Negatives include थिइनँ and थिएन. Identify the reference event and which event happened first.'),
17: ('相手に合う丁寧な頼み方を使う','Make requests at an appropriate level of respect',
 '初学者は-नुहोस्を基本にします。बस्नुहोस्は座ってください、लेख्नुहोस्は書いてください、です。日常にはबस्नुस्等の形もあります。親しい相手へのबस等と敬語形を混ぜず、कृपयाはお願いしますという丁寧さを添える語として扱います。',
 'Start with respectful -नुहोस्: बस्नुहोस्, please sit; लेख्नुहोस्, please write. Conversational variants such as बस्नुस् also occur. Keep familiar imperatives distinct from respectful ones. कृपया adds please; it does not replace the verb ending.'),
18: ('一緒にすることを提案し、自分の意志を述べる','Suggest a shared action and express intention',
 '一緒にする勧誘にはजाऔं・गरौं・बसौं等を使います。हामी जाऔंは行きましょう、です。自分への問い・申し出にはम जाऊँ?などが使えます。通常の現在形と区別し、しない提案はनजाऔंのようにनを付けます。',
 'Suggestions include जाऔं, गरौं and बसौं. हामी जाऔं means let us go. A first-person offer or question can use म जाऊँ? Distinguish these from ordinary present statements. Negative suggestions prefix न, as in नजाऔं.'),
19: ('しないでほしいことと禁止を伝える','Express negative requests and prohibition',
 '丁寧な「〜しないで」はन＋依頼形です。नआउनुहोस्は来ないでください。規則としての禁止には「動詞の-न＋हुँदैन」を使い、यहाँ बस्न हुँदैनはここに座ってはいけない、です。単にしないという現在否定とは話す目的が違います。',
 'A polite negative request uses न + request form: नआउनुहोस्, please do not come. A general prohibition uses the -न infinitive + हुँदैन: यहाँ बस्न हुँदैन, sitting here is not allowed. Distinguish a prohibition from a statement that someone does not do something.'),
20: ('できることとできないことを伝える','Express ability and inability',
 '「動作の-न形＋सक्नुの活用」で能力や可能を表します。बोल्न सक्छुは話せます、चलाउन सक्दिनँは運転できません、です。否定ではसक्नु側を変えます。人称・敬意はसक्नुに表れ、話す動詞を二重に活用しません。',
 'Use the action infinitive in -न + a form of सक्नु. बोल्न सक्छु means I can speak; चलाउन सक्दिनँ means I cannot drive. Negation and personal/respect agreement appear on सक्नु, not on both verbs.'),
21: ('必要・不要・許可を区別して伝える','Distinguish obligation, absence of obligation and permission',
 '「-नु पर्छ」はしなければならない、「-नु पर्दैन」はしなくてもよい、です。後者は「してはいけない」ではありません。「-न मिल्छ?」はしてもよいか・できる状況かを尋ねます。経験者をमलाई等で示す構文もあり、主語と対象を取り違えないようにします。',
 '-नु पर्छ expresses obligation; -नु पर्दैन means it is unnecessary, not forbidden. -न मिल्छ? asks whether an action is permitted or feasible. Some constructions use an experiencer such as मलाई; distinguish that role from the object.'),
22: ('希望と、その時の気分を述べる','Express wishes and what you feel like doing',
 '「-न चाहनु」はしたいという希望を表します。「経験者＋-न मन लाग्नु」はしたい気分です。मलाई चिया पिउन मन लाग्छではमलाईが私には、पिउनが飲むこと、मन लाग्छがしたい気持ちになる、です。否定・時制は主に最後の動詞で示します。',
 '-न चाहनु expresses a wish. An experiencer + -न मन लाग्नु expresses feeling like doing something. In मलाई चिया पिउन मन लाग्छ, मलाई marks the experiencer, पिउन is drink, and मन लाग्छ expresses inclination. Negation and tense appear mainly in the final verb.'),
23: ('名詞に合う形容詞の形と位置を選ぶ','Choose adjective position and agreement',
 '形容詞はふつう名詞の前に置きます。राम्रो・राम्री・राम्राのように性・数等で形が変わるものと、सुन्दर等のように通常変わらないものがあります。すべての物を日本語の性別で分類しません。को・की・काの一致はテーマ5と合わせて確認します。',
 'Adjectives normally precede nouns. Some change form, as in राम्रो, राम्री and राम्रा; others such as सुन्दर are normally invariable. Do not assign gender to objects by Japanese or English intuitions. Review genitive को/की/का agreement with topic 5.'),
24: ('動作の仕方、頻度、強さを加える','Add manner, frequency and degree',
 'बिस्तारैはゆっくり、छिटोは速く・早く、सधैंはいつも、प्रायःはたいてい、धेरैはとても・多く、です。動作を説明する語と、名詞の性質を述べる形容詞を区別します。कति＋形容詞は疑問だけでなく、感動を表す場合もあります。',
 'बिस्तारै means slowly, छिटो quickly/early, सधैं always, प्रायः usually, and धेरै very/much. Distinguish words describing an action from adjectives describing nouns. कति + adjective can express an exclamation as well as a question.'),
25: ('比較・最上級・似ていることを説明する','Compare things and express similarity',
 '「A＋Bभन्दा＋形容詞」でBを基準に比較します。सबभन्दा／सबैभन्दाは最上級、मध्येは集団の中から選ぶ範囲を示します。जस्तै／जस्तो等は似ていることを表し、जस्तोの形は結び付く名詞で変わることがあります。比較の基準と対象を逆にしないようにします。',
 'A + Bभन्दा + adjective compares A against B. सबभन्दा/सबैभन्दा express a superlative; मध्ये identifies the group selected from. जस्तै/जस्तो and related forms express similarity; जस्तो can agree with its noun. Keep the item and comparison standard distinct.'),
26: ('並列・順序・対比・理由をつなぐ','Connect addition, sequence, contrast and reason',
 'रは名詞などを並べる「と・そして」、अनिは順序、तरは対比、पनिは「も」です。किनभनेは理由を導き、-एकोले等は理由となる節を作ります。का कारण等の原因表現と、का बाबजुदの逆接も区別します。理由はすでにある事情、目的はこれから実現したいことです。',
 'र joins items; अनि marks sequence; तर marks contrast; पनि adds also. किनभने introduces a reason, and forms such as -एकोले create reason clauses. Distinguish cause phrases such as का कारण from concession with का बाबजुद. A reason is a circumstance; a purpose is an intended outcome.'),
27: ('同時・前後・期限の時間関係を伝える','Express simultaneity, sequence and deadlines',
 '-दै系は同時の動作、-एपछिは一つを終えてから次の動作、です。名詞＋पछिは「授業の後」などで、動詞の過去形をそのまま置く規則ではありません。अघि／पहिलेは前、भित्रは期間の以内、पश्चात्は書き言葉寄りの後、です。जब・जहिलेはテーマ29で扱います。',
 '-दै expresses simultaneous actions; -एपछि orders an action after another. Noun + पछि means after an event such as class; it is not formed by simply adding पछि to any past finite verb. अघि/पहिले mean before, temporal भित्र means within, and पश्चात् is a more formal after. See topic 29 for जब/जहिले.'),
28: ('誰のため、何をするためかを伝える','Express a beneficiary or an intended action',
 '人・物のためにはको / का लागि、動作の目的には-नको लागिを使います。छोराको लागिは息子のため、पढ्नको लागिは勉強するため、です。行く目的などではपढ्न जान्छुのように-नだけの形も使えます。निम्ति・निमित्तは類義表現として、実際の結合で学びます。',
 'Use को/का लागि for beneficiaries and -नको लागि for an intended action: छोराको लागि, for a son; पढ्नको लागि, in order to study. A motion purpose can also use a bare infinitive, as in पढ्न जान्छु. Learn synonymous निम्ति/निमित्त in actual combinations.'),
29: ('人・物・場所・時を文でつなぐ','Link people, things, places and times',
 '名詞の前に-नेや-एकोの説明を置く方法と、जो・जुन等で二つの節をつなぐ方法があります。जोは人、जुनは選び出す人・物など、जेは内容を受けます。जहाँは場所、जताは方向、जब・जहिलेは時、जसरीは方法、जतिは量・程度です。疑問詞の「誰？・どこ？」とは、文中の働きが違います。',
 'Nepali can modify a noun with a -ने/-एको clause, or link clauses with forms such as जो and जुन. जो commonly refers to a person, जुन selects an entity, and जे refers to content. जहाँ marks place, जता direction, जब/जहिले time, जसरी manner, and जति amount/degree. These link information rather than ask who or where.'),
30: ('条件と、その場合の行動を伝える','State a condition and what follows',
 '「条件＋भने＋その場合の文」が基本です。यदिはもしを明示しますが、省略しても条件を表せます。छ भनेとभयो भनेなど、現在の状態と仮定する出来事を区別します。जब…तबは「時」の関係で、भनेによる「もし」と必ず同じではありません。',
 'Use condition + भने + consequence. यदि explicitly adds if but is often optional. Distinguish a condition about a current state, छ भने, from one about an event, भयो भने. Temporal जब…तब is not automatically interchangeable with conditional भने.'),
31: ('意見・推測・可能性の強さを区別する','Distinguish opinion, prediction and possibility',
 'मलाई लाग्छは私にはそう思える、भन्नेは思う内容を受ける形です。होलाは推測、हुन सक्छは可能性を表します。-एको हुनु पर्छは状況からの推測で、-नु पर्छという義務と区別します。語尾によって確信の強さが変わり、単なる事実として訳さないようにします。',
 'मलाई लाग्छ introduces an impression or opinion; भन्ने can introduce its content. होला expresses a supposition and हुन सक्छ a possibility. -एको हुनु पर्छ can express an inference, unlike obligatory -नु पर्छ. Preserve the degree of certainty rather than translating a guess as a fact.'),
32: ('行為を受ける物・人を中心に述べる','Describe an event from the affected participant',
 '受動では書かれた手紙・開けられたドアなど、行為を受ける側を中心にします。लेखियो・खोलियो等の語形を学び、単純な自動詞と区別します。लेखिन्छは一般に書かれる、लेखिएनは書かれなかった、です。द्वाराは動作主、मार्फतは経由・仲介を示せます。धेरै हिँडियो等は非人称的な出来事で、物の受動と同じ意味ではありません。',
 'A passive foregrounds what is affected: a written letter or opened door. Learn forms such as लेखियो and खोलियो, distinct from ordinary intransitives. लेखिन्छ means is written generally; लेखिएन means was not written. द्वारा can mark an agent; मार्फत an intermediary. Impersonal धेरै हिँडियो is not a literal passive of an object.'),
33: ('人にさせる・してもらうことを述べる','Describe causing or arranging an action',
 '使役は、人に動作をさせる・してもらう関係です。खानु→खुवाउनु、सिक्नु→सिकाउनु等、元の動詞と対にして覚えます。誰が・誰に・何を、を分けます。「-न लगाउनु」も動作をさせる形です。過去の主語やलाई等はテーマ5・11の規則を確認します。',
 'A causative expresses causing or arranging an action. Learn pairs such as खानु→खुवाउनु and सिक्नु→सिकाउनु. Separate causer, person acting and object. -न लगाउनु is another causative construction. Review लाई and completed-event agent marking in topics 5 and 11.'),
34: ('発言内容を引用して伝える','Report what someone said',
 '「内容＋भन्नुभयो等」で発言を伝えます。引用した内容は発言者の立場からの言葉なので、म・यहाँ・भोलिの指す人・場所・日を確認します。अरे等を説明なしに追加しません。भन्नुभएनは言わなかった、भन्नुहुन्थ्यो等は繰り返し言っていた、です。条件のभनेと、言う動詞の過去形を文の役割で区別します。',
 'Report speech with its content followed by a respectful form such as भन्नुभयो. Words inside a quotation can retain the original speaker’s perspective: identify who म refers to, where यहाँ is and which day भोलि means. भन्नुभएन means did not say; भन्नुहुन्थ्यो can describe habitual past speech. Distinguish conditional भने from a past form of say by its role.'),
}

# Retain diverse existing recordings, not the long blocks of person-substitution drills.
KEEP = {
1:[1,5,7,9,10,11,12,13,14,17,18,19],2:[1,5,7,9,10,11,12,13,18],
3:[1,2,3,4,5,6,7,11,13,15],4:[1,2,3,4,5,6,7,8,9,10,11],
5:[5,8,9,10,13,15],6:[1,2,3,5,10,11,13],7:[1,2,3,5,6,7,8,9,10,16,17,18,19,20],
8:[1,13,16,17,19,20],9:[1,13,16,20],10:[1,13,16,18],
11:[1,13,16,19,20],12:[1,13,16,19,20],13:[1,13,16,17,18,19,20],
14:[1,13,16,20],15:[1,13,16,17,18,19,20],16:[1,13,16,17,18,19,20],
17:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],18:[1,2,3,4,5,6,7,8,9,10,11,13,14,15],
19:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],20:[1,5,10,11],
21:[1,3,5,6,7,9,10,11,12,13,14,15],22:[1,5,11,13,14,15],
23:[1,3,4,5,6,7,8,10,12,13,14,15],24:[1,5,7,8,9,10,11,12,13,14,15],
25:[1,3,4,5,9,10,11,12,14,15],26:[1,2,3,6,8,9,12,13,15],
27:[1,4,5,6,8,9,11,13,14],28:[1,3,5,6,9,10,11,12,13,14,15],
29:[1,3,4,5,6,7,8,10,11,12,13],30:[1,2,4,6,7,8,10,14,15],
31:[1,3,4,5,7,9,10,12,14],32:list(range(1,16)),33:[1,3,5,8,9,10,12,14],34:[2,3,4,6,8,9,13,14,15],
}

NEW_TSV = '''
1|तपाईंहरू शिक्षक हुनुहुन्छ।|tapāĩharū śikṣak hunuhuncha|あなたたちは先生です|You are teachers.
2|तपाईंहरू कहाँ हुनुहुन्छ?|tapāĩharū kahā̃ hunuhuncha?|あなたたちはどこにいますか？|Where are you?
2|कोठामा कुर्सी छैन।|koṭhāmā kursī chaina|部屋に椅子はありません|There is no chair in the room.
2|उनीहरू विद्यालयमा छन्।|unīharū vidyālayamā chan|彼らは学校にいます|They are at school.
3|हामी थाकेका छौं।|hāmī thākekā chaũ|私たちは疲れています|We are tired.
4|पानी तातो भयो।|pānī tāto bhayo|水がお湯になりました|The water became hot.
5|म घरबाट विद्यालयसम्म हिँड्छु।|ma gharbāṭa vidyālayasamma hiṇḍchu|私は家から学校まで歩きます|I walk from home to school.
5|म बिहानदेखि यहाँ छु।|ma bihāndekhi yahā̃ chu|私は朝からここにいます|I have been here since morning.
5|पसल पाँच बजेसम्म खुला छ।|pasal pā̃c bajesamma khulā cha|店は5時まで開いています|The shop is open until five.
5|उनी बजारतिर जान्छिन्।|unī bajārtira jānchin|彼女は市場の方へ行きます|She goes towards the market.
5|किताब झोलाभित्र छ।|kitāb jholābhitra cha|本はかばんの中にあります|The book is inside the bag.
5|घरको अगाडि बगैंचा छ।|gharko agāḍi bagaĩcā cha|家の前に庭があります|There is a garden in front of the house.
5|म साथीलाई पानी दिन्छु।|ma sāthīlāī pānī dinchu|私は友達に水をあげます|I give water to a friend.
5|यो रामको किताब हो।|yo rāmko kitāb ho|これはラムの本です|This is Ram's book.
5|उनी चिनीबिना चिया पिउँछिन्।|unī cinībinā ciyā piũchin|彼女は砂糖なしでお茶を飲みます|She drinks tea without sugar.
5|आजबाहेक म सधैं यहाँ आउँछु।|ājabāhek ma sadhaĩ yahā̃ āũchu|今日以外は、私はいつもここに来ます|Except today, I always come here.
6|तपाईं कहिले आउनुहुन्छ?|tapāĩ kahile āunuhuncha?|あなたはいつ来ますか？|When will you come?
6|तपाईं कसरी जानुहुन्छ?|tapāĩ kasarī jānuhuncha?|あなたはどうやって行きますか？|How will you go?
6|तपाईं कुन किताब पढ्नुहुन्छ?|tapāĩ kun kitāb paḍhnuhuncha?|あなたはどの本を読みますか？|Which book will you read?
6|यो खाना कस्तो छ?|yo khānā kasto cha?|この料理はどんな味ですか？|What is this food like?
6|कति जना आउनुहुन्छ?|kati janā āunuhuncha?|何人いらっしゃいますか？|How many people are coming?
6|तपाईंसँग कति वटा कलम छन्?|tapāĩsãga kati vaṭā kalam chan?|あなたはペンを何本持っていますか？|How many pens do you have?
6|अहिले कति बज्यो?|ahile kati bajyo?|今何時ですか？|What time is it now?
6|तपाईं कति बजे जानुहुन्छ?|tapāĩ kati baje jānuhuncha?|あなたは何時に行きますか？|At what time will you go?
6|तपाईं कहाँबाट आउनुभयो?|tapāĩ kahā̃bāṭa āunubhayo?|あなたはどこから来ましたか？|Where did you come from?
6|तपाईं कोसँग बस्नुहुन्छ?|tapāĩ kosãga basnuhuncha?|あなたは誰と住んでいますか？|Who do you live with?
6|तपाईं किन पर्खनुहुन्छ?|tapāĩ kina parkhanuhuncha?|あなたはなぜ待つのですか？|Why are you waiting?
6|तपाईं कति दिन बस्नुहुन्छ?|tapāĩ kati din basnuhuncha?|あなたは何日滞在しますか？|How many days will you stay?
6|तपाईं कसलाई फोन गर्नुहुन्छ?|tapāĩ kaslāī phon garnuhuncha?|あなたは誰に電話しますか？|Who will you call?
6|तपाईं कता जानुहुन्छ?|tapāĩ katā jānuhuncha?|あなたはどちらへ行きますか？|Which way are you going?
7|उ यहाँ छ।|u yahā̃ cha|その人はここにいます（低い敬意）|That person is here (low respect).
7|उनी यहाँ छन्।|unī yahā̃ chan|その人はここにいます（中程度の敬意）|That person is here (medium respect).
7|उहाँ यहाँ हुनुहुन्छ।|uhā̃ yahā̃ hunuhuncha|あの方はここにいらっしゃいます（高い敬意）|That person is here (high respect).
8|म बिहान चिया पिउँछु।|ma bihān ciyā piũchu|私は朝お茶を飲みます|I drink tea in the morning.
8|हामी बजारमा तरकारी किन्छौं।|hāmī bajārmā tarkārī kinchaũ|私たちは市場で野菜を買います|We buy vegetables at the market.
8|तपाईंहरू कहाँ काम गर्नुहुन्छ?|tapāĩharū kahā̃ kām garnuhuncha?|あなたたちはどこで働きますか？|Where do you work?
9|उनी मासु खाँदिनन्।|unī māsu khā̃dinan|彼女は肉を食べません|She does not eat meat.
9|हामी राति कफी पिउँदैनौं।|hāmī rāti kaphī piũdainaũ|私たちは夜コーヒーを飲みません|We do not drink coffee at night.
9|तपाईंहरू आइतबार काम गर्नुहुन्न।|tapāĩharū āitabār kām garnuhunna|あなたたちは日曜日には働きません|You do not work on Sundays.
10|हामी नेपाली सिक्दै छौं।|hāmī nepālī sikdai chaũ|私たちはネパール語を学んでいます|We are learning Nepali.
10|तपाईंहरू के पढ्दै हुनुहुन्छ?|tapāĩharū ke paḍhdai hunuhuncha?|あなたたちは何を読んでいますか？|What are you reading?
10|उनीहरू बस पर्खँदै छन्।|unīharū bas parkhãdai chan|彼らはバスを待っています|They are waiting for the bus.
11|हामी बजार गयौं।|hāmī bajār gayaũ|私たちは市場へ行きました|We went to the market.
11|उनले चिया पिइन्।|unle ciyā piin|彼女はお茶を飲みました|She drank tea.
11|तपाईंहरूले के किन्नुभयो?|tapāĩharūle ke kinnubhayo?|あなたたちは何を買いましたか？|What did you buy?
12|हामी हिजो बाहिर गएनौं।|hāmī hijo bāhira gaenaũ|私たちは昨日外出しませんでした|We did not go out yesterday.
12|उनले कफी पिइनन्।|unle kaphī piinan|彼女はコーヒーを飲みませんでした|She did not drink coffee.
13|हामी भोलि भेट्नेछौं।|hāmī bholi bheṭnechaũ|私たちは明日会います|We will meet tomorrow.
13|तपाईंहरू कहिले फर्कनुहुनेछ?|tapāĩharū kahile pharkanuhunecha?|あなたたちはいつ戻りますか？|When will you return?
14|हामी पहिले यहाँ बस्थ्यौं।|hāmī pahile yahā̃ basthyaũ|私たちは以前ここに住んでいました|We used to live here.
14|उनी पहिले चिया पिउँथिन्।|unī pahile ciyā piũthin|彼女は以前お茶をよく飲んでいました|She used to drink tea.
15|हामीले यो फिल्म हेरेका छौं।|hāmīle yo philm herekā chaũ|私たちはこの映画を見たことがあります|We have seen this film.
16|हामी पुग्दा पसल बन्द भइसकेको थियो।|hāmī pugdā pasal banda bhaisakeko thiyo|私たちが着いたとき、店はすでに閉まっていました|The shop had already closed when we arrived.
20|हामी पौडन सक्छौं।|hāmī pauḍna sakchaũ|私たちは泳げます|We can swim.
20|उनी गाडी चलाउन सक्छिन्।|unī gāḍī calāuna sakchin|彼女は車を運転できます|She can drive a car.
20|तपाईंहरू यो पढ्न सक्नुहुन्छ?|tapāĩharū yo paḍhna saknuhuncha?|あなたたちはこれを読めますか？|Can you read this?
20|म आज आउन सक्दिनँ।|ma āja āuna sakdinã|私は今日来ることができません|I cannot come today.
22|हामी नयाँ किताब पढ्न चाहन्छौं।|hāmī nayā̃ kitāb paḍhna cāhanchaũ|私たちは新しい本を読みたいです|We want to read a new book.
22|तपाईंहरू के खान चाहनुहुन्छ?|tapāĩharū ke khāna cāhanuhuncha?|あなたたちは何を食べたいですか？|What would you like to eat?
25|उनीहरू हामीभन्दा छिटो हिँड्छन्।|unīharū hāmībhandā chiṭo hiṇḍchan|彼らは私たちより速く歩きます|They walk faster than we do.
25|यीमध्ये कुन राम्रो छ?|yīmadhye kun rāmro cha?|これらの中ではどれが良いですか？|Which of these is good?
25|यो झोला मेरो झोलाजस्तै छ।|yo jholā mero jholājastai cha|このかばんは私のかばんによく似ています|This bag is like my bag.
26|वर्षाका कारण बाटो बन्द छ।|varṣākā kāraṇ bāṭo banda cha|雨のため道が通れません|The road is closed because of rain.
26|वर्षाका बाबजुद हामी गयौं।|varṣākā bābajud hāmī gayaũ|雨にもかかわらず私たちは行きました|We went despite the rain.
27|म खाना खानुअघि हात धुन्छु।|ma khānā khānuaghi hāt dhunchu|私は食事の前に手を洗います|I wash my hands before eating.
27|कक्षापछि हामी घर जान्छौं।|kakṣāpachi hāmī ghar jānchaũ|授業の後、私たちは家に帰ります|We go home after class.
27|हामी दुई दिनभित्र फर्कन्छौं।|hāmī duī dinbhitra pharkanchaũ|私たちは2日以内に戻ります|We will return within two days.
29|जो यहाँ बस्छ, ऊ मेरो साथी हो।|jo yahā̃ bascha, ū mero sāthī ho|ここに住んでいる人は私の友達です|The person who lives here is my friend.
29|जुन किताब तपाईं पढ्नुहुन्छ, त्यो राम्रो छ।|jun kitāb tapāĩ paḍhnuhuncha, tyo rāmro cha|あなたが読んでいる本は良い本です|The book you are reading is good.
29|जहाँ पानी छ, त्यहाँ जीवन छ।|jahā̃ pānī cha, tyahā̃ jīvan cha|水があるところには命があります|Where there is water, there is life.
29|जब पानी पर्छ, तब बाटो हिलो हुन्छ।|jab pānī parcha, tab bāṭo hilo huncha|雨が降ると、道はぬかるみます|When it rains, the road gets muddy.
29|म जहिले आउँछु, उनी यहाँ हुन्छिन्।|ma jahile āũchu, unī yahā̃ hunchin|私が来るときはいつも、彼女はここにいます|Whenever I come, she is here.
29|जसले मेहनत गर्छ, उसले सिक्छ।|jasle mehanat garcha, usle sikcha|努力する人は学びます|The person who makes an effort learns.
29|जसलाई पानी चाहिन्छ, उसलाई दिनुहोस्।|jaslāī pānī cāhincha, uslāī dinuhos|水が必要な人にあげてください|Give water to the person who needs it.
29|जसरी म गर्छु, त्यसरी गर्नुहोस्।|jasarī ma garchu, tyasarī garnuhos|私がするようにしてください|Do it the way I do.
29|जति चाहिन्छ, त्यति लिनुहोस्।|jati cāhincha, tyati linuhos|必要なだけ取ってください|Take as much as you need.
29|जे मन पर्छ, त्यही खानुहोस्।|je man parcha, tyahī khānuhos|好きなものを食べてください|Eat what you like.
29|जता उनी जान्छिन्, म पनि त्यतै जान्छु।|jatā unī jānchin, ma pani tyatai jānchu|彼女が行く方へ、私も行きます|I go in the same direction as she does.
32|यो पत्र शिक्षकद्वारा लेखिएको हो।|yo patra śikṣakdvārā lekhieko ho|この手紙は先生によって書かれたものです|This letter was written by the teacher.
32|मैले साथीमार्फत खबर पठाएँ।|maile sāthīmārphat khabar paṭhāẽ|私は友達を通して知らせを送りました|I sent a message through a friend.
'''

# Form | reading | Japanese meaning | English meaning | short construction
POST = '''
基本|मा|mā|〜に・で（場所・時）|in, at, on (place/time)|घरमा / gharmā
基本|लाई|lāī|〜に（受け手）、〜を（対象）、経験者|recipient, marked object, experiencer|रामलाई / rāmlāī
基本|को・का・की|ko / kā / kī|〜の。後ろの名詞に合う形を選ぶ|of; form agrees with the following noun|रामको किताब / rāmko kitāb
基本|बाट|bāṭa|〜から、〜で（移動手段など）|from; by a means of transport|बसबाट / basbāṭa
基本|देखि|dekhi|〜から・以来（起点）|from, since|बिहानदेखि / bihāndekhi
基本|सम्म|samma|〜まで（終点）|up to, until|पाँच बजेसम्म / pā̃c bajesamma
基本|देखि…सम्म|dekhi…samma|〜から〜まで|from…to|सोमबारदेखि शुक्रबारसम्म / sombārdekhi śukrabārsamma
同伴と所持|सँग・सित|sãga / sita|〜と一緒に、〜を相手に|with, in company with|साथीसँग / sāthīsãga
同伴と所持|को साथ|ko sāth|〜と一緒に。सँगと結合の形が異なる|with; construction differs from attached सँग|साथीको साथ / sāthīko sāth
同伴と所持|人＋सँग＋物＋छ|person + sãga + thing + cha|持っている。人＋物＋छुとは作らない|possession: the thing, not the possessor, controls छ|मसँग कलम छ / masãga kalam cha
基本|ले|le|〜で（道具・手段）。動作主の用法は11|with a tool; see 11 for agent marking|कलमले / kalamle
方向と位置|तिर・तर्फ・पट्टि|tira / tarpha / paṭṭi|〜の方へ・側。तिरは時刻の〜ごろにも使う|towards, to the side; तिर also about a time|बजारतिर / bajārtira
方向と位置|माथि|māthi|〜の上に。単独なら上へ・上に|above, on top; also above by itself|टेबलमाथि / ṭebalmāthi
方向と位置|तल・मुनि|tala / muni|〜の下。単独の方向と名詞を伴う関係を区別|below, under; distinguish standalone direction|टेबलमुनि / ṭebalmuni
方向と位置|भित्र・बाहिर|bhitra / bāhira|〜の中・外|inside, outside|झोलाभित्र / jholābhitra
方向と位置|अगाडि・पछाडि|agāḍi / pachāḍi|〜の前・後ろ|in front of, behind|घरको अगाडि / gharko agāḍi
方向と位置|सामु・सामुन्ने|sāmu / sāmunne|〜の面前・前方|in front of, before someone|मेरो सामु / mero sāmu
方向と位置|नजिक・निर・छेउ・छेउमा|najik / nira / cheu / cheumā|〜の近く・そば|near, beside|घरको नजिक / gharko najik
方向と位置|बीच・बीचमा・बिच・बिचमा|bīc / bīcmā / bic / bicmā|〜の間・中央。表記の違い|between, in the middle; spelling variants|दुई घरको बीचमा / duī gharko bīcmā
方向と位置|वरिपरि|varipari|〜の周り|around|घरको वरिपरि / gharko varipari
方向と位置|पारि・वारि|pāri / vāri|向こう側・こちら側|on the far side, on this side|खोलापारि / kholāpāri
方向と位置|टाढा|ṭāḍhā|遠い・離れて。出発点にはबाट等|far; a reference point can use बाट|घरबाट टाढा / gharbāṭa ṭāḍhā
範囲|भर・भरि|bhara / bhari|〜全体に・〜の間ずっと|throughout a place or period|दिनभरि / dinbhari
関係表現|को बारेमा・सम्बन्धमा・विषयमा|ko bāremā / sambandhamā / viṣayamā|〜について・〜に関して|about, regarding|नेपालको बारेमा / nepālko bāremā
関係表現|अनुसार|anusār|〜に従って・〜によれば|according to|नियमअनुसार / niyamanusār
関係表現|बमोजिम・मुताबिक・अनुरूप|bamojim / mutābik / anurūp|〜に従い・応じて。主に発展・書き言葉の参照|in accordance with; further/formal reference|सम्झौताबमोजिम / samjhautābamojim
関係表現|बिना・विना・बेगर|binā / vinā / begar|〜なしで。表記・類義形|without; variants and synonyms|चिनीबिना / cinībinā
関係表現|बाहेक|bāhek|〜以外・〜を除いて|except, apart from|आजबाहेक / ājabāhek
関係表現|को सट्टा・को साटो|ko saṭṭā / ko sāṭo|〜の代わりに|instead of|चियाको सट्टा / ciyāko saṭṭā
関係表現|प्रति|prati|〜に対して（気持ち・態度など）|towards in attitude or feeling|देशप्रति / deśprati
関係表現|विरुद्ध・विपरीत|viruddha / viparīt|〜に反対して・逆に。場面で使い分ける|against, contrary to; context determines use|नियमविरुद्ध / niyamviruddha
関係表現|मार्फत|mārphat|〜を通して・経由して。32で仲介との違い|through, via; compare agent vs intermediary in 32|साथीमार्फत / sāthīmārphat
'''

REL = '''
जो…उहाँ|jo…uhā̃|〜する人は、その人は|the person who…that person|जो यहाँ बस्छ, ऊ मेरो साथी हो।
जुन…त्यो|jun…tyo|〜するその人・物は、それは|the entity which…that one|जुन किताब तपाईं पढ्नुहुन्छ, त्यो राम्रो छ।
जे…त्यो／त्यही|je…tyo / tyahī|〜するもの・ことを、それを|what…that, the very thing|जे मन पर्छ, त्यही खानुहोस्।
जसले…उहाँले|jasle…uhā̃le|〜した／する人が、その人が|the agent who…that agent|जसले मेहनत गर्छ, उसले सिक्छ।
जसलाई…उहाँलाई|jaslāī…uhā̃lāī|〜する相手に、その相手に|the person whom/to whom…that person|जसलाई पानी चाहिन्छ, उसलाई दिनुहोस्।
जसको・जसकी・जसका|jasko / jaskī / jaskā|〜の持ち主・その人の。後ろの名詞に合わせる|whose; agreement follows the possessed noun|जसको किताब हो, उसलाई दिनुहोस्।
जसमा・जुन…मा|jasmā / jun…mā|〜が入る物・場所など|in which; choose according to the referent|जुन झोलामा किताब छ, त्यो मेरो हो।
जहाँ…त्यहाँ|jahā̃…tyahā̃|〜する場所には、そこに|where…there|जहाँ पानी छ, त्यहाँ जीवन छ।
जहाँबाट…त्यहाँबाट|jahā̃bāṭa…tyahā̃bāṭa|〜する所から、そこから|from where…from there|जहाँबाट आउनुभयो, त्यहाँबाट फेरि आउनुहोस्।
जता…त्यता／त्यतै|jatā…tyatā / tyatai|〜する方向へ、そちらへ|in whichever direction…that way|जता उनी जान्छिन्, म पनि त्यतै जान्छु।
जब…तब|jab…tab|〜する時、その時|when…then|जब पानी पर्छ, तब बाटो हिलो हुन्छ।
जहिले|jahile|〜する時・いつでも。文脈で反復を表す|when, whenever, according to context|म जहिले आउँछु, उनी यहाँ हुन्छिन्।
जसरी…त्यसरी|jasarī…tyasarī|〜する方法で、そのように|in the way…in that way|जसरी म गर्छु, त्यसरी गर्नुहोस्।
जसो…त्यसो|jaso…tyaso|〜するように、そのように（様子・成り行き）|as things are…accordingly|जसो भन्नुहुन्छ, त्यसो गर्छु।
जति…त्यति|jati…tyati|〜する量・程度だけ、それだけ|as much/many…that much/many|जति चाहिन्छ, त्यति लिनुहोस्।
जस्तो…त्यस्तो|jasto…tyasto|〜のような性質、それと同じような|of whatever kind…of that kind|जस्तो चाहिन्छ, त्यस्तो छान्नुहोस्।
जत्रो…त्यत्रो|jatro…tyatro|〜ほどの大きさ、それと同じ大きさ|of whatever size…of that size|जत्रो चाहिन्छ, त्यत्रो लिनुहोस्।
जोसुकै・जुनसुकै・जेसुकै|josukai / junsukai / jesukai|誰でも・どれでも・何でも。発展|whoever, whichever, whatever; extension|जुनसुकै किताब लिनुहोस्।
जहाँसुकै・जहिलेसुकै・जतिसुकै|jahā̃sukai / jahilesukai / jatisukai|どこでも・いつでも・どれほどでも。発展|wherever, whenever, however much; extension|जहिलेसुकै आउनुहोस्।
'''

QUESTIONS = '''
को|ko|誰|who|यहाँ को छ?|yahā̃ ko cha?|ここには誰がいますか？|Who is here?|राम यहाँ छ।|rām yahā̃ cha|ラムがいます|Ram is here.
के|ke|何|what|यो के हो?|yo ke ho?|これは何ですか？|What is this?|यो किताब हो।|yo kitāb ho|これは本です|This is a book.
कहाँ|kahā̃|どこ|where|तपाईं कहाँ बस्नुहुन्छ?|tapāĩ kahā̃ basnuhuncha?|どこに住んでいますか？|Where do you live?|म नेपालमा बस्छु।|ma nepālmā baschu|私はネパールに住んでいます|I live in Nepal.
कता・कतातिर|katā / katātira|どちらへ・どの方向に|which way, in which direction|तपाईं कता जानुहुन्छ?|tapāĩ katā jānuhuncha?|どちらへ行きますか？|Which way are you going?|म बजारतिर जान्छु।|ma bajārtira jānchu|市場の方へ行きます|I am going towards the market.
कहिले|kahile|いつ|when|तपाईं कहिले आउनुहुन्छ?|tapāĩ kahile āunuhuncha?|いつ来ますか？|When will you come?|म भोलि आउँछु।|ma bholi āũchu|明日来ます|I will come tomorrow.
किन|kina|なぜ|why|तपाईं किन पर्खनुहुन्छ?|tapāĩ kina parkhanuhuncha?|なぜ待つのですか？|Why are you waiting?|म साथीलाई पर्खन्छु।|ma sāthīlāī parkhanchu|友達を待っています|I am waiting for a friend.
कसरी|kasarī|どうやって|how, by what method|तपाईं कसरी जानुहुन्छ?|tapāĩ kasarī jānuhuncha?|どうやって行きますか？|How will you go?|म बसबाट जान्छु।|ma basbāṭa jānchu|バスで行きます|I will go by bus.
कति|kati|いくつ・いくら・どの程度|how many, how much|यो कति पर्छ?|yo kati parcha?|これはいくらですか？|How much does this cost?|यो सय रुपैयाँ पर्छ।|yo say rupaiyā̃ parcha|これは100ルピーです|This costs one hundred rupees.
कुन|kun|どの・どれ|which|तपाईं कुन किताब पढ्नुहुन्छ?|tapāĩ kun kitāb paḍhnuhuncha?|どの本を読みますか？|Which book will you read?|म यो किताब पढ्छु।|ma yo kitāb paḍhchu|この本を読みます|I will read this book.
कस्तो・कस्ती・कस्ता|kasto / kastī / kastā|どんな・どのような|what kind, what like|यो खाना कस्तो छ?|yo khānā kasto cha?|この料理はどんな味ですか？|What is this food like?|यो पिरो छ।|yo piro cha|これは辛いです|It is spicy.
कत्रो・कत्री・कत्रा|katro / katrī / katrā|どれほどの大きさ|how big|तपाईंको घर कत्रो छ?|tapāĩko ghar katro cha?|あなたの家はどれくらい大きいですか？|How big is your house?|मेरो घर सानो छ।|mero ghar sāno cha|私の家は小さいです|My house is small.
कत्तिको・कति＋形容詞|kattiko / kati + adjective|どの程度|to what extent|यो काम कत्तिको गाह्रो छ?|yo kām kattiko gāhro cha?|この仕事はどのくらい難しいですか？|How difficult is this work?|यो धेरै गाह्रो छैन।|yo dherai gāhro chaina|それほど難しくありません|It is not very difficult.
कसलाई|kaslāī|誰に・誰を|to whom, whom|तपाईं कसलाई फोन गर्नुहुन्छ?|tapāĩ kaslāī phon garnuhuncha?|誰に電話しますか？|Who will you call?|म रामलाई फोन गर्छु।|ma rāmlāī phon garchu|ラムに電話します|I will call Ram.
कसले|kasle|誰が（動作主）|who, as marked agent|कसले खाना पकायो?|kasle khānā pakāyo?|誰が料理を作りましたか？|Who cooked the food?|रामले खाना पकायो।|rāmle khānā pakāyo|ラムが料理を作りました|Ram cooked the food.
कसको・कसकी・कसका|kasko / kaskī / kaskā|誰の|whose|यो कसको किताब हो?|yo kasko kitāb ho?|これは誰の本ですか？|Whose book is this?|यो रामको किताब हो।|yo rāmko kitāb ho|これはラムの本です|This is Ram's book.
कोसँग|kosãga|誰と・誰のところに|with whom|तपाईं कोसँग बस्नुहुन्छ?|tapāĩ kosãga basnuhuncha?|誰と住んでいますか？|Who do you live with?|म परिवारसँग बस्छु।|ma parivārsãga baschu|家族と住んでいます|I live with my family.
कसका लागि・कसको लागि|kaskā lāgi / kasko lāgi|誰のために|for whom|यो कसका लागि हो?|yo kaskā lāgi ho?|これは誰のためですか？|Who is this for?|यो तपाईंका लागि हो।|yo tapāĩkā lāgi ho|あなたのためです|It is for you.
कसबाट|kasbāṭa|誰から|from whom|यो पत्र कसबाट आयो?|yo patra kasbāṭa āyo?|この手紙は誰から来ましたか？|Who did this letter come from?|यो पत्र रामबाट आयो।|yo patra rāmbāṭa āyo|ラムから来ました|It came from Ram.
कसको बारेमा|kasko bāremā|誰について|about whom|तपाईं कसको बारेमा बोल्नुहुन्छ?|tapāĩ kasko bāremā bolnuhuncha?|誰について話すのですか？|Who are you talking about?|म शिक्षकको बारेमा बोल्छु।|ma śikṣakko bāremā bolchu|先生について話します|I am talking about the teacher.
केमा・केबाट・केले|kemā / kebāṭa / kele|何に・何から／何で・何を使って|in what, from/by what, with what|तपाईं केले लेख्नुहुन्छ?|tapāĩ kele lekhnuhuncha?|何を使って書きますか？|What do you write with?|म कलमले लेख्छु।|ma kalamle lekhchu|ペンで書きます|I write with a pen.
केका लागि・केको|kekā lāgi / keko|何のために・何の|for what, of what|यो केका लागि हो?|yo kekā lāgi ho?|これは何のためですか？|What is this for?|यो पढ्नका लागि हो।|yo paḍhnakā lāgi ho|読むためです|It is for reading.
कहाँबाट・कहाँसम्म・कहाँतिर|kahā̃bāṭa / kahā̃samma / kahā̃tira|どこから・どこまで・どの辺へ|from where, up to where, towards where|तपाईं कहाँसम्म जानुहुन्छ?|tapāĩ kahā̃samma jānuhuncha?|どこまで行きますか？|How far are you going?|म बजारसम्म जान्छु।|ma bajārsamma jānchu|市場まで行きます|I will go as far as the market.
कहिलेदेखि・कहिलेसम्म|kahiledekhi / kahilesamma|いつから・いつまで|since when, until when|पसल कहिलेसम्म खुला छ?|pasal kahilesamma khulā cha?|店はいつまで開いていますか？|Until when is the shop open?|पसल पाँच बजेसम्म खुला छ।|pasal pā̃c bajesamma khulā cha|5時まで開いています|It is open until five.
कति वटा|kati vaṭā|何個・何本など|how many objects|तपाईंसँग कति वटा कलम छन्?|tapāĩsãga kati vaṭā kalam chan?|ペンを何本持っていますか？|How many pens do you have?|मसँग दुई वटा कलम छन्।|masãga duī vaṭā kalam chan|2本持っています|I have two pens.
कति जना|kati janā|何人|how many people|कति जना आउनुहुन्छ?|kati janā āunuhuncha?|何人いらっしゃいますか？|How many people are coming?|दुई जना आउनुहुन्छ।|duī janā āunuhuncha|2人いらっしゃいます|Two people are coming.
कति बजे・कति बज्यो|kati baje / kati bajyo|何時に・今何時|at what time, what time now|अहिले कति बज्यो?|ahile kati bajyo?|今何時ですか？|What time is it now?|अहिले पाँच बज्यो।|ahile pā̃c bajyo|今5時です|It is five now.
कति बेर・कति समय|kati ber / kati samay|どのくらいの間|how long|तपाईं कति बेर बस्नुहुन्छ?|tapāĩ kati ber basnuhuncha?|どのくらい滞在しますか？|How long will you stay?|म एक घण्टा बस्छु।|ma ek ghaṇṭā baschu|1時間滞在します|I will stay for one hour.
कति दिन・कति वर्ष|kati din / kati varṣa|何日・何年。年齢にも使う|how many days/years; also age|तपाईं कति दिन बस्नुहुन्छ?|tapāĩ kati din basnuhuncha?|何日滞在しますか？|How many days will you stay?|म दुई दिन बस्छु।|ma duī din baschu|2日滞在します|I will stay for two days.
कति पटक|kati paṭak|何回|how many times|तपाईं कति पटक आउनुभयो?|tapāĩ kati paṭak āunubhayo?|何回来ましたか？|How many times have you come?|म दुई पटक आएँ।|ma duī paṭak āẽ|2回来ました|I came twice.
कति टाढा|kati ṭāḍhā|どのくらい遠いか|how far away|पसल कति टाढा छ?|pasal kati ṭāḍhā cha?|店はどれくらい遠いですか？|How far away is the shop?|पसल दुई किलोमिटर टाढा छ।|pasal duī kilomīṭar ṭāḍhā cha|店は2キロ離れています|The shop is two kilometres away.
कुनचाहिँ・कुन-कुन|kuncāhĩ / kun-kun|どれを選ぶか・どれとどれ|which one in particular, which ones|तपाईं कुनचाहिँ लिनुहुन्छ?|tapāĩ kuncāhĩ linuhuncha?|あなたはどれを取りますか？|Which one will you take?|म यो लिन्छु।|ma yo linchu|これを取ります|I will take this one.
'''

EXTRA_ROWS = {
25: '''भन्दा|bhandā|〜より|than|चियाभन्दा / ciyābhandā
मध्ये|madhye|〜の中で（集合）|among a group|यीमध्ये / yīmadhye
जस्तै・जस्तो・झैं・सरी|jastai / jasto / jhaĩ / sarī|〜のように。जस्तोは一致する場合がある|like, similar to; जस्तो may agree|मेरो झोलाजस्तै / mero jholājastai''',
26: '''र・अनि・तर・पनि|ra / ani / tara / pani|と・それから・しかし・も|and, then, but, also|चिया र पानी / ciyā ra pānī
किनभने・-एकोले|kinabhane / -ekole|なぜなら・〜なので|because, since|समय नभएकोले / samay nabhaekole
का कारण・को कारणले・को वजहले|kā kāraṇ / ko kāraṇle / ko vajahle|〜が原因で|because of|वर्षाका कारण / varṣākā kāraṇ
का बाबजुद・हुँदाहुँदै|kā bābajud / hũdāhũdai|〜にもかかわらず。後者は動詞由来|despite; the latter is verbal|वर्षाका बाबजुद / varṣākā bābajud''',
27: '''-दै・-एपछि|-dai / -epachi|〜しながら・〜してから|while doing, after doing|पढ्दै / paḍhdai; पढेपछि / paḍhepachi
अघि・अगाडि・पहिले|aghi / agāḍi / pahile|時間の〜の前|before in time|खानुअघि / khānuaghi
पछि・पश्चात्|pachi / paścāt|〜の後。पश्चात्は書き言葉寄り|after; पश्चात् is more formal|कक्षापछि / kakṣāpachi
भित्र|bhitra|時間の〜以内に|within a period|दुई दिनभित्र / duī dinbhitra''',
28: '''को लागि・का लागि|ko lāgi / kā lāgi|名詞のために。結合する形を覚える|for a beneficiary; learn the construction|तपाईंका लागि / tapāĩkā lāgi
-नको लागि|-nako lāgi|動作をするために|in order to do|पढ्नको लागि / paḍhnako lāgi
निम्ति・निमित्त|nimti / nimitta|〜のために。類義形として参照|for, for the purpose of; further forms|तपाईंको निम्ति / tapāĩko nimti''',
32: '''द्वारा|dvārā|〜によって（動作主）|by an agent|शिक्षकद्वारा / śikṣakdvārā
मार्फत|mārphat|〜を通して（仲介・経由）|through an intermediary|साथीमार्फत / sāthīmārphat''',
}

if __name__ == '__main__':
    raise SystemExit('Run build_grammar_revision.py; this module contains reviewed lesson content.')
