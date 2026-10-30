"""Reviewed, explicit L1 glosses for illustrative Nepali in lesson explanations.

This is a teaching aid, not machine word-by-word translation. Incomplete patterns
are labelled as such; explicitly incorrect constructions are never presented as
valid example sentences. Voiced exercises and their translations are untouched.
"""
import copy
import re

DATA = '''अझ राम्रो|さらに良い|better; still better
अझै गरेको छैन|まだしていない|has not done it yet
अलि बिस्तारै|少しゆっくり|a little more slowly
अलि हेर्नुहोस्|ちょっと見てください|please have a look
अहिले हल्ला छैन|今は騒がしくありません|there is no noise now
आउन सक्नुहुन्न|来ることができません〈敬意〉|cannot come, respectful
आउनुभएको छैन|まだ来ていません〈敬意〉|has not come, respectful
आउनुभयो भने|来られたら|if you/he/she comes, respectful
आउने भन्ने कुरा|来るということ|the matter/content of coming
आएको मान्छे|来た人|the person who came
आज चिसो छ|今日は寒いです|it is cold today
आज धेरै हिँडियो|今日はたくさん歩きました〈非人称〉|there was a lot of walking today
आमाले बच्चालाई खाना खुवाउनुभयो|母が子供にご飯を食べさせました|the mother fed the child
उहाँ आउँदा मैले काम सकेको थिएँ|その方が来た時、私は仕事を終えていました|I had finished the work when he/she arrived
उहाँ आउनुभयो|彼・彼女が来ました〈敬意〉|he/she came, respectful
उहाँ आफू आउने कुरा भन्नुहुन्छ|その方は自分が来ると話します|he/she says that he/she will come
उहाँ कहाँ हुनुहुन्छ|彼・彼女はどこにいますか〈敬意〉|where is he/she, respectful
उहाँ गर्न सक्नुहुन्छ|彼・彼女はできます〈敬意〉|he/she can do it, respectful
उहाँ घरमा हुनुहुन्छ|彼・彼女は家にいます〈敬意〉|he/she is at home, respectful
उहाँ घरमा हुनुहुन्न|彼・彼女は家にいません〈敬意〉|he/she is not at home, respectful
उहाँ जान चाहनुहुन्छ|彼・彼女は行きたいと思っています〈敬意〉|he/she wants to go, respectful
उहाँ जानुभएको छ|彼・彼女は行っています・行ったことがあります〈敬意〉|he/she has gone; has been there, respectful
उहाँ जानुभएको थियो|彼・彼女はその時すでに行っていました〈敬意〉|he/she had gone, respectful
उहाँ जानुभएको होला|彼・彼女はもう行かれたでしょう|he/she has probably gone
उहाँ जानुहुनेछैन|彼・彼女は行かないでしょう〈未来・敬意〉|he/she will not go, respectful
उहाँ जानुहुन्न|彼・彼女は行きません〈敬意〉|he/she does not go, respectful
उहाँ पढ्दै हुनुहुन्छ|彼・彼女は今読んでいます〈敬意〉|he/she is reading, respectful
उहाँ पढ्नुहुने किताब|彼・彼女が読む本〈敬意〉|the book he/she reads, respectful
उहाँ पढ्नुहुन्न|彼・彼女は読みません〈敬意〉|he/she does not read, respectful
उहाँ यहाँ आउनुहुन्थ्यो|彼・彼女はよくここに来ていました〈敬意〉|he/she used to come here, respectful
उहाँ राम्रो हुनुहुन्छ|彼・彼女は良い方です〈敬意〉|he/she is a good person, respectful
उहाँ लेखक हुनुहुन्छ|彼・彼女は著者です〈敬意〉|he/she is an author, respectful
उहाँ व्यस्त हुनुहुन्छ|彼・彼女は忙しいです〈敬意〉|he/she is busy, respectful
उहाँ व्यस्त हुनुहुन्न|彼・彼女は忙しくありません〈敬意〉|he/she is not busy, respectful
उहाँलाई जाडो लाग्छ|彼・彼女は寒く感じます〈敬意〉|he/she feels cold, respectful
उहाँलाई भेट्छु|私はその方に会います|I meet him/her, respectful object
उहाँले गर्नुभयो|彼・彼女がしました〈敬意〉|he/she did it, respectful
उहाँले चिठी लेख्नुभयो|彼・彼女が手紙を書きました〈敬意〉|he/she wrote a letter, respectful
उहाँले पढ्नुभएको किताब|彼・彼女が読んだ本〈敬意〉|the book he/she has read, respectful
उहाँले पढ्नुभएको छ|彼・彼女は読み終えています・読んだことがあります〈敬意〉|he/she has read it, respectful
उहाँहरू जानुहुन्न|彼ら・彼女らは行きません〈敬意〉|they do not go, respectful
उहाँहरू पढ्नुहुन्छ|彼ら・彼女らは読みます〈敬意〉|they read, respectful
ए पनि|〜しても〈接続形の一部〉|even if/although, part of a linking pattern
एक पटक|1回|once
एको हुनु|〜した状態である〈複合形の一部〉|being in a completed state, part of a compound
कति जना|何人|how many people
कति दिन|何日・何日間|how many days
कति बजे|何時|what time
कति वटा|いくつ・何個|how many items
कलमले लेख्छु|私はペンで書きます|I write with a pen
कसरी जानुहुन्छ|どうやって行きますか〈敬意〉|how do you go, respectful
कसलाई लेख्नुभयो|誰に書きましたか〈敬意〉|to whom did you write, respectful
कसले लेख्नुभयो|誰が書きましたか〈敬意〉|who wrote it, respectful
कस्तो किताब|どんな本|what kind of book
कहाँबाट आउनुभयो|どこから来ましたか〈敬意〉|where did you come from, respectful
कहिले जानुहुन्छ|いつ行きますか〈敬意〉|when do you go, respectful
कहिलेकाहीँ जान्छु|私は時々行きます|I sometimes go
कहिल्यै गरेको छैन|これまで一度もしていない|has never done it
कहिल्यै जाँदिनँ|私は一度も行きません|I never go
का कारण|〜が原因で|because of
का बाबजुद|〜にもかかわらず|despite
का लागि|〜のために|for; for the benefit of
काम गर्दिनँ|私は働きません・仕事をしません|I do not work
काम गर्न लगाउनु|仕事をさせる|to make/have someone work
काम गर्नको लागि|仕事をするために|in order to work
काम थियो|仕事がありました|there was work
काम भयो|仕事が済みました・仕事が成立しました|the work was done/accomplished
किताब घरमा छ|本は家にあります|the book is at home
किताब टेबलमा छ|本は机の上にあります|the book is on the table
किताब पढ्छु|私は本を読みます|I read a book
किताब राम्रो छ|本は良いです|the book is good
किन खानुहुन्न|なぜ食べませんか〈敬意〉|why do you not eat, respectful
कुन किताब|どの本|which book
के खानुहुन्छ|何を食べますか〈敬意〉|what do you eat, respectful
के तपाईं खानुहुन्छ|あなたは食べますか〈はい・いいえの質問〉|do you eat, a yes/no question
के यो किताब हो|これは本ですか|is this a book
को लागि|〜のために|for; in order to
खाँदै छु|私は食べている途中です|I am eating
खाँदै बोल्नु|食べながら話す|to speak while eating
खान दिनु|食べることを許す・食べさせておく|to let someone eat
खाना खाएँ अनि गएँ|私は食事をして、それから行きました|I ate and then went
गएको छु|私は行っています・行ったことがあります|I have gone; I have been there
गएको थिएँ|私はその時すでに行っていました|I had gone
गएको थियो|行っていた〈三人称の過去完了の基本形〉|had gone, basic third-person form
गएको हुनु पर्छ|行ったに違いない|must have gone
गरिरहेको छु|私はしている途中です|I am doing it
गरेको छु|私はすでにしています・したことがあります|I have done it
गरेको छैनँ|私はまだしていません|I have not done it
गरेको थिएँ|私はその時すでにしていました|I had done it
गर्छु सक्छु|誤った接続例。能力ならगर्न सक्छु|incorrect combination; use गर्न सक्छु for ability
गर्दै छु|私はしている途中です|I am doing it
गर्न सक्छु|私はできます|I can do it
गर्नु हुँदैन|してはいけません|must not do it
घर होइन|家ではありません|it is not a house
घरदेखि विद्यालयसम्म|家から学校まで|from home to school
घरबाट आएँ|私は家から来ました|I came from home
घरमा छु|私は家にいます|I am at home
घरमा छैन|家にいません・ありません|is not at home
चिया र पानी|お茶と水|tea and water
छोराको लागि|息子のために|for the son
जब आउनुहुन्छ|来られる時|when you/he/she comes, respectful
जाँदै छु|私は向かっているところです|I am going
जाडो लाग्नु|寒く感じる|to feel cold
जाडोमा चिसो हुन्छ|冬は寒いものです|it is cold in winter generally
जान चाहन्छु|私は行きたいです|I want to go
जान मन पर्छ|行きたい・行くのが好き〈文脈による〉|want/like to go, depending on context
जान सक्छु|私は行くことができます|I can go
जान हुन्छ|行ってもよい|it is permissible to go
जानु पर्छ|行く必要があります|need to go
जानु पर्दैन|行く必要はありません|do not need to go
जानु पर्दैनथ्यो|行く必要はありませんでした|did not need to go
जानु हुँदैन|行ってはいけません|must not go
जाने बस|行くバス|the bus that goes
जुन किताब|〜する、その本〈関係表現〉|the book which…, a relative expression
जुन किताबमा|〜する、その本に・中に〈関係表現〉|in the book which…, a relative expression
टेबलमा किताब छ|机の上に本があります|there is a book on the table
डाक्टर बन्नु|医者になる|to become a doctor
ढोका खुल्यो|ドアが開きました|the door opened
ढोका खोलियो|ドアが開けられました|the door was opened
तँ गर्छस्|お前はする〈非常に親しい・低い敬意〉|you do it, intimate/low respect
तपाईं गर्नुहुन्छ|あなたはします〈敬意〉|you do it, respectful
तपाईं गर्नुहुन्न|あなたはしません〈敬意〉|you do not do it, respectful
तपाईं जस्तै|あなたと同じように・あなたのような|just like you
तपाईं पढ्नुहुन्छ|あなたは読みます〈敬意〉|you read, respectful
तपाईंका निम्ति|あなたのために|for you
तपाईंका लागि|あなたのために|for you
तपाईंजस्तो साथी|あなたのような友達|a friend like you
तिमी गर्छौ|君はする〈親しい相手〉|you do it, familiar
त्यो घरभन्दा|あの家より|than that house
थोरै पानी|少量の水|a little water
दुई घण्टापछि|2時間後に|after two hours
दुई घण्टाभित्र|2時間以内に|within two hours
दुई बजेसम्म|2時まで・2時までに〈動詞による〉|until/by two o'clock, depending on the verb
धेरै ठूलो|とても大きい|very big
धेरै पटक|何度も|many times
धेरै पटक पढ्छु|私は何度も読みます|I read many times
धेरै पढ्छु|私はたくさん読みます|I read a lot
धेरै पानी|たくさんの水|a lot of water
धेरै राम्रो|とても良い|very good
न हुन्छ|〜してよい〈前に動詞語幹が付く接続型〉|may do, with a preceding verb base
नआएको होला|来ていないでしょう|probably has not come
नु हुँदैन|〜してはいけない〈前に動詞語幹が付く型〉|must not do, with a preceding verb base
नु हुन्छ|〜してよい〈許可の型〉|may do, a permission pattern
नुभएको थियो|〜していた〈敬意・先行完了の語尾部分〉|had done, part of a respectful perfect form
नेपाल गएको छु|私はネパールへ行ったことがあります・行っています|I have been to/gone to Nepal
नेपाली बोल्न जान्छु|私はネパール語の話し方を知っています|I know how to speak Nepali
नेपाली बोल्न सक्छु|私はネパール語を話せます|I can speak Nepali
पढाइका लागि|勉強のために|for study
पढिरहेको मान्छे|読んでいる人|the person who is reading
पढेको छु|私は読み終えています・読んだことがあります|I have read it
पढेको थिएँ|私はその時すでに読んでいました|I had read it
पढेको बेला|読んだ時・読んでいた時|at the time of reading
पढ्दै छु|私は読んでいる途中です|I am reading
पढ्दै छैनँ|私は今読んでいません|I am not reading
पढ्दै थिएँ|私はその時読んでいる途中でした|I was reading
पढ्न सक्छु|私は読むことができます|I can read
पढ्नको लागि|読むために・勉強するために|in order to read/study
पढ्नको लागि आएँ|私は勉強するために来ました|I came in order to study
पढ्नुहुँदै छ|誤った進行形の例。敬意形はपढ्दै हुनुहुन्छ|incorrect progressive; respectful form: पढ्दै हुनुहुन्छ
पाँच बजेतिर|5時ごろに|around five o'clock
पाँच बजेसम्म|5時まで・5時までに〈動詞による〉|until/by five o'clock, depending on the verb
पानी चिसो छ|水は冷たいです|the water is cold
पानी चिसो छैन|水は冷たくありません|the water is not cold
पानी थिएन|水がありませんでした|there was no water
पानी परे पनि जान्छु|雨が降っても私は行きます|I will go even if it rains
पानी परेकोले आएनँ|雨が降ったので私は来ませんでした|I did not come because it rained
पानी परेकोले म गएनँ|雨が降ったので私は行きませんでした|I did not go because it rained
पानी पर्यो तर गएँ|雨が降りましたが私は行きました|it rained, but I went
पानी पर्यो भने म जाँदिनँ|雨が降ったら私は行きません|if it rains, I will not go
पानी पिएनँ|私は水を飲みませんでした|I did not drink water
बराबर छन्|等しいです|are equal
बस जानेछ|バスが行くでしょう〈未来〉|the bus will go
बस न|座ってね〈親しい依頼〉|do sit down, familiar request
बसबाट जान्छु|私はバスで行きます|I go by bus
बसमा छु|私はバスの中にいます|I am on the bus
बस्नुहोस् न|どうぞ座ってください|please do sit down
बस्ने मान्छे|住む人・座る人〈文脈による〉|the person who lives/sits, depending on context
बिस्तारै बोल्नुहोस्|ゆっくり話してください|please speak slowly
बिहानदेखि काम गर्दै छु|私は朝からずっと働いています|I have been working since morning
भनेर भन्नुभयो|〜と言いました〈引用に続く部分〉|said that…, following quoted content
भन्ने लाग्छ|〜というように思います〈内容に続く部分〉|it seems/thinks that…, following the content
भोलि जानेछु|私は明日行きます〈未来形〉|I will go tomorrow, future form
भोलि जान्छु|私は明日行きます〈現在形で予定〉|I will go tomorrow, a present-form plan
भोलि पानी पर्यो भने|明日雨が降ったら|if it rains tomorrow
भोलि म जान्छु|私は明日行きます|I will go tomorrow
भोलि लेख्छु|私は明日書きます|I will write tomorrow
म अहिले घरमा छु|私は今家にいます|I am at home now
म अहिले पढ्दै छु|私は今読んでいる途中です|I am reading now
म आउँछु|私は来ます|I will come
म कहिल्यै चुरोट खाँदिनँ|私はたばこを一度も吸いません|I never smoke
म किताब पढ्छु|私は本を読みます|I read a book
म खुसी छु|私はうれしいです|I am happy
म गएँ|私は行きました|I went
म गएको थिएँ|私はその時すでに行っていました|I had gone
म गएनँ|私は行きませんでした|I did not go
म गएनँ किनभने पानी पर्यो|私は行きませんでした。雨が降ったからです|I did not go because it rained
म गरूँ|私がしましょうか〈申し出〉|shall I do it, an offer
म गर्दिनथें|私は以前はしていませんでした〈習慣〉|I did not use to do it
म गर्न सक्छु|私はできます|I can do it
म घर गएँ|私は家に行きました・帰宅しました|I went home
म घरमा छु|私は家にいます|I am at home
म घरमा थिएँ|私は家にいました|I was at home
म चिठी लेख्छु|私は手紙を書きます|I write a letter
म चिया मात्र खान्छु|私はお茶だけ飲みます|I drink only tea
म जाँदिनँ|私は行きません|I do not/will not go
म जाऊँ|私が行きましょうか〈申し出〉|shall I go, an offer
म जाडो छु|誤った組み立ての例。寒いならमलाई जाडो लाग्छ|incorrect construction; use मलाई जाडो लाग्छ for feeling cold
म जान चाहन्छु|私は行きたいです|I want to go
म जान चाहन्नँ|私は行きたくありません|I do not want to go
म जानेछु|私は行くでしょう・行きます〈未来形〉|I will go
म जानेछैनँ|私は行きません〈未来形の否定〉|I will not go
म जान्छु|私は行きます|I go; I will go
म थिइनँ|私はいませんでした|I was not there
म धेरै हिँडेँ|私はたくさん歩きました|I walked a lot
म नेपाल गएको छु|私はネパールへ行ったことがあります・行っています|I have been to/gone to Nepal
म पढ्छु|私は読みます・勉強します|I read/study
म पढ्दै छु|私は読んでいる途中です|I am reading
म पढ्न जान्छु|私は勉強しに行きます|I go to study
म पढ्ने किताब|私が読む本|the book I read
म पनि जान्छु|私も行きます|I go too
म पहिले यहाँ बस्थें|私は以前ここに住んでいました|I used to live here
म बिहान घरमा हुन्छु|私は朝はふだん家にいます|I am usually at home in the morning
म बिहान पढ्छु|私は朝勉強します|I study in the morning
म लेखक हुँ|私は著者です|I am an author
म ल्याऊँ|私が持って来ましょうか〈申し出〉|shall I bring it, an offer
म व्यस्त छु|私は忙しいです|I am busy
म व्यस्त छैनँ|私は忙しくありません|I am not busy
म हिजो यहाँ बसेँ|私は昨日ここにいました・座りました|I stayed/sat here yesterday
म हुँ|私は〜です〈同定の文末〉|I am…, an identity ending
मन लागेको छ|〜したい気がしています〈動作に続く部分〉|feel like doing…, following the action
मलाई चिया खान मन पर्छ|私はお茶を飲むのが好きです・飲みたいです〈文脈による〉|I like/want to drink tea, depending on context
मलाई चिया मन पर्छ|私はお茶が好きです|I like tea
मलाई जाडो लाग्छ|私は寒く感じます|I feel cold
मलाई जान चाहन्छु|誤った組み立ての例。希望ならम जान चाहन्छु|incorrect construction; use म जान चाहन्छु for wanting to go
मलाई जान मन लाग्छ|私は行きたい気がします|I feel like going
मलाई जान मन लाग्दैन|私は行きたい気がしません|I do not feel like going
मलाई जानु पर्छ|私は行く必要があります|I need to go
मलाई जानु पर्यो|私は行かなければなりませんでした|I had to go
मलाई पानी चाहिन्छ|私は水が必要です|I need water
मलाई लाग्छ|私は〜と思います|I think/it seems to me that…
मसँग कलम छ|私はペンを持っています|I have a pen
मसँग किताब छ|私は本を持っています|I have a book
मान्छे पढिरहेको छ|その人は読んでいます|the person is reading
मेरा साथीहरू|私の友達たち|my friends
मेरी छोरी|私の娘|my daughter
मेरो छोरा|私の息子|my son
मैले काम गरेनँ|私は仕事をしませんでした|I did not work
मैले काम सकेको थिइनँ|私はその時まだ仕事を終えていませんでした|I had not finished the work
मैले किताब पढिनँ|私は本を読みませんでした|I did not read the book
मैले किताब पढेँ|私は本を読みました|I read the book, past
मैले किताब पढेको छु|私はその本を読んだことがあります・読み終えています|I have read the book
मैले गरिनँ|私はしませんでした〈過去否定の変種〉|I did not do it, a past-negative variant
मैले गरेँ|私がしました|I did it
मैले चिठी लेखेँ|私は手紙を書きました|I wrote a letter
मैले पढेँ|私は読みました|I read/studied, past
मैले पढेको किताब|私が読んだ本|the book I read, completed
यहाँ आउनुहोस्|ここに来てください|please come here
यहाँ धूम्रपान गर्नु हुँदैन|ここで喫煙してはいけません|smoking is not allowed here
यहाँ बसौं|ここに一緒に座りましょう|let us sit here
यहाँ बस्न हुन्छ|ここに座ってもよい|it is permissible to sit here
यहाँ बस्नुहोस्|ここに座ってください|please sit here
यहाँ विद्यालय थियो|ここに学校がありました|there was a school here
यहाँ हल्ला हुँदैन|ここではふだん騒ぎは起きません|there is usually no noise here
यहाँको मौसम राम्रो छ|ここの天気は良いです|the weather here is good
यीमध्ये यो सबैभन्दा ठूलो छ|これらの中でこれが一番大きいです|this is the biggest of these
यो किताब राम्रो छ|この本は良いです|this book is good
यो किताब हो|これは本です|this is a book
यो किताब होइन|これは本ではありません|this is not a book
यो के हो|これは何ですか|what is this
यो घर|この家|this house
यो घर त्यो घरभन्दा ठूलो छ|この家はあの家より大きいです|this house is bigger than that house
यो ठीक हुन सक्छ|これは正しい可能性があります|this may be correct
यो ठीक हो|これは正しいです|this is correct
यो ठीक होला|これはたぶん正しいでしょう|this is probably correct
यो मेरो किताब हो|これは私の本です|this is my book
यो राम्रो किताब हो|これは良い本です|this is a good book
यो लिनुहोस्|これを取ってください・どうぞお取りください|please take this
यो हो|これは〜です〈同定の文末〉|this is…, an identity ending
राम्ररी पढ्नु|よく・きちんと読む|to read/study properly
राम्ररी पढ्नुहोस्|よく・きちんと読んでください|please read/study carefully
राम्रा शिक्षक|良い先生〈複数・敬意の文脈〉|good teachers/a respected good teacher, depending on context
राम्रा साथीहरू|良い友達たち|good friends
राम्री छोरी|良い娘|a good daughter
राम्रो किताब|良い本|a good book
राम्रो छोरा|良い息子|a good son
लेखेको छु|私は書き終えています・書いたことがあります|I have written it
लेखेको थिएँ|私はその時すでに書いていました|I had written it
लेख्दै छु|私は書いている途中です|I am writing
लेख्न चाहन्छु|私は書きたいです|I want to write
लेख्न लगाउनु|書かせる|to make/have someone write
लेख्न सक्छु|私は書くことができます|I can write
लेख्नको लागि|書くために|in order to write
लेख्नु पर्छ|書く必要があります|need to write
लेख्ने चिठी|これから・ふだん書く手紙|the letter to be written/that someone writes
वर्षाका कारण|雨のために〈原因〉|because of rain
वसन्तमा यहाँको मौसम राम्रो हुन्छ|春はここの天気が良いものです|the weather here is generally good in spring
शिक्षकद्वारा लेखिएको|先生によって書かれた|written by the teacher
शिक्षकले लेख्नुभयो|先生が書きました〈敬意〉|the teacher wrote it, respectful
सकेको थिएँ|私はその時すでに終えていました|I had finished
सक्नुभएको थिएन|まだ終えていませんでした〈敬意〉|had not finished, respectful
सबैभन्दा ठूलो|最も大きい|the biggest
समय छ भने|時間があるなら|if there is time
समय नभए|時間がなければ|if there is no time
समय भए पनि|時間があっても|even if there is time
समय भयो भने|時間ができたら・その時間になったら|if time becomes available/when the time comes
साथीसँग जान्छु|私は友達と行きます|I go with a friend
सानो छ तर राम्रो छ|小さいですが良いです|it is small but good
सानो छँदा|小さかった頃・子供の頃|when young/a child
सानो पनि छ|小さくもあります|it is also small
सिकाउन सक्नुहुन्छ|教えることができます〈敬意〉|can teach, respectful
सिक्न सक्नुहुन्छ|学ぶことができます〈敬意〉|can learn, respectful
सुन्दर घर|美しい家|a beautiful house
सुन्दर फूल|美しい花|a beautiful flower
हरेक दिन|毎日|every day
हामी गएका थियौं|私たちはその時すでに行っていました|we had gone
हामी गर्दैनथ्यौं|私たちは以前はしていませんでした〈習慣〉|we did not use to do it
हामी गर्न सक्छौं|私たちはできます|we can do it
हामी जाऔं|私たちで行きましょう|let us go
हामी जानेछैनौं|私たちは行きません〈未来の否定〉|we will not go
हामी जानेछौं|私たちは行くでしょう・行きます〈未来形〉|we will go
हामी पढ्छौं|私たちは読みます・勉強します|we read/study
हामी पढ्दै छौं|私たちは読んでいる途中です|we are reading
हामी व्यस्त छौं|私たちは忙しいです|we are busy
हामी हौं|私たちは〜です〈同定の文末〉|we are…, an identity ending
हिजो गरेनँ|私は昨日しませんでした|I did not do it yesterday
हुन सक्छ|〜である可能性がある|may be; can be
हो छैन|誤った同定否定の例。正しくはहोइन|incorrect identity negative; use होइन
उहाँले «म आउँछु» भन्नुभयो|その方は「私は来ます」と言いました|he/she said, “I will come”
«म आउँछु»|「私は来ます」|“I will come”
«आउँछु» भनेर भन्नुभयो|「来ます」と言いました|said, “I will come”
«आउँदिनँ» भन्नुभयो|「来ません」と言いました|said, “I will not come”
«आउँछु» भन्नुभएन|「来ます」とは言いませんでした|did not say, “I will come”
सधैं・हरेक दिन・प्रायः|いつも・毎日・たいてい|always; every day; usually
पहिले・सानो छँदा|以前・子供の頃|formerly; when a child
पहिले・एक पटक・धेरै पटक|以前・1回・何度も|before; once; many times
अहिले…मन लागेको छ|今、〜したい気がしています|right now, feel like doing…
A र B बराबर छन्|AとBは等しいです|A and B are equal
म＋विद्यार्थी＋हुँ|私＋学生＋です → 私は学生です|I + student + am → I am a student
म + विद्यार्थी + हुँ|私＋学生＋です → 私は学生です|I + student + am → I am a student'''

DATA += '''
राम्रो छ|良いです〈現在の状態〉|is good, current description
राम्रो हुन्छ|ふだん良い・良くなる〈一般・条件〉|is generally good/becomes good
मसँग कलम|私の所にペン〈所持文の一部〉|a pen with me, part of a possession pattern
कति पटक|何回|how many times
कसका लागि|誰のために|for whom
कसको लागि|誰のために|for whom
कसको बारेमा|誰について|about whom
केका लागि|何のために|for what purpose
कति बज्यो|何時になりましたか・今何時ですか|what time is it
कति बेर|どのくらいの時間|how long
कति समय|どれだけの時間|how much time
कति वर्ष|何年・何歳|how many years; how old
कति टाढा|どのくらい遠く|how far
कति बजे जानुहुन्छ|何時に行きますか〈敬意〉|at what time do you go, respectful
तपाईंको उमेर कति वर्ष भयो|あなたは何歳ですか|how old are you
मन पर्छ|好きです・気に入ります|like; find pleasing
मन लाग्नु|〜したい気になる|to feel like doing
मन पर्नु|好きである・気に入る|to like; to find pleasing
मन लाग्छ|〜したい気がします|feel like doing
भए पनि|〜であっても|even if/although it is
नको लागि|〜するために〈前に動詞語幹が付く型〉|in order to do, with a preceding verb base
नेपाल जाने मान्छे|ネパールへ行く人|the person who goes to Nepal
हिजो आएको मान्छे|昨日来た人|the person who came yesterday
जो यहाँ बस्नुहुन्छ|ここに住んでいる方〈関係節〉|the person who lives here, a relative clause
उहाँ मेरो साथी हुनुहुन्छ|その方は私の友達です|he/she is my friend, respectful
छ भने|あるなら・いるなら|if there is; if someone is
भयो भने|起きたら・成立したら|if it happens/comes about
एको होला|〜したでしょう〈前に動詞語幹が付く型〉|probably has done, with a preceding verb base
न लगाउनु|〜させる〈前に動詞語幹が付く型〉|to make/have someone do, with a preceding verb base
नु पर्छ|〜する必要がある〈前に動詞語幹が付く型〉|need to do, with a preceding verb base
यहाँ किताब छ|ここに本があります|there is a book here
त्यहाँ किताब छ|そこ・あそこに本があります|there is a book there/over there
उहाँ किताब छ|あそこに本があります|there is a book over there
उहाँ शिक्षक हुनुहुन्छ|あの方は先生です|he/she is a teacher (respectful)
उ त्यहाँ|あそこ・ほらあそこ|over there, pointing to a distant place'''

GLOSSES = {}
for line in DATA.splitlines():
    ne,ja,en = line.split('|')
    assert ne not in GLOSSES, ne
    GLOSSES[ne]=(ja,en)

MULTIWORD = re.compile(r'[\u0900-\u097f]+(?:[ \u00a0]+[\u0900-\u097f]+)+')

def translate(text, lang):
    """Insert paired glosses outside bold spans; longest whole examples first."""
    index=0 if lang=='ja' else 1
    parts=re.split(r'(\*\*.*?\*\*)',text,flags=re.S)
    out=[]
    for part in parts:
        bold=part.startswith('**') and part.endswith('**')
        inner=part[2:-2] if bold else part
        # A whole quoted example must keep its quotation boundary intact.
        whole=inner.rstrip('?।')
        if whole in GLOSSES:
            gloss=GLOSSES[whole][index]
            out.append(part+('（'+gloss+'）' if lang=='ja' else ' ('+gloss+')'))
            continue
        def add(match):
            ne=match.group(0)
            assert ne in GLOSSES, f'Missing {lang} gloss: {ne}'
            gloss=GLOSSES[ne][index]
            source='**'+ne+'**' if bold else ne
            return source+('（'+gloss+'）' if lang=='ja' else ' ('+gloss+')')
        if bold:
            # Preserve bold for small morphology tokens between examples.
            cursor=0;segments=[]
            for m in MULTIWORD.finditer(inner):
                if m.start()>cursor:
                    gap=inner[cursor:m.start()]
                    segments.append('**'+gap+'**' if re.search(r'[\u0900-\u097f]',gap) else gap)
                segments.append(add(m));cursor=m.end()
            if cursor:
                if cursor<len(inner):
                    tail=inner[cursor:]
                    segments.append('**'+tail+'**' if re.search(r'[\u0900-\u097f]',tail) else tail)
                out.append(''.join(segments))
            else:out.append(part)
        else:out.append(MULTIWORD.sub(add,inner))
    return ''.join(out)

def support_blocks(blocks,lang):
    result=copy.deepcopy(blocks)
    exercise=False
    for b in result:
        text=b.get('text','')
        if b['type']=='h':
            if re.match(r'^(例題\d|(?:Example|Exercise)\s*\d)',text):exercise=True
            elif text in ['復習する教材','Review topics']:exercise=False
        if b.get('l1ExampleSupport') or b.get('beginnerIntroEnd') or b.get('lessonTitle'):continue
        if b['type'] in ['h','p','goal'] and not exercise:
            # The opening voiced example already has its own translation line.
            if b.get('presentation',{}).get('role') in ['example','reading','translation']:continue
            b['text']=translate(text,lang)
            if b['type'] in ['p','goal']:
                # Sentence breaks improve scanning without splitting an example
                # away from its gloss or changing the native renderer.
                b['text']=soft_breaks(b['text'],lang)
            b['l1ExampleSupport']=1
    return result

def soft_breaks(text,lang):
    depth=0;out=[]
    for i,ch in enumerate(text):
        if ch in '（(':depth+=1
        elif ch in '）)':depth=max(0,depth-1)
        out.append(ch)
        stop=ch=='。' if lang=='ja' else ch=='.' and i+2<len(text) and text[i+1]==' ' and text[i+2].isupper()
        if stop and depth==0 and i+1<len(text) and text[i+1]!='\n':out.append('\n')
    return ''.join(out)

def numbered_title(theme,title,lang):
    # Repeated packaging must not stack prefixes. Appendices keep both their
    # familiar A/B label and the 35/36 sequence used by the theme picker.
    title=re.sub(r'^(?:テーマ|Theme)\s*\d+\s*(?:[（(](?:付録|Appendix )?[AB][）)])?\s*[｜|:：—–-]\s*','',title).strip()
    prefix=('テーマ' if lang=='ja' else 'Theme ')+str(theme)
    if theme in [35,36]:prefix+=('（付録' if lang=='ja' else ' (Appendix ')+('A' if theme==35 else 'B')+('）' if lang=='ja' else ')')
    return prefix+'｜'+title
