"""Import authored UI and exact bilingual reuse candidates without calling an API.

Existing course translations remain unreviewed until checked against the Nepali.
Matching requires identical Nepali AND Japanese, never only an English gloss.
"""
import collections
import json
import re
from pathlib import Path
from localize_korean import APP, WORK, prepare, read, write


def reuse():
    plan = prepare()
    cache_path = WORK / 'korean_translations.json'
    cache = read(cache_path) if cache_path.exists() else {'schema': 1, 'items': {}}
    other = APP.parent / '聞いて話せる日本語/expo-app/data'
    korean = read(other / 'overlays/ko.json')
    candidates = collections.defaultdict(set)
    for field, filename in [('examplesL1', 'examples.json'), ('grammarL1', 'grammarExamples.json'), ('wordsL1', 'words.json')]:
        for group, rows in read(other / filename).items():
            translated = korean.get(field, {}).get(group, [])
            for i, row in enumerate(rows):
                if i < len(translated) and re.search('[가-힣]', translated[i]):
                    candidates[(row.get('ne', ''), row.get('jp', row.get('ja', '')))].add(translated[i])
    ui = read(APP / 'expo-app/src/i18n/ko.json')
    ui_destinations = {d['key']: d['path'][1:] for d in plan['destinations'] if d['path'][0] == 'ui'}
    counts = collections.Counter()
    for key, request in plan['requests'].items():
        prior = cache['items'].get(key)
        if prior and prior.get('source') == request and key not in ui_destinations:
            continue
        if key in ui_destinations:
            translated = ui
            for part in ui_destinations[key]:
                translated = translated[part]
            cache['items'][key] = {'source': request, 'ko': translated, 'reviewed': True, 'origin': 'authored-and-reviewed-in-session'}
            counts['authoredUI'] += 1
        else:
            matches = candidates[(request['ne'], request['ja'])]
            if request['ne'] and len(matches) == 1:
                cache['items'][key] = {'source': request, 'ko': next(iter(matches)), 'reviewed': False, 'origin': 'App B: identical Nepali and Japanese; awaiting review'}
                counts['reuseCandidates'] += 1
    write(cache_path, cache)
    print(json.dumps(dict(counts), ensure_ascii=False))


if __name__ == '__main__':
    reuse()
