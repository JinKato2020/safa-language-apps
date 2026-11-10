"""Finite, reviewed Arabic letter-chart templates and exact glossary reuse."""
import json
import re
from collections import defaultdict
from record_arabic import WORK, record

PLAN = 'c3d316fdedc73d0e1b67137c917fc162386e11e86fc9e53ba32db0d85714cf6f'
COMPARISON = 'Hear the letter sound first, then compare the two words. Vowels can disappear and sounds can change within a word.'
AR_COMPARISON = 'استمع أولًا إلى صوت الحرف، ثم قارن الكلمتين. قد تُحذف بعض الصوائت أو تتغيّر الأصوات داخل الكلمة.'


def translate(text):
    match = re.fullmatch(r'([\u0900-\u097f]+) \+ अ \(inherent\) → ([\u0900-\u097f]+)', text)
    if match and match[1] == match[2]:
        return f'{match[1]} + अ → {match[2]}\nالصائت a ملازم للحرف.'
    match = re.fullmatch(r'([\u0900-\u097f]+) with (a|ā|i|ī|u|ū|ṛ / ri|e|ai|o|au)', text)
    if match:
        return f'{match[1]} مع الصائت {match[2]}'
    if text.endswith('\n' + COMPARISON):
        formula = text.split('\n')[0]
        if re.fullmatch(r'[\u0900-\u097f+ →]+', formula):
            return formula + '\n' + AR_COMPARISON
    return None


if __name__ == '__main__':
    plan = json.loads((WORK / 'arabic_translation_requests.json').read_text(encoding='utf-8'))
    cache = json.loads((WORK / 'arabic_translations.json').read_text(encoding='utf-8'))['items']
    # Only exact, unambiguous word-meaning matches; never apply UI adaptations.
    words = defaultdict(set)
    for value in cache.values():
        if value['reviewed'] and value['source']['context'].startswith('overlay.wordsL1.'):
            words[value['source']['en']].add(value['ar'])
    destinations = defaultdict(list)
    for d in plan['destinations']:
        destinations[d['key']].append(d['path'])
    rows = []
    for i, (key, source) in enumerate(plan['requests'].items()):
        if not source['context'].startswith('overlay.lettersSounds.') or cache.get(key, {}).get('reviewed'):
            continue
        ar = translate(source['en'])
        if not ar and all(path[-1] == 'meaning' for path in destinations[key]):
            candidates = words.get(source['en'], set())
            if len(candidates) == 1:
                ar = next(iter(candidates))
        if ar:
            rows.append(str(i) + '|' + ar.replace('\n', '\\n'))
    if rows:
        record('plan=' + PLAN + '\n' + '\n'.join(rows))
