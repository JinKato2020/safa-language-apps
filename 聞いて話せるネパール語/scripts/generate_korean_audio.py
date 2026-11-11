"""Azure F0 sentence masters, following the existing App A naming contract.

Default is a local dry run. --generate uses the documented F0 resource only;
there is no paid fallback. Resumes by verified text/voice/audio hashes and copies
identical sentences locally. Credentials and service error bodies are never logged.
"""
import argparse
import hashlib
import json
import re
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

APP = Path(__file__).resolve().parents[1]
WORK = APP / '文法教材'
PLAN_SHA = 'ac6629df02c24a25d71f2ae77fd9506339a70b552675457e1e94395d1104fece'
VOICE = 'ko-KR-SunHiNeural'
FORMAT = 'audio-24khz-48kbitrate-mono-mp3'
MANIFEST = WORK / 'korean_audio_manifest.json'
LANGUAGE = 'ko'
LOCALE = 'ko-KR'
SOURCE_NAME = 'korean'
CHARACTER_LIMIT = 60000


def configure(language):
    global LANGUAGE, LOCALE, SOURCE_NAME, VOICE, PLAN_SHA, MANIFEST, CHARACTER_LIMIT
    assert language in {'ko', 'ar'}
    LANGUAGE = language
    if language == 'ar':
        LOCALE, SOURCE_NAME, VOICE = 'ar-SA', 'arabic', 'ar-SA-ZariyahNeural'
        PLAN_SHA = 'b5e4bc972f04be1cf1607199cf19f602e7f794657a81a426b3cac423e24380cc'
        MANIFEST = WORK / 'arabic_audio_manifest.json'
        CHARACTER_LIMIT = 250000


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save(manifest):
    temp = MANIFEST.with_suffix('.next')
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temp.replace(MANIFEST)


def targets(allow_pending_source=False):
    plan_path = WORK / f'{SOURCE_NAME}_translation_requests.json'
    assert digest(plan_path.read_bytes()) == PLAN_SHA, 'Translation source plan changed'
    plan = read(plan_path)
    cache = read(WORK / f'{SOURCE_NAME}_translations.json')['items']
    output = {}
    source_count = 0
    for d in plan['destinations']:
        p = d['path']
        if p[:2] not in [['overlay', 'examplesL1'], ['overlay', 'grammarL1']]:
            continue
        source_count += 1
        if d['key'] not in cache and allow_pending_source:
            continue
        item = cache[d['key']]
        assert item.get('reviewed') is True and item['source'] == plan['requests'][d['key']]
        mode = 'conv' if p[1] == 'examplesL1' else 'gram'
        assert re.fullmatch(r'\d+-\d+' if mode == 'conv' else r'\d+', p[2])
        name = f'{mode}/{p[2]}-{p[3] + 1}.mp3'
        assert name not in output
        output[name] = item[LANGUAGE]
    assert source_count == 2328, 'Unexpected audio identity count'
    assert allow_pending_source or len(output) == source_count, 'Incomplete sentence translations'
    return output


def check_audio(path):
    probe = subprocess.run(['C:/ffmpeg/bin/ffprobe.exe', '-v', 'error', '-show_entries',
                            'stream=codec_name,sample_rate,channels:format=duration',
                            '-of', 'json', str(path)], capture_output=True, check=True)
    info = json.loads(probe.stdout)
    assert len(info['streams']) == 1
    s = info['streams'][0]
    assert (s['codec_name'], s['sample_rate'], s['channels']) == ('mp3', '24000', 1)
    assert 0.2 < float(info['format']['duration']) < 600
    subprocess.run(['C:/ffmpeg/bin/ffmpeg.exe', '-v', 'error', '-xerror', '-i', str(path),
                    '-f', 'null', '-'], check=True, capture_output=True)


def run(generate=False, limit=0, verify=False, allow_pending_source=False):
    assert not (verify and allow_pending_source), 'Final verification requires all sentences'
    wanted = targets(allow_pending_source)
    manifest = read(MANIFEST) if MANIFEST.exists() else {'schema': 1, 'voice': VOICE, 'format': FORMAT, 'items': {}}
    assert manifest['voice'] == VOICE and manifest['format'] == FORMAT
    root = APP / 'audio' / LANGUAGE
    known = {}
    complete = set()
    for name, item in manifest['items'].items():
        path = root / name
        assert path.resolve().is_relative_to(root.resolve())
        if (wanted.get(name) == item.get('text') and item.get('voice') == VOICE and path.exists()
                and digest(path.read_bytes()) == item['sha256']):
            complete.add(name)
            known[item['text']] = path
            if verify:
                check_audio(path)
    pending_texts = set(wanted.values()) - set(known)
    print(json.dumps({'files': len(wanted), 'verifiedExisting': len(complete),
                      'pendingUniqueTexts': len(pending_texts),
                      'pendingCharacters': sum(map(len, pending_texts)), 'voice': VOICE}), flush=True)
    if verify:
        assert complete == set(wanted), 'Incomplete or stale sentence audio'
    if not generate:
        return
    env = {}
    for file in [APP.parent / '聞いて話せる日本語/.env', APP / '.env']:
        if file.exists():
            for line in file.read_text(encoding='utf-8-sig').splitlines():
                m = re.fullmatch(r'\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*', line)
                if m:
                    env[m[1]] = m[2].strip('\"\'')
    key, region = env.get('AZURE_SPEECH_KEY'), env.get('AZURE_SPEECH_REGION')
    assert key and region == 'japaneast', 'Documented Azure F0 configuration is required'
    # Each paid-tier upgrade would require a deliberate external configuration
    # change. This script uses only the user-supplied F0 resource, never upgrades it.
    assert sum(map(len, pending_texts)) <= CHARACTER_LIMIT, 'Unexpected synthesis volume'
    next_request = 0.0
    generated = copied = 0
    for name, text in wanted.items():
        if name in complete:
            continue
        out = root / name
        out.parent.mkdir(parents=True, exist_ok=True)
        if text in known:
            data = known[text].read_bytes()
            copied += 1
        else:
            if limit and generated >= limit:
                break
            body = f'<speak version="1.0" xml:lang="{LOCALE}"><voice name="{VOICE}">{escape(text)}</voice></speak>'.encode()
            req = urllib.request.Request(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
                data=body, headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': 'safa-tts'}, method='POST')
            for attempt in range(3):
                time.sleep(max(0, next_request - time.monotonic()))
                next_request = time.monotonic() + 3.2  # F0: <=20 requests per minute.
                try:
                    with urllib.request.urlopen(req, timeout=45) as response:
                        data = response.read()
                    break
                except urllib.error.HTTPError as error:
                    if (error.code == 429 or error.code >= 500) and attempt < 2:
                        next_request = time.monotonic() + 60
                        continue
                    raise RuntimeError(f'Speech HTTP {error.code}; stopped without fallback') from None
                except urllib.error.URLError:
                    raise RuntimeError('Speech network error; stopped, resume is safe') from None
            assert len(data) > 500, 'Invalid speech output'
            generated += 1
        temp = out.with_suffix('.next.mp3')
        temp.write_bytes(data)
        try:
            check_audio(temp)
            temp.replace(out)
        finally:
            temp.unlink(missing_ok=True)
        manifest['items'][name] = {'text': text, 'voice': VOICE, 'sha256': digest(data), 'bytes': len(data)}
        save(manifest)
        known[text] = out
        complete.add(name)
        if generated == 1 or len(complete) % 20 == 0:
            print(json.dumps({'complete': len(complete), 'generated': generated, 'copied': copied}), flush=True)
    print(json.dumps({'complete': len(complete), 'total': len(wanted), 'generated': generated, 'copied': copied}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true')
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--language', choices=['ko', 'ar'], default='ko')
    parser.add_argument('--allow-pending-source', action='store_true',
                        help='Generate reviewed sentences while other source sentences await correction; never valid for final verification')
    args = parser.parse_args()
    configure(args.language)
    run(args.generate, args.limit, args.verify, args.allow_pending_source)
