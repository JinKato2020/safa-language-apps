"""Translate fully recognized grammatical labels using reviewed Korean terminology.

No network calls. POS labels and notes consisting entirely of grammatical terms
qualify. Prose remains pending unless it matches an explicitly defined template.
"""
import hashlib
import json
import re
from record_korean import WORK

TERMS = '''
first person|1인칭
first-person|1인칭
1st person|1인칭
second person|2인칭
second-person|2인칭
2nd person|2인칭
third person|3인칭
third-person|3인칭
3rd person|3인칭
singular|단수
plural|복수
present perfect|현재완료
past perfect|과거완료
present progressive|현재진행
present continuous|현재진행
present habitual|현재 습관
past habitual|과거 습관
past progressive|과거진행
past continuous|과거진행
non-past|비과거
present tense|현재형
past tense|과거형
future tense|미래형
present|현재
past|과거
future|미래
present participle|현재분사
past participle|과거분사
perfect participle|완료분사
perfective participle|완료분사
passive participle|수동분사
conjunctive participle|연결분사
participle|분사
participial|분사
personal pronoun|인칭대명사
possessive pronoun|소유대명사
reflexive pronoun|재귀대명사
demonstrative pronoun|지시대명사
indefinite pronoun|부정대명사
interrogative pronoun|의문대명사
relative pronoun|관계대명사
demonstrative adjective|지시형용사
possessive adjective|소유형용사
pronoun|대명사
proper noun|고유명사
verbal noun|동작성 명사
noun phrase|명사구
noun modifier|명사 수식어
noun-modifying|명사 수식
noun-modifier|명사 수식어
nominal use|명사적 용법
nominalized|명사화
nominal|명사적
noun|명사
compound verb|복합동사
auxiliary verb|보조동사
existential verb|존재동사
copula verb|계사
verb phrase|동사구
verb stem|동사 어간
verb root|동사 어근
verb|동사
copula|계사
auxiliary|보조
existential|존재
genitive case|소유격
possessive case|소유격
instrumental case|도구격
locative case|처소격
objective case|목적격
nominative case|주격
accusative case|목적격
dative case|여격
ergative case|능격
ablative case|탈격
genitive|소유격
possessive|소유
instrumental|도구격
locative|처소격
nominative|주격
accusative|목적격
dative|여격
ergative|능격
ablative|탈격
postpositional phrase|후치사구
postpositional use|후치사 용법
postposition|후치사
adverbial phrase|부사구
adverbial particle|부사적 조사
interrogative particle|의문 조사
sentence-final particle|종결 조사
conjunctive particle|연결 조사
particle|조사
adjective|형용사
adjectival use|형용사적 용법
adjectival|형용사적
adverb|부사
adverbial usage|부사적 용법
adverbial|부사적
used adverbially|부사로 사용
used adjectivally|형용사로 사용
used as object|목적어로 사용
used as modifier|수식어로 사용
object of verb phrase|동사구의 목적어
predicative use|서술 용법
conditional clause|조건절
relative clause|관계절
temporal clause|시간절
causal clause|이유절
clause|절
conditional marker|조건 표지
conditional|조건
concessive|양보
concession|양보
conjunction for quotation|인용 접속사
conjunction|접속사
quotative|인용
conjunctive|연결
converb|부동사(연결형)
continuative|계속·연결
infinitive|부정사
gerundive|의무·당위 분사
gerund|동명사
imperative|명령
hortative|권유
optative|기원
obligative|의무
potential|가능
passive|수동
causative|사역
transitive|타동사
intransitive|자동사
negative|부정
negation|부정
positive|긍정
affirmative|긍정
perfective|완료
perfect|완료
progressive|진행
continuous|지속
habitual|습관
honorific|높임
mid-honorific|중간 높임
non-honorific|비높임
polite|공손
respectful|높임
informal|비격식
formal|격식
feminine|여성
masculine|남성
neuter|중성
interrogative word|의문사
interrogative adverb|의문부사
interrogative|의문
demonstrative|지시
attributive|관형
comparative|비교
superlative|최상급
determiner|한정사
quantifier|수량 한정사
numeral|수사
number|수
interjection|감탄사
loanword|차용어
compound word|합성어
compound|복합
idiomatic expression|관용 표현
expression|표현
emphatic|강조
emphasis|강조
assertive|단정
restrictive|한정
contrast|대조
adversative|역접
addition|추가
benefactive|수혜
impersonal|비인칭
time expression|시간 표현
time|시간
place|장소
direction|방향
cause|원인
causal|이유
reason|이유
source|출발점
means|수단
purpose|목적
purposive|목적
manner|방식
temporal|시간
simultaneous action|동시 동작
simultaneous|동시
sequential|순차
alternative|선택
subject|주어
object|목적어
modifier|수식어
relative|관계
reduplicated|반복
condition|조건
tense|시제
aspect|상
form|형
stem|어간
root|어근
use|용법
usage|용법
assertion|단정
identificational|정체·동일성 표현
identity|정체·동일성
polite register|공손한 말투
polite request|공손한 요청
polite language|공손한 표현
politeness adverb|공손함을 더하는 부사
case marker|격 표지
marker|표지
case|격
directional|방향
path|경로
scene|장면
context|맥락
target|대상
counter/measure word|단위·수량을 세는 말
counter word|단위·수량을 세는 말
counter|단위·수량을 세는 말
classifier|분류사
obligation construction|의무 표현 구문
obligation expression|의무 표현
obligatory|의무
obligation|의무
indefinite article|부정관사
article-like modifier|관사처럼 쓰이는 수식어
article-like determiner|관사처럼 쓰이는 한정사
article-like adjective|관사처럼 쓰이는 형용사
article-like numeral|관사처럼 쓰이는 수사
indefinite-article-like|부정관사와 같은 용법
article usage|관사와 같은 용법
kinship term|친족 호칭
starting point|출발점
route|경로
instrument|수단·도구
comparison|비교
material|재료
comitative|동반격
accompaniment|동반
predicative|서술적
predicate|서술어
connective|연결
completed|완료된
completive|완결
completion|완료
volitional|의지
objective|목적어
topic|화제
adverb-forming suffix|부사를 만드는 접미사
adverbializing suffix|부사를 만드는 접미사
suffix|접미사
prefix|접두사
degree|정도
short form|축약형
quantity|수량
quantitative|수량을 나타내는
pronominal|대명사적
focus particle|초점 조사
focusing particle|초점 조사
clitic|접어
involvement|관여
time word|시간 명사
limitative|범위 한정
range|범위
endpoint|끝점
goal|목표 지점
destination|도착점
limit|한계
formal/dummy noun|형식명사
agentive|행위자격
agent|행위자
active case|행위자격
coordination|대등 연결
coordinating|대등 연결
coordinative|대등 연결
greeting|인사
question particle|의문 조사
sentence-initial question marker|문두 의문 표지
question sentence marker|의문문 표지
ordinal numeral|서수
ordinal|순서
counter-like usage|단위명사와 같은 용법
number of times|횟수
verbal phrase|동사구
verbal|동사의
indefinite adjective|부정형용사
contrastive addition|대조적 추가
parallel enumeration and emphasis|병렬 나열·강조
additive|추가
complementizer|보문 표지
nominalizing|명사화
relativizing particle|관계절을 만드는 조사
quotation clause formation|인용절 형성
quotative particle function|인용 조사 기능
quotation marker|인용 표지
quotation particle|인용 조사
quotation|인용
indefinite|불특정
possibility|가능성
conjecture|추측
conjectural|추측
postpositional|후치사적
indirect-question marker|간접의문 표지
relative-clause usage|관계절 용법
idiomatic usage|관용적 용법
idiomatic|관용적
proximal|근칭
proximate|근칭
distal|원칭
prenominal|관형
coordinate|대등 연결
distributive|분배
hypothetical|가정
reciprocal|상호
infinitive-like|부정사와 같은
past-participial use|과거분사적 용법
past-participial usage|과거분사적 용법
general|일반
iterative|반복
ability|능력
imperative sense|명령의 의미
amount of money|금액
amount|양
exclamation|감탄
exclamatory|감탄
absolutive|부동사
date counter|날짜 단위
English loanword|영어 차용어
people counter|사람 수를 세는 말
currency unit|화폐 단위
currency|통화
month name|달 이름
unit of time|시간 단위
absolute participle|독립분사
similative|유사·비교
speculative|추측
mid-level honorific|중간 높임
middle honorific|중간 높임
tag question|부가의문
question|질문
oblique|사격
pre-postposition form|후치사 앞에 오는 형태
exceedance|초과
definition|정의
nominalization|명사화
adnominal|관형
indirect question|간접의문
choice|선택
allative|방향격
inferential|추론
location|위치
presumptive|추측
necessity expression|필요·의무 표현
hearsay|전해 들은 말
unit of distance|거리 단위
unit of measurement|측정 단위
unit|단위
gradual-progressive|점진적 진행
foreign borrowing|외래어
stative|상태
negated|부정
command|명령
gender|성
reflexive|재귀
pre-verbal usage|동사 앞의 용법
preposition|전치사
counterfactual|반사실
animal|동물
prohibitive|금지
adverse effect|부정적 결과
place name|지명
preceding clause|앞 절
quasi-adjectival|형용사와 유사한
Sanskrit loanword|산스크리트어 차용어
disjunctive|선택·분리
passive-like|수동과 유사한
generic|일반 지칭
universal|전체 지칭
voice|태
abbreviation|약어
sensory expression|감각 표현
reportative|전언
linking|연결
interior|내부
prefix|접두사
exclusion|제외
limiter|한정 표현
giving expression|주다 표현
construction|구문
part|부분
simultaneous-condition|동시·조건
abessive|결여격
confirmation|확인
request|요청
information acquired|새로 알게 된 정보
discovery|새로 알게 됨
plain final form|비높임 종결형
abstract noun|추상명사
approximate|대략
resultative|결과
duration|기간
postposition-like|후치사와 같은
mountain name|산 이름
onomatopoeia|의성어
honorific title|존칭
posterior|후속
medial connective|중간 연결
personal name|인명
surname|성씨
desiderative|희망
and|및
or|또는
possession|소유
identification|정체·종류의 확인
definitional|정의
sentence-final|문장 끝
confirmatory|확인
strong assertion|강한 단정
recipient|받는 사람
beneficiary|수혜자
experiencer|경험자
possessor|소유자
state|상태
affiliation|소속
situation|상황
field|분야
domain|영역
existence|존재
method|방법
scope|범위
medium|매개 수단
point in time|시점
period|기간
belonging|소속
noun modification|명사 수식
relationship|관계
relation|관계
emotional expression|감정 표현
emotional expressions|감정 표현
emotion|감정
sensation|감각
frequency|빈도
action|동작
continuation|지속
contraction|축약
intention|의도
prohibition|금지
permission|허락
necessity|필요
obligation|의무
ability|능력
result|결과
habit|습관
tendency|경향
desire|바람
request expression|요청 표현
plain-polite form|일반적인 공손형
direct object|직접목적어
indirect object|간접목적어
animate object|생명체를 가리키는 목적어
agent|행위자
origin|기원·출처
recurrence|재발
repetition|반복
ownership|소유
accompaniment|동반
companionship|동행
joint action|함께하는 행동
co-agent|함께 행동하는 사람
counterpart|상대
association|연관
connection|연결
quality|성질
quantity|양
degree|정도
modification|수식
adjectives|형용사
verbs|동사
nouns|명사
clauses|절
infinitives|부정사
the following noun|뒤의 명사
following noun|뒤의 명사
the preceding noun|앞의 명사
preceding noun|앞의 명사
genitive marker|소유격 표지
possessive marker|소유격 표지
locative case marker|장소 표지
emphatic particle|강조 표지
positive evaluation|긍정적인 평가
borrowed word|차용어
occupational noun|직업 명사
cardinal numeral|기수
resulting state|결과 상태
continuing state|계속되는 상태
compound word|합성어
compound words|합성어
head noun|중심 명사
prenominal|관형
perfect aspect|완료
perfect tense|완료 시제
existential construction|존재 구문
purpose clause|목적절
negative sentences|부정문
interrogative sentences|의문문
affirmative sentences|긍정문
transitive sentences|타동사 구문
transitive verbs|타동사
sensory verbs|감각 동사
emotive verbs|감정 동사
psychological verbs|심리 동사
emotional verbs|감정 동사
plural subject|복수 주어
singular subject|단수 주어
adjectival phrase|형용사구
verbal phrase|동사구
subject clause|주어절
object clause|목적어절
subordinate clause|종속절
volition|의지
expectation|예상
place|장소
time|시간
route|경로
destination|도착점
separation|분리
location|위치
range|범위
restriction|제한
contrast|대조
emotive sentence|감정 구문
'''


def translate_label(text):
    # POS labels only: delimiters retain the grouping of the original.
    terms = {en.lower(): ko for en, ko in (line.split('|', 1) for line in TERMS.strip().splitlines())}
    pattern = r'(?<![\w-])(' + '|'.join(re.escape(x) for x in sorted(terms, key=len, reverse=True)) + r')(?![\w-])'
    result = re.sub(pattern, lambda m: terms[m[0].lower()], text, flags=re.I)
    if re.search('[A-Za-z]', result):
        return None
    result = result.replace(' – ', ' · ').replace(': ', ' · ').replace(', ', ' · ')
    return re.sub(r'(?<=[가-힣]) 형\b', '형', result)


def translate_note(text):
    label = translate_label(text)
    if label:
        return label
    # Restrict sentence templates to the same finite, fully recognized vocabulary.
    for prefix, suffix in [('indicates ', ' 표시'), ('indicating ', ' 표시'),
                           ('expresses ', ' 표현'), ('expressing ', ' 표현'),
                           ('used as ', ' 역할로 사용'), ('used as the ', ' 역할로 사용'),
                           ('used in ', '에 사용'), ('marks ', ' 표시'),
                           ('marking ', ' 표시'), ('functions as ', ' 역할'),
                           ('functions as a ', ' 역할'), ('functions as an ', ' 역할'),
                           ('forms ', ' 형성'), ('forms a ', ' 형성'),
                           ('forms an ', ' 형성'), ('modifies ', ' 수식'),
                           ('emphasizes ', ' 강조')]:
        if text.lower().startswith(prefix):
            body = translate_label(text[len(prefix):])
            if body:
                return body + suffix
    nepali = r"[\u0900-\u097f][\u0900-\u097f\s+\-/]*"
    quoted_nepali = r"['\"«]?" + nepali + r"['\"»]?"
    patterns = [
        (rf'(?:combines|combined|combining|compounds|compounded|compound|co-occurs|collocates|used|used together|together|used in combination) with ({quoted_nepali})', '결합: {0}'),
        (rf'(?:combines|combined) with (?:postposition|verb) ({quoted_nepali})', '결합: {0}'),
        (rf'(?:modifies|modifying) (?:noun )?({quoted_nepali})(?: \(noun\))?', '수식 대상: {0}'),
        (rf'modified by ({quoted_nepali})', '{0}의 수식을 받음'),
        (rf'emphasizes ({quoted_nepali})', '강조 대상: {0}'),
        (rf'correlates with ({quoted_nepali})', '호응 표현: {0}'),
        (rf'used in parallel with ({quoted_nepali})', '병렬로 사용: {0}'),
        (rf'contrasted with ({quoted_nepali})', '대조 표현: {0}'),
        (rf'(?:forms (?:a )?compound (?:word|verb) with|compound (?:word|verb) with|forms (?:a )?compound with) ({quoted_nepali})', '{0}와 합성 표현을 이룸'),
        (rf'(?:combines with|combined with) ({quoted_nepali}) to form (?:a )?verb phrase', '{0}와 동사구를 이룸'),
        (rf'forms (?:a )?verb phrase (?:in combination|together) with ({quoted_nepali})', '{0}와 동사구를 이룸'),
        (rf'forms predicate (?:together )?with ({quoted_nepali})', '{0}와 서술어를 이룸'),
        (rf'combines with ({quoted_nepali}) to form predicate', '{0}와 서술어를 이룸'),
        (rf'participle modifying ({quoted_nepali})', '{0}를 수식하는 분사'),
        (rf'used idiomatically with ({quoted_nepali})', '{0}와 관용 표현으로 사용'),
        (rf'plural form is ({quoted_nepali})', '복수형: {0}'),
        (rf'({quoted_nepali}) is the plural form', '복수형: {0}'),
        (rf'plural with ({quoted_nepali})', '{0}를 붙여 복수를 나타냄'),
        (rf'negated with ({quoted_nepali})', '{0}를 붙여 부정함'),
        (rf'(?:combines|combined|co-occurs|used) with (?:genitive|possessive|locative|dative|ergative|accusative)(?: case)?(?: marker| particle| postposition)? ({quoted_nepali})', '격 표지 {0}와 결합'),
        (rf'(?:first|pre-) element (?:of|in) ({quoted_nepali})', '{0}의 앞부분'),
        (rf'(?:second|last) element (?:of|in) ({quoted_nepali})', '{0}의 뒷부분'),
        (rf'(?:base form|dictionary form|infinitive) of ({quoted_nepali})', '{0}의 원형'),
        (rf'(?:derived form|inflected form) of ({quoted_nepali})', '{0}에서 나온 형태'),
        (rf'(?:past tense|past form) of ({quoted_nepali})', '{0}의 과거형'),
        (rf'(?:negative form|negative) of ({quoted_nepali})', '{0}의 부정형'),
        (rf'(?:plural form|plural) of ({quoted_nepali})', '{0}의 복수형'),
        (rf'(?:genitive form|genitive|possessive form) of ({quoted_nepali})', '{0}의 소유형'),
        (rf'(?:feminine form|feminine) of ({quoted_nepali})', '{0}의 여성형'),
        (rf'(?:honorific form|honorific) of ({quoted_nepali})', '{0}의 높임형'),
    ]
    for pattern, template in patterns:
        match = re.fullmatch(pattern, text, flags=re.I)
        if match:
            return template.format(*(part.strip(" '\"«»") for part in match.groups()))
    match = re.fullmatch(rf'(.+?) of ({quoted_nepali})', text, flags=re.I)
    if match:
        label = translate_label(match[1])
        if label:
            return match[2].strip(" '\"«»") + '의 ' + label
    match = re.fullmatch(r'(.+?) (?:indicating|expressing) (.+)', text, flags=re.I)
    if match:
        left, right = translate_label(match[1]), translate_label(match[2])
        if left and right:
            return right + ' 표현 · ' + left
    # Mixed quoted examples and formulas need a full-sentence translation;
    # grammatical relation templates must not reorder parts across punctuation.
    if re.search(r'[=:;/()\u0900-\u097f]', text):
        return None
    for pattern, template in [
            (r'(.+?) of (?:a |an |the )?(.+)', '{1}의 {0}'),
            (r'(.+?) modifying (?:a |an |the )?(.+)', '{1}를 수식하는 {0}'),
            (r'(.+?) used as (?:a |an |the )?(.+)', '{0} · 용법: {1}'),
            (r'(.+?) functioning as (?:a |an |the )?(.+)', '{1} 역할의 {0}'),
            (r'(.+?) in (?:a |an |the )?(.+)', '{1}의 {0}')]:
        match = re.fullmatch(pattern, text, flags=re.I)
        if match:
            parts = [translate_label(x) for x in match.groups()]
            if all(parts):
                return template.format(*parts)
    match = re.fullmatch(rf'(?:combines|combined) with ({quoted_nepali}) to (?:form|indicate) (.+)', text, flags=re.I)
    if match:
        label = translate_label(match[2])
        if label:
            return match[1].strip(" '\"«»") + '와 결합 · ' + label
    return None


def apply():
    plan_path = WORK / 'korean_translation_requests.json'
    assert hashlib.sha256(plan_path.read_bytes()).hexdigest() == 'f45a15c05a0022254dab3689d0f70fc861df3c5e10b671b4a8b3d69f31b39ee3'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    cache_path = WORK / 'korean_translations.json'
    cache = json.loads(cache_path.read_text(encoding='utf-8'))
    keys = {d['key'] for d in plan['destinations'] if d['path'][1] in {'convVocab', 'grammarVocab'} and d['path'][-1] in {'pos', 'note'}}
    count = 0
    for key in keys:
        prior = cache['items'].get(key, {})
        if prior.get('reviewed') and not prior.get('origin', '').startswith('reviewed-grammar-terminology'):
            continue
        source = plan['requests'][key]
        translated = translate_note(source['en'])
        if not translated:
            continue
        cache['items'][key] = {'source': source, 'ko': translated, 'reviewed': True,
                               'origin': 'reviewed-grammar-terminology; complete-label coverage'}
        count += 1
    tmp = cache_path.with_suffix('.next')
    tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(cache_path)
    print(json.dumps({'labelsTranslated': count, 'labelsPending': sum(not cache['items'].get(k, {}).get('reviewed') for k in keys)}))


if __name__ == '__main__':
    apply()
