"""Reviewed beginner explanations; leave practice sentences and recordings intact.

The rule builder and the existing downloaded guides share these corrections.
Review scope: all 34 themes and both appendices, including reference tables.
Primary checks: Oja & Oja, Nepali: A Beginner's Primer (Cornell, 2004),
Prasain, A Computational Analysis of Nepali Morphology (TU, 2011), and
Introduction to the Nepali Language, BCcampus chapters 8, 9 and 15.
"""
from copy import deepcopy
import re

# (theme, numbered rule): bilingual heading, explanation, and compact comparison.
# Rows contain a written form/reading followed by Japanese and English meanings.
RULES = {}


def add(theme, number, ja_title, en_title, ja, en, rows=(), after_ja='', after_en=''):
    RULES[theme, number] = (ja_title, en_title, ja, en, rows, after_ja, after_en)


add(2, 1, '何があるかで、छ・छन्を選ぶ', 'Choose छ or छन् for what exists',
    '**場所＋मा**の後ろに、そこにある物・いる人と動詞を置けます。場所を先に置くと「そこに何があるか」、物を先に置くと「その物はどこか」を伝えやすくなります。\n**छ＝一つの物など、छन्＝複数の物など**。人なら私のछु、私たちのछौं、敬意のहुनुहुन्छにします。',
    'A location takes **मा**. Put the location first to introduce what is there, or the thing first to say where it is.\nUse **छ for a singular thing**, **छन् for plural things**. For people, use छु with म, छौं with हामी, and हुनुहुन्छ for respectful subjects.',
    [('टेबलमा किताब छ।\nṭebalmā kitāb cha', '机の上に本があります。', 'There is a book on the table.'),
     ('टेबलमा दुई किताब छन्।\nṭebalmā duī kitāb chan', '机の上に本が2冊あります。数があるので、हरूがなくても複数。', 'There are two books on the table. The number already marks plurality; हरू is not required here.')])

add(3, 3, 'मलाई＋感覚＋लाग्नु：誰がどう感じる？', 'मलाई + sensation + लाग्नु: who feels it?',
    '**मलाई（malāī）＝私には**。感覚を経験する人にलाईを付けます。\n**मलाई／हामीलाई／तपाईंलाई／उहाँलाई＋感覚＋लाग्छ**。感じる人を替えても、この型のलाग्छをलाग्छुやलाग्नुहुन्छにはしません。\n**म खुसी छु**（ma khusī chu／私はうれしいです）は主語मを使う別の型です。',
    '**मलाई (malāī) means “to me”**: लाई marks the person experiencing the sensation.\nUse **मलाई/हामीलाई/तपाईंलाई/उहाँलाई + sensation + लाग्छ**. Changing that person does not change लाग्छ to लाग्छु or लाग्नुहुन्छ in this construction.\n**म खुसी छु** (ma khusī chu, I am happy) is a different construction with म as the subject.',
    [('मलाई जाडो लाग्छ।\nmalāī jāḍo lāgcha', '私は寒く感じます。जाडो＝寒さ。', 'I feel cold. जाडो = cold.'),
     ('मलाई भोक लाग्यो।\nmalāī bhok lāgyo', 'おなかがすきました。भोक＝空腹。今、空腹になったと伝える時にも使います。', 'I am hungry / I got hungry. भोक = hunger. This can announce hunger felt now.'),
     ('मलाई निद्रा लागेको छ।\nmalāī nidrā lāgeko cha', '私は眠くなっています。निद्रा＝眠気・睡眠。', 'I am feeling sleepy. निद्रा = sleep/sleepiness.')],
    '**लाग्छ → लाग्यो → लागेको छ**は、普段の感じ方・その感覚が生じたこと・今続く感覚を比べる基本形です。लाग्योは過去形でも「今おなかがすいた」のように現在の感覚を伝えられます。\n否定は**लाग्दैन（lāgdaina）／लागेन（lāgena）／लागेको छैन（lāgeko chaina）**。',
    '**लाग्छ → लाग्यो → लागेको छ** help distinguish a general feeling, a feeling that arose, and a resulting feeling now. Although लाग्यो is past in form, it can announce a present sensation such as becoming hungry.\nNegatives: **लाग्दैन (lāgdaina), लागेन (lāgena), लागेको छैन (lāgeko chaina)**.')

add(3, 6, '同じलाग्नुでも、時間・費用は別の型', 'लाग्नु also expresses time and cost',
    '**लाग्नु（lāgnu）を一つの日本語訳に固定しない**ことが大切です。時間や費用なら「かかる」。この型ではमलाईを必ず置くわけではありません。',
    '**लाग्नु (lāgnu) has several constructions**, not one fixed translation. With time or cost it means “take/cost”; मलाई is not automatically required.',
    [('एक घण्टा लाग्छ।\nek ghaṇṭā lāgcha', '1時間かかります。एक घण्टा＝1時間。', 'It takes one hour. एक घण्टा = one hour.'),
     ('एक घण्टा लाग्यो।\nek ghaṇṭā lāgyo', '1時間かかりました。このलाग्योは実際にかかった時間を振り返っています。', 'It took one hour. Here लाग्यो reports the time actually taken.')],
    '「〜と思う」はテーマ31、「〜したい気がする」はテーマ22で、この動詞の前に何を置くかを学びます。',
    'Theme 31 explains “think/seem”; theme 22 explains “feel like doing”. The words before लाग्नु select the meaning.')

add(8, 1, '辞書形から、私の現在形を作る', 'Build the present form from the dictionary form',
    '**語幹＝語尾を付け替える土台**です。まず辞書形の最後のनुを外して、下の完成形と比べます。\n子音で終わる語幹は、文字では्を含む形になります。母音や鼻音の変化もあるため、全てを同じ綴りにしません。',
    'The **stem is the base to which endings attach**. Remove final नु from the dictionary form and compare the resulting complete forms below.\nA consonant-final stem is written with ्. Vowels and nasalization can change, so one spelling rule does not cover every verb.',
    [('गर्नु → गर् → गर्छु\ngarnu → gar → garchu', 'する → 語幹 → 私はします。', 'do → stem → I do.'),
     ('पढ्नु → पढ् → पढ्छु\npaḍhnu → paḍh → paḍhchu', '読む・勉強する → 語幹 → 私は読みます。', 'read/study → stem → I read.'),
     ('खानु → खान्छु／जानु → जान्छु\nkhānu → khānchu / jānu → jānchu', '私は食べます／行きます。母音で終わる語幹の形も、完成形で覚えます。', 'I eat / I go. Learn these vowel-stem forms as complete patterns.'),
     ('आउनु → आउँछु\nāunu → āũchu', '私は来ます。ँは鼻音の目印です。', 'I come. ँ marks nasalization.')])

add(9, 4, 'गर्दिनँとगरिनँ：似た否定を聞き分ける', 'गर्दिनँ versus गरिनँ: two different negatives',
    '**現在の否定にはदがある**形を比べましょう。過去の私の否定には-इनँ系と-एनँ系の形があり、この教材の例題にはगरिनँも出ます。',
    'Compare the **द in the present negative** with the past forms. First-person past negatives include -इनँ and -एनँ variants; the examples in this course also use गरिनँ.',
    [('म काम गर्दिनँ।\nma kām gardinã', '私は仕事をしません。現在・習慣・意志の否定。', 'I do not / will not work: present, habitual or intended non-action.'),
     ('मैले काम गरिनँ।／मैले काम गरेनँ।\nmaile kām garinã / maile kām garenã', '私は仕事をしませんでした。過去の否定の二つの形。', 'I did not work: two first-person past negative forms.')])

add(10, 3, '-रहेकोの前と後ろを分ける', 'Separate the parts of -रहेको',
    '**गरि＋रहेको＋छु → गरिरहेको छु**（gari + raheko + chu → gariraheko chu／私はしている途中です）。\n「動作＋続いている形＋人称の形」と分けます。**-दै＋छ系**と同じく進行を表せます。',
    '**गरि + रहेको + छु → गरिरहेको छु** (gari + raheko + chu → gariraheko chu, I am doing it).\nSeparate the action, the ongoing form, and the personal auxiliary. Like **-दै + a छ form**, this can express an action in progress.',
    [('म पढिरहेको छु।\nma paḍhiraheko chu', '私は読んでいます。基本の形。', 'I am reading: the basic form.'),
     ('म पढिरहेकी छु।\nma paḍhirahekī chu', '私は読んでいます。女性の話し手を形に表す場合。', 'I am reading, with feminine agreement for the speaker.'),
     ('हामी पढिरहेका छौं।\nhāmī paḍhirahekā chaũ', '私たちは読んでいます。複数の例。', 'We are reading: a plural example.')],
    '女性形を使うかなどには会話で幅があります。まず**रहेको・रहेकी・रहेका**の違いを知り、後ろのछु・छौंも主語に合わせます。',
    'Usage varies, including whether feminine agreement is expressed in conversation. Recognize **रहेको/रहेकी/रहेका**, and also match छु/छौं to the subject.')

add(12, 1, '過去の否定：私の形を作る', 'Form the first-person past negative',
    '**गरेँ → गरिनँ／गरेनँ**は「した → しなかった」。例題のगरिनँと解説で見るगरेनँは、どちらも私の過去否定として使われる形です。\n**गर्दिनँ**なら現在の「しない」。दが入るかも比べてください。',
    '**गरेँ → गरिनँ/गरेनँ** contrasts “I did” with “I did not”. Both गरिनँ, used in the examples, and गरेनँ occur as first-person past negatives.\n**गर्दिनँ** is present “I do not”. Notice the द.',
    [('गएँ → गएनँ\ngaẽ → gaenã', '行った → 行かなかった。', 'I went → I did not go.'),
     ('आएँ → आएनँ\nāẽ → āenã', '来た → 来なかった。', 'I came → I did not come.'),
     ('पढेँ → पढिनँ／पढेनँ\npaḍhẽ → paḍhinã / paḍhenã', '読んだ → 読まなかった。', 'I read → I did not read.')])

add(13, 1, '-नेछの未来形を組み立てる', 'Build the future form in -नेछ',
    '**गर्नु → गर्＋ने＋छु → गर्नेछु**（garnu → gar + ne + chu → garnechu）。私の「これからする」という形です。\n普通形は-नेの形に人称の形を続け、敬意形は**-नुहुनेछ**という組になります。',
    '**गर्नु → गर् + ने + छु → गर्नेछु** (garnu → gar + ne + chu → garnechu) gives “I will do”.\nPlain forms combine -ने with a personal ending. Respectful forms use the different sequence **-नुहुनेछ**.',
    [('म गर्नेछु।\nma garnechu', '私はするでしょう・します。', 'I will do it.'),
     ('हामी गर्नेछौं।\nhāmī garnechaũ', '私たちはするでしょう・します。', 'We will do it.'),
     ('उहाँ गर्नुहुनेछ।\nuhā̃ garnuhunecha', 'その方はするでしょう・します。敬意の形。', 'That person will do it: respectful.')],
    '下の「活用・語彙」では、**भोलि＋現在形**で日常の予定を伝える形も比べられます。未来を話す時に、常に-नेछが必要なわけではありません。',
    'The Forms & words tab also compares everyday plans expressed with **भोलि + the present form**. Future time does not always require -नेछ.')

add(15, 6, '-एको・-एकी・-एका：何に合わせる？', '-एको, -एकी, -एका: what do they agree with?',
    'まず**行く・来るなど、自動詞の人を説明する形**で比べます。最後のछु・छौंだけでなく、その前の分詞にも性・数が表れることがあります。',
    'Start with **intransitive actions such as going and coming**. Gender and number can appear on the participle as well as on the final छु/छौं auxiliary.',
    [('म गएको छु।／म गएकी छु।\nma gaeko chu / ma gaekī chu', '私は行ったことがあります。基本形／女性形の例。', 'I have been/gone: basic and feminine forms.'),
     ('हामी गएका छौं।\nhāmī gaekā chaũ', '私たちは行ったことがあります。複数の例。', 'We have been/gone: a plural example.'),
     ('उहाँ जानुभएको छ।\nuhā̃ jānubhaeko cha', 'その方は行ったことがあります・行っています。敬意はनुभएकोに表します。', 'That person has been/gone. Respect is expressed in नुभएको.')],
    '**ले付きの他動詞では、分詞を人数だけで機械的に変えません。** 対象や構文にも一致が関係し、**हामीले काम गरेको छौं**（hāmīle kām gareko chaũ／私たちは仕事を済ませています）のような組もあります。',
    '**With a ले-marked transitive agent, do not change the participle solely by counting people.** Agreement also involves the object/construction: compare **हामीले काम गरेको छौं** (hāmīle kām gareko chaũ, we have done the work).')

add(17, 4, '依頼の3段階：最後の形まで比べる', 'Three levels of request: compare the whole ending',
    '「する」の依頼なら下の3形です。**相手との関係で選び、初対面ではगर्नुहोस्を基本にします。**\n低い敬意と親しい形は、語末の母音も違います。表記では最後の्の有無を確認しましょう。',
    'For “do”, compare these three forms. **Choose by your relationship; गर्नुहोस् is the beginner default with someone you do not know.**\nThe lowest and familiar forms differ in their final vowel; notice the final ् in writing.',
    [('गर् / gar', 'तँに対応。非常に直接的。使う相手・場面が限られます。', 'With तँ: very direct, restricted to particular relationships and situations.'),
     ('गर / gara', 'तिमीに対応。親しい相手への「して」。', 'With तिमी: a familiar “do”.'),
     ('गर्नुहोस् / garnuhos', 'तपाईंに対応。「してください」。', 'With तपाईं: respectful “please do”.')],
    '**गर न**（gara na／してね）の文末नは頼む気持ちを添えます。否定の**नगर**（nagara／しないで）とは位置が逆です。',
    'Final न in **गर न** (gara na, do it, please) adds an urging/requesting tone. Negative **नगर** (nagara, do not do it) places न before the verb.')

add(19, 4, '規則としての禁止：-नु हुँदैन', 'Prohibition as a rule: -नु हुँदैन',
    '**動詞の辞書形＋हुँदैन（hũdaina）＝〜してはいけない**。行為が許されないことを伝えます。\n**यहाँ धूम्रपान गर्नु हुँदैन।**\nyahā̃ dhūmrapān garnu hũdaina.\nここでは喫煙してはいけません。\n**नगर्नुहोस्**（nagarnuhos／しないでください）は相手への直接の依頼。**गर्नु हुँदैन**（garnu hũdaina）は許されない行為を説明する型です。会話ではहुँदैनを**हुन्न**（hunna）と短くすることもあります。',
    '**Dictionary-form verb + हुँदैन (hũdaina)** states that an action is not allowed.\n**यहाँ धूम्रपान गर्नु हुँदैन।**\nyahā̃ dhūmrapān garnu hũdaina.\nSmoking is not allowed here.\n**नगर्नुहोस्** (nagarnuhos, please do not do it) directly addresses someone. **गर्नु हुँदैन** (garnu hũdaina) describes a prohibited action. In conversation, हुँदैन can shorten to **हुन्न** (hunna).')

add(20, 1, '動作を-न形にして、सक्नुを続ける', 'Use the -न form before सक्नु',
    '**何ができる？＋できる人の形**の順です。前の動作は辞書形の最後のुを外す**-न形**にします。सक्नु（saknu）が「できる」を担います。',
    'Put **the action first, then the ability form for the person**. For the first verb, remove the final ु from the dictionary form to make the **-न form**. सक्नु (saknu) expresses ability.',
    [('पढ्नु → पढ्न सक्छु\npaḍhnu → paḍhna sakchu', '読む → 私は読むことができます。', 'read → I can read.'),
     ('बोल्नु → बोल्न सक्छु\nbolnu → bolna sakchu', '話す → 私は話せます。', 'speak → I can speak.'),
     ('गर्नु → गर्न सक्छु\ngarnu → garna sakchu', 'する → 私はできます。', 'do → I can do it.')])

add(20, 3, 'सक्छは全員共通ではない：否定と過去', 'सक्छ is not universal: negatives and past forms',
    '**सक्छ（sakcha）**は普通の三人称などの形です。私なら**सक्छु**、私たちなら**सक्छौं**、敬意なら**सक्नुहुन्छ**。\n否定や過去にする時も、前の動作の-न形は保ち、सक्नुの側を変えます。',
    '**सक्छ (sakcha)** is a plain third-person form, not a form for every subject. Use **सक्छु** for I, **सक्छौं** for we, and **सक्नुहुन्छ** for respectful subjects.\nKeep the first verb in its -न form when changing सक्नु for negation or tense.',
    [('म पढ्न सक्दिनँ।\nma paḍhna sakdinã', '私は読むことができません。', 'I cannot read.'),
     ('मैले पढ्न सकेँ।\nmaile paḍhna sakẽ', '私は読むことができました。読めた・やり遂げられた。', 'I was able to read / managed to read.'),
     ('मैले पढ्न सकिनँ।\nmaile paḍhna sakinã', '私は読むことができませんでした。', 'I could not read.')],
    '敬意形は**सक्नुहुन्न／सक्नुभयो／सक्नुभएन**（saknuhunna / saknubhayo / saknubhaena）。読むなど他動詞の完了では、動作主のमもमैलेへ変わります。',
    'Respectful forms: **सक्नुहुन्न/सक्नुभयो/सक्नुभएन** (saknuhunna / saknubhayo / saknubhaena). With a completed transitive action such as reading, म also becomes the agent form मैले.')

add(20, 5, '能力・許可・希望は別の型', 'Ability, permission and desire are different',
    '**できる＝必ず許可されている、ではありません。** 前の動作が似ていても、後ろの語で文の目的が変わります。',
    '**Being able does not automatically mean being allowed.** Similar action forms can be followed by expressions with different functions.',
    [('म जान सक्छु।\nma jāna sakchu', '私は行けます。能力・状況上の可能。', 'I can go: ability or practical possibility.'),
     ('जान मिल्छ?\njāna milcha?', '行ってもよいですか？ 許可・差し支えの有無。', 'May I go? Permission or whether it is acceptable.'),
     ('मलाई जान मन छ।\nmalāī jāna man cha', '私は行きたいです。希望。', 'I want to go: desire.')],
    '**हुन सक्छ**（huna sakcha／そうである可能性がある）は推測で、テーマ31の型です。',
    '**हुन सक्छ** (huna sakcha, may be) expresses possibility; see the construction in theme 31.')

add(20, 6, 'सक्नुには「終える」もある', 'सक्नु also means “finish”',
    '**前が-न形なら「できる」、目的語と直接組むなら「終える」**という違いをまず比べます。सक्यो・सकेँだけでは意味を決められません。',
    'Compare **an action in -न + सक्नु, “be able”**, with **an object directly followed by सक्नु, “finish”**. सक्यो or सकेँ alone does not determine the meaning.',
    [('मैले काम सकेँ।\nmaile kām sakẽ', '私は仕事を終えました。काम＝仕事が直接続く型。', 'I finished the work. काम is the direct object.'),
     ('मैले काम गर्न सकेँ।\nmaile kām garna sakẽ', '私は仕事をすることができました。गर्न＝することが入ります。', 'I managed to do the work. गर्न supplies the action “do”.')],
    'テーマ16の**काम सकेको थिएँ**（kām sakeko thiẽ／仕事を終えていました）は「終える」の完了形です。',
    '**काम सकेको थिएँ** (kām sakeko thiẽ, had finished the work) in theme 16 uses the “finish” meaning.')

add(21, 1, 'पर्छ＝必要：前は辞書形の-नु', 'पर्छ for necessity: keep -नु before it',
    '**पर्नु（parnu）→ पर्छ（parcha）**。動詞の辞書形と組むと「〜する必要がある」です。\n**必要な人＋लाई／ले＋動作の-नु形＋पर्छ**。この教材ではमलाईの型を先に学びます。मलाई・हामीलाई・उहाँलाईに替えても、この必要のपर्छは変えません。',
    '**पर्नु (parnu) → पर्छ (parcha)**. With a dictionary-form verb it expresses necessity.\nUse **the responsible person + लाई/ले + an action in -नु + पर्छ**. Start with the मलाई pattern used here. Changing मलाई to हामीलाई or उहाँलाई does not change पर्छ in this necessity construction.',
    [('मलाई पढ्नु पर्छ।\nmalāī paḍhnu parcha', '私は勉強する必要があります。पढ्नुは辞書形のまま。', 'I need to study. पढ्नु keeps its dictionary form.'),
     ('उहाँलाई पढ्नु पर्छ।\nuhā̃lāī paḍhnu parcha', 'その方は勉強する必要があります。敬意の相手でも、このपर्छは共通。', 'That person needs to study. पर्छ stays the same despite the respectful experiencer.')],
    '**पढ्न सक्छु**（読める）のपढ्नと比べ、**पढ्नु पर्छ**（読む必要がある）には最後のुがあることを確認します。पढ्नुपर्छと続けて書くこともあります。',
    'Compare **पढ्न सक्छु** (can read) with **पढ्नु पर्छ** (need to read): necessity keeps final ु. The joined spelling पढ्नुपर्छ is also used.')

add(21, 3, '許可のहुन्छと、敬意の-नुहुन्छ', 'Permission हुन्छ versus respectful -नुहुन्छ',
    '許可を尋ねる時は、**動作の-न形＋हुन्छ?**を一つの基本にします。辞書形の-नु＋हुन्छも使われます。\n見た目が似ている**-नुहुन्छ**は、相手の行動を丁寧に述べる現在形です。',
    'One basic permission question uses **an action in -न + हुन्छ?**. Dictionary-form -नु + हुन्छ also occurs.\nThe similar-looking **-नुहुन्छ** is a respectful present ending describing an action.',
    [('यहाँ बस्न हुन्छ?\nyahā̃ basna huncha?', 'ここに座ってもよいですか？ 許可を尋ねる。', 'May I sit here? Asking permission.'),
     ('यहाँ बस्नु हुन्छ?\nyahā̃ basnu huncha?', 'ここに座ってもよいですか？ -नुを使う許可の型。', 'May I sit here? The permission construction with -नु.'),
     ('उहाँ यहाँ बस्नुहुन्छ।\nuhā̃ yahā̃ basnuhuncha', 'その方はここに住んでいます。敬意の現在形。', 'That person lives here: respectful present.')],
    '許可の否定は**बस्नु हुँदैन**（basnu hũdaina／座ってはいけません）を基本にします。間の空白だけでなく、人と場面も見て判断します。',
    'For prohibition, learn **बस्नु हुँदैन** (basnu hũdaina, sitting is not allowed). Use the people and context as well as spacing to interpret the construction.')

add(21, 4, 'पर्छ → पर्यो：必要が生じた', 'पर्छ → पर्यो: a need arose',
    '**पर्यो（paryo／パリョ）**はपर्नुの過去形です。**पर्‍यो**という字体でも見かけます。別の動詞を丸暗記するのでなく、**पर्छと同じ仲間**として覚えましょう。',
    '**पर्यो (paryo)** is a past form of पर्नु; you may also see the rendering **पर्‍यो**. Learn it as a member of the **पर्छ family**, not as a separate verb.',
    [('मलाई जानु पर्छ।\nmalāī jānu parcha', '私は行く必要があります。', 'I need to go.'),
     ('मलाई जानु पर्यो।\nmalāī jānu paryo', '私は行かなければなりませんでした。必要が生じたこと。', 'I had to go: a need arose.'),
     ('मलाई जानु परेन।\nmalāī jānu parena', '私は行く必要がありませんでした。今回、必要が生じなかったこと。', 'I did not have to go: that occasion did not require it.'),
     ('मलाई जानु पर्दैनथ्यो।\nmalāī jānu pardainathyo', '私は以前、行く必要はありませんでした。過去の事情・習慣。', 'I did not need to go then: a past situation or habitual requirement.')],
    '**जानु परेन**は必要がなかっただけで、実際に行かなかったとまでは言いません。行かなかった出来事は**म गएनँ**（ma gaenã）です。',
    '**जानु परेन** says there was no need; it does not itself say whether the person went. **म गएनँ** (ma gaenã) reports “I did not go”.')

add(21, 6, 'पाइन्छ・मिल्छ：実際の許可の聞き方', 'पाइन्छ and मिल्छ: asking what is allowed',
    '**動作の-न形＋पाइन्छ／मिल्छ**も許可を聞く型です。पाइन्छは許されている・利用できること、मिल्छは差し支えない・都合が合うことなどを表します。\nここでの形は、話す人が私でも共通です。',
    '**An action in -न + पाइन्छ/मिल्छ** can ask about permission. पाइन्छ concerns what is allowed or available; मिल्छ can concern acceptability, suitability or feasibility.\nThese impersonal forms do not become first-person merely because I am asking.',
    [('यहाँ बस्न पाइन्छ?\nyahā̃ basna pāincha?', 'ここに座ってもよいですか？ 規則として許されるか。', 'Is sitting here allowed? Asking about permission/rules.'),
     ('यहाँ बस्न मिल्छ?\nyahā̃ basna milcha?', 'ここに座っても大丈夫ですか？ 差し支えないか。', 'Is it OK to sit here? Asking whether it is acceptable.'),
     ('बस्न पाइँदैन／बस्न मिल्दैन\nbasna pāĩdaina / basna mildaina', '座ることは許されません／座るのは都合が悪い・認められません。文脈で判断。', 'Sitting is not allowed / not acceptable or feasible, depending on context.')],
    '**能力のसक्छु**とは区別します。また、पाइन्छを物と組むと**यहाँ चिया पाइन्छ**（yahā̃ ciyā pāincha／ここではお茶が手に入ります）のように「入手できる」になります。',
    'Distinguish these from ability **सक्छु**. With a thing, पाइन्छ can mean availability: **यहाँ चिया पाइन्छ** (yahā̃ ciyā pāincha, tea is available here).')

add(21, 7, 'पर्छの意味は、前の語とセットで', 'Read पर्छ together with what precedes it',
    '**पर्छを見たら全部「〜しなければ」ではありません。** 必要・天気・値段・好みを、前の語で見分けます。',
    '**पर्छ does not always mean “must”.** Distinguish necessity, weather, price and liking by the preceding expression.',
    [('पानी पर्छ → पानी पर्यो\npānī parcha → pānī paryo', '雨が降る → 雨が降った。पानीはこの組では雨。', 'It rains → it rained. पानी refers to rain in this combination.'),
     ('यो कति पर्छ?\nyo kati parcha?', 'これはいくらですか？ 値段を尋ねる。', 'How much does this cost? Asking a price.'),
     ('मलाई चिया मन पर्छ।\nmalāī ciyā man parcha', '私はお茶が好きです。मन पर्छを一まとまりにする。', 'I like tea. Treat मन पर्छ as a unit.')])

add(22, 2, 'मन छ・मन लाग्छ・मन लाग्यो', 'मन छ, मन लाग्छ and मन लाग्यो',
    '**希望を感じる人＋लाई＋動作の-न形＋मन…**。मन（man）は心・気持ちです。**चाहन्छु**の主語मとは違い、こちらはमलाईにします。',
    '**Experiencer + लाई + action in -न + मन…**. मन (man) means mind/feeling. Use मलाई here, unlike subject म with चाहन्छु.',
    [('मलाई जान मन छ।\nmalāī jāna man cha', '私は行きたいです。今、その希望がある。', 'I want to go. The desire is present.'),
     ('मलाई जान मन लाग्छ।\nmalāī jāna man lāgcha', '私は行きたい気がします。行きたい気持ちが起こる。', 'I feel like going. The desire arises.'),
     ('मलाई जान मन लाग्यो।\nmalāī jāna man lāgyo', '私は行きたくなりました。気持ちが生じた。', 'I felt like going / came to want to go.'),
     ('मलाई जान मन छैन।\nmalāī jāna man chaina', '私は行きたくありません。今、その気がない。', 'I do not want to go. I have no desire to go now.')],
    '**मन लाग्दैन**（man lāgdaina／したい気がしない）、**मन लागेन**（man lāgena／したい気にならなかった）も対応します。人をउहाँलाईへ替えても、この型のछ・लाग्छはそのままです。',
    'Also compare **मन लाग्दैन** (man lāgdaina, do not feel like it) and **मन लागेन** (man lāgena, did not feel like it). Changing the experiencer to उहाँलाई leaves छ/लाग्छ unchanged in this construction.')

add(22, 3, 'मन पर्छは好み、मन छは希望', 'मन पर्छ for liking, मन छ for wanting',
    '**मन पर्नु（man parnu）＝好きである・気に入る**。物を好きな時にも、ある行動が好きな時にも使います。\n**その時にしたい気持ちはमन छ／मन लाग्छ**、普段の好みはमन पर्छを基本にすると区別しやすくなります。',
    '**मन पर्नु (man parnu) means to like or find pleasing**, whether the object is a thing or an activity.\nAs a beginner, use **मन छ/मन लाग्छ for wanting or feeling like an action**, and **मन पर्छ for liking**.',
    [('मलाई चिया पिउन मन पर्छ।\nmalāī ciyā piuna man parcha', '私はお茶を飲むのが好きです。行動の好み。', 'I like drinking tea: liking an activity.'),
     ('मलाई चिया पिउन मन छ।\nmalāī ciyā piuna man cha', '私はお茶を飲みたいです。今の希望。', 'I want to drink tea: a present desire.'),
     ('मलाई यो चिया मन पर्यो।\nmalāī yo ciyā man paryo', '私はこのお茶が気に入りました。気に入った時の反応。', 'I liked this tea: a reaction after trying it.')],
    '否定は**मन पर्दैन／मन परेन**（man pardaina / man parena）。文脈で意味が近づく場合もありますが、मन पर्छをいつでも「今〜したい」と置き換えません。',
    'Negatives: **मन पर्दैन/मन परेन** (man pardaina / man parena). Context can bring these meanings closer, but मन पर्छ is not a universal substitute for “want to now”.')

add(23, 1, '名詞で紹介するहो系、性質を言うछ系', 'Identify with हो; describe a quality with छ',
    '**形容詞＋名詞＋हो系**で「何であるか」を伝えます。\n**यो राम्रो किताब हो।**\nyo rāmro kitāb ho.\nこれは良い本です。\n\n**名詞＋形容詞＋छ系**で「どんな性質・状態か」を伝えます。\n**यो किताब राम्रो छ।**\nyo kitāb rāmro cha.\nこの本は良いです。\n\n同じराम्रो（良い）でも、**名詞किताबの前か、文末の説明か**で、後ろのहो・छが変わります。',
    '**Adjective + noun + a हो form** identifies what something is.\n**यो राम्रो किताब हो।**\nyo rāmro kitāb ho.\nThis is a good book.\n\n**Noun + adjective + a छ form** describes its quality or state.\n**यो किताब राम्रो छ।**\nyo kitāb rāmro cha.\nThis book is good.\n\nThe adjective राम्रो (good) is the same. Its role **before the noun किताब or as the final description** determines the choice of हो/छ.')

add(23, 2, '語尾の基本：オ → イ／ア', 'The ending pattern: o → ī / ā',
    '**राम्रोのように、-ो（o／オ）で終わる形の変わる形容詞**は、説明する人・物に合わせて語尾を替えます。\n**女性を表す形は-ी（ī／イ）、複数の基本形は-ा（ā／ア）**。別の単語を後ろに足すのでなく、最後の母音記号を付け替えます。',
    'An **inflecting adjective such as राम्रो, ending in -ो (o)**, changes its ending to agree with the person or thing described.\n**-ी (ī) is feminine; -ा (ā) is the basic plural pattern.** Replace the final vowel sign rather than adding another word.',
    [('राम्रो छोरा\nrāmro chorā', '男性・単数：良い息子。राम्रोの最後はो＝o。', 'Masculine singular: a good son. राम्रो ends in ो = o.'),
     ('राम्री छोरी\nrāmrī chorī', '女性・単数：良い娘。राम्रीの最後はी＝ī。', 'Feminine singular: a good daughter. राम्री ends in ी = ī.'),
     ('राम्रा किताबहरू\nrāmrā kitābharū', '複数の物：良い本（複数）。राम्राの最後はा＝ā。', 'Plural things: good books. राम्रा ends in ा = ā.')],
    '**सानो → सानी → साना**（sāno → sānī → sānā／小さい）も同じ仲間です。\n女性だけの複数を**राम्री केटीहरू**（rāmrī keṭīharū／かわいい女の子たち）のように女性形で表す用法もあります。「複数は例外なくア」とは固定しません。\n名詞の語尾だけで性を決めません。छोराはआで終わっても息子です。',
    '**सानो → सानी → साना** (sāno → sānī → sānā, small) follows the same pattern.\nFeminine agreement can also occur with a female plural, as in **राम्री केटीहरू** (rāmrī keṭīharū, pretty girls). Do not treat ā as an exceptionless plural ending.\nA noun ending alone does not identify gender: छोरा means son although it ends in आ.')

add(23, 5, 'आ形でも、人数が複数とは限らない', 'An ā form does not always mean several people',
    '**-ा（ā）は複数以外にも、敬意や後置詞につながる形で現れます。** 人数は名詞・数詞・文脈と一緒に判断します。',
    '**-ा (ā) can also occur in honorific agreement or an oblique form before a postposition.** Use the noun, numbers and context to determine how many people are meant.',
    [('एक जना राम्रा शिक्षक\nek janā rāmrā śikṣak', '良い先生が1人。एक जना＝1人なので、敬意に関わるआ形と分かる。', 'One good teacher. एक जना means one person; the ā form is honorific here.'),
     ('एउटा सानो केटा → एउटा साना केटाले\neuṭā sāno keṭā → euṭā sānā keṭāle', '1人の小さい男の子 → その男の子が〈लेを伴う形〉。1人のままでもआ形が出る。', 'One small boy → that boy as a ले-marked agent. The ā form can occur while the referent remains singular.')],
    'まず前の表で基本の形を覚え、この項目は「アを見ても即座に複数と決めない」ための補足として使ってください。',
    'Learn the basic pattern first. Use this note to avoid automatically interpreting every ā form as plural.')

add(24, 6, 'कति：質問にも感嘆にも', 'कति can ask or exclaim',
    '**कति＋形容詞**は「どれほど？」という質問にも、「なんて〜なんだろう！」という感嘆にもなります。場面・声の調子・句読点で区別します。',
    '**कति + adjective** can ask about degree or exclaim “how …!”. Context, intonation and punctuation distinguish them.',
    [('कति राम्रो!\nkati rāmro!', 'なんて素敵！ 相手に数量の答えを求めていない。', 'How lovely! No numerical answer is requested.'),
     ('यो कति ठूलो छ?\nyo kati ṭhūlo cha?', 'これはどのくらい大きいですか？ 大きさを尋ねる。', 'How big is this? Asking about size.')])

add(25, 5, 'जत्तिकै・जति：同じ程度と量', 'जत्तिकै and जति: equality and amount',
    '**比べる相手＋जत्तिकै＋形容詞**で「相手と同じくらい〜」。**भन्दा**なら差を、**जत्तिकै**なら同じ程度を伝えます。',
    '**Comparison standard + जत्तिकै + adjective** expresses “as … as”. **भन्दा** introduces a difference; **जत्तिकै** highlights equal degree.',
    [('यो झोला त्यो झोलाजत्तिकै ठूलो छ।\nyo jholā tyo jholājattikai ṭhūlo cha', 'このかばんは、あのかばんと同じくらい大きいです。', 'This bag is as big as that bag.'),
     ('यो झोला त्यो झोलाभन्दा ठूलो छ।\nyo jholā tyo jholābhandā ṭhūlo cha', 'このかばんは、あのかばんより大きいです。', 'This bag is bigger than that bag.')],
    '**जति**は「〜ほどの量・程度」、**बराबर**（barābar）は等しいという意味です。**जति…त्यति**（〜する量だけ、それだけ）の文はテーマ29で扱います。',
    '**जति** concerns amount/degree, and **बराबर** (barābar) means equal. Theme 29 covers the paired **जति…त्यति** construction.')

add(26, 6, 'किनभनेとत्यसैले：理由を先に言う？', 'किनभने or त्यसैले: what comes first?',
    '**結果＋किनभने＋理由**と、**理由＋त्यसैले＋結果**を比べます。二つの文を同じ順番のまま入れ替えると、理由と結果が逆になります。',
    'Compare **result + किनभने + reason** with **reason + त्यसैले + result**. Swapping only the connector reverses the causal relation.',
    [('म घरमै बसेँ किनभने पानी पर्यो।\nma gharmai basẽ kinabhane pānī paryo', '私は家にいました。雨が降ったからです。घरमै＝家に（強調）。', 'I stayed home because it rained. घरमै emphasizes at home.'),
     ('पानी पर्यो, त्यसैले म घरमै बसेँ।\npānī paryo, tyasaile ma gharmai basẽ', '雨が降りました。だから私は家にいました。', 'It rained, so I stayed home.')])

add(29, 3, 'जोの形は、前後の文で別々に選ぶ', 'Choose the relative and matching forms separately',
    '**जो＝〜する人、जसले＝〜した人が、जसलाई＝〜する相手に**。前後の節で同じ人を指していても、役割は同じとは限りません。',
    '**जो refers to a person; जसले marks a relative agent; जसलाई marks a relative recipient/experiencer.** The same person can have different roles in the two clauses.',
    [('जसले यो लेख्नुभयो, उहाँ मेरो साथी हुनुहुन्छ।\njasle yo lekhnubhayo, uhā̃ mero sāthī hunuhuncha', 'これを書いた方は、私の友達です。前半は書いた動作主なのでजसले。後半は人物紹介なのでउहाँ。', 'The person who wrote this is my friend. जसले marks the writer in the first clause; उहाँ is the identifying subject in the second.'),
     ('जसलाई पानी चाहिन्छ, उहाँलाई दिनुहोस्।\njaslāī pānī cāhincha, uhā̃lāī dinuhos', '水が必要な方にあげてください。前半は必要な人、後半は渡す相手なので、両方लाई。', 'Give it to the person who needs water. The first clause has an experiencer, the second a recipient: both use लाई.')])

add(31, 1, 'लाग्छ・लाग्यो：考えた内容を一文で続ける', 'लाग्छ and लाग्यो with a complete thought',
    '**考える人＋लाई＋［内容］＋जस्तो लाग्छ**は「その人には〜のように思える」。\n身体の感覚の**जाडो लाग्छ**と同じलाग्नुでも、ここでは考えの内容を受けます。',
    '**Experiencer + [content] + जस्तो लाग्छ** means “it seems to that person that …”.\nThe verb is the same लाग्नु as in **जाडो लाग्छ**, but here it takes the content of a thought.',
    [('मलाई उहाँ घरमा हुनुहुन्छ जस्तो लाग्छ।\nmalāī uhā̃ gharmā hunuhuncha jasto lāgcha', '私は、その方は家にいると思います。हुनुहुन्छはその方に対応し、लाग्छは「思える」の型。', 'I think that person is at home. हुनुहुन्छ agrees with that person; लाग्छ belongs to the “seems to me” construction.'),
     ('मलाई उहाँ घरमा हुनुहुन्छ जस्तो लाग्यो।\nmalāī uhā̃ gharmā hunuhuncha jasto lāgyo', '私は、その方は家にいると思いました。思った時点を過去にする。', 'I thought that person was at home. लाग्यो puts the impression in the past.')],
    '**मलाई लाग्छ, …**（malāī lāgcha／私は思いますが、…）の語順もあります。**लाग्दैन**（lāgdaina）は「そうは思えない」です。',
    'The order **मलाई लाग्छ, …** (malāī lāgcha, I think …) also occurs. **लाग्दैन** (lāgdaina) negates the impression.')

add(31, 4, 'पर्छ：義務と「〜に違いない」を区別', 'पर्छ: obligation versus inference',
    '**動作の-नु＋पर्छ＝する必要**。**完了の形＋हुनु पर्छ＝そうなったはずだという推論**。前にある形が意味を変えます。',
    '**Action in -नु + पर्छ expresses necessity. A perfect participle + हुनु पर्छ expresses an inference** about what must have happened. Read the preceding form.',
    [('उहाँलाई जानु पर्छ।\nuhā̃lāī jānu parcha', 'その方は行く必要があります。これからの行為への必要。', 'That person needs to go: a required action.'),
     ('उहाँ जानुभएको हुनु पर्छ।\nuhā̃ jānubhaeko hunu parcha', 'その方はもう行かれたに違いありません。根拠からの推測。', 'That person must have gone: an inference from evidence.')],
    '**हुन सक्छ**（huna sakcha／そうである可能性がある）は可能性を残す言い方です。**हुनु पर्छ**の推論も、確認済みの事実を報告する形とは区別します。',
    '**हुन सक्छ** (huna sakcha, may be) leaves a possibility open. Inferential **हुनु पर्छ** is also different from reporting a verified fact.')

add(33, 3, 'लगाउनुとलाग्नु：似ている別の動詞', 'लगाउनु and लाग्नु are different verbs',
    '**動作の-न形＋लगाउनु（lagāunu）＝人に〜させる**。**लाग्नु（lāgnu）＝感じる・かかる**などとは別の動詞です。',
    '**Action in -न + लगाउनु (lagāunu) means to make/have someone do something**. It is a different verb from **लाग्नु (lāgnu), feel/take/seem**.',
    [('उहाँले मलाई लेख्न लगाउनुभयो।\nuhā̃le malāī lekhna lagāunubhayo', 'その方は私に書かせました。उहाँले＝させた人、मलाई＝書く人、लेख्न＝書く動作。', 'That person had me write. उहाँले is the causer; मलाई is the writer; लेख्न is the action.'),
     ('मलाई जाडो लाग्यो।\nmalāī jāḍo lāgyo', '私は寒くなりました。このलाग्योは使役ではありません。', 'I felt/got cold. This लाग्यो is not causative.')],
    '過去・敬意は後ろの**लगाउनुभयो**が担い、前のलेख्नをलेख्नुभयोにしません。',
    'The final **लगाउनुभयो** carries past tense and respect; the preceding लेख्न does not become लेख्नुभयो.')

add(34, 2, '直接引用から、内容を伝える形へ', 'From direct words to reported content',
    '**引用内のम＝元の発言者**です。その言葉をそのまま残す直接引用と、「自分が〜であること」と内容にまとめる形を比べます。',
    '**म inside a quotation refers to the original speaker**. Compare preserving those words with reporting the content as “that they themselves …”.',
    [('उहाँले “म बिरामी छु” भन्नुभयो।\nuhā̃le “ma birāmī chu” bhannubhayo', 'その方は「私は病気です」と言いました。元のछुを保つ。', 'That person said, “I am ill.” The original छु stays inside the quotation.'),
     ('उहाँले आफू बिरामी भएको बताउनुभयो।\nuhā̃le āphū birāmī bhaeko batāunubhayo', 'その方は自分が病気だと伝えました。आफू＝本人、भएको＝そうであるという内容を結ぶ形。', 'That person reported being ill. आफू refers to that person; भएको connects the reported state.')],
    '**भएकोを入れれば全ての引用が作れるわけではありません。** 行動なら**आफू आउने**（āphū āune／自分が来る）など、伝える内容に合う形を選びます。',
    '**भएको is not a universal marker for every quotation.** An action can instead take a form such as **आफू आउने** (āphū āune, that they will come), according to the reported content.')


def rule_blocks(theme, number, lang):
    ja = lang == 'ja'
    jt, et, jp, ep, rows, ja_after, en_after = RULES[theme, number]
    blocks = [
        {'type': 'h', 'text': f'{number}. ' + (jt if ja else et), 'presentation': {'tone': 'violet', 'role': 'plain'}},
        {'type': 'p', 'text': jp if ja else ep, 'presentation': {'tone': 'violet', 'role': 'plain'}},
    ]
    if rows:
        blocks.append({'type': 'table', 'headers': ['形と読み', '意味・使い方'] if ja else ['Form and reading', 'Meaning and use'],
                       'rows': [[form, j if ja else e] for form, j, e in rows],
                       'presentation': {'tone': 'blue', 'rowTones': ['blue', 'green', 'violet', 'teal'][:len(rows)]}})
    if (ja_after if ja else en_after):
        blocks.append({'type': 'p', 'text': ja_after if ja else en_after, 'presentation': {'tone': 'teal', 'role': 'body'}})
    for block in blocks:
        block['clarityReview'] = f'2026-11-{theme}-{number}'
    return blocks


def clarify(blocks, theme, lang):
    """Idempotently replace numbered rules, keeping every unrelated block."""
    result = deepcopy(blocks)
    for t, n in sorted(RULES):
        if t != theme:
            continue
        start = next((i for i, b in enumerate(result) if b['type'] == 'h' and b.get('text', '').startswith(f'{n}. ')), None)
        if start is not None:
            end = next((i for i in range(start + 1, len(result)) if result[i]['type'] == 'h' or result[i].get('beginnerIntroEnd') or result[i].get('practiceRuleV3') or result[i].get('lessonSupplement')), len(result))
            result[start:end] = rule_blocks(t, n, lang)
        else:
            numbered = [i for i, b in enumerate(result) if b['type'] == 'h' and re.match(r'^\d+\. ', b.get('text', ''))]
            assert numbered, f'Theme {theme}: no rule boundary'
            last = numbered[-1]
            end = next((i for i in range(last + 1, len(result)) if result[i]['type'] == 'h' or result[i].get('beginnerIntroEnd') or result[i].get('practiceRuleV3') or result[i].get('lessonSupplement')), len(result))
            result[end:end] = rule_blocks(t, n, lang)
    return correct_reference_tables(result, theme, lang)


def correct_reference_tables(blocks, theme, lang):
    ja = lang == 'ja'
    for block in blocks:
        if theme == 13 and block['type'] == 'h' and block.get('text') in ('活用を比較するための表', 'A reference table for comparing personal forms', 'Table for comparing forms', 'Compare the forms'):
            block['text'] = '会話の予定：भोलि＋現在形' if ja else 'Everyday plans: भोलि + the present form'
        if block['type'] == 'table':
            rows = block['rows']
            # The old appendix copied the same respectful form into three rows,
            # retained familiar pronouns, and omitted respectful plural "you".
            if theme in (35, 36) and len(rows) in (10, 20) and rows[0][0].startswith(('म ', 'मैले ')) and rows[4][0].startswith(('तपाईं ', 'तपाईंले ')):
                compact = []
                for start in range(0, len(rows), 10):
                    group = rows[start:start + 10]
                    assert len(group) == 10 and group[8][0].startswith(('हामी ', 'हामीले '))
                    you = group[4]
                    compact.extend([group[0], group[8], you])
                    for pronoun, roman, native in [('तपाईंहरू', 'tapāĩharū', 'あなたたち' if ja else 'You all'), ('उहाँ', 'uhā̃', 'その方' if ja else 'That person'), ('उहाँहरू', 'uhā̃harū', 'その方たち' if ja else 'Those people')]:
                        row = deepcopy(you)
                        row[0] = row[0].replace('तपाईं', pronoun)
                        row[1] = row[1].replace('tapāĩ', roman)
                        if ja:
                            row[2] = re.sub(r'^あなた', native, row[2])
                        else:
                            # Use the original third-person translation so its
                            # English verb agrees, but the Nepali follows you.
                            row[2] = re.sub(r'^(He|She|They)', native, group[5 if pronoun == 'उहाँ' else 9][2]) if pronoun.startswith('उहाँ') else re.sub(r'^You', native, row[2])
                        compact.append(row)
                block['rows'] = rows = compact
                block['clarityReferenceReview'] = True
            for row in rows:
                if theme == 22 and len(row) == 3 and any('उहाँ' in cell and 'नेपाल' in cell for cell in row):
                    for index, cell in enumerate(row):
                        row[index] = cell.replace('चाहन्छिन्', 'चाहनुहुन्छ').replace('cāhanchin', 'cāhanuhuncha').replace('चाहँदैनन्', 'चाहनुहुन्न').replace('cāhãdainan', 'cāhanuhunna')
                if theme == 29:
                    for index, cell in enumerate(row):
                        row[index] = cell.replace('जसको किताब हुनुहुन्छ', 'जसको किताब हो').replace('jasko kitāb hunuhuncha', 'jasko kitāb ho')
                if ja and len(row) == 3:
                    if row[0] == 'あなたたち': row[-1] = re.sub(r'^あなたは', 'あなたたちは', row[-1])
                    if row[0] in ('彼・彼女', '彼・彼女たち'): row[-1] = re.sub(r'^(彼女|彼)は', 'その方は', row[-1])
                    if row[0] in ('彼ら・彼女たち', '彼ら・彼女ら'): row[-1] = re.sub(r'^(彼ら|彼女たち)は', 'その方たちは', row[-1])
        if block.get('practiceRuleV3'):
            if theme == 15:
                block['text'] = ('練習のポイント：自動詞の完了・経験は、基本の -एको、女性の -एकी、複数の -एका と、最後のछ系を比べます。敬意は -नुभएको。ले付き他動詞の分詞は対象・構文にも関係するため、主語の人数だけで変えません。' if ja else 'Practice focus: for intransitive perfects, compare basic -एको, feminine -एकी and plural -एका, plus the final छ auxiliary. Respectful forms use -नुभएको. With ले-marked transitive agents, participle agreement also involves the object/construction; do not change it just by counting subjects.')
            if theme == 23:
                block['text'] = ('練習のポイント：この問題の基本形は सानो、女性単数は सानी、複数の物は साना。形容詞が説明する名詞を見ます。\nयी と名詞の -हरू は複数の目印。これらの問題では形容詞 साना、所有の形 मेरा が対応します。\nकेटी（女の子）は女性単数なので सानी。女性の複数や敬意形は基本ルールの補足も確認しましょう。' if ja else 'Practice focus: in these questions use basic सानो, feminine singular सानी and साना for plural things. Look at the noun being described.\nयी and -हरू mark plural; these questions pair them with साना and मेरा.\nकेटी (girl) takes सानी. The core rules also explain feminine plurals and respectful forms.')
            if theme == 34:
                block['text'] = ('練習のポイント：この問題では「〜である」という状態の内容を भएको、「〜でない」を नभएकोでつなぎます。आफू は話した本人。行動の内容には別の形もあり、全ての間接話法をभएकोだけで作るわけではありません。' if ja else 'Practice focus: these questions report a state with भएको, or a negative state with नभएको. आफू refers to the original speaker. Actions can take other forms; भएको is not a universal indirect-speech marker.')
    return blocks


def main():
    """Apply the reviewed text to current local guides and both editable masters."""
    import json
    from pathlib import Path
    from package_beginner_grammar_update import markdown
    app = Path(__file__).resolve().parents[1]

    def write(path, text):
        old = path.read_bytes() if path.exists() else b''
        newline = '\r\n' if b'\r\n' in old else '\n'
        path.write_bytes(text.replace('\r\n', '\n').replace('\n', newline).encode('utf-8'))

    for lang in ('ja', 'en'):
        path = app / f'expo-app/data/overlays/{lang}.json'
        overlay = json.loads(path.read_text(encoding='utf-8-sig'))
        old = deepcopy(overlay)
        changed = []
        for key, blocks in overlay['grammarGuide'].items():
            revised = clarify(blocks, int(key), lang)
            assert revised == clarify(revised, int(key), lang), (lang, key, 'not idempotent')
            if revised != blocks:
                changed.append(int(key))
            overlay['grammarGuide'][key] = revised
        assert {k: v for k, v in old.items() if k != 'grammarGuide'} == {k: v for k, v in overlay.items() if k != 'grammarGuide'}
        write(path, json.dumps(overlay, ensure_ascii=False, indent=2) + '\n')
        write(app / f'expo-app/src/grammarGuide.{lang}.json', json.dumps(overlay['grammarGuide'], ensure_ascii=False, indent=2) + '\n')
        master = '文法教材_v2_ja_ドラフト.md' if lang == 'ja' else 'grammar_guide_v2_en.md'
        write(app / '文法教材' / master, markdown(overlay['grammarGuide'], overlay['grammarThemeNames'], lang))
        print(f'{lang}: reviewed 36 themes; changed {len(changed)}: {changed}; examples, practice, vocabulary and audio unchanged')


if __name__ == '__main__':
    main()
