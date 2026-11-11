"""Publish verified content to the same Cloudflare R2 bucket used by CAE.

Uses the saved Wrangler login (or CLOUDFLARE_API_TOKEN/ACCOUNT_ID in CI).
Immutable assets are uploaded and verified first; _manifest.json switches last.
No native build, paid translation, bucket creation, deletion or credential output.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import time
import tomllib
import urllib.error
import urllib.parse
import urllib.request

from build_content_ota import APP, BASE, build, prepare_media, read, write, assert_asset_name
from verify_content_release import verify

ROOT = APP.parent
BUCKET = 'safa-content'
LEGACY = 'https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-ota/manifest.json'
USER_AGENT = 'Safa-content-release/1.0'


def public_bytes(url, missing=False):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if missing and error.code == 404:
                return None
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise RuntimeError(f'Public content HTTP {error.code}') from None
        except urllib.error.URLError:
            if attempt == 2:
                raise RuntimeError('Public content download failed') from None
        time.sleep(2 * (attempt + 1))


def current_manifest():
    raw = public_bytes(BASE + '_manifest.json?t=' + str(time.time_ns()), missing=True)
    if raw is not None:
        value = json.loads(raw)
        assert value.get('appId') == 'nepali' and value.get('schema') == 1
    return raw


class R2:
    def __init__(self):
        self.lock = threading.Lock()
        self.next_request = 0.0
        self.token = os.environ.get('CLOUDFLARE_API_TOKEN', '').strip()
        self.config = None
        if not self.token:
            candidates = [Path(os.environ.get('APPDATA', str(Path.home()))) / 'xdg.config/.wrangler/config/default.toml',
                          Path.home() / '.config/.wrangler/config/default.toml',
                          Path.home() / '.wrangler/config/default.toml']
            self.config = next((p for p in candidates if p.is_file()), None)
            assert self.config, 'Wrangler login is required'
            self.refresh()
        self.account = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '').strip()
        if not self.account:
            accounts = self.call('/accounts')['result']
            assert len(accounts) == 1, 'Set CLOUDFLARE_ACCOUNT_ID to select the shared account'
            self.account = accounts[0]['id']

    def refresh(self):
        if not self.config:
            return
        config = tomllib.loads(self.config.read_text(encoding='utf-8'))
        expires = datetime.datetime.fromisoformat(config['expiration_time'].replace('Z', '+00:00')).timestamp()
        if expires < time.time() + 300:
            cli = shutil.which('wrangler')
            command = [cli] if cli else None
            if not command:
                cache = Path(os.environ.get('LOCALAPPDATA', str(Path.home()))) / 'npm-cache/_npx'
                candidates = list(cache.glob('*/node_modules/wrangler/bin/wrangler.js'))
                if candidates:
                    command = ['node', str(max(candidates, key=lambda p: p.stat().st_mtime))]
            assert command, 'Run wrangler login before publishing'
            result = subprocess.run([*command, 'r2', 'bucket', 'list'], capture_output=True, timeout=90)
            assert result.returncode == 0, 'Wrangler authentication refresh failed; run wrangler login'
            config = tomllib.loads(self.config.read_text(encoding='utf-8'))
        self.token = config['oauth_token']

    def call(self, route, data=None, metadata=None):
        for attempt in range(4):
            with self.lock:
                self.refresh()
                time.sleep(max(0, self.next_request - time.monotonic()))
                self.next_request = time.monotonic() + 0.35
                token = self.token
            headers = {'Authorization': 'Bearer ' + token, 'User-Agent': USER_AGENT}
            if metadata:
                headers.update(metadata)
            try:
                request = urllib.request.Request('https://api.cloudflare.com/client/v4' + route,
                    data=data, headers=headers, method='PUT' if data is not None else 'GET')
                with urllib.request.urlopen(request, timeout=180) as response:
                    result = json.load(response)
                assert result.get('success'), 'Cloudflare rejected the operation'
                return result
            except urllib.error.HTTPError as error:
                if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                    raise RuntimeError(f'R2 HTTP {error.code}; no fallback or tier change') from None
            except urllib.error.URLError:
                if attempt == 3:
                    raise RuntimeError('R2 connection failed; rerun safely to resume') from None
            time.sleep(min(30, 5 * (attempt + 1)))

    def put(self, name, raw, mutable=False):
        assert name and not name.startswith('/') and '..' not in name.split('/')
        key = urllib.parse.quote('nepali/' + name, safe='/')
        content_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'
        self.call(f'/accounts/{self.account}/r2/buckets/{BUCKET}/objects/{key}', raw,
                  {'Content-Type': content_type, 'Cache-Control': 'no-store, max-age=0' if mutable else 'public, max-age=31536000, immutable',
                   'cf-r2-storage-class': 'Standard'})


def upload(folder, files, remote, receipt_path):
    receipt = read(receipt_path) if receipt_path.exists() else {'base': BASE, 'files': {}}
    assert receipt['base'] == BASE
    r2 = R2()
    needed = []
    for name, expected in files.items():
        assert_asset_name(name)
        path = (folder / name).resolve()
        assert path.is_relative_to(folder.resolve()) and path.is_file(), name
        raw = path.read_bytes()
        assert len(raw) == expected['size'] and hashlib.sha256(raw).hexdigest() == expected['sha256'], name
        if remote.get('files', {}).get(name) == expected or receipt['files'].get(name) == expected:
            continue
        needed.append((name, expected))
    print(f'R2 assets: {len(files)} referenced, {len(needed)} to check/upload; prefix nepali/ only', flush=True)

    def one(item):
        name, expected = item
        before = public_bytes(BASE + name, missing=True)
        if before is None:
            r2.put(name, (folder / name).read_bytes())
            before = public_bytes(BASE + name + '?v=' + expected['sha256'])
        assert len(before) == expected['size'] and hashlib.sha256(before).hexdigest() == expected['sha256'], ('Immutable asset mismatch', name)
        return name, expected

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(one, item) for item in needed]
        try:
            for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
                name, expected = future.result()
                receipt['files'][name] = expected
                if i % 25 == 0 or i == len(needed):
                    temp = receipt_path.with_suffix('.next.json');write(temp, receipt);temp.replace(receipt_path)
                if i % 100 == 0 or i == len(needed):
                    print(f'R2 assets verified: {i}/{len(needed)}', flush=True)
        except BaseException:
            for future in futures:future.cancel()
            raise
    return r2


def github_cli(explicit=None):
    gh = explicit or shutil.which('gh')
    if not gh:
        candidate = Path(os.environ.get('LOCALAPPDATA', '')) / 'Programs/gh/bin/gh.exe'
        if candidate.is_file():gh = str(candidate)
    assert gh, 'GitHub CLI is required for the compatibility manifest'
    result = subprocess.run([gh, 'release', 'view', 'packs-appa-ota', '--repo', 'JinKato2020/safa-language-apps'], capture_output=True)
    assert result.returncode == 0, 'GitHub release access failed; live content was not changed'
    return gh


def mirror_manifest(gh, raw, transfer):
    mirror = transfer / 'manifest.json';mirror.write_bytes(raw)
    result = subprocess.run([gh, 'release', 'upload', 'packs-appa-ota', str(mirror),
                             '--repo', 'JinKato2020/safa-language-apps', '--clobber'], capture_output=True)
    assert result.returncode == 0, 'R2 published; run --mirror-only to retry the legacy GitHub pointer'
    assert public_bytes(LEGACY + '?t=' + str(time.time_ns())) == raw, 'Legacy pointer verification failed; retry --mirror-only'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--version', type=int)
    parser.add_argument('--audio-updates', type=Path)
    parser.add_argument('--media-only', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--gh')
    parser.add_argument('--mirror-only', action='store_true', help='Recover a failed legacy pointer update without publishing a new revision')
    args = parser.parse_args()
    transfer = ROOT / '.tmp-nepali-r2-transfer';transfer.mkdir(exist_ok=True)
    folder = ROOT / ('.tmp-nepali-r2-media' if args.media_only else '.tmp-nepali-r2-release')
    remote_raw = current_manifest();remote = json.loads(remote_raw) if remote_raw else {}
    if args.mirror_only:
        assert remote_raw and not args.media_only and not args.dry_run
        mirror_manifest(github_cli(args.gh), remote_raw, transfer)
        print(f'Legacy pointer recovered for OTA {remote["version"]}.');return
    if args.media_only:
        prepare_media(folder);files = read(folder / '_assets.json')['files']
        if not args.dry_run:upload(folder, files, remote, transfer / 'verified-assets.json')
        print('Immutable media prepared. Live manifest unchanged.');return
    legacy_raw = public_bytes(LEGACY + '?t=' + str(time.time_ns()))
    previous_version = max(remote.get('version', 0), json.loads(legacy_raw)['version'])
    version = args.version or previous_version + 1
    assert version > previous_version, 'Content revision must increase'
    gh = None if args.dry_run else github_cli(args.gh)
    subprocess.run([sys.executable, '-X', 'utf8', '-B', str(APP/'scripts/verify_arabic_content.py'),
                    '--require-lessons', '--require-practice', '--require-dictionary'], check=True)
    # A stale failed stage must not add unrelated files to the next inventory.
    if folder.exists():
        assert folder.resolve().parent == ROOT.resolve() and folder.name == '.tmp-nepali-r2-release'
        shutil.rmtree(folder)
    build(folder, version, audio_updates=args.audio_updates)
    verify(folder)
    manifest = read(folder / '_manifest.json')
    if args.dry_run:
        print(f'Validated OTA {version}; nothing published or built.');return
    r2 = upload(folder, manifest['files'], remote, transfer / 'verified-assets.json')
    assert current_manifest() == remote_raw, 'Remote content changed during preparation; rerun with latest revision'
    raw = (folder / '_manifest.json').read_bytes()
    r2.put('_manifest.json', raw, mutable=True)
    assert public_bytes(BASE + '_manifest.json?t=' + str(time.time_ns())) == raw, 'Public R2 manifest mismatch'
    # Older installed shells still read this tiny pointer. All payloads are R2 URLs.
    mirror_manifest(gh, raw, transfer)
    print(f'Published OTA {version}: {BASE}_manifest.json; legacy pointer also verified. Native build not started.')


if __name__ == '__main__':
    main()
