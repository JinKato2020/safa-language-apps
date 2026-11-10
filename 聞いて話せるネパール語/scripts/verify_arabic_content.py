"""Audit resumable Arabic translations; full release is forbidden while incomplete."""
import argparse
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
WORK = APP / '文法教材'
PLAN_SHA = 'c3d316fdedc73d0e1b67137c917fc162386e11e86fc9e53ba32db0d85714cf6f'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main(partial=False):
    path = WORK / 'arabic_translation_requests.json'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == PLAN_SHA, 'Source plan changed'
    plan, cache = read(path), read(WORK / 'arabic_translations.json')
    assert cache['language'] == 'ar'
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
    ui = read(APP / 'expo-app/src/i18n/ar.json')
    for destination in plan['destinations']:
        field = 'ui' if destination['path'][0] == 'ui' else destination['path'][1]
        fields[field]['total'] += 1
        if destination['key'] in cache['items']:
            fields[field]['complete'] += 1
            if field == 'ui':
                value = ui
                for component in destination['path'][1:]:
                    value = value[component]
                assert value == cache['items'][destination['key']]['ar'], destination['path']
    missing = len(plan['requests']) - len(cache['items'])
    if not partial:
        assert not missing, f'Arabic release blocked: {missing} untranslated requests'
    print(json.dumps({'mode': 'partial audit only' if partial else 'complete audit',
                      'reviewedUnique': len(cache['items']), 'pendingUnique': missing,
                      'destinations': fields}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial', action='store_true')
    main(parser.parse_args().partial)
