"""Check reviewed lessons, mirrors, and preservation of non-lesson content."""
import argparse
import json
import re
import subprocess
from pathlib import Path
from nepali_rule_clarifications import RULES, clarify
from package_beginner_grammar_update import markdown

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / '聞いて話せるネパール語'


def verify(baseline=None):
    changed = {}
    for lang in ('ja', 'en'):
        path = APP / f'expo-app/data/overlays/{lang}.json'
        data = json.loads(path.read_text(encoding='utf-8-sig'))
        guides = data['grammarGuide']
        assert set(guides) == set(map(str, range(1, 37)))
        assert guides == json.loads((APP / f'expo-app/src/grammarGuide.{lang}.json').read_text(encoding='utf-8-sig'))
        master = APP / '文法教材' / ('文法教材_v2_ja_ドラフト.md' if lang == 'ja' else 'grammar_guide_v2_en.md')
        assert master.read_text(encoding='utf-8') == markdown(guides, data['grammarThemeNames'], lang)
        for key, blocks in guides.items():
            assert blocks == clarify(blocks, int(key), lang)
            assert sum(bool(b.get('beginnerIntroEnd')) for b in blocks) == 1
            headers = [b['text'] for b in blocks if b['type'] == 'h']
            assert len(headers) == len(set(headers)), (lang, key, 'duplicate heading')
            for b in blocks:
                assert b['type'] in ('p', 'h', 'note', 'goal', 'table')
                if b['type'] == 'table':
                    assert all(len(row) == len(b['headers']) for row in b['rows'])
                    values = [cell for row in b['rows'] for cell in row]
                else: values = [b.get('text', '')]
                if b.get('clarityReview'):
                    assert all(s.count('**') % 2 == 0 for s in values)
                    assert not any(s.count('****') for s in values)
            for theme, number in RULES:
                if theme == int(key):
                    assert sum(b['type'] == 'h' and b.get('text', '').startswith(f'{number}. ') for b in blocks) == 1
        for theme, terms in {3: ['लाग्छ', 'लाग्यो', 'लागेन', 'लागेको छ'], 20: ['सक्छु', 'सक्छौं', 'सक्नुहुन्छ', 'सकिनँ', 'काम सकेँ'], 21: ['पर्छ', 'पर्यो', 'परेन', 'पाइन्छ', 'मिल्छ', 'पर्दैनथ्यो'], 22: ['मन छ', 'मन लाग्छ', 'मन लाग्यो', 'मन पर्यो'], 23: ['-ो', '-ी', '-ा', 'राम्री केटीहरू'], 24: ['कति राम्रो!'], 25: ['जत्तिकै'], 26: ['त्यसैले']}.items():
            text = json.dumps(guides[str(theme)], ensure_ascii=False)
            assert all(term in text for term in terms), (lang, theme)
        assert 'जसको किताब हुनुहुन्छ' not in json.dumps(guides['29'], ensure_ascii=False)
        assert 'चाहन्छिन्' not in json.dumps(guides['22'], ensure_ascii=False)
        assert 'चाहँदैनन्' not in json.dumps(guides['22'], ensure_ascii=False)
        for key in ('35', '36'):
            for b in guides[key]:
                if b['type'] == 'table' and b['headers'][0] in ('ネパール語', 'Nepali') and b['rows'][0][0].startswith(('म ', 'मैले ')):
                    assert len(b['rows']) in (6, 12)
                    assert all(not row[0].startswith(('तँ ', 'तिमी', 'तैंले ')) for row in b['rows'])
        if baseline:
            original = json.loads(subprocess.check_output(['git', 'show', f'{baseline}:{path.relative_to(ROOT).as_posix()}'], cwd=ROOT))
            assert {k: v for k, v in original.items() if k != 'grammarGuide'} == {k: v for k, v in data.items() if k != 'grammarGuide'}, 'Only guides may change'
            changed[lang] = [int(k) for k in guides if guides[k] != original['grammarGuide'][k]]
            for key in guides:
                assert [b for b in guides[key] if b.get('lessonSupplement')] == [b for b in original['grammarGuide'][key] if b.get('lessonSupplement')], 'Culture cards must be preserved'
    print(json.dumps({'reviewedThemesPerLanguage': 36, 'clarifiedRules': len(RULES), 'changedThemes': changed,
                      'mirrorsAndMasters': 'match', 'idempotent': True, 'nonLessonContent': 'unchanged'}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline')
    verify(parser.parse_args().baseline)
