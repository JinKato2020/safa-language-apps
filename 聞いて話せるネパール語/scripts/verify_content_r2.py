"""Exercise publisher failure/retry boundaries without credentials or network."""
import hashlib
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

import publish_content_r2 as publisher
from build_content_ota import BASE, assert_asset_name, write


def main():
    for invalid in ['../secret.json', 'learning/../../secret.mp3', '.env', 'notes.json', '_manifest.json']:
        try:assert_asset_name(invalid)
        except AssertionError:pass
        else:raise AssertionError('Unsafe asset accepted: ' + invalid)

    data=b'{"lesson":"verified"}\n';sha=hashlib.sha256(data).hexdigest()
    name=f'content-{sha}.json';metadata={'sha256':sha,'size':len(data)}
    manifest={'schema':1,'appId':'nepali','version':2,'files':{name:metadata}}
    objects={};puts=[];events=[]
    class Storage:
        def put(self, key, raw, mutable=False):
            puts.append(key);events.append(('put',key));objects[BASE+key]=raw
    def download(url, missing=False):
        key=url.split('?')[0]
        if key==publisher.LEGACY:return json.dumps({'version':1}).encode()
        if key not in objects and not missing:raise RuntimeError('missing public object')
        return objects.get(key)

    with tempfile.TemporaryDirectory(prefix='nepali-r2-test-') as root:
        root=Path(root);folder=root/'assets';folder.mkdir();(folder/name).write_bytes(data)
        with patch.object(publisher,'R2',Storage),patch.object(publisher,'public_bytes',download):
            publisher.upload(folder,{name:metadata},{},root/'receipt.json')
            assert puts==[name]
            publisher.upload(folder,{name:metadata},{},root/'receipt.json')
            assert puts==[name],'Retry must reuse publicly verified assets'
            objects[BASE+name]=b'corrupt'
            try:publisher.upload(folder,{name:metadata},{},root/'fresh-receipt.json')
            except AssertionError:pass
            else:raise AssertionError('Immutable public corruption was accepted')
            assert puts==[name],'An existing immutable object must never be overwritten'
            objects[BASE+name]=data

            def build(stage,version,**kwargs):
                assert version==2;stage.mkdir();(stage/name).write_bytes(data)
                write(stage/'manifest.json',manifest);write(stage/'_manifest.json',manifest)
            def verify(stage):events.append(('verified','release'))
            def mirror(gh,raw,transfer):
                assert objects[BASE+'_manifest.json']==raw
                events.append(('mirror','legacy'))
            def current():return objects.get(BASE+'_manifest.json')
            shared=[patch.object(publisher,'ROOT',root),patch.object(publisher,'build',build),
                    patch.object(publisher,'verify',verify),patch.object(publisher,'github_cli',lambda _: 'gh'),
                    patch.object(publisher,'mirror_manifest',mirror),
                    patch.object(publisher.subprocess,'run',lambda *a,**k:SimpleNamespace(returncode=0))]
            from contextlib import ExitStack
            with ExitStack() as stack:
                for context in shared:stack.enter_context(context)
                stack.enter_context(patch.object(publisher.sys,'argv',['publish_content_r2.py','--version','2']))
                with patch.object(publisher,'current_manifest',side_effect=[None,b'concurrent release']):
                    try:publisher.main()
                    except AssertionError as error:assert 'Remote content changed' in str(error)
                    else:raise AssertionError('Concurrent publication was overwritten')
                assert '_manifest.json' not in puts,'Failed publication must leave the live pointer untouched'
                with patch.object(publisher,'current_manifest',current):publisher.main()
                assert puts[-1]=='_manifest.json' and events[-1]==('mirror','legacy')
                assert events.index(('verified','release'))<events.index(('put','_manifest.json'))
    print('PASS R2: safe file allowlist, resumable upload, immutable corruption rejection, concurrent publication guard and manifest-last/legacy-mirror ordering.')


if __name__=='__main__':main()
