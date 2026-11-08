"""Build the reviewed beginner lexicon, independently of generated context glosses.

Source rows remain addressable for audit. Meanings below are our own learner glosses,
not copied dictionary definitions. Re-running never invents inflection mappings.
"""
import hashlib, json, re
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
DATA = APP / 'expo-app/data'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p, value):
    text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    old = p.read_bytes() if p.exists() else b''
    if b'\r\n' in old: text = text.replace('\n', '\r\n')
    raw = text.encode('utf-8')
    if old != raw: p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(raw)

# One reading per source row; scholarly consonant distinctions with ch/chh for च/छ.
# These are reading aids, not a phonetic transcription. Audio supplies pronunciation.
ROMAN = {
1: 'māthi|tala|agāḍi|pachhāḍi|dāyā̃|bāyā̃|bhitra|bāhira|chheu|bīch|pūrva|pashchim|dakṣiṇ|uttar|najik|ṭāḍhā|yahā̃|tyahā̃|sidhā|waripari',
2: 'ahile|āja|hijo|bholi|asti|parsi|bihāna|diũso|sā̃jha|rāta|madhyāhna|madhyarāt|samaya|mineṭ|ghaṇṭā|haptā|mahinā|varṣa|yo haptā|arko haptā',
3: 'dherai|thorai|sāhrai|nikai|dheraijaso|bilkulai|sadhaĩ|kahilekāhī̃|viralai|sāmānyatayā|ajhai|pahile nai|turuntai|pheri|nishchaya|sāyad|sā̃chchai|bistārai|chhiṭo|sãgai',
4: 'tāto|chiso|nyāno|kaḍā|naram|chillo|khasro|bhijeko|sukkhā|gahraũ|halkā|dukhne|chilāune|guliyo|piro|amilo|tito|nunilo|ganhāune|mīṭho bāsnā',
5: 'rāmro|narāmro|saphā|phohor|sundar|kurūp|nayā̃|purāno|sajilo|gāhro|suvidhājanak|asuvidhājanak|sahī|galat|surakṣit|khatarnāk|sāmānya|visheṣ|mahattvapūrṇa|āvashyak',
6: 'dayālu|sahṛdaya|kaḍā|imāndār|satya bolne|jiddī|ḍarpok|sāhasī|chalākh|mūrkha|ramāilo|nīras|phurtilo|shānta|hallā garne|lajālu|sakriya|alchhī|udār|kanjus',
7: 'jānu|āunu|hĩḍnu|dauḍanu|rokinu|basnu|ubhinu|sutnu|uṭhnu|chaḍhnu|orlanu|pasnu|niskinu|pharkinu|aghi baḍhnu|samātnu|rākhnu|phālnu|dhakelnu|tānnu',
8: 'khānu|piunu|banāunu|khānā pakāunu|dhunu|saphā garnu|lagāunu|phukālnu|kinnu|bechnu|tirnu|prayog garnu|kholnu|banda garnu|suru garnu|saknu|ārām garnu|kām garnu|basnu|khelnu',
9: 'bolnu|bhannu|sunnu|sodhnu|javāph dinu|paḍhnu|lekhnu|hernu|bheṭnu|sikāunu|siknu|bolāunu|sunāunu|vyākhyā garnu|phon garnu|abhivādan garnu|dhanyavād bhannu|māphī māgnu|hā̃snu|runu',
10: 'sochnu|lāgnu|thāhā pāunu|bujhnu|yād garnu|birsanu|vishvās garnu|shaṅkā garnu|āshā garnu|chintā garnu|chhakka parnu|risāunu|khusī hunu|dukhī hunu|ḍarāunu|man parāunu|ghṛṇā garnu|māyā garnu|sammān garnu|nirṇaya garnu',
11: 'bubā|āmā|dāju|didī|bhāi|bahinī|chhorā|chhorī|shrīmān|shrīmatī|hajurbubā|hajurāmā|nāti|nātinī|kākā|kākī|bhatij|bhatijī|parivār|āphanta|bachchā|navajāt|āmābubā|sāthī|najikko sāthī|chhimekī|vivāha|sasurā|sāsū|jwāĩ|buhārī|dājubhāi|didībahinī|vayaska|yuvā|vṛddha|puruṣ|strī|keṭā|keṭī',
12: 'ṭāuko|kapāl|anuhār|ā̃khā|nāk|mukh|kān|dā̃t|gardhan|kā̃dha|chhātī|ḍhāḍ|pākhurā|hāt|aũlā|khuṭṭā|peṭ|kammar|muṭu|sharīr|nidhār|ā̃khībhaũ|parelā|oṭh|jibro|ghā̃ṭī|chiũḍo|ghũḍā|tighrā|pĩḍulā|golīgā̃ṭho|nāḍī|kuhino|naṅ|chhālā|hāḍ|mā̃speshī|ragat|phokso|kalejo',
13: 'khusī|dukhī|ris|ḍar|chhakka|māyā|īrṣyā|lāj|ramāilo|dikka|tanāv|ḍhukka|utsāha|eklo|thakit|ṭhīk|chintā|man parne|man naparne|kṛtajñatā|ḍarlāgdo|ānandit|ruchi|ātmavishvās|sāhas|āshā|nirāshā|āshaṅkā|vishvās|sahānubhūti|pachhuto|nirāsh|santuṣṭa|asantuṣṭa|dayālu|sahṛdaya|kaḍā|muskān|ā̃su|prabhāvit',
14: 'rāto|nilo|pahẽlo|hariyo|kālo|seto|khairo|gulābī|baijanī|suntale|khairo|golo|varga|trikoṇ|ṭhūlo|sāno|lāmo|chhoṭo|pharākilo|sā̃ghuro|sunaulo|chā̃dīko raṅ|phikkā|gahiro|sīdhā|vakra|samtal|golākār|kunā bhaeko|bāklo|pātalo|gahraũ|halkā|chhiṭo|ḍhilo|baliyo|kamjor|nayā̃|purāno',
15: 'lugā|sarṭ|pāinṭ|skarṭ|juttā|mojā|ṭopī|chasmā|ghaḍī|jholā|pars|chhātā|māsk|panjā|skārf|koṭ|jyākeṭ|bhitrī lugā|gahanā|aũṭhī|sweṭar|ṭī sarṭ|kaṭṭu|ṭāi|peṭī|churā|mālā|karṇaphūl|chappal|buṭ|rumāl|jins|sutne lugā|vardī|sāḍī|daurā suruwāl|ṭā̃k|chen|khaltī|kapālko gahanā',
16: 'bhāt|dāl|pāuroṭī|chāumin|māsu|māchhā|aṇḍā|tarkārī|phalphūl|chāmal|tarkārī|sūp|momo|miṭhāī|pāstā|bargar|pijjā|salād|susī|khājā|selroṭī|dālbhāt|ālu|golbhẽḍā|kā̃kro|gājar|pāluṅg|bandā|kāulī|bhanṭā|rāmtoriyā|syāu|kerā|suntalā|ā̃p|aṅgur|bhuĩkaṭhar|tarbujā|nariwal|miṭho khānā',
17: 'pānī|chiyā|kaphī|dūdh|jus|biyar|raksī|chinī|nun|khursānī|tel|makhan|maha|dahī|sirkā|masalā|lasun|aduwā|pyāj|soyā sas|kāgatī|jirā|dhaniyā|besār|dālchinī|alaĩchī|lavaṅ|marich|achār|madirā|kolḍ ḍriṅk|hariyo chiyā|kālo chiyā|leman chiyā|lassī|smūdī|jaḍībuṭī chiyā|soḍā pānī|koko|chakleṭ',
18: 'kukur|birālo|gāī|ghoḍā|kukhurā|bheḍā|bākhrā|sũgur|charā|bāgh|hāttī|bā̃dar|sarpa|māchhā|rūkh|phūl|ghā̃s|pāt|bīu|jaṅgal|kharāyo|muso|lokharke|bhālu|mṛga|bwā̃so|phyāuro|chīl|sugā|hā̃s|kalagī|mujur|kāg|maurī|kamilā|putalī|hā̃gā|jarā|phal|jaṅgalī janāwar',
19: 'mausam|ghām|jun|tārā|bādal|pānī|hiũ|hāwā|chaṭyāṅ|indreṇī|ā̃dhī|kuhiro|garmī|jāḍo|nyāno|chiso|osilo|sukkhā|bhuĩchālo|prakṛti|pahāḍ|upatyakā|ḍā̃ḍā|samtal bhūmi|marubhūmi|jwālāmukhī|jharnā|pokharī|simsār|ṭāpu|samudra kinār|guphā|chaṭṭān|bāluwā|māṭo|hilo|ākāsh|pṛthvī|prākṛtik prakop|bāḍhī',
20: 'vasanta|grīṣma|sharad|hiũd|varṣā|bihāna|diũso|sā̃jha|rāta|madhyarāt|saberai|sūryāsta|sombār|maṅgalbār|budhabār|bihībār|shukrabār|shanibār|āitabār|saptāhānta|janawarī|phebruārī|mārch|april|me|jun|julāī|agast|sepṭembar|akṭobar|nobhembar|ḍisembar|ek tārikh|ek mineṭ aghi|ek ghaṇṭā pachhi|kehī din|kehī haptā|kehī varṣa|dinbhari|rātbhari',
21: 'ghar|koṭhā|ḍhokā|jhyāl|bhittā|bhuĩ|chhat|chhānā|bharyāṅ|bagaĩchā|khāṭ|ḍesk|kursī|ṭebal|sophā|darāj|phrij|ṭibhī|bhānsā|bāthrum|baiṭhak koṭhā|khānā khāne koṭhā|sutne koṭhā|shauchālaya|adhyayan koṭhā|garāj|bārdalī|ainā|battī|paṅkhā|esī|hiṭar|shāwar|kamoḍ|siṅk|bhā̃ḍākũḍā|bhā̃ḍo|kā̃ṭā|chamchā|kap',
22: 'sahar|gāũ|bāṭo|saḍak|pārk|vidyālaya|aspatāl|baiṅk|hulāk|praharī chaukī|mandir|girjāghar|masjid|bajār|pasal|resṭurenṭ|hoṭel|sṭesan|vimānasthal|pustakālaya|kalā saṅgrahālaya|saṅgrahālaya|sinemā hal|raṅgamañch|raṅgashālā|swimiṅ pūl|vyāyāmashālā|kāryālaya|kārkhānā|godām|peṭrol pamp|kaphī pasal|bekarī|tarkārī pasal|māsu pasal|auṣadhi pasal|suparmārkeṭ|sāno pasal|saḍak pasal|nagarpālikā',
23: 'bas|ṭyāksī|gāḍī|moṭarsāikal|sāikal|hawāījahāj|helikapṭar|ḍuṅgā|rel|riksā|ṭrak|rājmārg|pārkiṅ|ṭikaṭ|bhāḍā|chālak|yātrī|ṭrāphik battī|sāinborḍ|saḍak|ṭrāphik jām|gati|peṭrol|ḍijel|ṭāyar|sṭeriṅ|brek|harn|siṭ belṭ|sawārī chālak anumatipatra|durghaṭanā|marmat|bas sṭap|relmārg|prasthān|āgaman|ḍhilāi|rijarbhesan|yātrā kāryakram|paidalmārg',
24: 'ḍākṭar|nars|shikṣak|vidyārthī|karmachārī|vyāpārī|injiniyar|vakil|praharī|sipāhī|kisān|chālak|bhānse|sikarmī|silāi|kapāl kāṭne|pasale|baiṅkar|patrakār|dobhāṣe|mālik|vibhāg pramukh|vyavasthāpak|sachiv|risepsanisṭ|anuvādak|gāiḍ|kalākār|saṅgītkār|gāyak|abhinetā|lekhak|progrāmar|ḍijāinar|phoṭogrāphar|pāilaṭ|hawāī parichārikā|matsya pālak|goṭhālo|gṛhiṇī',
25: 'vidyālaya|vishvavidyālaya|shikṣak|vidyārthī|kakṣākoṭhā|kitāb|kāpī|sisākalam|kalam|rabar|kālopāṭī|ḍesk|parīkṣā|gṛhakārya|pāṭh|snātak|bhāṣā|vyākaraṇ|shabda|prashna|pāṭhyapustak|shabdakosh|prativedan|prastuti|vyākhyān|satra|shaikṣik varṣa|bharnā|natijā|gaṇit|vijñān|itihās|bhūgol|bhautik vijñān|rasāyan shāstra|jīv vijñān|sāhitya|darshan|arthashāstra|uttar',
26: 'paisā|noṭ|sikkā|rupaiyā̃|ḍalar|mūlya|dām|mahãgo|sasto|talab|bhattā|baiṅk|khātā|bachat|ṛṇ|byāj|kar|bajeṭ|rasid|phirtā|lagānī|nāphā|ghāṭā|sheyar|ṛṇ|bhuktānī|bechnu|kinnu|chhuṭ|sel|niḥshulka|dān|puraskār|vyāpār|kampanī|rojgār|berojgār|dhanī|garib|kreḍiṭ kārḍ',
27: 'shauk|manorañjan|paḍhne kām|chalachitra|ṭibhī kāryakram|saṅgīt|gīt|nāch|khel|pajal|yātrā|phoṭogrāphī|chitrakalā|chitra banāunu|māchhā mārne kām|paidalyātrā|parvatārohaṇ|kyāmp|khānā pakāune shauk|bunāī|hastakalā|vādyayantra|gitār|piyāno|ḍram|bā̃surī|karāoke|kamik|enime|upanyās|kavitā|yog|dhyān|bagaĩchā garne|saṅgraha|jammā garnu|majā linu|ārām|pārṭī|sāthīsãga khelnu',
28: 'chāḍ|dashaĩ|tihār|vivāha|janmadin|prārthanā|mandir|bhagavān|buddha|āsthā|hindū dharma|bauddha dharma|islām|īsāī dharma|sãskṛti|paramparā|sãskār|prasād|tīrthayātrā|nayā̃ varṣa|holī|smaraṇ|antyeṣṭi|dāhasãskār|jyotiṣ|rāshiphal|paurāṇik kathā|dharmagrantha|sādhu|tīrthayātrī|kuladevatā|devī|devatā|rākṣas|swargadūt|swarga|narak|ātmā|punarjanma|karma',
29: 'yātrā|paryaṭan|hoṭel|koṭhā|ṭikaṭ|rāhadānī|bhisā|vimānasthal|hawāījahāj|suṭkes|naksā|gāiḍ|kyāmerā|phoṭo|koselī|himāl|parvat|tāl|nadī|samudra|simānā|bhansār|sāṭāsāṭ|bhāḍāko gāḍī|paryaṭak|paryaṭakīya sthal|prasiddha sthal|vishva sampadā|rāṣṭriya nikuñj|ṭrekiṅ|ryāphṭiṅ|mandir darshan|homesṭe|gesṭ hāus|risorṭ|bhāḍā|bukiṅ|radda|chek in',
30: 'āpatkāl|embulens|aspatāl|ḍākṭar|nars|birāmī|rog|dukhāi|jvaro|rughā|khokī|ṭāuko dukhāi|choṭ|auṣadhi|suī|ragat|āgo|praharī|sahāyatā|khatarā|elarjī|khādya viṣāktatā|inphluenjā|uchcha raktachāp|madhumeha|kyānsar|muṭuko rog|apresan|paṭṭī|plāsṭar|jvaro nāpnu|eksare|khop|swāsthya|swāsthya parīkṣaṇ|bharnā|ḍischārj|ḍaḍhāi|haḍḍī bhā̃chinu|hĩsā',
}
# Correct inaccurate glosses, over-narrow contextual meanings, and source typos.
# Each row: source spelling | dictionary spelling | Japanese | English | optional POS.
FIXES = '''
छेउ||そば・端・横|side; edge; beside|noun
गहिरो||深い・濃い（色）|deep; dark (colour)|adjective
हात||手・腕|hand; arm|noun
छक्क||驚いた|surprised|adjective
वृद्ध||高齢の人|elderly person|noun
पर्स||財布・小銭入れ|wallet; purse|noun
माला||首飾り・花輪|necklace; garland|noun
खेल||遊び・ゲーム・スポーツ|game; sport|noun
ध्यान||注意・集中／瞑想|attention; concentration; meditation|noun
विवाह||結婚・結婚式|marriage; wedding|noun
मध्यान्ह|मध्याह्न|正午|noon|noun
घन्टा||時間（長さの単位）|hour (duration)|noun
धेरै||たくさんの・たくさん・とても|many; much; very|modifier
धेरैजसो||たいてい・大部分は|mostly; usually|adverb
बिल्कुलै||まったく・完全に|absolutely; completely|adverb
विरलै||めったに〜ない・まれに|rarely|adverb
सामान्यतया||通常は・一般に|usually; generally|adverb
निश्चय||確信・決心|certainty; decision|noun
मीठो बास्ना|बासना|香り・芳香|fragrance; aroma|noun
इमान्दार||正直な・誠実な|honest; sincere|adjective
चलाक|चलाख|賢い・抜け目のない|clever; shrewd|adjective
निरस|नीरस|退屈な・味気ない|dull; uninteresting|adjective
फुर्तिलो||身軽な・きびきびした|agile; energetic|adjective
सत्य बोल्ने||本当のことを話す・正直な|truth-telling; truthful|phrase
हल्ला गर्ने||騒ぐ・騒がしい|making noise; noisy|phrase
गलत||誤った・間違っている|wrong; incorrect|adjective
थाहा पाउनु||知るようになる・分かる|find out; come to know|verb
ससुर|ससुरा|義父|father-in-law|noun
भतिज||甥（兄弟の息子）|nephew (a brother's son)|noun
भतिजी||姪（兄弟の娘）|niece (a brother's daughter)|noun
काका||おじ（父の弟）|uncle (father's younger brother)|noun
नवजात||新生児・生まれたばかりの|newborn|modifier
पाखुरा||腕・上腕|arm; upper arm|noun
खुट्टा||脚・足|leg; foot|noun
परेला||まつげ|eyelash; eyelashes|noun
नाडी||手首・脈|wrist; pulse|noun
गोली गाँठो|गोलीगाँठो|足首|ankle|noun
लाज||恥ずかしさ・恥|shame; embarrassment|noun
दिक्क||うんざりした・退屈した|fed up; bored|adjective
तनाव||ストレス・緊張|stress; tension|noun
उत्साह||意欲・熱意|enthusiasm|noun
एक्लो||一人の・孤独な|alone; lonely|adjective
ठीक||よい・大丈夫な・正しい|fine; all right; correct|adjective
मन पर्ने||気に入っている・好きな|liked; favourite|phrase
मन नपर्ने||気に入らない・好きでない|disliked; not liked|phrase
निराशा||失望・絶望|disappointment; despair|noun
निराश||失望した|disappointed|adjective
सन्तुष्ट||満足した|satisfied|adjective
असन्तुष्ट||不満な|dissatisfied|adjective
प्रभावित||影響を受けた・感銘を受けた|affected; impressed|adjective
खैरो||茶色の|brown|adjective
वर्ग||正方形・階級・分類|square; class; category|noun
सीधा||まっすぐな・直接の|straight; direct|adjective
वक्र||曲がった|curved|adjective
कट्टु||半ズボン・パンツ（下着）|shorts; underpants|noun
चेन||鎖・チェーン／衣服のファスナー|chain; zip (on clothing)|noun
चाउमिन||チャウミン（炒め麺）|chow mein; stir-fried noodles|noun
दाल||豆・豆のスープ|lentils; lentil soup|noun
मम|मोमो|モモ（蒸し餃子など）|momo; dumpling|noun
मिठो खाना|मिठो खाना|おいしい食べ物・料理|delicious food|phrase
मदिरा||酒・酒類|alcoholic drink; liquor|noun
कालो चिया||ミルクを入れない紅茶|black tea (without milk)|noun
फ्याउरो||キツネ|fox|noun
चील||トビなどの猛禽類|kite; bird of prey|noun
कलगी||とさか・冠羽|crest (on a bird's head)|noun
घाम||日差し・日光|sunshine; sunlight|noun
चट्याङ||雷・稲妻・落雷|lightning; thunderbolt|noun
गर्मी||暑さ・暑い時季|heat; hot season|noun
जाडो||寒さ・寒い時季|cold; cold season|noun
ओसिलो||湿った|damp|adjective
सिमसार||湿地|wetland|noun
वर्षा||雨・降雨／雨季|rain; rainfall; rainy season|noun
सबेरै||朝早く|early in the morning|adverb
छत||平らな屋根・屋上|flat roof; rooftop|noun
खाना कोठा|खाना खाने कोठा|食事をする部屋|dining room|noun
भाँडाकुँडा||調理器具・食器|cooking utensils; dishes|noun
भाँडो||容器・鍋|vessel; pot|noun
सानो पसल||小さな店|small shop|noun
नगरपालिका||市・自治体／市役所|municipality; municipal office|noun
राजमार्ग||幹線道路・ハイウェイ|highway; main road|noun
कर्मचारी||従業員・職員|employee; staff member|noun
सिलाई||裁縫・縫製|sewing; stitching|noun
कपाल काट्ने||髪を切る（人）|cutting hair; a person who cuts hair|phrase
पसले||店主・店を営む人|shopkeeper|noun
मालिक||所有者・雇い主|owner; employer|noun
मत्स्य पालक||魚の養殖業者|fish farmer|noun
गोठालो||家畜の世話をする人|herder|noun
स्नातक||大学卒業者・学士|graduate; bachelor's degree|noun
सत्र||期間・会期・学期|session; academic term|noun
शैक्षिक वर्ष||学年度|academic year|noun
नतिजा||結果・成績|result|noun
अर्थशास्त्र||経済学|economics|noun
मूल्य||価格・価値|price; value|noun
फिर्ता||返却・返金・返すこと|return; refund|noun
भुक्तानी||支払い|payment|noun
पुरस्कार||賞・報酬|prize; reward|noun
बेरोजगार||失業中の|unemployed|adjective
धनी||裕福な|rich|adjective
गरिब||貧しい|poor|adjective
स्मरण||記憶・思い出すこと|memory; remembrance|noun
साधु||修行者|ascetic; holy person|noun
कुलदेवता||一族の守護神|family or clan deity|noun
देवता||神・神格|deity; god|noun
हिमाल||雪を頂く高山・ヒマラヤ山脈|snow-covered mountain; Himalayas|noun
भन्सार||税関・関税|customs; customs duty|noun
साटासाट||交換・物々交換|exchange; barter|noun
भाडा||運賃・賃料・使用料|fare; rent; hire charge|noun
बिरामी||病気の・患者|ill; sick person; patient|modifier
सुई||針・注射|needle; injection|noun
आगो||火|fire|noun
सहायता||助け・援助|help; assistance|noun
प्लास्टर||石こう・ギプス／ばんそうこう|plaster; cast; adhesive plaster|noun
ज्वरो नाप्ने|ज्वरो नाप्नु|体温を測る|take someone's temperature|verb
डढाइ|डढ्नु|焼ける・焦げる|burn; be scorched|verb
हड्डी भाँचिनु||骨が折れる|break a bone; a bone breaks|verb
आराम||休息|rest|noun
'''

# POS exceptions use one-based source row numbers. Multiword noun phrases remain nouns.
POS = {1:'location',2:'noun',3:'adverb',4:'adjective',5:'adjective',6:'adjective',7:'verb',8:'verb',9:'verb',10:'verb',13:'noun',14:'adjective'}
EXCEPTIONS = {
2:{'adverb':list(range(1,11))+[19,20]},
13:{'adjective':[1,2,5,9,10,12,14,15,16,21,22,32,33,34,35,36,37,40],'phrase':[18,19]},
14:{'noun':[13,14],'phrase':[22,30]},
20:{'adverb':[11,34,35,39,40],'phrase':[33,36,37,38]},
26:{'adjective':[8,9,31,37,38,39],'verb':[27,28]},
27:{'verb':[14,36,37,40],'phrase':[3,15,19,34]},
29:{'adjective':[39]},
}

NOTES = {
'घन्टा': ('時間の長さを数えます。「3時」のような時刻には बजे を使います。', 'Counts hours of duration. Use बजे for clock times such as three o’clock.'),
'बिल्कुलै': ('肯定なら「まったく・完全に」。否定と組み合わせると「全然〜ない」です。', 'Means completely or absolutely; with a negative, not at all.'),
'निश्चय': ('「確信」という名詞のほか、「確かに」という副詞にもなります。निश्चय नै もよく使う形です。', 'Used as a noun for certainty and an adverb for certainly. निश्चय नै is also common.'),
'थाहा पाउनु': ('情報を得て「分かる・知るようになる」。すでに知っている状態は थाहा हुनु：मलाई थाहा छ。', 'Finding out is a change. For already knowing, use थाहा हुनु: मलाई थाहा छ।'),
'मन पराउनु': ('「主語＋好きなもの＋मन पराउनु」。मलाई … मन पर्छ の形も使います。', 'Used with a subject and something they like. मलाई … मन पर्छ is another common pattern.'),
'भतिज': ('兄弟の息子です。姉妹の息子は भान्जा。いとことは区別します。', 'A brother’s son. A sister’s son is भान्जा; this is not a cousin.'),
'भतिजी': ('兄弟の娘です。姉妹の娘は भान्जी。', 'A brother’s daughter. A sister’s daughter is भान्जी.'),
'खैरो': ('基本は茶色。灰色は खरानी रङ्ग などで表します。', 'Normally brown. Grey can be expressed as खरानी रङ्ग.'),
'पानी': ('水を表しますが、पानी पर्छ のような天気の文では雨の意味になります。', 'Means water; in weather expressions such as पानी पर्छ it refers to rain.'),
'जुन': ('月を表す名詞と、英語由来の6月は同じ綴りです。関係表現の जुन（〜するところの）もあります。', 'The moon and the borrowed month name June share this spelling. जुन also has a relative use: which/that.'),
'सिलाई': ('人の職業名ではなく「縫うこと」。仕立て屋は दर्जी です。', 'The activity of sewing, not the person. A tailor is दर्जी.'),
'सहायता': ('名詞「援助」です。「助けてください」は सहयोग गर्नुहोस् など、依頼の文にします。', 'A noun meaning assistance. Make a request, for example सहयोग गर्नुहोस्, to ask for help.'),
'फिर्ता': ('「返す・戻す」こと。お釣りだけに限定しません。', 'Returning something or a refund; not limited to change from a purchase.'),
'बगैंचा गर्ने': ('「庭仕事をする」という表現。名詞の「園芸」は बागवानी。', 'A phrase for working in a garden. The noun gardening is बागवानी.'),
}

# Curated inflection families: no suffix guessing from the noisy context dictionaries.
FORMS = {
'जानु':'जान्छु जान्छौं जान्छौँ जान्छ जान्छन् जानुहुन्छ गएँ गयो गए जान्छिन् जानुहोस्',
'आउनु':'आउँछु आउँछौं आउँछौँ आउँछ आउँछन् आउनुहुन्छ आएँ आयो आए आउनुहोस्',
'खानु':'खान्छु खान्छौं खान्छौँ खान्छ खान्छन् खानुहुन्छ खाएँ खायो खाए खानुहोस्',
'पिउनु':'पिउँछु पिउँछ पिउनुहुन्छ पिएँ पियो पिउनुहोस्',
'बस्नु':'बस्छु बस्छौं बस्छौँ बस्छ बस्छन् बस्नुहुन्छ बसेँ बस्यो बस्नुहोस्',
'पढ्नु':'पढ्छु पढ्छौं पढ्छौँ पढ्छ पढ्छन् पढ्नुहुन्छ पढेँ पढ्यो पढ्नुहोस्',
'लेख्नु':'लेख्छु लेख्छ लेख्नुहुन्छ लेखेँ लेख्यो लेख्नुहोस्',
'सक्नु':'सक्छु सक्छौं सक्छौँ सक्छ सक्छन् सक्नुहुन्छ सकेँ सक्यो सक्छिन्',
'लाग्नु':'लाग्छ लाग्यो लाग्छन् लागे लाग्नुहुन्छ',
'भन्नु':'भन्छु भन्छ भन्नुहुन्छ भनेँ भन्यो भन्नुहोस्',
'हेर्नु':'हेर्छु हेर्छ हेर्नुहुन्छ हेरेँ हेर्‍यो हेर्नुहोस्',
'सुन्नु':'सुन्छु सुन्छ सुन्नुहुन्छ सुनेँ सुन्यो सुन्नुहोस्',
'किन्नु':'किन्छु किन्छ किन्नुहुन्छ किनेँ किन्यो किन्नुहोस्',
'गर्नु':'गर्छु गर्छौं गर्छौँ गर्छ गर्छन् गर्नुहुन्छ गरेँ गर्‍यो गरे गर्छिन् गर्नुहोस्',
'हुनु':'हुँ हुँदैन हुँदैनन् हुन्छ हुन्छु हुन्छौं हुन्छौँ हुन्छन् हुनुहुन्छ हो होइन हुन् हुनुहुन्न छु छौं छौँ छ छन् छैन छैनन्',
'पर्नु':'पर्छ पर्‍यो पर्यो परे पर्छन्',
'मिल्नु':'मिल्छ मिल्यो मिल्छन् मिले',
'दिनु':'दिन्छु दिन्छ दिनुहुन्छ दिएँ दियो दिनुहोस्',
'लिनु':'लिन्छु लिन्छ लिनुहुन्छ लिएँ लियो लिनुहोस्',
'राम्रो':'राम्री राम्रा', 'नराम्रो':'नराम्री नराम्रा','ठूलो':'ठूली ठूला','सानो':'सानी साना','नयाँ':'नयाँ',
'पुरानो':'पुरानी पुराना','रातो':'राती राता','कालो':'काली काला','सेतो':'सेती सेता',
}

EXTRA = '''
हुनु|hunu|verb|〜である・いる・ある／〜になる|be; exist; become
गर्नु|garnu|verb|する・行う|do; perform
पर्नु|parnu|verb|落ちる・降る／必要になる・費用がかかる|fall; be necessary; cost
मिल्नु|milnu|verb|合う・一致する／可能である・許される|match; fit; be possible; be permitted
दिनु|dinu|verb|与える・渡す|give
लिनु|linu|verb|取る・受け取る|take; receive
थाहा हुनु|thāhā hunu|phrase|知っている|know; be aware
म|ma|pronoun|私|I; me
हामी|hāmī|pronoun|私たち|we; us
तपाईं|tapāī̃|pronoun|あなた（敬意）|you (respectful)
तपाईंहरू|tapāī̃harū|pronoun|あなたたち（敬意）|you, plural (respectful)
उहाँ|uhā̃|pronoun|あの方・彼・彼女（敬意）|he; she; that person (respectful)
उहाँहरू|uhā̃harū|pronoun|あの方々・彼ら・彼女ら（敬意）|they (respectful)
ऊ|ū|pronoun|彼・彼女（親しい間柄）|he; she (familiar)
उनी|unī|pronoun|彼・彼女（中程度の敬意）|he; she (medium respect)
तिमी|timī|pronoun|君・あなた（親しい間柄）|you (familiar)
मलाई|malāī|pronoun|私に・私を|to me; me
सँग|sãga|postposition|〜と・〜と一緒に|with
बाट|bāṭa|postposition|〜から（出発点・経路・手段）|from; through; by means of
देखि|dekhi|postposition|〜から（起点・継続の始まり）|from; since
सम्म|samma|postposition|〜まで|to; until; as far as
पछि|pachhi|postposition|〜の後に|after; later
अघि|aghi|postposition|〜の前に|before; in front of
लागि|lāgi|postposition|〜のために|for
मा|mā|postposition|〜に・〜で（場所など）|in; at; on
लाई|lāī|postposition|〜に・〜を（相手や対象）|to; object marker
ले|le|postposition|動作主・手段を示す助詞|agent or instrument marker
को|ko|postposition|〜の|of; possessive marker
के|ke|pronoun|何|what
को|ko|pronoun|誰|who
कहाँ|kahā̃|adverb|どこ|where
कहिले|kahile|adverb|いつ|when
किन|kina|adverb|なぜ|why
कसरी|kasarī|adverb|どうやって|how
कति|kati|modifier|いくつ・どのくらい|how many; how much
कस्तो|kasto|modifier|どんな|what kind of; how
दर्जी|darjī|noun|仕立て屋|tailor
थर्मोमिटर|tharmomiṭar|noun|体温計|thermometer
खरानी रङ्ग|kharānī raṅga|noun|灰色|grey
भान्जा|bhānjā|noun|甥（姉妹の息子）|nephew (a sister's son)
भान्जी|bhānjī|noun|姪（姉妹の娘）|niece (a sister's daughter)
'''

DETAILS = {
'हुनु': {'forms':'हो हुँ हुन् छु छौं छौँ छ छन् हुन्छ हुन्छन् हुनुहुन्छ होइन छैन', 'themes':[1,2,3,7], 'note':('हो 系は身元・種類、छ 系は存在・状態、हुन्छ 系は習慣・一般的な成り立ちなど。主語の人称と敬意によって形が変わります。','हो forms identify; छ forms describe existence/state; हुन्छ forms express habitual/general situations. Forms also depend on person and respect.')},
'पर्नु': {'themes':[21,22], 'note':('पानी पर्छ＝雨が降る。जानुपर्छ＝行かなければならない。कति पर्छ?＝いくらかかりますか。文型ごとに意味を確認します。','पानी पर्छ: it rains. जानुपर्छ: must go. कति पर्छ?: how much does it cost? The construction determines the meaning.')},
'लाग्नु': {'note':('मलाई जाडो लाग्छ＝私は寒く感じます。時間の長さ＋लाग्छ なら「〜かかる」。मलाई … लाग्छ には「〜と思う・感じる」の用法もあります。','मलाई जाडो लाग्छ means I feel cold. A duration + लाग्छ means it takes that long. मलाई … लाग्छ also expresses impressions or opinions.')},
'सक्नु': {'note':('動詞の -न 形＋सक्नु は「〜できる」。काम सक्नु のように目的語を伴うと「仕事を終える」の意味にもなります。','Verb in -न + सक्नु expresses ability. With an object, as in काम सक्नु, it can mean finish the work.')},
'मिल्नु': {'note':('口語の यहाँ बस्न मिल्छ? は「ここに座ってもいいですか」。-न मिल्छ で可能・許可をたずねる形です。','The colloquial question यहाँ बस्न मिल्छ? means May I sit here? A verb in -न + मिल्छ can express possibility or permission.')},
}

# Independent short examples, deliberately only where the whole sentence was checked.
EXAMPLES = '''
हुनु|यो किताब हो।|これは本です。|This is a book.
गर्नु|म काम गर्छु।|私は仕事をします。|I work.
पर्नु|आज पानी पर्छ।|今日は雨が降ります。|It will rain today.
लाग्नु|मलाई जाडो लाग्छ।|私は寒く感じます。|I feel cold.
सक्नु|म नेपाली पढ्न सक्छु।|私はネパール語を読めます。|I can read Nepali.
मिल्नु|यहाँ बस्न मिल्छ?|ここに座ってもいいですか。|May I sit here?
थाहा पाउनु|मैले आज थाहा पाएँ।|私は今日知りました。|I found out today.
थाहा हुनु|मलाई थाहा छ।|私は知っています。|I know.
जानु|म घर जान्छु।|私は家に行きます。|I go home.
आउनु|उहाँ भोलि आउनुहुन्छ।|あの方は明日来ます。|That person will come tomorrow.
बस्नु|म नेपालमा बस्छु।|私はネパールに住んでいます。|I live in Nepal.
खानु|हामी भात खान्छौँ।|私たちはご飯を食べます。|We eat rice.
पिउनु|म पानी पिउँछु।|私は水を飲みます。|I drink water.
पढ्नु|म किताब पढ्छु।|私は本を読みます。|I read a book.
लेख्नु|म चिठी लेख्छु।|私は手紙を書きます。|I write a letter.
दिनु|मलाई पानी दिनुहोस्।|私に水をください。|Please give me some water.
लिनु|यो लिनुहोस्।|これをどうぞ。|Please take this.
मन पराउनु|म चिया मन पराउँछु।|私はお茶が好きです。|I like tea.
गर्मी|आज गर्मी छ।|今日は暑いです。|It is hot today.
जाडो|आज जाडो छ।|今日は寒いです。|It is cold today.
पानी|म पानी पिउँछु।|私は水を飲みます。|I drink water.
घर|यो मेरो घर हो।|これは私の家です。|This is my house.
राम्रो|यो किताब राम्रो छ।|この本はよいです。|This book is good.
भाडा|भाडा कति हो?|運賃はいくらですか。|How much is the fare?
सँग|म साथीसँग जान्छु।|私は友達と行きます。|I go with a friend.
देखि|म बिहानदेखि यहाँ छु।|私は朝からここにいます。|I have been here since morning.
बाट|म जापानबाट आएको हुँ।|私は日本から来ました。|I come from Japan.
घन्टा|दुई घन्टा लाग्छ।|2時間かかります。|It takes two hours.
'''

def build():
    core = read(DATA/'ota-baseline/core.json')
    overlays = {lang:read(DATA/f'overlays/{lang}.json') for lang in ('ja','en')}
    fixes = {}
    for line in FIXES.strip().splitlines():
        old,new,ja,en,pos = line.split('|'); fixes[old] = (new or old,ja,en,pos)
    # Missing slots caught before any writes.
    ROMAN[14] = ROMAN[14].replace('gahiro|sīdhā','gahiro|pāradarshī|sīdhā')
    ROMAN[29] = ROMAN[29].replace('ṭrekiṅ|ryāphṭiṅ','ṭrekiṅ|kyāmp|ryāphṭiṅ')
    by_word = {}
    def add(ne,rom,ja,en,pos,source=None,alias=None):
        if ne not in by_word:
            by_word[ne] = {'id':'ne-'+hashlib.sha256(ne.encode()).hexdigest()[:12], 'ne':ne, 'roman':rom, 'senses':[], 'forms':[], 'sources':[], 'examples':[], 'themes':[]}
        entry=by_word[ne]
        # Same sense in two categories should not produce redundant definitions.
        if not any(s['ja']==ja or s['en']==en for s in entry['senses']): entry['senses'].append({'ja':ja,'en':en,'pos':pos})
        if source: entry['sources'].append(source)
        if alias and alias!=ne and alias not in entry['forms']: entry['forms'].append(alias)
        return entry
    for category,words in core['wordsNe'].items():
        cat=int(category); romans=ROMAN[cat].split('|'); assert len(romans)==len(words),(cat,len(romans),len(words))
        for i,(ne,rom) in enumerate(zip(words,romans)):
            pos=POS.get(cat,'noun')
            for p,indices in EXCEPTIONS.get(cat,{}).items():
                if i+1 in indices: pos=p
            ja,en=overlays['ja']['wordsL1'][category][i],overlays['en']['wordsL1'][category][i]
            original=ne
            if ne in fixes: ne,ja,en,pos=fixes[ne]
            if ne=='बासना':rom='bāsnā'
            if ne=='डढ्नु':rom='ḍaḍhnu'
            add(ne,rom,ja,en,pos,f'{cat}:{i+1}',original)
    for line in EXTRA.strip().splitlines():
        ne,rom,pos,ja,en=line.split('|'); add(ne,rom,ja,en,pos)
    for ne,forms in FORMS.items():
        if ne in by_word: by_word[ne]['forms']+= [f for f in forms.split() if f!=ne]
    # Common orthographic variants; not speculative lemmatization.
    for canonical,variants in {'सधैं':['सधैँ'],'कहिलेकाहीं':['कहिलेकाहीँ'],'गह्रौं':['गह्रौँ'],'औंला':['औँला'],'तपाईं':['तपाईँ'],'तपाईंहरू':['तपाईँहरू'],'सुख्खा':['सुक्खा'],'जानु':['जान'],'बासना':['बास्ना']}.items():
        by_word[canonical]['forms']+=variants
    for ne,notes in NOTES.items():
        if ne in by_word: by_word[ne]['note']={'ja':notes[0],'en':notes[1]}
    for ne,detail in DETAILS.items():
        if 'note' in detail: by_word[ne]['note']={'ja':detail['note'][0],'en':detail['note'][1]}
    for line in EXAMPLES.strip().splitlines():
        ne,sentence,ja,en=line.split('|'); by_word[ne]['examples'].append({'ne':sentence,'ja':ja,'en':en})
    # Direct mentions in real lesson prose provide relevant, OTA-stable theme links.
    guides=overlays['ja']['grammarGuide']
    for ne,entry in by_word.items():
        entry['forms']=sorted(set(entry['forms'])-{ne})
        for theme,blocks in guides.items():
            text=json.dumps(blocks,ensure_ascii=False)
            if re.search(r'(?<![\u0900-\u097f])'+re.escape(ne)+r'(?![\u0900-\u097f])',text): entry['themes'].append(int(theme))
        entry['themes']=entry['themes'][:4]
    # Merge synonymous duplicate category glosses for known polysemous headwords.
    merged = {
      'बस्नु':[('座る','sit'),('住む・滞在する','live; stay')],
      'सक्नु':[('〜できる（動詞の -न 形と使う）','can; be able to (after a verb in -न)'),('終える','finish')],
      'कडा':[('硬い','hard'),('厳しい・厳格な','strict; harsh')],
      'तरकारी':[('野菜','vegetables'),('野菜のおかず・カレー','vegetable dish; curry')],
      'पानी':[('水','water'),('雨（天気の表現で）','rain (in weather expressions)')],
      'उत्तर':[('北','north'),('答え・返事','answer; reply')],
      'जुन':[('月（天体）','moon'),('6月（西暦）','June')],
      'ऋण':[('借金・貸付金','debt; loan')],
      'निश्चय':[('確信・決心','certainty; decision'),('確かに・きっと','certainly; definitely')],
      'भर्ना':[('入学・入会などの登録','enrolment; admission'),('入院','hospital admission')],
      'लाग्नु':[('感じる・〜と思える','feel; seem'),('時間などがかかる','take (time); cost'),('付く・当たる','attach; strike')],
    }
    for ne,senses in merged.items():
        pos=by_word[ne]['senses'][0]['pos']; by_word[ne]['senses']=[{'ja':ja,'en':en,'pos':pos} for ja,en in senses]
    by_word['निश्चय']['senses'][1]['pos']='adverb'
    for sense in by_word['उत्तर']['senses']: sense['pos']='noun'
    manifest=read(APP/'文法教材/learning_audio_manifest.json')
    for entry in by_word.values():
        if entry['ne'] in manifest: entry['audio']=manifest[entry['ne']]
    result={'schema':1,'revision':1,'sourceRowCount':1000,'entries':list(by_word.values())}
    write(APP/'文法教材/nepali_dictionary.json',result)
    for lang,overlay in overlays.items():
        overlay['nepaliDictionary']=result; write(DATA/f'overlays/{lang}.json',overlay)
    print(json.dumps({'sourceRows':1000,'entries':len(by_word),'forms':sum(len(e['forms'])for e in by_word.values()),'examples':sum(len(e['examples'])for e in by_word.values()),'existingAudio':sum('audio'in e for e in by_word.values())}))

if __name__=='__main__': build()
