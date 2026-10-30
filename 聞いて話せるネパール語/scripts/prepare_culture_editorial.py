"""Import approved Web illustrations and concise bilingual app readings.

Reads the sibling Web source without modifying it. No paid generation.
Run explicitly when updating the Web-derived editorial snapshot.
"""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT.parent / 'app_website'
APP = ROOT / '聞いて話せるネパール語'

# Two short paragraphs: a scene, then a concrete cultural discovery.
SUMMARIES = {
'valley-morning': (
 '朝の光がれんがの壁を照らす路地。木彫の窓の下を、野菜を抱えた人が通ります。**カトマンズ・パタン・バクタプル**は、マッラ朝の時代に王都として発展した三つの街です。\n\nカトマンズは商業と古い街路、パタンは金属工芸や木彫、バクタプルはれんがの街並みや陶器づくり。同じ盆地でも個性はさまざま。いつか歩くなら、広場の先に続く暮らしにも目を向けてみたいですね。',
 'Morning light falls on a brick lane as someone carries vegetables beneath carved windows. **Kathmandu, Patan and Bhaktapur** flourished as royal cities under Malla rulers.\n\nKathmandu brings commerce alongside old streets; Patan invites a closer look at metalwork and woodcarving; Bhaktapur is associated with brick streets and pottery. Picture walking beyond a square into a neighbourhood where people still live and work.'),
'tea-visit': (
 '小さなグラスから、甘いお茶の湯気が上がります。**チヤ**はネパール語でお茶のこと。牛乳と砂糖を加えたり、ショウガやカルダモンで香りを付けたり。甘さも濃さも、作る人ごとに違います。\n\n茶店では近所の話や仕事の相談が始まることも。一杯を飲み終える時間が、挨拶の続きをつくってくれます。牛乳なしのお茶もあるので、自分の好きな一杯を探す楽しみもあります。',
 'Steam rises from a small glass. **Chiya** means tea in Nepali. Milk and sugar are familiar additions; ginger or cardamom may lend their aroma. Strength and sweetness vary, and tea without milk is available too.\n\nA tea shop can make room for neighbourhood news or a work conversation. Imagine a greeting turning into a longer exchange while the tea cools. Finding your own favourite cup becomes part of getting to know a place.'),
'hills-paths': (
 '斜面に段を重ねる畑と、その先の小さな集落。美しい**段々畑は、傾斜地を耕して使う工夫**でもあります。家から畑へ、学校へ。景色の中の細い道は、誰かの毎日の道です。\n\n高い山、中間丘陵、南のタライ平野では、標高や水、季節に合わせて作物も変わります。山の旅を支える仕事も、ガイドだけでなく宿、食事、運搬、交通とさまざま。風景の向こうにある暮らしを想像すると、旅が少し近くなります。',
 'Terraces follow a hillside towards a cluster of homes. **Terraced fields make sloping land usable for farming**; the paths between them also lead to schools, shops and homes.\n\nCrops vary with altitude, water and season across the mountains, middle hills and southern Tarai plains. Mountain journeys connect many jobs too: guiding, lodging, cooking, carrying supplies and transport. Imagine the everyday lives within a landscape, as well as the view.'),
'dai-didi': (
 '店で「ディディ」と声をかけるお客さん。親戚には見えないのに、響きには親しさがあります。**ダイは兄、ディディは姉**にあたる言葉で、実のきょうだいでなくても、年上の相手への呼びかけに使うことがあります。\n\n誰にでも同じ呼び方を当てはめるわけではなく、年齢差や関係も大切。名前の前のひと言にも、相手をどう迎えるかが表れます。お店で交わされる声に耳を傾けたくなりますね。',
 'A customer calls to a shopkeeper, “Didi.” They need not be relatives for the word to carry warmth. **Dai means elder brother; didi means elder sister**, and these words can also address older people outside the family.\n\nAge and relationships matter, so they are not automatic labels for everyone. A small word before a question can reveal how people relate to one another. Imagine listening for those greetings in a neighbourhood shop.'),
'dal-bhat': (
 '金属の皿にご飯、豆のスープ、彩りのよいおかず。**ダルは豆のスープ、バートは炊いたご飯**。野菜のおかず「タルカリ」や、酸味・辛味のある付け合わせ「アチャール」が加わることもあります。\n\nご飯に少しずつ合わせると、ひと口ごとに味が変わります。右手で食べる習慣も今なお見られますが、スプーンを使う人や店もあります。家庭や季節ごとの違いも含めて、次の一皿が楽しみになる食事です。',
 'Rice, lentil soup and colourful accompaniments arrive on a metal plate. **Dal is lentil soup; bhat is cooked rice.** Tarkari adds vegetable dishes, while achar brings a tangy or spicy accompaniment.\n\nCombining a little at a time changes each mouthful. Eating with the right hand remains a living practice, alongside the use of spoons in different homes and settings. Ingredients vary by household, region and season: there is always another plate to discover.'),
'meal-warmth': (
 '豆のスープが減るころ、「もう少しどうぞ」と鍋が近づきます。食べる様子を気にかけるやり取りも、おもてなしの一部。満腹なら、おいしかった気持ちと感謝を添えて伝えたいですね。\n\n食卓では、**取り分け用の道具と、口に運ぶ道具を分ける**ことが大切にされる場面もあります。口や唾液が触れたものをめぐる「ジュトー」という考え方が関わりますが、実際の作法は家庭や間柄でさまざま。相手の動きを見ながら、一緒の食卓を楽しみましょう。',
 'As the lentil soup runs low, someone offers another helping. That attention can be part of the welcome. When full, appreciation and thanks can accompany a gentle refusal.\n\n**Keep serving utensils separate from utensils used for eating** where that is the household practice. The idea of jutho concerns food or objects touched by the mouth or saliva, though customs vary with household and relationship. Watching how food is served helps you join the meal with care.'),
'momo-plate': (
 '蒸し器のふたが上がり、湯気の向こうに小さなひだが並びます。**モモは、生地で具を包む、ネパールで親しまれている料理**。肉入りだけでなく、野菜やチーズを使うものもあり、揚げる作り方もあります。\n\n同じモモでも、具とたれの味や辛さで印象はさまざま。何が入っているのか、たれは辛いのか。店の人とひと言交わせたら、自分の好きな一皿に出会えるかもしれません。',
 'A steamer opens and small pleated dumplings emerge through the steam. **Momo are filled dumplings widely enjoyed in Nepal.** Meat, vegetable and cheese versions offer different tastes; some are fried rather than steamed.\n\nFillings, sauces and heat levels give each plate its character. A small question about what is inside, or how spicy the sauce is, can help you find a favourite. Waiting for that warm plate is part of the experience too.'),
'market-meeting': (
 'トマトの赤、葉ものの緑、はかりに品物を載せる音。**市場は、食材と人が街へ集まる場所**です。並ぶ野菜から、その季節の食卓も少し見えてきます。品物は近隣だけでなく、ほかの地域や国外から届くこともあります。\n\n何をどのくらい買うか、値段はいくらか。短いやり取りが街の暮らしにつながります。値段を相談できる店も、定価の店もあるので、まずは周りの買い物を眺めてみましょう。',
 'Red tomatoes, green leaves and the sound of produce settling on a scale: **a market brings food and people into the city**. Seasonal vegetables hint at daily meals, while supplies may arrive from nearby farms, other regions or abroad.\n\nChoosing a quantity and asking a price can bring everyday life closer. Some shops allow a price discussion; others have fixed prices. Watching the exchanges around you is a small discovery in itself.'),
'many-nepals': (
 '畑の向こうを自転車が走る南の平野。雪山が見えなくても、ここはネパールです。**山地・丘陵・タライ平野**では、景色も作物も仕事の姿も変わります。\n\n暮らしを支えるのは農業や観光だけでなく、商業、交通、建設、製造業、水力発電など。海外で働く家族からの送金も、家計や教育と結び付いています。旅先で「どんな仕事をしていますか」と聞けたら、一枚の山の写真には収まらない国の姿が見えてきそうです。',
 'A bicycle passes fields on a southern plain. No snowy summit is in sight, yet this is Nepal too. **Mountains, hills and the Tarai plains** shape different crops, journeys and jobs.\n\nFarming and tourism sit alongside trade, transport, construction, manufacturing and hydropower. Money sent by relatives working abroad also supports households and education. Imagine asking about someone’s work and discovering a country that reaches far beyond a single mountain photograph.'),
'seasons-weather': (
 '傘に雨が跳ね、ぬれた路地でチヤの湯気が上がります。**雨季はおおむね6〜9月**。田畑が緑を増し、雲に山が隠れる日もあります。雨の合間に動き出す街も、ネパールの表情の一つです。\n\n秋から春は概して雨が少なく、10〜11月には澄んだ空と山の眺めを楽しめることも。冬の朝晩は冷え込みます。同じ季節でも南の低地と高い山では気温が違うので、行きたい街を思い浮かべながら季節を選ぶのも、旅の楽しみですね。',
 'Rain taps on umbrellas; tea steams beside a wet lane. **The monsoon generally runs from June to September.** Fields grow greener and clouds may hide the mountains, while streets come alive between showers.\n\nAutumn through spring is generally drier, with October and November often bringing clear mountain views. Winter mornings and evenings can be cold. Lowlands and high mountains differ greatly: choosing a season for the place you hope to visit becomes part of imagining the journey.')
}

def main():
    web_path = WEB / 'src/data/nepali-learning/culture-editorial-v2.json'
    web = json.loads(web_path.read_text(encoding='utf-8'))
    assets = APP / 'expo-app/assets/culture'
    assets.mkdir(parents=True, exist_ok=True)
    items = []
    registry = []
    for item in web['items']:
        if item['id'] not in SUMMARIES:
            continue  # Religious festival and its illustration are outside app scope.
        key = item['id']
        src = WEB / f'public/ne/learning/culture/{key}-v2-app.jpg'
        digest = hashlib.sha256(src.read_bytes()).hexdigest()
        with Image.open(src) as image:
            width, height = image.size
            assert (width, height) == (960, 640)
        filename = f'{key}-{digest[:12]}.jpg'
        shutil.copyfile(src, assets / filename)
        item = {k:item[k] for k in ['id','theme','title','alt','sources']}
        if key == 'seasons-weather':
            item['theme'] = 3  # Conditions/weather; keep one culture break per theme.
        item['body'] = dict(zip(['ja','en'],SUMMARIES[key]))
        item['image'] = dict(id=filename[:-4],uri='https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-v2/'+filename,width=width,height=height,sha256=digest)
        items.append(item)
        registry.append(f"  '{digest}': require('../assets/culture/{filename}'),")
    assert len(items) == 10
    snapshot = dict(version=1,source='app_website/src/data/nepali-learning/culture-editorial-v2.json',sourceSHA256=hashlib.sha256(web_path.read_bytes()).hexdigest(),notice=web['notice'],items=items)
    (APP/'文法教材/culture_editorial_app.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (APP/'expo-app/src/cultureImages.ts').write_text("// Web illustrations, bundled for first-launch offline use. Keys are content hashes.\nimport type { ImageSourcePropType } from 'react-native';\nexport const CULTURE_IMAGES: Record<string, ImageSourcePropType> = {\n"+'\n'.join(registry)+'\n};\n',encoding='utf-8')
    print('Imported 10 nonreligious Web illustrations and bilingual short readings.')

if __name__ == '__main__': main()
