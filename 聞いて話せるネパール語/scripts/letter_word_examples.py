"""Original bilingual word choices for the core letters and 30 conjuncts.

The word must contain the displayed spelling. A word illustrates the spelling
in context, not a promise that every conjunct keeps its isolated reading.
"""
WORDS = {
    'अ': [('अहिले','ahile','今','now'),('अगाडि','agāḍi','前に','in front')],
    'आ': [('आमा','āmā','母','mother'),('आज','āja','今日','today')],
    'इ': [('इच्छा','icchā','望み','wish'),('इतिहास','itihās','歴史','history')],
    'ई': [('ईमेल','īmel','メール','email'),('ईर्ष्या','īrṣyā','嫉妬','jealousy')],
    'उ': [('उत्तर','uttar','答え／北','answer / north'),('उज्यालो','ujyālo','明るい','bright')],
    'ऊ': [('ऊन','ūn','羊毛','wool'),('ऊर्जा','ūrjā','エネルギー','energy')],
    'ऋ': [('ऋतु','ritu','季節','season'),('ऋण','riṇ','借金','debt')],
    'ए': [('एक','ek','1','one'),('एघार','eghāra','11','eleven')],
    'ऐ': [('ऐना','ainā','鏡','mirror'),('ऐन','ain','法律','law')],
    'ओ': [('ओठ','oṭh','唇','lip'),('ओछ्यान','ochyān','寝床','bed')],
    'औ': [('औषधि','auṣadhi','薬','medicine'),('औँला','aũlā','指','finger')],
    'क': [('किताब','kitāb','本','book'),('कुकुर','kukur','犬','dog')],
    'ख': [('खाना','khānā','食事','food'),('खुट्टा','khuṭṭā','足','foot / leg')],
    'ग': [('गाउँ','gāũ','村','village'),('गाडी','gāḍī','車','vehicle')],
    'घ': [('घर','ghar','家','house'),('घडी','ghaḍī','時計','clock / watch')],
    'ङ': [('रङ्ग','raṅga','色','colour'),('अङ्ग','aṅga','体の部分','body part')],
    'च': [('चिया','ciyā','お茶','tea'),('चामल','cāmal','米','uncooked rice')],
    'छ': [('छाता','chātā','傘','umbrella'),('छोरी','chorī','娘','daughter')],
    'ज': [('जुत्ता','juttā','靴','shoes'),('जाडो','jāḍo','寒さ','cold weather')],
    'झ': [('झोला','jholā','かばん','bag'),('झ्याल','jhyāl','窓','window')],
    'ञ': [('सञ्चार','sañcār','通信・コミュニケーション','communication'),('मञ्जुरी','mañjurī','同意・許可','consent / permission')],
    'ट': [('टाउको','ṭāuko','頭','head'),('टमाटर','ṭamāṭar','トマト','tomato')],
    'ठ': [('ठूलो','ṭhūlo','大きい','big'),('ठेगाना','ṭhegānā','住所','address')],
    'ड': [('डाँडा','ḍā̃ḍā','丘','hill'),('डोरी','ḍorī','ひも','rope')],
    'ढ': [('ढोका','ḍhokā','ドア','door'),('ढिलो','ḍhilo','遅い','late')],
    'ण': [('गणित','gaṇit','数学','mathematics'),('गुण','guṇ','性質・長所','quality / merit')],
    'त': [('तपाईं','tapāī̃','あなた（丁寧）','you (respectful)'),('तारा','tārā','星','star')],
    'थ': [('थोरै','thorai','少し','a little'),('थाल','thāl','大皿','plate')],
    'द': [('दूध','dūdh','牛乳','milk'),('दिन','din','日','day')],
    'ध': [('धेरै','dherai','たくさん','a lot'),('धन्यवाद','dhanyavād','ありがとう','thank you')],
    'न': [('नाम','nām','名前','name'),('नयाँ','nayā̃','新しい','new')],
    'प': [('पानी','pānī','水','water'),('पसल','pasal','店','shop')],
    'फ': [('फल','phal','果物','fruit'),('फूल','phūl','花','flower')],
    'ब': [('बजार','bajār','市場','market'),('बिहान','bihān','朝','morning')],
    'भ': [('भात','bhāt','炊いたご飯','cooked rice'),('भोलि','bholi','明日','tomorrow')],
    'म': [('माछा','māchā','魚','fish'),('माया','māyā','愛情','affection')],
    'य': [('यहाँ','yahā̃','ここ','here'),('यात्रा','yātrā','旅','journey')],
    'र': [('राम्रो','rāmro','良い','good'),('रात','rāt','夜','night')],
    'ल': [('लुगा','lugā','服','clothes'),('लामो','lāmo','長い','long')],
    'व': [('वर्ष','varṣa','年','year'),('विद्यालय','vidyālay','学校','school')],
    'श': [('शहर','śahar','都市','city'),('शब्द','śabda','単語','word')],
    'ष': [('भाषा','bhāṣā','言語','language'),('वर्ष','varṣa','年','year')],
    'स': [('समय','samay','時間','time'),('साथी','sāthī','友達','friend')],
    'ह': [('हात','hāt','手','hand'),('हावा','hāvā','風・空気','wind / air')],
    'क्ष': [('कक्षा','kakṣā','授業・教室','class / classroom'),('परीक्षा','parīkṣā','試験','exam')],
    'त्र': [('पत्र','patra','手紙','letter'),('मित्र','mitra','友人','friend')],
    'ज्ञ': [('ज्ञान','gyān','知識','knowledge'),('विज्ञान','vigyān','科学','science')],
    'श्र': [('श्रम','śram','労働','labour'),('श्रमिक','śramik','労働者','worker')],
    'क्क': [('पक्का','pakkā','確かな','certain'),('चक्का','cakkā','車輪','wheel')],
    'क्त': [('रक्त','rakta','血','blood'),('व्यक्ति','vyakti','人','person')],
    'क्र': [('क्रम','kram','順番','order'),('चक्र','cakra','輪・周期','wheel / cycle')],
    'ग्र': [('ग्राम','grām','グラム','gram'),('ग्राहक','grāhak','客','customer')],
    'ङ्ग': [('रङ्ग','raṅga','色','colour'),('अङ्ग','aṅga','体の部分','body part')],
    'ञ्च': [('मञ्च','mañca','舞台','stage'),('पञ्च','pañca','五（複合語など）','five (in compounds)')],
    'ञ्ज': [('मञ्जुरी','mañjurī','同意・許可','consent / permission'),('गुञ्जन','guñjan','響き','resonance')],
    'ट्ट': [('पट्टी','paṭṭī','包帯','bandage'),('छुट्टी','chuṭṭī','休み','day off')],
    'ण्ड': [('अण्डा','aṇḍā','卵','egg'),('खण्ड','khaṇḍa','部分・区分','section')],
    'त्त': [('उत्तर','uttar','答え／北','answer / north'),('पत्ता','pattā','葉','leaf')],
    'द्ध': [('शुद्ध','śuddha','純粋な','pure'),('प्रसिद्ध','prasiddha','有名な','famous')],
    'द्य': [('विद्यालय','vidyālay','学校','school'),('विद्यार्थी','vidyārthī','学生','student')],
    'द्व': [('द्वार','dvār','門','gate'),('द्वीप','dvīp','島','island')],
    'न्त': [('अन्त','anta','終わり','end'),('शान्त','śānta','静かな','quiet')],
    'न्द': [('बन्द','banda','閉まった','closed'),('सुन्दर','sundar','美しい','beautiful')],
    'प्र': [('प्रश्न','praśna','質問','question'),('प्रयास','prayās','試み','attempt')],
    'म्ब': [('लम्बाइ','lambāi','長さ','length'),('सम्बन्ध','sambandha','関係','relationship')],
    'म्र': [('राम्रो','rāmro','良い','good'),('नम्र','namra','礼儀正しい','polite')],
    'ल्य': [('मूल्य','mūlya','価格・価値','price / value'),('कल्याण','kalyāṇ','幸福・福祉','well-being / welfare')],
    'व्य': [('व्यस्त','vyasta','忙しい','busy'),('व्यापार','vyāpār','商業・商売','business / trade')],
    'स्त': [('सस्तो','sasto','安い','inexpensive'),('पुस्तक','pustak','本','book')],
    'स्थ': [('स्थान','sthān','場所','place'),('अवस्था','avasthā','状態','condition')],
    'स्क': [('स्कुल','skul','学校','school'),('नमस्कार','namaskār','こんにちは（丁寧な挨拶）','hello (polite greeting)')],
    'र्ख': [('पर्खनु','parkhanu','待つ','to wait'),('मूर्ख','mūrkha','愚かな','foolish')],
    'र्त': [('शर्त','śarta','条件','condition'),('कर्ता','kartā','行為をする人・主語','doer / grammatical subject')],
    'र्ष': [('वर्ष','varṣa','年','year'),('हर्ष','harṣa','喜び','joy')],
}

def validate_words():
    assert len(WORDS)==74
    for letter,words in WORDS.items():
        assert len(words)==2 and len({w[0] for w in words})==2,letter
        for word,roman,ja,en in words:
            assert letter in word and roman and ja and en,(letter,word)

if __name__=='__main__':
    validate_words()
    print('PASS 74 letters/conjuncts, two distinct spelling-matched bilingual words each.')
