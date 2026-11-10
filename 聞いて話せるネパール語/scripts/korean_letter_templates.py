"""Reviewed Korean wording for the finite letter-chart label templates."""
import json
import re
from record_korean import WORK, record

PLAN = 'f45a15c05a0022254dab3689d0f70fc861df3c5e10b671b4a8b3d69f31b39ee3'
COMPARISON = 'Hear the letter sound first, then compare the two words. Vowels can disappear and sounds can change within a word.'
KO_COMPARISON = '먼저 글자의 소리를 듣고 두 단어를 비교해 보세요. 단어 안에서는 모음이 빠지거나 소리가 달라질 수 있어요.'


def translate(text):
    match = re.fullmatch(r'([\u0900-\u097f]+) \+ अ \(inherent\) → ([\u0900-\u097f]+)', text)
    if match and match[1] == match[2]:
        return text.replace('(inherent)', '(기본 모음)')
    match = re.fullmatch(r'([\u0900-\u097f]+) with (a|ā|i|ī|u|ū|ṛ / ri|e|ai|o|au)', text)
    if match:
        return f'{match[1]} + 모음 {match[2]}'
    if text.endswith('\n' + COMPARISON):
        formula = text.split('\n')[0]
        if re.fullmatch(r'[\u0900-\u097f+ →]+', formula):
            return formula + '\n' + KO_COMPARISON
    return None


if __name__ == '__main__':
    plan = json.loads((WORK / 'korean_translation_requests.json').read_text(encoding='utf-8'))
    cache = json.loads((WORK / 'korean_translations.json').read_text(encoding='utf-8'))['items']
    rows = []
    for i, (key, source) in enumerate(plan['requests'].items()):
        if source['context'].startswith('overlay.lettersSounds.') and not cache.get(key, {}).get('reviewed'):
            ko = translate(source['en'])
            if ko:
                rows.append(str(i) + '|' + ko.replace('\n', '\\n'))
            else:
                print(i, source['en'])
    if rows:
        record('plan=' + PLAN + '\n' + '\n'.join(rows))
