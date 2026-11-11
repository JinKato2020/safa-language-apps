"""Verify reviewed Korean translations, preserved source structure and matching audio."""
import hashlib
import json
from pathlib import Path
from localize_korean import destination_translation, validate_overrides

APP = Path(__file__).resolve().parents[1]

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def verify():
    plan = read(APP/'文法教材/korean_translation_requests.json')
    cache = read(APP/'文法教材/korean_translations.json')
    validate_overrides(plan, cache, 'ko')
    items = cache['items']
    actual = {'overlay': read(APP/'expo-app/data/overlays/ko.json'),
              'ui': read(APP/'expo-app/src/i18n/ko.json')}
    expected = {'overlay': read(APP/'expo-app/data/overlays/en.json'),
                'ui': read(APP/'expo-app/src/i18n/en.json')}
    for key, source in plan['requests'].items():
        assert items[key]['source'] == source and items[key]['reviewed'] is True, key
        assert items[key]['ko'].strip(), key
    for destination in plan['destinations']:
        parent = expected
        for key in destination['path'][:-1]:
            parent = parent[key]
        parent[destination['path'][-1]] = destination_translation(cache, destination, 'ko')
    expected['overlay']['l1'] = 'ko'
    for key in ['learningPath', 'learningPathV2', 'posterLessons']:
        expected['overlay'].pop(key, None)
    assert expected == actual, 'Translated values or untranslated Nepali/audio structure differ'
    manifest = read(APP/'文法教材/korean_audio_manifest.json')
    wanted = {}
    for mode, field in [('conv', 'examplesL1'), ('gram', 'grammarL1')]:
        for group, rows in actual['overlay'][field].items():
            for i, text in enumerate(rows):
                wanted[f'{mode}/{group}-{i+1}.mp3'] = text
    assert set(wanted) == set(manifest['items'])
    for name, text in wanted.items():
        meta = manifest['items'][name]
        assert meta['text'] == text and meta['voice'] == 'ko-KR-SunHiNeural', name
        raw = (APP/'audio/ko'/name).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == meta['sha256'] and len(raw) == meta['bytes'], name
    print(f'PASS Korean: {len(plan["requests"])} reviewed translations / {len(plan["destinations"])} destinations; Nepali, romanization and source audio identities preserved; {len(wanted)} matching Korean recordings.')

if __name__ == '__main__':
    verify()
