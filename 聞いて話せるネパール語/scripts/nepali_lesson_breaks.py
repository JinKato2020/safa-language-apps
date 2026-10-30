"""Original bilingual culture breaks and contextual everyday-speech notes.

Culture cards evoke everyday Nepal rather than teaching another grammar rule.
Speech examples are reading material with explicit L1/roman pairs, not additions
to the voiced practice set. Sources support factual checks, not copied prose.
"""
from nepali_lesson_glosses import soft_breaks

SOURCES = {
 'valley':'https://ntb.gov.np/en/kathmandu-valley',
 'hills':'https://ntb.gov.np/en/mid-hills',
 'people':'https://ntb.gov.np/en/things-to-do/meet-the-people',
 'food':'https://ntb.gov.np/en/plan-your-trip/about-nepal/culture',
 'dal':'https://trade.ntb.gov.np/wp-content/uploads/2018/05/Experience_Nepal_Globalizing_Nepalese_Heritage_Cuisine_Recipe_Book.pdf',
 'etiquette':'https://trade.ntb.gov.np/travel-essentials/cultural-etiquette/',
 'tea':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-6-unit-2-cultural-insight/',
 'family':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-11-unit-2-cultural-insight/',
 'meal':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-15-unit-2-cultural-insight/',
 'market':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-16-unit-2-cultural-insight/',
 'responses':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-9-unit-1-key-vocabulary/',
 'time_dialogue':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-12-unit-3-conversations/',
 'directions':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-17-unit-3-conversations/',
 'shop_grammar':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-16-unit-4-grammar-focus/',
 'availability':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-15-unit-4-grammar-focus/',
 'past_story':'https://pressbooks.bccampus.ca/nepali/chapter/chapter-14-unit-4-grammar-focus/',
 'primer':'https://www.digitalhimalaya.com/projectteam/turin/downloads/nepali_primer.pdf',
}

def culture(key,ja_title,en_title,ja,en,sources):
    return dict(id=key,kind='culture',title=(ja_title,en_title),body=(ja,en),examples=[],sources=sources)

def spoken(key,ja_title,en_title,ja,en,examples,sources):
    return dict(id=key,kind='spoken',title=(ja_title,en_title),body=(ja,en),examples=examples,sources=sources)

CARDS = {
1:[culture('valley-morning','カトマンズ、路地の向こうへ','Beyond a Kathmandu lane',
    'カトマンズ盆地には、カトマンズ・パタン・バクタプルという、表情の違う古い街があります。広場から路地へ、路地から中庭へ。旅する自分を思い浮かべてみましょう。地図で見ていた街が、誰かの暮らす街に変わる瞬間です。',
    'Kathmandu, Patan and Bhaktapur give the valley three distinct old-city faces. Imagine stepping from a square into a lane, then a courtyard. A place once seen on a map begins to feel like somebody’s neighbourhood.', ['valley']),
   spoken('haina-tag','हैन? は「〜ですよね？」','हैन? as a conversational check',
    '**हैन**は**होइन**の会話でよく聞く形です。文末で上げ調子にすると、確認の「〜ですよね？」にもなります。否定を押し付ける意味ではなく、道が合っているかなどを相手に確かめる場面で聞いてみましょう。',
    '**हैन** is a common conversational form of **होइन**. At the end of a statement, rising intonation can ask for confirmation. In the example, the speaker checks a route rather than simply asserting a negative.',
    [('यही बाटो हो, हैन?','yahī bāṭo ho, haina?','この道で合っていますよね？','This is the right road, isn’t it?')],['directions'])],
2:[culture('tea-visit','湯気の向こうに、会話がある','Conversation across a cup of tea',
    '家を訪ねたとき、温かいお茶を囲んで話が始まることがあります。甘いミルクティーの湯気を眺めながら、急がず過ごすひととき。何を話すか迷っても、同じ一杯を楽しむ時間が、初対面の距離を少し縮めてくれそうです。',
    'A visit may begin with tea and time together. Picture the steam from a sweet milk tea and an unhurried conversation. Even before you find much to say, sharing that small pause can make a first meeting feel warmer.', ['tea']),
   spoken('kata-location','कता छ? も「どちらですか？」','कता छ? in everyday directions',
    '場所を聞く**कहाँ**に加え、会話では**कता**もよく聞きます。方向の「どちらへ」だけでなく、お店などの位置を尋ねる言い方にも使われます。まずは短い質問をひとまとまりで聞き取ってみましょう。',
    'Alongside **कहाँ**, you will hear **कता** in everyday location questions. It can ask where a shop or other place is, not only the direction of movement. Recognize the short question as a complete conversational turn.',
    [('पसल कता छ?','pasal kata cha?','お店はどちらですか？','Where is the shop?')],['directions'])],
3:[spoken('sanchai-short','短くても会話になる「お元気？」','A short “How are you?”',
    '顔を合わせた場面では、主語や長い質問を省いた**सन्चै?**も聞かれます。親しみのある短い挨拶です。相手や場面に合わせて、丁寧な呼びかけを添えてもよいでしょう。',
    '**सन्चै?** is a short, friendly check on someone’s wellbeing. Conversation can omit the subject and a longer question when the situation makes them clear. A respectful address can accompany it when appropriate.',
    [('सन्चै?','sancai?','お元気ですか？','Are you well?'),('सन्चै छु।','sancai chu.','元気です。','I am well.')],['primer','time_dialogue'])],
4:[spoken('huncha-okay','हुन्छ は、返事の「いいですよ」にも','हुन्छ as “Okay”',
    '依頼や提案への返事の**हुन्छ**は「いいですよ・分かりました」。ここでは「なります」と直訳しません。**ठीक छ**も了解の返事に使えます。人・物の同定に答える**हो**とは、質問の種類が違います。',
    'As a reply to a request or proposal, **हुन्छ** can mean okay or agreed. **ठीक छ** also acknowledges an arrangement. These responses have a different role from **हो** confirming an identity statement.',
    [('हुन्छ।','huncha.','いいですよ・分かりました。','Okay; agreed.'),('ठीक छ।','ṭhīk cha.','分かりました・大丈夫です。','All right; okay.')],['responses','time_dialogue'])],
5:[culture('hills-paths','街の先には、丘の暮らし','Life beyond the city',
    'ネパールの魅力は雪山だけではありません。丘に沿って続く集落や畑、街と村を結ぶ道にも、人の暮らしがあります。いつか車窓から気になる家並みを見つけたら、「どんな毎日だろう」と想像してみたいですね。',
    'Nepal is more than snowy peaks. Hillside settlements, fields and paths between towns and villages hold everyday lives too. Imagine noticing a cluster of homes from a window and wondering what an ordinary day there feels like.', ['hills'])],
6:[spoken('ni-return-question','तपाईंलाई नि? で「あなたは？」','तपाईंलाई नि? to return a question',
    '**नि?**を添えた短い聞き返しは、直前の話題を相手に返すときに使います。下の流れなら「あなたの具合は？」。これだけで何でも聞ける万能文ではなく、省かれた内容を会話から補います。',
    'A short return question with **नि?** sends the previous topic back to the listener. Here it asks about the other person’s wellbeing. The missing content comes from the preceding turn; it is not a context-free question.',
    [('मलाई सन्चै छ।','malāī sancai cha.','私は元気です。','I am well.'),('तपाईंलाई नि?','tapāĩlāī ni?','あなたはどうですか？','And you?')],['time_dialogue'])],
7:[culture('dai-didi','親戚でなくても、お兄さん・お姉さん','A family-like way of addressing people',
    'お店や道端で、少し年上の人を「お兄さん・お姉さん」にあたる呼び方で呼ぶことがあります。本当のきょうだいでなくても、呼びかけに親しみがにじむのが面白いところ。相手との距離や年齢を大切にする、人づきあいの一面です。',
    'An older person at a shop or on the street may be addressed with a word like elder brother or sister, even without a family connection. It is a glimpse of how warmth, age and relationships shape everyday encounters.', ['family']),
   spoken('hajur-response','हजुर は「はい」と「もう一度？」','हजुर: acknowledgement or “Pardon?”',
    '**हजुर**は丁寧な応答として「はい・聞いています」。上げ調子の**हजुर?**なら「え、もう一度？」という聞き返しにもなります。相づちを打っただけなのか、内容に同意したのかは、前後のやり取りも確認します。',
    '**हजुर** can politely acknowledge that you are listening. With questioning intonation, **हजुर?** can ask for repetition. Acknowledging the speaker does not always mean agreeing with every part of the message.',
    [('हजुर।','hajur.','はい・伺っています。','Yes; I am listening.'),('हजुर?','hajur?','もう一度お願いできますか？','Pardon?')],['responses'])],
8:[culture('dal-bhat','一皿に広がる、ダルバートの世界','A little world on a dal-bhat plate',
    'ご飯に豆のスープ、野菜のおかず、酸味や辛味のある付け合わせ。ダルバートは、一皿の中で味を組み合わせて楽しめる食事です。家庭や地域で中身はさまざま。「同じ料理なのに、昨日のお店と違うね」も旅の楽しみになりそうです。',
    'Rice, lentil soup, vegetables and a tangy or spicy accompaniment make a plate of dal bhat a small world of flavours. Homes and regions vary the combination. Discovering how today’s plate differs from yesterday’s can become part of the journey.', ['dal'])],
11:[culture('meal-warmth','おかわりに込められた、おもてなし','The warmth behind an extra helping',
    '食卓で、もう少しどうぞと勧めてもらうことがあります。ひと皿を通して気に掛けてくれる、そのやり取りも旅の思い出。満腹なら無理をせず、味わった喜びや感謝を伝えたいですね。食卓の習慣は家庭ごとに違います。',
    'An offer of another helping can be a small gesture of care. That exchange may become as memorable as the food. You need not eat beyond comfort: appreciation and thanks matter too. Every household has its own rhythm.', ['meal']),
   spoken('eaten-greeting','「食べましたか？」が気遣いの一言に','“Have you eaten?” as a caring check-in',
    '**खाना खानुभयो?**は実際に食事を済ませたかという質問です。間柄や場面によっては、会ったときの気遣いの一言にもなります。食事への招待が必ず含まれるわけでも、いつでも「こんにちは」と置き換えられるわけでもありません。',
    '**खाना खानुभयो?** really asks whether someone has eaten. Between people who know each other, it can also be a caring check-in. It is neither an automatic meal invitation nor a universal replacement for hello.',
    [('खाना खानुभयो?','khānā khānubhayo?','ご飯は食べましたか？','Have you eaten?')],['meal'])],
13:[spoken('bhetau-la','पछि भेटौंला は別れ際の一言','पछि भेटौंला when parting',
    '別れ際に**पछि भेटौंला**と言えば「また会いましょう」。ここでの**-ला**は、未来形の表だけを直訳するより、再会を見込む会話の一言として覚えると自然です。具体的な日時を約束した文とは限りません。',
    '**पछि भेटौंला** is a natural parting expression, see you later. Recognize the **-ला** form as part of this conversational expression of an expected future meeting. It does not by itself arrange a precise time.',
    [('पछि भेटौंला।','pachi bheṭaũlā.','また会いましょう。','See you later.')],['time_dialogue'])],
17:[spoken('dinus-short','दिनुहोस् → दिनुस् と短くなる','Shortened polite दिनुस्',
    '丁寧な依頼の**दिनुहोस्**が、会話では**दिनुस्**と短く聞こえることがあります。文末の**न**は、お願いを柔らかくしたり促したりする働き。短い形だから必ず乱暴、というわけではありません。声の調子や場面も大切です。',
    'Polite **दिनुहोस्** is often heard in shortened form **दिनुस्**. Final **न** can soften or encourage a request. Shortening alone does not make it rude; tone and context matter.',
    [('एक कप चिया दिनुस् न।','ek kap ciyā dinus na.','お茶を1杯お願いします。','A cup of tea, please.')],['shop_grammar'])],
18:[spoken('la-start','ल は「じゃあ・さあ」の合図','ल as “Well then” or “Let’s”',
    '**ल**は、話を受けたり、行動へ移ったりする短い合図として使います。必ず日本語の「はい」一語に対応するわけではありません。下の例なら、相談のあとで「じゃあ行こう」と動き出す感じです。',
    '**ल** can acknowledge what was said or signal moving on to action. It is not always a literal yes. Here it gives the suggestion a conversational well then, let’s get going feel.',
    [('ल, जाऔं।','la, jāaũ.','じゃあ、行きましょう。','Well then, let’s go.')],['time_dialogue'])],
19:[spoken('na-position','前のनと、後ろのनは違う','Initial न versus final न',
    '会話で聞こえる**न**は、位置で役割が変わります。依頼形の前なら否定、文末ならお願いを添えることがあります。音だけを拾って「行かない」と決めず、動詞の前後まで聞いてみましょう。',
    'The position of **न** matters in speech. Before a request verb it negates; after the request it can soften or urge. Listen to its position rather than interpreting every न as not.',
    [('नजानुहोस्।','najānuhos.','行かないでください。','Please do not go.'),('जानुहोस् न।','jānuhos na.','どうぞ行ってください。','Please do go.')],['primer','shop_grammar'])],
20:[spoken('paincha-available','पाइन्छ? は「手に入りますか？」','पाइन्छ? for availability',
    'お店の**पाइन्छ?**は「売っていますか・手に入りますか」。能力の「できる」とは違います。**सक्नु**で自分の能力を述べる文と、お茶を提供してもらえるか尋ねる文を分けて覚えましょう。',
    'In a shop, **पाइन्छ?** asks whether something is available or can be obtained. This differs from personal ability with **सक्नु**. The question asks about obtaining tea, not the customer’s ability to make it.',
    [('यहाँ चिया पाइन्छ?','yahā̃ ciyā pāincha?','ここでお茶をいただけますか・売っていますか？','Can I get tea here?')],['availability'])],
21:[culture('photo-encounter','シャッターより先に、ひと声','A moment before the photograph',
    '市場の働く姿や、旅先で出会った笑顔。写真に残したくなる場面があっても、まずは撮ってよいかを確かめたいですね。カメラの外側にいる相手と少し話せたら、一枚の写真が、その人との思い出に変わります。',
    'A market scene or a smile encountered along the way may invite a photograph. Ask before taking someone’s picture. A brief exchange with the person beyond the camera can turn an image into a shared memory.', ['etiquette']),
   spoken('milcha-permission','मिल्छ は「〜してもいい」にも使う','मिल्छ for permission and feasibility',
    '**動詞の-न形＋मिल्छ**は、状況に合って「できる・差し支えない」を表し、許可を尋ねる会話でもよく使います。否定は**मिल्दैन**。誤用ではありませんが、何でも能力の**सक्नु**と同じにはしません。許されるか、予定や事情から可能かは文脈で変わります。',
    '**An infinitive in -न + मिल्छ** expresses something being feasible or acceptable and is common when asking permission. The negative is **मिल्दैन**. This is an established use, not a mistake, but it is not interchangeable with ability **सक्नु** in every context.',
    [('यहाँ बस्न मिल्छ?','yahā̃ basna milcha?','ここに座ってもいいですか？','May I sit here?'),('आज भेट्न मिल्छ?','āja bheṭna milcha?','今日は会えますか？〈都合を尋ねる〉','Would it work to meet today?'),('मिल्छ।','milcha.','大丈夫です・構いません。','Yes, that is fine.'),('अहिले बस्न मिल्दैन।','ahile basna mildaina.','今は座れません・座ってはいけません〈事情による〉。','Sitting here is not possible/allowed right now.')],['directions','primer'])],
22:[culture('momo-plate','モモのお店で、ひと皿','A plate of momo',
    '湯気の立つモモを、たれに少し付けてひと口。具や調理法、たれにもお店ごとの楽しみがあります。肉入りだけでなく野菜入りもあり、食べ比べたくなる料理です。店先で好みを伝えられたら、次のひと皿がもっと楽しみになりそうです。',
    'Picture a warm momo dipped in sauce before the first bite. Fillings, cooking styles and sauces offer different pleasures, including vegetable options. Being able to describe what you enjoy can make discovering the next plate even more inviting.', ['food'])],
24:[spoken('ali-softening','अलि はお願いのクッションにも','अलि as a softener',
    '**अलि**は量・程度の「少し」だけでなく、お願いを控えめにする働きもあります。下の例では「少しゆっくり」。命令を強くするのでなく、聞き取るために相手へ調整を頼む一言です。',
    '**अलि** can soften a request as well as express a small amount or degree. Here it asks for a little slower speech, helping you keep the conversation going rather than ending it when you miss something.',
    [('अलि बिस्तारै बोल्नुस् न।','ali bistārai bolnus na.','少しゆっくり話していただけますか？','Could you speak a little more slowly, please?')],['primer','shop_grammar'])],
25:[culture('market-meeting','市場は、小さな出会いの連続','Small encounters at the market',
    '野菜や果物の色が並ぶ市場。品物を見て、値段を尋ねて、少し言葉を交わすだけでも、旅の景色が近くなります。値段を相談できるお店もあれば、定価のお店もあります。買い物を勝ち負けにせず、やり取りそのものを楽しみたいですね。',
    'A market gathers colour, produce and small encounters. Looking, asking and exchanging a few words can bring a place closer. Some shops welcome a price discussion; others use fixed prices. Think of the exchange as a meeting, not a contest.', ['market']),
   spoken('kam-request','お店で「少し安く」はどう頼む？','A gentle price request',
    '値段の話をしているときの**कम**は「少なく」、**गरिदिनुस् न**は相手にしてもらう依頼です。値段を相談できる場で、穏やかに使います。定価の店でも必ず交渉する、という意味ではありません。',
    'During a price discussion, **कम** asks for a reduction and **गरिदिनुस् न** makes a request for the listener to do it. Use a friendly tone where negotiation is appropriate, not as a demand in every fixed-price shop.',
    [('अलि कम गरिदिनुस् न।','ali kam garidinus na.','少し安くしていただけませんか？','Could you reduce the price a little, please?')],['market'])],
26:[culture('many-nepals','ネパールは、一つの風景じゃない','More than one picture of Nepal',
    '高い山のイメージから旅を始めても、街や村で出会う言葉、食事、装いは一様ではありません。いろいろな背景の人が暮らす国だからこそ、「前に会った人と違う」が発見になります。知ったつもりにならず、次の出会いを楽しみに。',
    'You may begin with a picture of high mountains, then discover varied languages, meals and clothing in towns and villages. Nepal’s many communities make differences part of the discovery. Leave room for the next encounter to surprise you.', ['people','food']),
   spoken('ani-followup','अनि? で話の続きを聞く','अनि? to invite the next part',
    '**अनि**は「それから」ですが、上げ調子の**अनि?**だけで「それで？」と続きを促すこともあります。**अनि के भयो?**なら何が起きたかを具体的に聞く形。相手の話を急がせない調子で使ってみましょう。',
    '**अनि** means then; a questioning **अनि?** can invite someone to continue. **अनि के भयो?** explicitly asks what happened next. A gentle tone makes it an invitation to tell more, rather than a demand to hurry.',
    [('अनि?','ani?','それで？・それから？','And then?'),('अनि के भयो?','ani ke bhayo?','それからどうなりましたか？','What happened then?')],['past_story'])],
34:[spoken('re-hearsay','रे は「〜だそうです」の合図','रे as a hearsay signal',
    '会話の文末の**रे**は、人から聞いた内容を伝える合図になります。自分で確かめた事実の断言とは分け、誰から聞いた話かにも気を配ります。自分の推測を表す**होला**とは同じではありません。',
    'Sentence-final **रे** can mark information heard from someone else. It does not assert that the speaker personally verified it. This reported-information use differs from the speaker’s own supposition with **होला**.',
    [('भोलि छुट्टी छ रे।','bholi chuṭṭī cha re.','明日は休みだそうです。','I hear tomorrow is a day off.')],['primer'])],
}

def extra_blocks(theme,lang):
    index=0 if lang=='ja' else 1
    out=[]
    for card in CARDS.get(theme,[]):
        tone='violet' if card['kind']=='culture' else 'teal'
        meta={'id':card['id'],'kind':card['kind']}
        def block(kind,text,role='body',palette=tone,join=None):
            p={'tone':palette,'role':role}
            if join:p['join']=join
            return {'type':kind,'text':text,'presentation':p,'l1ExampleSupport':1,'lessonSupplement':meta}
        label=('ひと休み' if lang=='ja' else 'A moment in Nepal') if card['kind']=='culture' else ('会話でよく聞く' if lang=='ja' else 'Heard in conversation')
        out.extend([block('h',label+'｜'+card['title'][index],'plain'),
                    block('p',soft_breaks(card['body'][index],lang),'body' if card['kind']=='culture' else 'plain')])
        for ne,roman,ja,en in card['examples']:
            out.extend([block('p','**'+ne+'**','example','green','start'),
                        block('p',roman,'reading','green','middle'),
                        block('p',ja if lang=='ja' else en,'translation','green','end')])
    return out
