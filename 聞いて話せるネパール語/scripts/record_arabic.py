"""Record reviewed Arabic against the exact source plan, without a paid API.

stdin: plan=<sha256>, followed by source-index|Arabic (\\n for newlines).
The Arabic cache is the resumable source of truth; unfinished text is not shipped.
"""
import hashlib
import json
import sys
from pathlib import Path

WORK = Path(__file__).resolve().parents[1] / '文法教材'


def record(text):
    plan_path = WORK / 'arabic_translation_requests.json'
    lines = text.strip().splitlines()
    assert lines[0] == 'plan=' + hashlib.sha256(plan_path.read_bytes()).hexdigest(), 'Source plan changed'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    rows = list(plan['requests'].items())
    cache_path = WORK / 'arabic_translations.json'
    cache = json.loads(cache_path.read_text(encoding='utf-8'))
    seen = set()
    for line in lines[1:]:
        index, arabic = line.split('|', 1)
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
    temporary = cache_path.with_suffix('.next')
    temporary.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temporary.replace(cache_path)
    print(json.dumps({'recorded': len(seen), 'reviewedTotal': sum(v.get('reviewed') is True for v in cache['items'].values())}))


if __name__ == '__main__':
    record(sys.stdin.read())
