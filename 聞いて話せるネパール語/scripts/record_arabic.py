"""Record reviewed Arabic against the exact source plan, without a paid API.

stdin: plan=<sha256>, followed by source-index|Arabic (\\n for newlines).
Use a JSON destination path instead of an index for a reviewed contextual override.
The Arabic cache is the resumable source of truth; unfinished text is not shipped.
"""
import hashlib
import json
import sys
from pathlib import Path
from localize_korean import destination_id, validate_overrides

WORK = Path(__file__).resolve().parents[1] / '文法教材'


def record(text):
    plan_path = WORK / 'arabic_translation_requests.json'
    lines = text.strip().splitlines()
    assert lines[0] == 'plan=' + hashlib.sha256(plan_path.read_bytes()).hexdigest(), 'Source plan changed'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    rows = list(plan['requests'].items())
    destinations = {destination_id(d['path']): d for d in plan['destinations']}
    cache_path = WORK / 'arabic_translations.json'
    cache = json.loads(cache_path.read_text(encoding='utf-8'))
    seen = set()
    for line in lines[1:]:
        index, arabic = line.split('|', 1)
        if index.startswith('['):
            path_id = destination_id(json.loads(index))
            assert path_id in destinations and path_id not in seen and arabic.strip(), index
            seen.add(path_id)
            cache.setdefault('overrides', {})[path_id] = {
                'sourceKey': destinations[path_id]['key'], 'sourcePlanSha256': lines[0][5:],
                'ar': arabic.replace('\\n', '\n'), 'reviewed': True,
                'origin': 'direct-in-session-destination-context-review',
            }
            continue
        key, source = rows[int(index)]
        assert key not in seen and arabic.strip(), index
        seen.add(key)
        preserve = arabic == '@preserve_nepali_source'
        if preserve:
            assert any('\u0900' <= ch <= '\u097f' for ch in source['en']), index
        cache['items'][key] = {
            'source': source, 'ar': source['en'] if preserve else arabic.replace('\\n', '\n'),
            'reviewed': True, 'origin': 'preserved-nepali-learning-content' if preserve else 'direct-in-session-translation-and-source-check',
        }
    validate_overrides(plan, cache, 'ar')
    temporary = cache_path.with_suffix('.next')
    temporary.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temporary.replace(cache_path)
    print(json.dumps({'recorded': len(seen), 'reviewedTotal': sum(v.get('reviewed') is True for v in cache['items'].values()), 'contextOverrides': len(cache.get('overrides', {}))}))


if __name__ == '__main__':
    record(sys.stdin.read())
