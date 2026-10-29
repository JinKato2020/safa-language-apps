"""Reviewed respectful third-person forms; familiar forms belong to topic 7."""
import copy
import re

# Source word -> respectful word, reading, Japanese meaning, English meaning.
DATA = '''उ|उहाँ|uhā̃|彼・彼女（敬意）|he/she (respectful)
ऊ|उहाँ|uhā̃|彼・彼女（敬意）|he/she (respectful)
उनी|उहाँ|uhā̃|彼・彼女（敬意）|he/she (respectful)
उनीहरू|उहाँहरू|uhā̃harū|彼ら・彼女ら（敬意）|they (respectful)
उनले|उहाँले|uhā̃le|彼・彼女が（लेの付いた形・敬意）|he/she as agent (respectful)
उसले|उहाँले|uhā̃le|彼・彼女が（लेの付いた形・敬意）|he/she as agent (respectful)
उनलाई|उहाँलाई|uhā̃lāī|彼・彼女に・を（敬意）|to him/her; him/her as object (respectful)
उसलाई|उहाँलाई|uhā̃lāī|彼・彼女に・を（敬意）|to him/her; him/her as object (respectful)
उनको|उहाँको|uhā̃ko|彼・彼女の（敬意）|his/her (respectful)
उसको|उहाँको|uhā̃ko|彼・彼女の（敬意）|his/her (respectful)
उनीहरूले|उहाँहरूले|uhā̃harūle|彼ら・彼女らが（動作主・敬意）|they as agents (respectful)
उनीहरूलाई|उहाँहरूलाई|uhā̃harūlāī|彼ら・彼女らに・を（敬意）|to them; them as object (respectful)
उनीहरूको|उहाँहरूको|uhā̃harūko|彼ら・彼女らの（敬意）|their (respectful)
हुन्|हुनुहुन्छ|hunuhuncha|です・います（敬意）|is/are (respectful)
हो|हुनुहुन्छ|hunuhuncha|です（敬意）|is/are (respectful)
होइन|हुनुहुन्न|hunuhunna|ではありません（敬意）|is/are not (respectful)
होइनन्|हुनुहुन्न|hunuhunna|ではありません（敬意）|is/are not (respectful)
छ|हुनुहुन्छ|hunuhuncha|います（敬意）|is/are present (respectful)
छिन्|हुनुहुन्छ|hunuhuncha|います（敬意）|is/are present (respectful)
छन्|हुनुहुन्छ|hunuhuncha|います（敬意）|is/are present (respectful)
छैन|हुनुहुन्न|hunuhunna|いません（敬意）|is/are not present (respectful)
छैनन्|हुनुहुन्न|hunuhunna|いません（敬意）|is/are not present (respectful)
जान्छिन्|जानुहुन्छ|jānuhuncha|行きます（敬意）|go/goes (respectful)
जान्छन्|जानुहुन्छ|jānuhuncha|行きます（敬意）|go/goes (respectful)
पिउँछिन्|पिउनुहुन्छ|piunuhuncha|飲みます（敬意）|drink/drinks (respectful)
पढ्छिन्|पढ्नुहुन्छ|paḍhnuhuncha|読みます（敬意）|read/reads (respectful)
खाँदिनन्|खानुहुन्न|khānuhunna|食べません（敬意）|do/does not eat (respectful)
लेख्दैछिन्|लेख्दै हुनुहुन्छ|lekhdai hunuhuncha|書いています（敬意）|is/are writing (respectful)
गइन्|जानुभयो|jānubhayo|行きました（敬意）|went (respectful)
पिइन्|पिउनुभयो|piunubhayo|飲みました（敬意）|drank (respectful)
पिइनन्|पिउनुभएन|piunubhaena|飲みませんでした（敬意）|did not drink (respectful)
आउँछिन्|आउनुहुन्छ|āunuhuncha|来ます（敬意）|come/comes (respectful)
आउँदैनन्|आउनुहुन्न|āunuhunna|来ません（敬意）|do/does not come (respectful)
आउँदिनन्|आउनुहुन्न|āunuhunna|来ません（敬意）|do/does not come (respectful)
पिउँथिन्|पिउनुहुन्थ्यो|piunuhunthyo|以前は飲んでいました（敬意）|used to drink (respectful)
सक्छन्|सक्नुहुन्छ|saknuhuncha|できます（敬意）|can (respectful)
सक्छिन्|सक्नुहुन्छ|saknuhuncha|できます（敬意）|can (respectful)
बस्छिन्|बस्नुहुन्छ|basnuhuncha|住んでいます・座ります（敬意）|live/lives; sit/sits (respectful)
बस्छ|बस्नुहुन्छ|basnuhuncha|住んでいます（敬意）|live/lives (respectful)
बोल्दैनन्|बोल्नुहुन्न|bolnuhunna|話しません（敬意）|do/does not speak (respectful)
हिँड्छिन्|हिँड्नुहुन्छ|hiṇḍnuhuncha|歩きます（敬意）|walk/walks (respectful)
हिँड्छन्|हिँड्नुहुन्छ|hiṇḍnuhuncha|歩きます（敬意）|walk/walks (respectful)
गर्छिन्|गर्नुहुन्छ|garnuhuncha|します（敬意）|do/does (respectful)
गर्छ|गर्नुहुन्छ|garnuhuncha|します（敬意）|do/does (respectful)
सिक्छ|सिक्नुहुन्छ|siknuhuncha|学びます（敬意）|learn/learns (respectful)
हुन्छिन्|हुनुहुन्छ|hunuhuncha|います・なります（敬意）|is/becomes (respectful)
लगाइन्|लगाउनुभयो|lagāunubhayo|させました（敬意）|caused/made someone do (respectful)
लगाए|लगाउनुभयो|lagāunubhayo|させました（敬意）|caused/made someone do (respectful)
भनिन्|भन्नुभयो|bhannubhayo|言いました（敬意）|said (respectful)
भने|भन्नुभयो|bhannubhayo|言いました（敬意）|said (respectful)
लेख्छ|लेख्नुहुन्छ|lekhnuhuncha|書きます（敬意）|write/writes (respectful)
लेख्छिन्|लेख्नुहुन्छ|lekhnuhuncha|書きます（敬意）|write/writes (respectful)
लेख्छन्|लेख्नुहुन्छ|lekhnuhuncha|書きます（敬意）|write/writes (respectful)
लेख्दैन|लेख्नुहुन्न|lekhnuhunna|書きません（敬意）|do/does not write (respectful)
लेख्दिनन्|लेख्नुहुन्न|lekhnuhunna|書きません（敬意）|do/does not write (respectful)
लेख्दैनन्|लेख्नुहुन्न|lekhnuhunna|書きません（敬意）|do/does not write (respectful)
लेख्यो|लेख्नुभयो|lekhnubhayo|書きました（敬意）|wrote (respectful)
लेखिन्|लेख्नुभयो|lekhnubhayo|書きました（敬意）|wrote (respectful)
लेखे|लेख्नुभयो|lekhnubhayo|書きました（敬意）|wrote (respectful)
लेखेन|लेख्नुभएन|lekhnubhaena|書きませんでした（敬意）|did not write (respectful)
लेखिनन्|लेख्नुभएन|lekhnubhaena|書きませんでした（敬意）|did not write (respectful)
लेखेनन्|लेख्नुभएन|lekhnubhaena|書きませんでした（敬意）|did not write (respectful)
लेखेको|लेख्नुभएको|lekhnubhaeko|書いた・書き終えた（敬意）|having written (respectful)
लेखेकी|लेख्नुभएको|lekhnubhaeko|書いた・書き終えた（敬意）|having written (respectful)
लेखेका|लेख्नुभएको|lekhnubhaeko|書いた・書き終えた（敬意）|having written (respectful)
लेख्थ्यो|लेख्नुहुन्थ्यो|lekhnuhunthyo|以前は書いていました（敬意）|used to write (respectful)
लेख्थिन्|लेख्नुहुन्थ्यो|lekhnuhunthyo|以前は書いていました（敬意）|used to write (respectful)
लेख्थे|लेख्नुहुन्थ्यो|lekhnuhunthyo|以前は書いていました（敬意）|used to write (respectful)
थियो|हुनुहुन्थ्यो|hunuhunthyo|いました・でした（敬意）|was/were (respectful)
थिइन्|हुनुहुन्थ्यो|hunuhunthyo|いました・でした（敬意）|was/were (respectful)
थिए|हुनुहुन्थ्यो|hunuhunthyo|いました・でした（敬意）|was/were (respectful)
थिएन|हुनुहुन्नथ्यो|hunuhunnathyo|いませんでした（敬意）|was/were not (respectful)
थिइनन्|हुनुहुन्नथ्यो|hunuhunnathyo|いませんでした（敬意）|was/were not (respectful)
थिएनन्|हुनुहुन्नथ्यो|hunuhunnathyo|いませんでした（敬意）|was/were not (respectful)'''
FORMS = {a[0]: a[1:] for a in (line.split('|') for line in DATA.splitlines())}
PRONOUN = re.compile(r'(?<!\S)(?:उनी(?:हरू)?(?:ले|लाई|को)?|उन(?:ले|लाई|को)|उस(?:ले|लाई|को)|ऊ|उ)(?=[\s,।]|$)')

# Clauses with another subject, nonfinite honorifics and quoted speech need
# sentence-level decisions rather than replacing every verb indiscriminately.
SPECIAL = {
 'उनले पैसा छैन भनिन्।': ('उहाँले पैसा छैन भन्नुभयो।','uhā̃le paisā chaina bhannubhayo'),
 'हामी पुग्दा, उनी घर गएकी थिइन्।': ('हामी पुग्दा, उहाँ घर जानुभएको थियो।','hāmī pugdā, uhā̃ ghar jānubhaeko thiyo'),
 'उनलाई अहिले बोल्न मन छैन।': ('उहाँलाई अहिले बोल्न मन छैन।','uhā̃lāī ahile bolna man chaina'),
 'उनी काम गर्ने अफिस टाढा छ।': ('उहाँ काम गर्नुहुने अफिस टाढा छ।','uhā̃ kām garnuhune aphis ṭāḍhā cha'),
 'उनी आउँछिन् भने, म पनि आउँछु।': ('उहाँ आउनुहुन्छ भने, म पनि आउँछु।','uhā̃ āunuhuncha bhane, ma pani āũchu'),
 'उनी घर गएकी हुनु पर्छ।': ('उहाँ घर जानुभएको हुनु पर्छ।','uhā̃ ghar jānubhaeko hunu parcha'),
}

def normalize_row(row):
    out = copy.deepcopy(row)
    ne, roman = row['ne'], row['roman']
    if not PRONOUN.search(ne):
        return out
    if ne in SPECIAL:
        out['ne'], out['roman'] = SPECIAL[ne]
        return out
    # A completed-event participle already marks honorific agreement; its
    # auxiliary stays छ, as in the existing reviewed appendix recording.
    perfect = any(x in ne for x in ['लेखेको','लेखेकी','लेखेका'])
    ne_words, ro_words = ne.split(), roman.split()
    assert len(ne_words) == len(ro_words), (ne, roman)
    for i, word in enumerate(ne_words):
        plain = word.strip('।,?')
        if plain not in FORMS or (perfect and plain in ['छ','छिन्','छन्']):
            continue
        # Object-only examples keep the verb belonging to the other subject.
        if 'उनीहरूलाई' in ne and plain not in ['उनीहरूलाई']:
            continue
        target, reading, _, _ = FORMS[plain]
        ne_words[i] = word.replace(plain,target)
        suffix = ''.join(x for x in ro_words[i][-1:] if x in ',?')
        ro_words[i] = reading + suffix
    out['ne'], out['roman'] = ' '.join(ne_words), ' '.join(ro_words)
    return out

def lexicon_forms():
    out = {v[0]: dict(rom=v[1],ja=v[2],en=v[3]) for v in FORMS.values() if ' ' not in v[0]}
    out.update({
      'गर्नुहुने':dict(rom='garnuhune',ja='する・働く（敬意・名詞を説明する形）',en='who does/works (respectful modifier)'),
      'जानुभएको':dict(rom='jānubhaeko',ja='行った・行き終えた（敬意）',en='having gone (respectful)'),
      'लेख्दै':dict(rom='lekhdai',ja='書いている途中・書きながら',en='writing; while writing'),
    })
    return out
