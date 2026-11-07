"""Author the Nepali script course (original explanations and examples).

Factual checks: Unicode 17 chapter 12 (script mechanics),
Khatiwada, Nepali, JIPA 39(3), 2009, doi:10.1017/S0025100309990181 (phonetics).
BCcampus Introduction to the Nepali Language, chapter 1 (inventory cross-check).
No third-party audio, illustrations or teaching prose are incorporated.
"""
import json
from pathlib import Path
APP=Path(__file__).resolve().parents[1]
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
VOWELS=[
('अ','','a','口を力ませない「ア」','Relaxed a vowel','子音だけの字にも、この母音が含まれています。','This is the inherent vowel in a plain consonant letter.'),
('आ','ा','ā','口を開く「ア」','Open ā vowel','अ と口の開き・響きを聞き比べよう。単純に2倍伸ばす記号ではありません。','Compare its quality with अ. The bar does not mean you must simply double its duration.'),
('इ','ि','i','「イ」の字（इ）','The i letter इ','子音につく ि は字の左に見えても、音は子音の後。कि＝ki。','The sign ि appears to the left but is pronounced after the consonant: कि = ki.'),
('ई','ी','ī','「イ」の別の字（ई）','The i letter ई','इ と ई は綴りを区別します。現代ネパール語では、いつも長さだけで区別するわけではありません。','Keep इ and ई distinct in spelling. Modern Nepali does not consistently distinguish them by duration alone.'),
('उ','ु','u','唇を丸める「ウ」','Rounded u vowel','子音には下につく ु を使います。कु＝ku。','After a consonant, use the lower sign ु: कु = ku.'),
('ऊ','ू','ū','「ウ」の別の字（ऊ）','The u letter ऊ','उ と ऊ は綴りを区別。ू の形にも注目。必ず2倍長く読む、と暗記しなくて大丈夫。','Distinguish उ and ऊ in writing. Notice the shape of ू; do not memorise a fixed two-to-one duration rule.'),
('ऋ','ृ','ṛ / ri','主にサンスクリット系の語に出る字','A letter mainly in Sanskrit-derived words','ネパール語では ri に近く読むのが一般的。子音につく形は ृ。日常で頻出する母音字より後で覚えよう。','Usually read close to ri in Nepali. Its dependent sign is ृ. Learn it after the common vowel letters.'),
('ए','े','e','「エ」','The e vowel','唇の形を大きく動かさず、音を聞いてみよう。子音につく形は े。','Listen with a steady mouth shape. Its dependent sign is े.'),
('ऐ','ै','ai','「ア」から「イ」へ','The ai combination','子音につく形は ै。ए の े と、上の形を見比べよう。','Its dependent sign is ै. Compare the marks above the letter with ए’s े.'),
('ओ','ो','o','「オ」','The o vowel','子音につく形は ो。左右の部品を合わせて1つの母音記号です。','Its dependent sign ो has parts around the consonant but represents one vowel.'),
('औ','ौ','au','「ア」から「ウ」へ','The au combination','子音につく形は ौ。ओ の ो と上の部分が違います。','Its sign ौ differs from ओ’s ो at the top.')]
GROUPS=[
('velar','喉の奥：क の仲間','At the back: the क group','舌の奥を上げて出す仲間。क→ख、ग→घ は息の強さを比べよう。ङ は「ンガ」の鼻に響く部分に近く、単語では ङ्ग などの形でも現れます。','Raise the back of the tongue. Compare the puff of air in क/ख and ग/घ. ङ is a nasal sound at the same place; it also appears in clusters such as ङ्ग.',
 [('क','k','息を強く出さない','Unaspirated'),('ख','kh','強く息を出す','Aspirated'),('ग','g','声を伴う','Voiced'),('घ','gh','声と強い息を伴う','Voiced with aspiration'),('ङ','ṅ','喉の奥の鼻音','Velar nasal')]),
('affricate','チ・ジャの仲間','The च and ज group','च と छ、ज と झ の息を聞き分けよう。ローマ字の c は「カ」ではなくチ／ツに近い音の目印です。ञ は主に結合した形で見かけます。','Compare the aspiration in च/छ and ज/झ. Roman c here marks a ch/ts-like sound, not k. ञ is mainly encountered in conjuncts.',
 [('च','c','チ／ツに近い音','Ch/ts-like sound'),('छ','ch','その音に強い息を添える','With aspiration'),('ज','j','ジ／ズに近い音','J/dz-like sound'),('झ','jh','その音に声と強い息','Voiced with aspiration'),('ञ','ñ','ニャに近い位置の鼻音','Palatal nasal')]),
('retroflex','舌先を後ろに：ट の仲間','Tongue farther back: ट group','舌先を上の歯より後ろへ。ṭ・ḍ の下の点は、त・द と区別する目印です。「タ」とだけ覚えず、次の項目と聞き比べよう。','Place the tongue tip farther back than the upper teeth. The dots in ṭ and ḍ distinguish these from त and द. Compare with the next group.',
 [('ट','ṭ','舌先を後ろに・息は弱く','Retroflex, unaspirated'),('ठ','ṭh','舌先を後ろに・息は強く','Retroflex, aspirated'),('ड','ḍ','舌先を後ろに・声を伴う','Retroflex, voiced'),('ढ','ḍh','舌先を後ろに・声と強い息','Retroflex, voiced aspirated'),('ण','ṇ','この位置の鼻音（語によって न に近い）','Retroflex nasal; often close to न in everyday speech')]),
('dental','上の歯に：त の仲間','At the upper teeth: त group','舌先を上の歯の付近に当てます。त と ट は字も音も別。थ の h は別の「ハ」を足す指示ではなく、強い息の目印です。','Touch the tongue tip near the upper teeth. त and ट are distinct letters and sounds. The h in थ marks aspiration, not an extra syllable.',
 [('त','t','歯の付近・息は弱く','Dental, unaspirated'),('थ','th','歯の付近・息は強く','Dental, aspirated'),('द','d','歯の付近・声を伴う','Dental, voiced'),('ध','dh','歯の付近・声と強い息','Dental, voiced aspirated'),('न','n','歯の付近の鼻音','Dental nasal')]),
('labial','唇を使う：प の仲間','Using the lips: प group','両唇を閉じてから開く仲間。प と फ、ब と भ の息を比べよう。फ は借用語などで f に近く発音されることもあります。','Close and release the lips. Compare aspiration in प/फ and ब/भ. फ can also be pronounced close to f, especially in loanwords.',
 [('प','p','唇を閉じて開く','Lips close and release'),('फ','ph','強い息を伴う','With aspiration'),('ब','b','声を伴う','Voiced'),('भ','bh','声と強い息を伴う','Voiced aspirated'),('म','m','唇を閉じた鼻音','Nasal with closed lips')]),
('other','残りの8字','Eight more consonants','य・र・ल・व と、श・ष・स・ह。श と ष はサンスクリット系の綴りによく現れ、日常の発音では स に近づくことがあります。綴りと実際の音を分けて覚えよう。','य, र, ल, व and श, ष, स, ह. श and ष occur in Sanskrit-derived spellings and may approach स in everyday speech. Learn both the spelling and the spoken form.',
 [('य','y','「ヤ」の子音','Y sound'),('र','r','舌先を短く弾く／震わせる','Brief tongue tap or trill'),('ल','l','舌先を上につけ、横へ息を流す','Lateral l sound'),('व','v','v／w に近い音。語や話者で違う','V/w-like; varies by word and speaker'),('श','ś','श の字。s／sh に近い','The letter श; s/sh-like'),('ष','ṣ','ष の字。日常では s に近いことも','The letter ष; often close to s'),('स','s','「ス」の子音','S sound'),('ह','h','息を通すハ行に近い音','H-like sound')])]
CONJUNCTS=[
('क्ष','क् + ष','kṣa / chya','क्षमा','kṣamā','許し','forgiveness'),
('त्र','त् + र','tra','पत्र','patra','手紙','letter'),
('ज्ञ','ज् + ञ','gya','ज्ञान','gyān','知識','knowledge'),
('श्र','श् + र','śra','श्रम','śram','労働','labour'),
('क्क','क् + क','kka','पक्का','pakkā','確かな','certain'),
('क्त','क् + त','kta','रक्त','rakta','血','blood'),
('क्र','क् + र','kra','क्रम','kram','順番','order'),
('ग्र','ग् + र','gra','ग्राम','grām','グラム','gram'),
('ङ्ग','ङ् + ग','ṅga','रङ्ग','raṅga','色','colour'),
('ञ्च','ञ् + च','ñca','पञ्च','pañca','五（複合語など）','five (in compounds)'),
('ञ्ज','ञ् + ज','ñja','गुञ्जन','guñjan','響き','resonance'),
('ट्ट','ट् + ट','ṭṭa','पट्टी','paṭṭī','包帯','bandage'),
('ण्ड','ण् + ड','ṇḍa','खण्ड','khaṇḍa','部分','section'),
('त्त','त् + त','tta','उत्तर','uttar','答え／北','answer / north'),
('द्ध','द् + ध','ddha','शुद्ध','śuddha','純粋な','pure'),
('द्य','द् + य','dya','विद्यालय','vidyālay','学校','school'),
('द्व','द् + व','dva','द्वार','dvār','門','gate'),
('न्त','न् + त','nta','अन्त','anta','終わり','end'),
('न्द','न् + द','nda','बन्द','banda','閉まった','closed'),
('प्र','प् + र','pra','प्रश्न','praśna','質問','question'),
('म्ब','म् + ब','mba','लम्बाइ','lambāi','長さ','length'),
('म्र','म् + र','mra','राम्रो','rāmro','良い','good'),
('ल्य','ल् + य','lya','मूल्य','mūlya','価格・価値','price / value'),
('व्य','व् + य','vya','व्यस्त','vyasta','忙しい','busy'),
('स्त','स् + त','sta','सस्तो','sasto','安い','cheap'),
('स्थ','स् + थ','stha','स्थान','sthān','場所','place'),
('स्क','स् + क','ska','स्कुल','skul','学校','school'),
('र्ख','र् + ख','rkha','पर्खनु','parkhanu','待つ','to wait'),
('र्त','र् + त','rta','शर्त','śarta','条件','condition'),
('र्ष','र् + ष','rṣa','वर्ष','varṣa','年','year')]

def build():
    manifest=read(APP/'文法教材/learning_audio_manifest.json');out={}
    for lang in ['ja','en']:
        en=lang=='en';sections=[]
        def sample(id,ne,roman,ja,eng,detail='',speech=None):
            obj=dict(id=id,ne=ne,roman=roman,meaning=eng if en else ja,detail=detail)
            if speech is not False:
                text=speech or ne;obj.update(speech=text,audio=manifest.get(text,{'url':'','sha256':'','bytes':0}))
            return obj
        def section(id,ja,eng,bodyja,bodyen,samples): sections.append(dict(id=id,title=eng if en else ja,body=bodyen if en else bodyja,samples=samples))
        section('start','文字のしくみ','How the script works',
        'ネパール語の文字はデーヴァナーガリー。左から右へ読みます。横につながる上の線も、字の一部です。\n子音の字には基本の母音 a が含まれ、記号を添えると母音が変わります。まず「1字ずつ」より「音のまとまり」で見てみよう。',
        'Nepali uses Devanagari, read left to right. The joining line at the top is part of the script.\nA consonant letter includes an inherent a; attached signs change that vowel. Look for sound units rather than treating every visible mark as a separate sound.',
        [sample('nepali','नेपाली','nepālī','ネパール語','Nepali','ने + पा + ली → नेपाली'),sample('ka-base','क','ka','子音＋基本の母音 a','Consonant + inherent a'),sample('ka-aa','का','kā','क に ा をつけた形','क with the ा sign'),sample('house','घर','ghar','家','house','語末の a を読まない語もあります。字の表と単語の音を一緒に確認しよう。' if not en else 'The final inherent a is not spoken in some words. Compare the letter chart with the complete word.')])
        section('vowels','母音11字','11 vowel letters','単独で書く母音字です。イ・ウには綴りの異なる2字ずつがあります。ローマ字の長音線は字を見分ける目印としても使っています。\n母音の後に母音が続く時も独立した字を使います。','These are independent vowel letters. The i and u sounds each have two spellings. Roman bars also help distinguish those spellings.\nAn independent letter is also used when a vowel follows another vowel.',
        [sample('v-'+str(i),v,r,j,e,de if en else dj)for i,(v,sign,r,j,e,dj,de) in enumerate(VOWELS)])
        consonants=[]
        for id,j,e,bj,be,rows in GROUPS:
            section(id,j,e,bj,be,[sample('c-'+c,c,r+'a',mj,me)for c,r,mj,me in rows]);consonants.extend(rows)
        section('combinations','子音＋母音','Consonant + vowel','33子音×11母音を選んで確認できます。म＋ा＝मा、म＋ि＝मि のように、同じ子音の母音が変わります。\n最初は क・म・न からで十分。ऋ／ृ の列や一部の組み合わせは綴りのしくみを知るための表で、日常語にすべてが現れるわけではありません。\nर＋ु＝रु、र＋ू＝रू は特別な見た目にも注目。',
        'Explore 33 consonants × 11 vowels. For example, म + ा = मा and म + ि = मि: the consonant stays, the vowel changes.\nStart with क, म and न. The ऋ/ृ column and some combinations are spelling references; not every combination is common in everyday words.\nNotice the special shapes रु and रू.',[])
        combinations=[]
        for c,r,_,_ in consonants:
            samples=[]
            for i,(v,sign,vr,*_) in enumerate(VOWELS):
                ne=c+sign;roman=r+('ri' if v=='ऋ' else vr)
                detail=(f'{c} + {sign or "अ (inherent)"} → {ne}' if en else f'{c} ＋ {sign or "अ（もとの母音）"} → {ne}')
                samples.append(sample(f'cv-{ord(c)}-{i}',ne,roman,f'{c} の {vr} の形',f'{c} with {vr}',detail))
            combinations.append(dict(consonant=c,roman=r+'a',samples=samples))
        section('conjuncts','子音をつなぐ・複合文字','Conjunct consonants',
        '子音の下の ्（ハラント）は、もとの母音を外す記号。क्＋त＝क्त のように、母音を挟まず次の子音につながります。半分の形になったり、上下に重なったり、別の形に見えることもあります。\nक्ष・त्र・ज्ञ・श्र も組み合わせです。ज्ञ はネパール語では gya に近い読み。क्ष は語や話者によって kṣ／chya に近くなります。\nर् が先なら上に回る形（र्क など）、र が後なら下に添える形（क्र・त्र など）に注目。\n下は代表30形。複合文字は作り方のある組み合わせなので、有限の追加アルファベットとして丸暗記するものではありません。単語の音声で確かめよう。',
        'The lower mark ् (halant) removes the inherent vowel. In क् + त = क्त, the consonants join without a vowel between. Shapes may become half-forms, stack, or change considerably.\nक्ष, त्र, ज्ञ and श्र are combinations too. ज्ञ is commonly read close to gya in Nepali; क्ष varies toward kṣ/chya by word and speaker.\nInitial र् may appear above (र्क); following र often attaches below (क्र, त्र).\nThese 30 common forms illustrate the patterns. Conjuncts are productive combinations, not a finite extra alphabet. Listen to each whole word.',
        [sample('halant','क → क्','ka → k','母音を外す形','Removing the inherent vowel','この記号だけに音があるわけではありません。' if not en else 'The mark itself has no separate sound.',False),
         *[sample('conj-'+str(i),c,roman,word+'＝'+ja,word+' = '+eng,formula+' → '+c+'\n'+word+' · '+wr,word)for i,(c,formula,roman,word,wr,ja,eng) in enumerate(CONJUNCTS)]])
        section('marks','鼻に響く音・記号','Nasal sounds and signs',
        'ँ（チャンドラビンドゥ）は母音の鼻への響きの目印。別の「ン」を足すより、母音そのものを鼻にも響かせます。ं（アヌスヴァーラ）は鼻音を表し、後ろの子音に合わせた音になることなどがあります。\nः（ヴィサルガ）は主にサンスクリット系の綴り。単語ごとに発音を確かめよう。। は文末の印です。',
        'ँ (chandrabindu) marks a nasal vowel: let the vowel resonate through the nose rather than adding a separate n. ं (anusvara) marks nasal sound; its pronunciation can adapt to the following consonant.\nः (visarga) occurs mainly in Sanskrit-derived spelling; check the whole word’s pronunciation. । marks a sentence ending.',
        [sample('nasal-here','यहाँ','yahā̃','ここ','here','ँ の響き' if not en else 'Listen for ँ'),sample('nasal-am','हुँ','hũ','です（私・何者か）','am (I; identity)'),sample('anusvara','संसार','saṃsār','世界','world','ं のある語' if not en else 'A word with ं'),sample('visarga','दुःख','duḥkha / dukha','悲しみ・苦しみ','sorrow','ः のある語' if not en else 'A word with ः'),sample('stop','।','pūrṇa virām','文末の印。ここでは音を読みません。','Sentence-ending mark; not pronounced here.',speech=False)])
        nums=[('०','शून्य','śūnya'),('१','एक','ek'),('२','दुई','duī'),('३','तीन','tīn'),('४','चार','cār'),('५','पाँच','pā̃c'),('६','छ','cha'),('७','सात','sāt'),('८','आठ','āṭh'),('९','नौ','nau')]
        section('numbers','数字と読みの確認','Digits and reading',
        '数字も左から右。१० は10、२५ は25です。読みは数字を1字ずつつなぐだけではないので、まず0〜9を音で覚えよう。\nこの教材はネパール語の基本文字を網羅しています。他言語・古典用の ॠ・ऌ・ॡ や、借用語用の点（़）つき文字なども同じ文字体系にありますが、日常ネパール語の基本33子音・11母音とは分けて扱います。',
        'Digits also run left to right: १० is 10 and २५ is 25. Number names are not made simply by reading each digit separately; begin with 0–9.\nThis course covers the core Nepali script. The wider script also has letters such as ॠ, ऌ and ॡ for classical or other-language use, and dotted letters (़) for borrowed sounds. Those are distinct from the 33 core consonants and 11 vowel letters.',
        [sample('digit-'+str(i),d,r,f'{i} · {word}',f'{i} · {word}',speech=word)for i,(d,word,r) in enumerate(nums)])
        out[lang]=dict(title='Letters & sounds' if en else '文字と音',description='11 vowels · 33 consonants · 363 combinations' if en else '母音11字・子音33字・組み合わせ363通り',sections=sections,combinations=combinations)
    write(APP/'文法教材/letters_sounds.json',out)
    print('Prepared 12 sections, 11 vowels, 33 consonants, 363 combinations, 30 conjuncts, signs and digits, JA/EN.')
if __name__=='__main__':build()
