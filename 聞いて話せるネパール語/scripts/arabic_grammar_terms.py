"""Arabic grammatical labels, restricted to fully recognized source patterns.

Only contextual POS/note fields qualify. Existing reviewed translations are never
overwritten. Unrecognized prose remains pending for direct translation/review.
"""
import hashlib
import json
import re
from record_arabic import WORK

TERMS = '''
first person|المتكلّم
first-person|المتكلّم
1st person|المتكلّم
second person|المخاطب
second-person|المخاطب
2nd person|المخاطب
third person|الغائب
third-person|الغائب
3rd person|الغائب
singular|مفرد
plural|جمع
present perfect|المضارع التام
past perfect|الماضي التام
present progressive|المضارع المستمر
present continuous|المضارع المستمر
present habitual|المضارع الدالّ على العادة
past habitual|العادة في الماضي
past progressive|الماضي المستمر
past continuous|الماضي المستمر
non-past|غير الماضي
present tense|المضارع
past tense|الماضي
future tense|المستقبل
present|مضارع
past|ماضٍ
future|مستقبل
present participle|صيغة وصفية للفعل الجاري
past participle|صيغة وصفية للفعل الماضي
perfect participle|صيغة وصفية للفعل المكتمل
perfective participle|صيغة وصفية للفعل المكتمل
passive participle|صيغة وصفية مبنية للمجهول
conjunctive participle|صيغة فعلية للربط
participle|صيغة فعلية وصفية
participial|استعمال وصفي للفعل
personal pronoun|ضمير شخصي
possessive pronoun|ضمير ملكية
reflexive pronoun|ضمير انعكاسي
demonstrative pronoun|ضمير إشارة
indefinite pronoun|ضمير غير محدّد
interrogative pronoun|ضمير استفهام
relative pronoun|ضمير وصل
demonstrative adjective|صفة إشارية
possessive adjective|صفة ملكية
pronoun|ضمير
proper noun|اسم علم
verbal noun|اسم يدلّ على الحدث
noun phrase|عبارة اسمية
noun modifier|وصف للاسم
noun-modifying|واصف للاسم
noun-modifier|واصف للاسم
nominal use|استعمال اسمي
nominalized|محوّل إلى اسم
nominal|اسمي
noun|اسم
compound verb|فعل مركّب
auxiliary verb|فعل مساعد
existential verb|فعل يدلّ على الوجود
copula verb|فعل رابط
verb phrase|عبارة فعلية
verb stem|جذع الفعل
verb root|جذر الفعل
verb|فعل
copula|فعل رابط
auxiliary|مساعد
existential|دالّ على الوجود
genitive case|حالة الملكية
possessive case|حالة الملكية
instrumental case|حالة الأداة أو الوسيلة
locative case|حالة المكان
objective case|حالة المفعول
nominative case|حالة الفاعل غير الموسوم
accusative case|حالة المفعول المباشر
dative case|حالة المتلقّي
ergative case|حالة فاعل الفعل المتعدّي
ablative case|حالة المصدر أو الابتداء
genitive|ملكية
possessive|ملكية
instrumental|أداة أو وسيلة
locative|مكان
nominative|فاعل غير موسوم
accusative|مفعول مباشر
dative|متلقّي
ergative|فاعل فعل متعدٍّ
ablative|مصدر أو ابتداء
postpositional phrase|عبارة بأداة تأتي بعد الاسم
postpositional use|استعمال أداة بعد الاسم
postposition|أداة تأتي بعد الاسم
adverbial phrase|عبارة ظرفية
adverbial particle|أداة ظرفية
interrogative particle|أداة استفهام
sentence-final particle|أداة في نهاية الجملة
conjunctive particle|أداة ربط
particle|أداة
adjective|صفة
adjectival use|استعمال وصفي
adjectival|وصفي
adverb|ظرف
adverbial usage|استعمال ظرفي
adverbial|ظرفي
used adverbially|مستعمل كظرف
used adjectivally|مستعمل كصفة
used as object|مستعمل كمفعول
used as modifier|مستعمل كوصف
object of verb phrase|مفعول العبارة الفعلية
predicative use|استعمال في المسند
conditional clause|جملة شرطية
relative clause|جملة صلة
temporal clause|جملة زمنية
causal clause|جملة تعليلية
clause|جملة
conditional marker|علامة شرط
conditional|شرط
concessive|استدراك رغم الشرط
concession|استدراك رغم الشرط
conjunction for quotation|أداة ربط لنقل الكلام
conjunction|أداة ربط
quotative|نقل الكلام
conjunctive|ربط
converb|صيغة فعلية تربط الأحداث
continuative|استمرار أو ربط
infinitive|الصيغة المصدرية للفعل
gerundive|صيغة فعلية للوجوب
gerund|اسم الحدث
imperative|أمر
hortative|اقتراح مشترك
optative|تمنٍّ
obligative|وجوب
potential|إمكان
passive|مبني للمجهول
causative|صيغة سببية
transitive|متعدٍّ
intransitive|لازم
negative|نفي
negation|نفي
positive|إثبات
affirmative|إثبات
perfective|حدث مكتمل
perfect|تام
progressive|استمرار
continuous|استمرار
habitual|عادة
honorific|صيغة احترام
mid-honorific|درجة احترام متوسطة
non-honorific|صيغة بلا تعظيم
polite|مهذّب
respectful|بصيغة احترام
informal|غير رسمي
formal|رسمي
feminine|مؤنّث
masculine|مذكّر
neuter|محايد الجنس
interrogative word|أداة استفهام
interrogative adverb|ظرف استفهام
interrogative|استفهام
demonstrative|إشارة
attributive|وصف للاسم
comparative|مقارنة
superlative|تفضيل
determiner|محدّد للاسم
quantifier|محدّد للكمية
numeral|عدد
number|عدد
interjection|تعبير انفعالي
loanword|كلمة دخيلة
compound word|كلمة مركّبة
compound|مركّب
idiomatic expression|تعبير اصطلاحي
expression|تعبير
emphatic|توكيد
emphasis|توكيد
assertive|تقرير جازم
restrictive|حصر
contrast|مقابلة
adversative|استدراك
addition|إضافة
benefactive|دلالة على المستفيد
impersonal|غير شخصي
time expression|تعبير زمني
time|زمان
place|مكان
direction|اتجاه
cause|سبب
causal|تعليل
reason|سبب
source|مصدر أو نقطة انطلاق
means|وسيلة
purpose|غرض
purposive|دالّ على الغرض
manner|كيفية
temporal|زمني
simultaneous action|فعل متزامن
simultaneous|تزامن
sequential|تعاقب
alternative|اختيار بين بدائل
subject|فاعل أو مسند إليه
object|مفعول
modifier|وصف
relative|وصل
reduplicated|تكرار لفظي
condition|شرط
tense|زمن الفعل
aspect|جهة الحدث
form|صيغة
stem|جذع
root|جذر
use|استعمال
usage|استعمال
assertion|تقرير جازم
identificational|تعريف بالهوية
identity|هوية
polite register|أسلوب مهذّب
polite request|طلب مهذّب
polite language|كلام مهذّب
politeness adverb|ظرف للتأدّب
case marker|علامة للدور النحوي
marker|علامة
case|حالة نحوية
directional|اتجاه
path|مسار
scene|مشهد
context|سياق
target|جهة مقصودة
counter/measure word|كلمة عدّ أو قياس
counter word|كلمة عدّ
counter|كلمة عدّ
classifier|كلمة تصنيف عند العدّ
obligation construction|تركيب الوجوب
obligation expression|تعبير عن الوجوب
obligatory|واجب
obligation|وجوب
indefinite article|أداة تنكير
article-like modifier|وصف شبيه بأداة التنكير
article-like determiner|محدّد شبيه بأداة التنكير
article-like adjective|صفة شبيهة بأداة التنكير
article-like numeral|عدد مستعمل كأداة تنكير
indefinite-article-like|شبيه بأداة التنكير
article usage|استعمال شبيه بأداة التعريف أو التنكير
kinship term|لفظ قرابة
starting point|نقطة البداية
route|طريق
instrument|أداة أو وسيلة
comparison|مقارنة
material|مادة
comitative|دلالة على المصاحبة
accompaniment|مصاحبة
predicative|استعمال في المسند
predicate|مسند
connective|ربط
completed|مكتمل
completive|اكتمال
completion|اكتمال
volitional|إرادة أو عزم
objective|متعلّق بالمفعول
topic|موضوع الكلام
adverb-forming suffix|لاحقة لتكوين ظرف
adverbializing suffix|لاحقة لتكوين ظرف
suffix|لاحقة
prefix|سابقة
degree|درجة
short form|صيغة مختصرة
quantity|كمية
quantitative|دالّ على الكمية
pronominal|ضميري
focus particle|أداة تركيز
focusing particle|أداة تركيز
clitic|عنصر لغوي متّصل
involvement|مشاركة
time word|كلمة زمنية
limitative|تحديد النطاق
range|نطاق
endpoint|نقطة النهاية
goal|غاية
destination|وجهة
limit|حدّ
formal/dummy noun|اسم ذو وظيفة تركيبية
agentive|دالّ على القائم بالفعل
agent|القائم بالفعل
active case|حالة القائم بالفعل
coordination|ربط متوازٍ
coordinating|ربط متوازٍ
coordinative|ربط متوازٍ
greeting|تحية
question particle|أداة استفهام
sentence-initial question marker|علامة استفهام في أول الجملة
question sentence marker|علامة للجملة الاستفهامية
ordinal numeral|عدد ترتيبي
ordinal|ترتيبي
counter-like usage|استعمال شبيه بكلمة العدّ
number of times|عدد المرات
verbal phrase|عبارة فعلية
verbal|فعلي
indefinite adjective|صفة غير محدّدة
contrastive addition|إضافة مع المقابلة
parallel enumeration and emphasis|تعداد متوازٍ وتوكيد
additive|إضافة
complementizer|أداة تربط جملة مكمّلة
nominalizing|تحويل إلى اسم
relativizing particle|أداة لتكوين جملة صلة
quotation clause formation|تكوين جملة لنقل الكلام
quotative particle function|وظيفة أداة نقل الكلام
quotation marker|علامة نقل الكلام
quotation particle|أداة نقل الكلام
quotation|نقل الكلام
indefinite|غير محدّد
possibility|احتمال
conjecture|تخمين
conjectural|تخمين
postpositional|متعلّق بأداة تأتي بعد الاسم
indirect-question marker|علامة سؤال غير مباشر
relative-clause usage|استعمال جملة صلة
idiomatic usage|استعمال اصطلاحي
idiomatic|اصطلاحي
proximal|إشارة للقريب
proximate|إشارة للقريب
distal|إشارة للبعيد
prenominal|قبل الاسم
coordinate|ربط متوازٍ
distributive|توزيع
hypothetical|افتراض
reciprocal|تبادل
infinitive-like|شبيه بالصيغة المصدرية
past-participial use|استعمال وصفي للفعل الماضي
past-participial usage|استعمال وصفي للفعل الماضي
general|عام
iterative|تكرار
ability|قدرة
imperative sense|معنى الأمر
amount of money|مبلغ مالي
amount|مقدار
exclamation|تعجّب
exclamatory|تعجّب
absolutive|صيغة فعلية رابطة
date counter|كلمة عدّ للتاريخ
English loanword|كلمة دخيلة من الإنجليزية
people counter|كلمة لعدّ الأشخاص
currency unit|وحدة نقدية
currency|عملة
month name|اسم شهر
unit of time|وحدة زمنية
absolute participle|صيغة فعلية مستقلة للربط
similative|تشبيه
speculative|تخمين
mid-level honorific|درجة احترام متوسطة
middle honorific|درجة احترام متوسطة
tag question|سؤال تأكيدي في نهاية الجملة
question|سؤال
oblique|صيغة تتغيّر قبل الأداة
pre-postposition form|الصيغة التي تسبق الأداة اللاحقة للاسم
exceedance|تجاوز
definition|تعريف
nominalization|تحويل إلى اسم
adnominal|وصف للاسم
indirect question|سؤال غير مباشر
choice|اختيار
allative|دلالة على الاتجاه نحو شيء
inferential|استنتاج
location|موقع
presumptive|ترجيح
necessity expression|تعبير عن الضرورة
hearsay|نقل خبر مسموع
unit of distance|وحدة مسافة
unit of measurement|وحدة قياس
unit|وحدة
gradual-progressive|استمرار تدريجي
foreign borrowing|كلمة دخيلة
stative|دالّ على حالة
negated|منفي
command|أمر
gender|جنس نحوي
reflexive|انعكاسي
pre-verbal usage|استعمال قبل الفعل
preposition|أداة تأتي قبل الاسم
counterfactual|شرط مخالف للواقع
animal|حيوان
prohibitive|نهي
adverse effect|أثر سلبي
place name|اسم مكان
preceding clause|الجملة السابقة
quasi-adjectival|شبيه بالصفة
Sanskrit loanword|كلمة دخيلة من السنسكريتية
disjunctive|اختيار أو فصل
passive-like|شبيه بالمبني للمجهول
generic|دلالة عامة
universal|دلالة شاملة
voice|بناء الفعل للمعلوم أو المجهول
abbreviation|اختصار
sensory expression|تعبير عن إحساس
reportative|نقل خبر
linking|ربط
interior|داخل
exclusion|استثناء
limiter|تعبير للحصر
giving expression|تعبير عن الإعطاء
construction|تركيب
part|جزء
simultaneous-condition|تزامن وشرط
abessive|دلالة على انعدام شيء
confirmation|تأكيد
request|طلب
information acquired|معلومة تبيّنت حديثًا
discovery|اكتشاف
plain final form|صيغة ختامية بلا تعظيم
abstract noun|اسم معنى مجرّد
approximate|تقريب
resultative|دالّ على النتيجة
duration|مدة
postposition-like|شبيه بأداة تأتي بعد الاسم
mountain name|اسم جبل
onomatopoeia|محاكاة صوتية
honorific title|لقب احترام
posterior|لاحق
medial connective|ربط داخل الجملة
personal name|اسم شخص
surname|اسم عائلة
desiderative|رغبة
and|و
or|أو
possession|ملكية
identification|تحديد الهوية
definitional|تعريفي
sentence-final|في نهاية الجملة
confirmatory|تأكيدي
strong assertion|توكيد جازم
recipient|متلقّي
beneficiary|مستفيد
experiencer|صاحب الإحساس أو التجربة
possessor|مالك
state|حالة
affiliation|انتماء
situation|وضع
field|مجال
domain|مجال
existence|وجود
method|طريقة
scope|نطاق
medium|وسيط
point in time|لحظة زمنية
period|فترة
belonging|انتماء
noun modification|وصف الاسم
relationship|علاقة
relation|علاقة
emotional expression|تعبير عن المشاعر
emotional expressions|تعبيرات عن المشاعر
emotion|شعور
sensation|إحساس
frequency|تكرار
action|فعل أو حدث
continuation|استمرار
contraction|اختصار
intention|نية
prohibition|نهي
permission|إذن
necessity|ضرورة
result|نتيجة
habit|عادة
tendency|ميل
desire|رغبة
request expression|تعبير عن الطلب
plain-polite form|صيغة مهذّبة عادية
direct object|مفعول مباشر
indirect object|مفعول غير مباشر
animate object|مفعول يدلّ على كائن حيّ
origin|أصل أو مصدر
recurrence|تكرّر
repetition|تكرار
ownership|ملكية
companionship|رفقة
joint action|فعل مشترك
co-agent|مشارك في الفعل
counterpart|طرف مقابل
association|ارتباط
connection|ارتباط
quality|صفة أو خاصية
modification|وصف
adjectives|صفات
verbs|أفعال
nouns|أسماء
clauses|جمل
infinitives|صيغ مصدرية
the following noun|الاسم التالي
following noun|الاسم التالي
the preceding noun|الاسم السابق
preceding noun|الاسم السابق
genitive marker|علامة الملكية
possessive marker|علامة الملكية
locative case marker|علامة المكان
emphatic particle|أداة توكيد
positive evaluation|تقييم إيجابي
borrowed word|كلمة دخيلة
occupational noun|اسم مهنة
cardinal numeral|عدد أصلي
resulting state|حالة ناتجة
continuing state|حالة مستمرة
compound words|كلمات مركّبة
head noun|الاسم الرئيسي
perfect aspect|جهة الحدث التام
perfect tense|زمن تام
existential construction|تركيب يدلّ على الوجود
purpose clause|جملة للغرض
negative sentences|جمل منفية
interrogative sentences|جمل استفهامية
affirmative sentences|جمل مثبتة
transitive sentences|جمل بفعل متعدٍّ
transitive verbs|أفعال متعدّية
sensory verbs|أفعال الإحساس
emotive verbs|أفعال المشاعر
psychological verbs|أفعال نفسية
emotional verbs|أفعال المشاعر
plural subject|فاعل أو مسند إليه جمع
singular subject|فاعل أو مسند إليه مفرد
adjectival phrase|عبارة وصفية
subject clause|جملة في موقع المسند إليه
object clause|جملة في موقع المفعول
subordinate clause|جملة تابعة
volition|إرادة
expectation|توقّع
separation|انفصال
restriction|تقييد
emotive sentence|جملة تعبّر عن المشاعر
'''

_TERMS = dict(line.split('|', 1) for line in TERMS.strip().splitlines())
_TERMS = {key.lower(): value for key, value in _TERMS.items()}
_PATTERN = re.compile(r'(?<![\w-])(' + '|'.join(re.escape(x) for x in sorted(_TERMS, key=len, reverse=True)) + r')(?![\w-])', re.I)


def translate_label(text):
    # Fully parsed terminology only; never leave an English fragment behind.
    result = _PATTERN.sub(lambda m: _TERMS[m[0].lower()], text)
    return None if re.search('[A-Za-z]', result) else result.replace(', ', '، ')


def translate_note(text):
    translated = translate_label(text)
    if translated:
        return translated
    for prefix, template in [
        ('indicates ', 'يدلّ على: {}'), ('indicating ', 'يدلّ على: {}'),
        ('expresses ', 'يعبّر عن: {}'), ('expressing ', 'يعبّر عن: {}'),
        ('used as ', 'الاستعمال: {}'), ('used as the ', 'الاستعمال: {}'),
        ('used in ', 'يُستعمل في: {}'), ('marks ', 'علامة على: {}'),
        ('marking ', 'علامة على: {}'), ('functions as ', 'الوظيفة: {}'),
        ('functions as a ', 'الوظيفة: {}'), ('functions as an ', 'الوظيفة: {}'),
        ('forms ', 'يكوّن: {}'), ('forms a ', 'يكوّن: {}'), ('forms an ', 'يكوّن: {}'),
        ('modifies ', 'يصف: {}'), ('emphasizes ', 'يؤكّد: {}'),
    ]:
        if text.lower().startswith(prefix):
            body = translate_label(text[len(prefix):])
            if body:
                return template.format(body)
    return None


def apply():
    plan_path = WORK / 'arabic_translation_requests.json'
    assert hashlib.sha256(plan_path.read_bytes()).hexdigest() == 'c3d316fdedc73d0e1b67137c917fc162386e11e86fc9e53ba32db0d85714cf6f'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    cache_path = WORK / 'arabic_translations.json'
    cache = json.loads(cache_path.read_text(encoding='utf-8'))
    # The Korean review already distinguished recognized label patterns from
    # prose, word glosses and source errors. Restrict reuse to that exact subset.
    korean = json.loads((WORK / 'korean_translations.json').read_text(encoding='utf-8'))
    count = 0
    for key, source in plan['requests'].items():
        if key in cache['items']:
            continue
        previous = korean['items'].get(key, {})
        if previous.get('origin') != 'reviewed-grammar-terminology; complete-label coverage':
            continue
        value = translate_note(source['en'])
        if value:
            cache['items'][key] = {'source': source, 'ar': value, 'reviewed': True,
                                   'origin': 'reviewed-arabic-grammar-terminology; complete-label coverage'}
            count += 1
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps({'recorded': count, 'reviewedTotal': len(cache['items'])}))


if __name__ == '__main__':
    apply()
