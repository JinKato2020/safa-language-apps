"""Audit resumable Arabic translations; full release is forbidden while incomplete."""
import argparse
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from localize_korean import validate_overrides, destination_translation

APP = Path(__file__).resolve().parents[1]
WORK = APP / '文法教材'
PLAN_SHA = 'c3d316fdedc73d0e1b67137c917fc162386e11e86fc9e53ba32db0d85714cf6f'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main(partial=False, require_lessons=False, require_practice=False, require_dictionary=False):
    path = WORK / 'arabic_translation_requests.json'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == PLAN_SHA, 'Source plan changed'
    plan, cache = read(path), read(WORK / 'arabic_translations.json')
    assert cache['language'] == 'ar'
    validate_overrides(plan, cache, 'ar')
    for path_id, item in cache.get('overrides', {}).items():
        assert re.search(r'[\u0620-\u064a]', item['ar']), ('Override not Arabic', path_id)
    assert not (set(cache['items']) - set(plan['requests'])), 'Unknown translation keys'
    for key, item in cache['items'].items():
        source = plan['requests'][key]
        assert item['source'] == source, ('Stale source', key)
        assert item.get('reviewed') is True, ('Unreviewed', key)
        assert isinstance(item.get('ar'), str) and item['ar'].strip(), ('Empty', key)
        preserved = item.get('origin') == 'preserved-nepali-learning-content'
        if preserved:
            assert item['ar'] == source['en'] and re.search(r'[\u0900-\u097f]', source['en']), ('Changed Nepali source', key)
        assert preserved or re.search(r'[\u0620-\u064a]', item['ar']) or source['en'] == '{{n}}×', ('Not Arabic', key)
        expected = set(re.findall(r'\{\{\w+\}\}', source['en']))
        if source['context'] == 'ui.courseCopy.c_3ec230bb4da9':
            expected.discard('{{p1}}')
        assert expected == set(re.findall(r'\{\{\w+\}\}', item['ar'])), ('Placeholders', key)
    fields = defaultdict(lambda: {'complete': 0, 'total': 0})
    lessons = defaultdict(lambda: {'complete': 0, 'total': 0})
    practice = read(APP / 'expo-app/data/overlays/en.json')['learningPathV3'] if require_practice else None
    ui = read(APP / 'expo-app/src/i18n/ar.json')
    for destination in plan['destinations']:
        field = 'ui' if destination['path'][0] == 'ui' else destination['path'][1]
        fields[field]['total'] += 1
        if field == 'grammarGuide':
            lesson = destination['path'][2]
            lessons[lesson]['total'] += 1
        if destination['key'] in cache['items']:
            fields[field]['complete'] += 1
            translated = destination_translation(cache, destination, 'ar')
            if field in {'grammarGuide', 'learningPathV3', 'nepaliDictionary'}:
                source = plan['requests'][destination['key']]
                assert translated.count('**') % 2 == 0, ('Unbalanced emphasis', destination['path'])
                # Danda punctuation may change with Arabic quoting; teaching letters may not.
                nepali = set(re.findall(r'[\u0900-\u0963\u0966-\u097f]+', source['en']))
                translated_nepali = set(re.findall(r'[\u0900-\u0963\u0966-\u097f]+', translated))
                assert not (nepali - translated_nepali), ('Missing Nepali teaching form', destination['path'], nepali - translated_nepali)
            if field == 'grammarGuide':
                lessons[lesson]['complete'] += 1
            if field == 'learningPathV3' and practice is not None:
                parent = practice
                for component in destination['path'][2:-1]:
                    parent = parent[component]
                parent[destination['path'][-1]] = translated
                # The source key is shared with the mother-language selector label.
                # The selector says Arabic, but अंग्रेजी inside a lesson still means English.
                if destination['path'][-1] == 'meaning' and plan['requests'][destination['key']]['en'] == 'English':
                    assert translated == 'الإنجليزية', ('Language-label leakage into lesson', destination['path'])
            if field == 'ui':
                value = ui
                for component in destination['path'][1:]:
                    value = value[component]
                assert value == destination_translation(cache, destination, 'ar'), destination['path']
    missing = len(plan['requests']) - len(cache['items'])
    if require_dictionary:
        assert fields['nepaliDictionary']['total'] == 2196, 'Dictionary source changed'
        assert fields['nepaliDictionary']['complete'] == fields['nepaliDictionary']['total'], 'Incomplete dictionary'
    if require_lessons:
        assert len(lessons) == 36 and all(v['complete'] == v['total'] for v in lessons.values()), ('Incomplete lessons', dict(lessons))
        assert fields['grammarVocab']['complete'] == fields['grammarVocab']['total'], 'Incomplete grammar vocabulary'
    if require_practice:
        assert fields['learningPathV3']['complete'] == fields['learningPathV3']['total'], 'Incomplete practice translations'
        assert len(practice['exercises']) == 720, 'Practice source changed'
        def fold(text):
            return re.sub(r'[\u0640\u064b-\u065f\u0670\u06d6-\u06ed\s.,،؟؛!]+', '', text).translate(str.maketrans({'أ': 'ا', 'إ': 'ا', 'آ': 'ا'}))
        for exercise_id, exercise in practice['exercises'].items():
            choices = exercise['meaningChoices']
            assert exercise['jp'] in choices, ('Practice answer missing', exercise_id)
            normalized = [fold(value) for value in choices]
            assert len(normalized) == len(set(normalized)), ('Ambiguous meaning options', exercise_id, choices)
    if not partial:
        assert not missing, f'Arabic release blocked: {missing} untranslated requests'
    print(json.dumps({'mode': 'partial audit only' if partial else 'complete audit',
                      'reviewedUnique': len(cache['items']), 'pendingUnique': missing,
                      'completeLessons': sum(v['complete'] == v['total'] for v in lessons.values()),
                      'contextOverrides': len(cache.get('overrides', {})),
                      'destinations': fields}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial', action='store_true')
    parser.add_argument('--require-lessons', action='store_true', help='Require all 34 grammar lessons and both appendices')
    parser.add_argument('--require-practice', action='store_true', help='Require all 720 exercises and distinct Arabic meaning options')
    parser.add_argument('--require-dictionary', action='store_true', help='Require every dictionary sense, note and example translation')
    args = parser.parse_args()
    main(args.partial, args.require_lessons, args.require_practice, args.require_dictionary)
