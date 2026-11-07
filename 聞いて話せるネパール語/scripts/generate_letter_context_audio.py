"""Extract letter sounds from Hemkala carrier sentences using word timestamps.

Requires the official azure-cognitiveservices-speech SDK, numpy and scipy.
Example: python scripts/generate_letter_context_audio.py --sdk-path <temporary SDK dir>
The three sibilants reuse the user's approved recording, aligned to raw-PCM
timestamp output; they are never replaced with a different-vowel syllable.
"""
import argparse,hashlib,json,re,subprocess,sys
from pathlib import Path
from xml.sax.saxutils import escape
APP=Path(__file__).resolve().parents[1]
ROOT=APP.parent
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--sdk-path',type=Path);parser.add_argument('--ffmpeg',default='ffmpeg');a=parser.parse_args()
    if a.sdk_path:sys.path.insert(0,str(a.sdk_path.resolve()))
    import azure.cognitiveservices.speech as sdk
    import numpy as np
    from scipy.signal import correlate,correlation_lags
    from build_letters_sounds import CONJUNCTS
    env={}
    for app in ['聞いて話せる日本語','聞いて話せるネパール語']:
        for line in (ROOT/app/'.env').read_text(encoding='utf-8-sig').splitlines():
            m=re.match(r'^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$',line)
            if m:env[m[1]]=m[2].strip('"\'')
    config=sdk.SpeechConfig(subscription=env['AZURE_SPEECH_KEY'],region=env['AZURE_SPEECH_REGION'])
    config.set_speech_synthesis_output_format(sdk.SpeechSynthesisOutputFormat.Raw24Khz16BitMonoPcm)
    config.set_property_by_name('SpeechServiceResponse_RequestWordBoundary','true')
    synth=sdk.SpeechSynthesizer(speech_config=config,audio_config=None)
    events=[]
    synth.synthesis_word_boundary.connect(lambda e:events.append(dict(text=e.text,start=e.audio_offset/10_000_000,duration=e.duration.total_seconds(),kind=str(e.boundary_type))))
    def synthesize(text):
        events.clear()
        ssml=f'<speak version="1.0" xml:lang="ne-NP"><voice name="ne-NP-HemkalaNeural"><prosody rate="0%">{escape(text)}</prosody></voice></speak>'
        r=synth.speak_ssml_async(ssml).get()
        if r.reason!=sdk.ResultReason.SynthesizingAudioCompleted:raise RuntimeError('Speech synthesis failed: '+str(r.reason))
        return np.frombuffer(r.audio_data,dtype='<i2').copy(),list(events)
    sources=APP/'文法教材/音声生成ソース';sources.mkdir(exist_ok=True)
    approved=sources/'approved-sibilants.mp3'
    if not approved.exists():approved.write_bytes((APP/'文法教材/発音確認_20261108/sibilants-sentence-context.mp3').read_bytes())
    manifest_path=APP/'文法教材/learning_audio_manifest.json';manifest=read(manifest_path)
    audit_path=APP/'文法教材/letter_audio_sources.json';audit=read(audit_path) if audit_path.exists() else {}
    out=APP/'expo-app/assets/learning-audio';out.mkdir(exist_ok=True)
    def store(letter,pcm,bounds,phrase,source,shift=0,extra=None):
        word=[e for e in bounds if e['text']==letter and e['kind'].endswith('.Word')]
        if len(word)!=1:raise ValueError(f'Expected one exact word boundary for {letter}: {bounds}')
        e=word[0];start=e['start']+shift;end=start+e['duration']
        assert .04<=e['duration']<=1.5,(letter,e)
        previous=max((x['start']+x['duration']+shift for x in bounds if x['start']<e['start']),default=0)
        following=min((x['start']+shift for x in bounds if x['start']>e['start']),default=len(pcm)/24000)
        # Preserve consonant onset/tail while never crossing a neighbouring word.
        lo=max(0,start-.015,(previous+start)/2);hi=min(len(pcm)/24000,end+.015,(end+following)/2)
        clip=pcm[round(lo*24000):round(hi*24000)]
        assert len(clip)>900 and float(np.sqrt(np.mean(clip.astype(float)**2)))>80,letter
        padded=np.concatenate([np.zeros(2400,dtype='<i2'),clip,np.zeros(6000,dtype='<i2')])
        audio=subprocess.check_output([a.ffmpeg,'-v','error','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','48k','-write_xing','0','-f','mp3','pipe:1'],input=padded.tobytes())
        sha=hashlib.sha256(audio).hexdigest();name='learning-'+sha+'.mp3';(out/name).write_bytes(audio)
        manifest[letter]=dict(url=f'https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-learning-{sha[0]}/'+name,sha256=sha,bytes=len(audio))
        audit[letter]=dict(method='carrier-word-boundary',voice='ne-NP-HemkalaNeural',rate='0%',phrase=phrase,source=source,start=lo,end=hi,wordBoundary=e,sha256=sha,**(extra or {}))
        write(manifest_path,manifest);write(audit_path,audit)
        print(f'Prepared {letter}: {hi-lo:.3f}s + silence',flush=True)
    approved_phrase='यो श हो। यो ष हो। यो स हो।'
    missing=[c for c in ['श','ष','स'] if c not in audit or manifest.get(c,{}).get('sha256')!=audit[c]['sha256']]
    if missing:
        raw,bounds=synthesize(approved_phrase)
        accepted=np.frombuffer(subprocess.check_output([a.ffmpeg,'-v','error','-i',str(approved),'-f','s16le','-ar','24000','-ac','1','pipe:1']),dtype='<i2')
        x=accepted.astype(float);y=raw.astype(float);c=correlate(x,y,method='fft');lag=int(correlation_lags(len(x),len(y))[np.argmax(c)]);score=float(c.max()/np.sqrt(np.dot(x,x)*np.dot(y,y)))
        if score<.98:raise ValueError('Approved audio alignment failed; do not guess cuts: '+str(score))
        print(f'Approved-source alignment {score:.6f}, shift {lag/24000:.6f}s',flush=True)
        for letter in missing:store(letter,accepted,bounds,approved_phrase,'音声生成ソース/approved-sibilants.mp3',lag/24000,dict(userApprovedSource=True,alignmentCorrelation=score,sourceSha256=hashlib.sha256(approved.read_bytes()).hexdigest()))
    for letter in ['ञ',*[c[0] for c in CONJUNCTS]]:
        if letter in audit and manifest.get(letter,{}).get('sha256')==audit[letter]['sha256']:continue
        phrase=f'यो {letter} हो।';pcm,bounds=synthesize(phrase)
        name='context-'+hashlib.sha256(phrase.encode()).hexdigest()[:16]+'.wav'
        import wave
        with wave.open(str(sources/name),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(24000);f.writeframes(pcm.tobytes())
        store(letter,pcm,bounds,phrase,'音声生成ソース/'+name,extra=dict(userApprovedSource=False))
    print('Prepared 4 corrected consonants and 30 standalone conjunct sounds. New contexts still require human phonetic QA.')
if __name__=='__main__':main()
