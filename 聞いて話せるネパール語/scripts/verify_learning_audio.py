"""Check every bundled learning recording against its bilingual source and manifest."""
import argparse,concurrent.futures,hashlib,json,subprocess
from pathlib import Path
APP=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def verify(ffprobe):
    manifest=read(APP/'文法教材/learning_audio_manifest.json');used=set()
    for lang in ['ja','en']:
        legacy=read(APP/'文法教材/beginner_learning_path.json')[lang]
        grammar=read(APP/'文法教材/grammar_practice.json')[lang]
        letters=read(APP/'文法教材/letters_sounds.json')[lang]
        samples=[*legacy['exercises'].values(),*[s for b in legacy['intro'] for s in b.get('samples',[])],*grammar['exercises'].values(),*[s for b in letters['sections'] for s in b['samples'] if s.get('audio')],*[s for r in letters['combinations'] for s in r['samples']]]
        for s in samples:
            text=s.get('speech',s['ne']);assert s['audio']==manifest[text],text;used.add(text)
    assert used==set(manifest),'Unreferenced/missing manifest entries'
    def check(a):
        f=APP/'expo-app/assets/learning-audio'/f"learning-{a['sha256']}.mp3";b=f.read_bytes()
        assert len(b)==a['bytes'] and hashlib.sha256(b).hexdigest()==a['sha256'],f
        result=json.loads(subprocess.check_output([ffprobe,'-v','error','-show_entries','stream=codec_name,sample_rate,channels:format=duration','-of','json',str(f)],text=True))
        stream=result['streams'][0];assert stream['codec_name']=='mp3' and stream['sample_rate']=='24000' and stream['channels']==1
        assert float(result['format']['duration'])>0
        return len(b)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:total=sum(pool.map(check,manifest.values()))
    print(f'PASS {len(manifest)} bilingual audio references, SHA-256, byte lengths, MP3 decoding, 24 kHz mono; {total} bytes. Phonetic quality requires listening review.')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--ffprobe',default='ffprobe');a=p.parse_args();verify(a.ffprobe)
