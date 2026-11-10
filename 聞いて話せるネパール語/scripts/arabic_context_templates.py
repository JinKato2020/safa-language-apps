"""Translate only exact, reviewed context-note templates; preserve Nepali tokens.

This is a finite translation table, not word-by-word translation or a fallback.
Unknown prose remains pending. Preview is the default; --apply records matches.
"""
import argparse
import hashlib
import json
import re
from collections import defaultdict
from record_arabic import WORK

PLAN_SHA = 'c3d316fdedc73d0e1b67137c917fc162386e11e86fc9e53ba32db0d85714cf6f'
NEPALI = re.compile(r'[\u0900-\u0963\u0966-\u097f]+(?:[ \u200c\u200d]*[\u0900-\u0963\u0966-\u097f]+)*')

TEMPLATES = '''
combines with {0}|يأتي في تركيب مع {0}
combine with {0}|يأتي في تركيب مع {0}
combining with {0}|يأتي في تركيب مع {0}
combined with {0}|مركّب مع {0}
co-occurs with {0}|يرد مع {0}
collocates with {0}|يشيع وروده مع {0}
used in combination with {0}|يُستعمل في تركيب مع {0}
used together with {0}|يُستعمل مع {0}
compound with {0}|تركيب مع {0}
compounded with {0}|مركّب مع {0}
compounds with {0}|يُركَّب مع {0}
forms compound with {0}|يُكوّن تركيبًا مع {0}
forms a compound with {0}|يُكوّن تركيبًا مع {0}
object of {0}|مفعول لـ {0}
subject of {0}|فاعل أو مسند إليه لـ {0}
modifies {0}|يصف {0}
modifying {0}|يصف {0}
modified by {0}|موصوف بـ {0}
combines with {0} to form a verb phrase|يأتي مع {0} لتكوين عبارة فعلية
noun (forms a verb phrase with {0})|اسم يُكوّن عبارة فعلية مع {0}
noun (forms verb phrase with {0})|اسم يُكوّن عبارة فعلية مع {0}
noun (combines with {0} to form a verb phrase)|اسم يأتي مع {0} لتكوين عبارة فعلية
noun (compound verb with {0})|اسم يدخل في فعل مركّب مع {0}
noun (verbalized with {0})|اسم يُستخدم مع {0} لتكوين فعل
compound verb with {0}|فعل مركّب مع {0}
forms compound verb with {0}|يُكوّن فعلًا مركّبًا مع {0}
correlates with {0}|يقترن بـ {0} في التعبير
combines with postposition {0}|يأتي مع الأداة {0} التي تلي الاسم
combined with postposition {0}|مركّب مع الأداة {0} التي تلي الاسم
compound of {0} + {1}|تركيب من {0} + {1}
compound word with {0}|كلمة مركّبة مع {0}
forms a compound word with {0}|يُكوّن كلمة مركّبة مع {0}
polite imperative form of {0}|صيغة أمر مهذّبة من {0}
polite imperative of {0}|صيغة أمر مهذّبة من {0}
negative form of {0}|صيغة النفي من {0}
contrasted with {0}|يُقابَل بـ {0}
genitive form of {0}|صيغة الملكية من {0}
genitive of {0}|صيغة الملكية من {0}
used idiomatically with {0}|يُستعمل مع {0} في تعبير اصطلاحي
plural form of {0}|صيغة الجمع من {0}
emphatic form of {0} + {1}|صيغة تأكيد من {0} + {1}
part of {0}|جزء من {0}
{0} is the plural form|{0} هي صيغة الجمع
plural form is {0}|صيغة الجمع هي {0}
used in parallel with {0}|يُستعمل بالتوازي مع {0}
combines with {0} to form predicate|يأتي مع {0} لتكوين المسند
forms predicate together with {0}|يُكوّن المسند مع {0}
forms predicate with {0}|يُكوّن المسند مع {0}
dative form of {0}|صيغة المتلقّي من {0}
present perfect with {0}|المضارع التام مع {0}
gerund form of {0}|صيغة اسم الحدث من {0}
infinitive + {0} = want to ~|صيغة مصدرية + {0} = يريد أن يفعل
connected with {0}|مرتبط بـ {0}
connects with {0}|يرتبط بـ {0}
combines with {0} to mean 'to speak'|يأتي مع {0} بمعنى «يتكلّم»
{0} expresses continuation|{0} تعبّر عن الاستمرار
combines with {0} to form perfect|يأتي مع {0} لتكوين الصيغة التامة
combines with {0} to form present perfect|يأتي مع {0} لتكوين المضارع التام
used together with {0} for emphasis|يُستعمل مع {0} للتأكيد
{0} + {1} = because ~|{0} + {1} = لأنّ
combines with verb {0}|يأتي مع الفعل {0}
participle modifying {0}|صيغة وصفية للفعل تصف {0}
used with {0} to form potential expressions|يُستعمل مع {0} للتعبير عن الإمكان
combines with {0} to form a potential expression|يأتي مع {0} للتعبير عن الإمكان
negated with {0}|يُنفى بـ {0}
derived form of {0}|صيغة مشتقّة من {0}
combines with {0} to form continuative aspect|يأتي مع {0} للتعبير عن استمرار الحدث
combines with {0} to indicate starting point|يأتي مع {0} لتحديد نقطة البداية
genitive modification with {0}|وصف بعلاقة ملكية باستخدام {0}
coordinated with {0}|معطوف مع {0}
plural with {0}|جمع باستخدام {0}
combined with {0} to mean 'to be surprised'|يأتي مع {0} بمعنى «يندهش»
'''
TABLE = dict(line.split('|', 1) for line in TEMPLATES.strip().splitlines())


def translate(text):
    pieces = []
    def capture(match):
        pieces.append(match[0])
        return '{' + str(len(pieces) - 1) + '}'
    pattern = NEPALI.sub(capture, text).strip().rstrip('.').lower()
    pattern = re.sub(r"['‘’\"“”](\{\d+\})['‘’\"“”]", r'\1', pattern)
    template = TABLE.get(pattern)
    if template is None:
        return None
    assert pieces and set(re.findall(r'\{\d+\}', pattern)) == set(re.findall(r'\{\d+\}', template))
    return template.format(*pieces), pattern


def main(apply=False):
    plan_path = WORK / 'arabic_translation_requests.json'
    assert hashlib.sha256(plan_path.read_bytes()).hexdigest() == PLAN_SHA, 'Source plan changed'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    cache_path = WORK / 'arabic_translations.json'
    cache = json.loads(cache_path.read_text(encoding='utf-8'))
    candidates = defaultdict(list)
    for index, (key, source) in enumerate(plan['requests'].items()):
        if key in cache['items'] or not source['context'].startswith('overlay.convVocab.') or not source['context'].endswith('.contexts'):
            continue
        result = translate(source['en'])
        if result is None:
            continue
        arabic, pattern = result
        candidates[pattern].append((index, source['en'], arabic))
        if apply:
            cache['items'][key] = {'source': source, 'ar': arabic, 'reviewed': True,
                                  'origin': 'reviewed-exact-Arabic-context-template', 'template': pattern}
    if apply:
        temporary = cache_path.with_suffix('.next')
        temporary.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
        temporary.replace(cache_path)
    for pattern, rows in candidates.items():
        print(json.dumps({'pattern': pattern, 'count': len(rows), 'first': rows[0]}, ensure_ascii=False))
    print(json.dumps({'applied': apply, 'matches': sum(map(len, candidates.values())), 'reviewedTotal': len(cache['items'])}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    main(parser.parse_args().apply)
