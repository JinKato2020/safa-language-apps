"""Prepare and assemble Korean content without changing Nepali or audio identities.

Preparation is local and free. API translation/review is a separate, budgeted step.
Only fully translated AND reviewed dictionaries may be assembled for release.
"""
import argparse
import copy
import hashlib
import json
import re
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
DATA = APP / 'expo-app/data'
WORK = APP / '文法教材'
SKIP = {'id', 'ne', 'roman', 'rom', 'speech', 'url', 'sha256', 'audio', 'value',
        'consonant', 'sign', 'base_form', 'sentence_id', 'type', 'tone', 'role',
        'join', 'ipa', 'source', 'sources', 'forms', 'grammarAudioRefs',
        'l1', 'posterLessons', 'learningPath', 'learningPathV2', 'nepaliDictionary'}


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def destination_id(path):
    return json.dumps(path, ensure_ascii=False, separators=(',', ':'))


def validate_overrides(plan, cache, language):
    """Keep reviewed exceptions for ambiguous English glosses tied to one exact source plan."""
    prefix = {'ko': 'korean', 'ar': 'arabic'}[language]
    plan_sha = hashlib.sha256((WORK / f'{prefix}_translation_requests.json').read_bytes()).hexdigest()
    destinations = {destination_id(d['path']): d for d in plan['destinations']}
    for path_id, item in cache.get('overrides', {}).items():
        assert path_id in destinations, f'Unknown override destination: {path_id}'
        key = destinations[path_id]['key']
        assert item.get('sourcePlanSha256') == plan_sha, f'Stale override plan: {path_id}'
        assert item.get('sourceKey') == key, f'Stale override key: {path_id}'
        assert item.get('reviewed') is True, f'Unreviewed override: {path_id}'
        value = item.get(language)
        assert isinstance(value, str) and value.strip(), f'Empty override: {path_id}'
        expected = set(re.findall(r'\{\{\w+\}\}', plan['requests'][key]['en']))
        assert expected == set(re.findall(r'\{\{\w+\}\}', value)), f'Override placeholders: {path_id}'


def destination_translation(cache, destination, language):
    override = cache.get('overrides', {}).get(destination_id(destination['path']))
    return (override or cache['items'][destination['key']])[language]


def prepare(language='ko'):
    prefix = {'ko': 'korean', 'ar': 'arabic'}[language]
    english = read(DATA / 'overlays/en.json')
    japanese = read(DATA / 'overlays/ja.json')
    core = read(DATA / 'ota-baseline/core.json')
    ui = read(APP / 'expo-app/src/i18n/en.json')
    ui_ja = read(APP / 'expo-app/src/i18n/ja.json')
    requests = {}
    destinations = []

    def add(path, en, ja='', ne=''):
        if not en or not re.search('[A-Za-z]', en):
            return
        # A term's Nepali context distinguishes, e.g., right-hand from correct.
        # Grammatical labels/explanations have the same meaning across many words.
        # Keep word context for glosses; retain source Nepali for full sentences.
        contextual = path[-1] in {'ja', 'base_meaning', language} or (len(path) > 1 and path[1] in {'examplesL1', 'grammarL1', 'wordsL1'})
        payload = {'en': en, 'ja': ja if isinstance(ja, str) else '', 'ne': ne if contextual else ''}
        key = hashlib.sha256(json.dumps({'en': en, 'ne': payload['ne']}, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]
        requests.setdefault(key, dict(payload, context='.'.join(map(str, path[:4]))))
        destinations.append({'path': path, 'key': key})

    def walk(en, ja, path, ne=''):
        if isinstance(en, dict):
            context = en.get('ne') or en.get('base_form') or ne
            for key, value in en.items():
                if key in SKIP:
                    continue
                if key == 'text' and en.get('presentation', {}).get('role') == 'reading':
                    continue
                # Context-vocabulary maps use the Nepali word itself as the key.
                word = key if re.search('[\u0900-\u097f]', key) else context
                walk(value, ja.get(key) if isinstance(ja, dict) else None, path + [key], word)
        elif isinstance(en, list):
            for i, value in enumerate(en):
                walk(value, ja[i] if isinstance(ja, list) and i < len(ja) else None, path + [i], ne)
        elif isinstance(en, str) and (en != ja or path[0] == 'ui') and not en.startswith(('https://', 'http://')):
            add(path, en, ja, ne)

    # Whole-sentence and single-word translations use the original Nepali as context.
    for field, core_field in [('examplesL1', 'examplesNe'), ('grammarL1', 'grammarNe'), ('wordsL1', 'wordsNe')]:
        for group, rows in english[field].items():
            for i, text in enumerate(rows):
                add(['overlay', field, group, i], text, japanese[field][group][i], core[core_field][group][i])
    for key, value in english.items():
        if key not in SKIP and key not in {'examplesL1', 'grammarL1', 'wordsL1'}:
            walk(value, japanese.get(key), ['overlay', key])
    # Keep the existing Japanese and English dictionary glosses, adding Korean.
    for i, entry in enumerate(english['nepaliDictionary']['entries']):
        root = ['overlay', 'nepaliDictionary', 'entries', i]
        for j, sense in enumerate(entry['senses']):
            add(root + ['senses', j, language], sense['en'], sense['ja'], entry['ne'])
        if entry.get('note'):
            add(root + ['note', language], entry['note']['en'], entry['note']['ja'], entry['ne'])
        for j, example in enumerate(entry['examples']):
            add(root + ['examples', j, language], example['en'], example['ja'], example['ne'])
    walk(ui, ui_ja, ['ui'])
    result = {'schema': 1, 'requests': requests, 'destinations': destinations}
    write(WORK / f'{prefix}_translation_requests.json', result)
    print(json.dumps({'requests': len(requests), 'destinations': len(destinations),
                      'englishCharacters': sum(len(r['en']) for r in requests.values()),
                      'contextCharacters': sum(len(r['ne']) + len(r['ja']) for r in requests.values())}))
    return result


def assemble(language='ko'):
    prefix = {'ko': 'korean', 'ar': 'arabic'}[language]
    plan = prepare(language)
    cache = read(WORK / f'{prefix}_translations.json')
    validate_overrides(plan, cache, language)
    required = set(plan['requests'])
    assert required <= set(cache['items']), f"Missing {len(required - set(cache['items']))} translations"
    for key in required:
        item = cache['items'][key]
        assert item.get('reviewed') is True, f'Unreviewed: {key}'
        assert isinstance(item.get(language), str) and item[language].strip(), f'Empty: {key}'
        assert item.get('source') == plan['requests'][key], f'Stale source: {key}'
        expected = set(re.findall(r'\{\{\w+\}\}', plan['requests'][key]['en']))
        actual = set(re.findall(r'\{\{\w+\}\}', item[language]))
        # Localized entry counts do not interpolate the English word entry/entries.
        if plan['requests'][key]['context'] == 'ui.courseCopy.c_3ec230bb4da9':
            expected.discard('{{p1}}')
        assert expected == actual, f'Placeholder mismatch: {key}'
    output = {'overlay': copy.deepcopy(read(DATA / 'overlays/en.json')),
              'ui': copy.deepcopy(read(APP / 'expo-app/src/i18n/en.json'))}
    for destination in plan['destinations']:
        parent = output
        for key in destination['path'][:-1]:
            parent = parent[key]
        parent[destination['path'][-1]] = destination_translation(cache, destination, language)
    overlay = output['overlay']
    overlay['l1'] = language
    # These retired fields are not used by the Korean-capable shell.
    for key in ['learningPath', 'learningPathV2', 'posterLessons']:
        overlay.pop(key, None)
    write(DATA / f'overlays/{language}.json', overlay)
    write(APP / f'expo-app/src/i18n/{language}.json', output['ui'])
    print(f'Assembled complete, reviewed {language} overlay and UI. Nepali text/audio retained.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--assemble', action='store_true')
    args = parser.parse_args()
    assemble() if args.assemble else prepare()
