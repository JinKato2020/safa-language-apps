"""Record directly authored/reviewed Korean, with an exact source-plan guard.

stdin: first line 'plan=<sha256>', then source-index|Korean text (\\n for newlines).
No network or paid API is used. The translation cache is the resumable master.
"""
import hashlib
import json
import sys
from pathlib import Path

WORK = Path(__file__).resolve().parents[1] / '文法教材'


def record(text):
    plan_path = WORK / 'korean_translation_requests.json'
    lines = text.strip().splitlines()
    assert lines[0] == 'plan=' + hashlib.sha256(plan_path.read_bytes()).hexdigest(), 'Source plan changed'
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    rows = list(plan['requests'].items())
    cache_path = WORK / 'korean_translations.json'
    cache = json.loads(cache_path.read_text(encoding='utf-8'))
    seen = set()
    for line in lines[1:]:
        index, ko = line.split('|', 1)
        key, source = rows[int(index)]
        assert key not in seen, index
        assert ko.strip(), index
        seen.add(key)
        cache['items'][key] = {'source': source, 'ko': ko.replace('\\n', '\n'),
                               'reviewed': True, 'origin': 'direct-in-session-translation-and-source-check'}
    tmp = cache_path.with_suffix('.next')
    tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    tmp.replace(cache_path)
    print(json.dumps({'recorded': len(seen), 'reviewedTotal': sum(v.get('reviewed') is True for v in cache['items'].values())}))


if __name__ == '__main__':
    record(sys.stdin.read())
