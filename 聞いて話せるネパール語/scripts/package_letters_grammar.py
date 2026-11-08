"""Package the new course alongside legacy OTA fields for older installed shells."""
import argparse,json
from pathlib import Path
from package_beginner_grammar_update import markdown
APP=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def package(version):
    practice=read(APP/'文法教材/grammar_practice.json');letters=read(APP/'文法教材/letters_sounds.json')
    for lang in ['ja','en']:
        p=APP/f'expo-app/data/overlays/{lang}.json';overlay=read(p)
        samples=[*practice[lang]['exercises'].values(),*[s for section in letters[lang]['sections']for s in section['samples']if 'audio'in s],*[s for row in letters[lang]['combinations']for s in row['samples']],*[s for row in letters[lang].get('conjunctCombinations',[])for s in row['samples']]]
        samples.extend([w for s in list(samples) for w in s.get('examples',[])])
        assert all(s['audio']['bytes']>0 for s in samples),'Generate the audio before packaging'
        overlay.update(learningPathV3=practice[lang],lettersSounds=letters[lang],version=version,curriculumRevision=version)
        for step in practice[lang]['steps']:
            key=str(step['guideThemeId']);blocks=[b for b in overlay['grammarGuide'][key] if not b.get('practiceRuleV3')]
            # This rule is visible in the lesson itself as well as in practice preparation.
            index=next((i for i,b in enumerate(blocks) if b.get('beginnerIntroEnd')),len(blocks))
            blocks.insert(index,dict(type='note',text=('練習のポイント：'if lang=='ja'else'Practice focus: ')+step['goal'],practiceRuleV3=True,presentation=dict(tone='teal')))
            overlay['grammarGuide'][key]=blocks
        write(p,overlay);write(APP/f'expo-app/src/grammarGuide.{lang}.json',overlay['grammarGuide'])
        master='文法教材_v2_ja_ドラフト.md'if lang=='ja'else'grammar_guide_v2_en.md'
        (APP/'文法教材'/master).write_text(markdown(overlay['grammarGuide'],overlay['grammarThemeNames'],lang),encoding='utf-8')
    p=APP/'expo-app/data/ota-baseline/core.json';core=read(p);core['curriculumRevision']=version;write(p,core)
    print('Packaged letters and grammar practice:',version)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--version',type=int,required=True);a=p.parse_args();package(a.version)
