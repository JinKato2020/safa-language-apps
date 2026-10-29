"""Publishable text/audio pair in the existing App A positional format.

Only prepares data, never modifies app source or invokes an app build.
Source recording IDs are an authoring detail; shipped MP3 names are theme-index.
Upload immutable payloads first, then update both v2/v3 catalogs last.
"""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / '聞いて話せるネパール語'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-dir', type=Path, required=True)
    p.add_argument('--previous-dir', type=Path, required=True)
    p.add_argument('--audio-dir', type=Path, default=APP / 'dist-packs')
    p.add_argument('--output-dir', type=Path, required=True)
    p.add_argument('--revision', type=int, required=True)
    a = p.parse_args()
    source_cat = read(a.source_dir / 'catalog.json')
    previous_cat = read(a.previous_dir / 'catalog.json')
    def payload(entry):
        return read(a.source_dir / entry['url'].rsplit('/', 1)[1])
    core = payload(source_cat['core'])
    refs = core.pop('grammarAudioRefs')
    core['curriculumRevision'] = a.revision
    assert a.revision > max(source_cat['core']['version'], previous_cat['core']['version'])
    recordings = read(APP / '文法教材/grammar_recording_texts_v2.json')
    recordings.update(read(APP / '文法教材/grammar_recordings_v3.json')['recordings'])
    ids = {f'{k}-{i+1}' for k, rows in core['grammarNe'].items() for i in range(len(rows))}
    assert set(refs) == ids and all(refs.values())
    conv_ids = {f'{k}-{i+1}' for k, rows in core['examplesNe'].items() for i in range(len(rows))}
    prefix = 'https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-v2/'
    cat = {'schema': 1, 'packs': [], 'core': {}}
    checks = {}
    a.output_dir.mkdir(parents=True, exist_ok=True)
    core_name = f'core-{a.revision}.json'
    write(a.output_dir / core_name, core)
    for lang, stem in [('ne', 'core'), ('en', 'en'), ('ja', 'ja')]:
        old_entry = previous_cat['core'] if lang == 'ne' else next(x for x in previous_cat['packs'] if x['l1'] == lang)
        src_entry = source_cat['core'] if lang == 'ne' else next(x for x in source_cat['packs'] if x['l1'] == lang)
        version = max(old_entry['audioVersion'], src_entry['audioVersion']) + 1
        zip_name = f'audio-{stem}-{version}.zip'
        target = a.output_dir / zip_name
        overlay = None
        if lang != 'ne':
            overlay = payload(src_entry)
            overlay.pop('grammarAudioRefs', None)
            overlay['curriculumRevision'] = a.revision
            overlay['version'] = a.revision
        audio_hashes = {}
        with ZipFile(a.audio_dir / f'audio-{stem}.zip') as source, ZipFile(target, 'w', ZIP_STORED) as dest:
            assert source.testzip() is None
            for id in sorted(conv_ids):
                data = source.read(id + '.mp3')
                dest.writestr(id + '.mp3', data)
            for key, rows in core['grammarNe'].items():
                if overlay is not None:
                    assert len(overlay['grammarL1'][key]) == len(rows)
                for i, ne in enumerate(rows):
                    id = f'{key}-{i+1}'
                    recorded = recordings[refs[id]]
                    assert recorded['ne'] == ne, id
                    if overlay is not None:
                        assert recorded[lang] == overlay['grammarL1'][key][i], (lang, id)
                    data = source.read(refs[id] + '.mp3')
                    dest.writestr(id + '.mp3', data)
                    audio_hashes[id] = sha(data)
        with ZipFile(target) as z:
            assert len(z.namelist()) == len(ids) + len(conv_ids)
            assert set(z.namelist()) == {x + '.mp3' for x in ids | conv_ids}
            assert z.testzip() is None
        entry = {'audioVersion': version, 'audioZip': prefix + zip_name, 'audioZipBytes': target.stat().st_size}
        if lang == 'ne':
            entry.update(url=prefix + core_name, version=a.revision)
            cat['core'] = entry
        else:
            name = f'overlay-{lang}-{a.revision}.json'
            write(a.output_dir / name, overlay)
            entry.update(l1=lang, name=src_entry['name'], nameJa=src_entry['nameJa'], version=a.revision,
                         access=src_entry.get('access', 'free'), sizeBytes=(a.output_dir / name).stat().st_size, url=prefix + name)
            cat['packs'].append(entry)
        checks[lang] = {'grammarFiles': len(ids), 'conversationFilesUnchanged': len(conv_ids), 'audioVersion': version,
                        'positionalAudioSHA256': audio_hashes}
    write(a.output_dir / 'catalog.json', cat)
    report = {'packVersion': a.revision, 'compatibleAppVersions': ['2.1.3', '2.1.4'], 'appRebuilt': False,
              'clientCodeChanged': False, 'grammarExamples': len(ids), 'languages': checks,
              'payloadSHA256': {x.name: sha(x.read_bytes()) for x in a.output_dir.iterdir() if x.is_file()},
              'readerSourceCommit': '89c0982a', 'format': 'theme-index.mp3; no shipped grammarAudioRefs'}
    write(APP / '文法教材/教材音声セット更新_検証結果.json', report)
    write(APP / '文法教材/grammar_pack_v2_catalog.json', cat)
    write(APP / '文法教材/grammar_pack_v3_catalog.json', cat)
    print(f'Prepared pack {a.revision}: {len(ids)} grammar + {len(conv_ids)} unchanged conversation recordings per language; no app build')

if __name__ == '__main__':
    main()
