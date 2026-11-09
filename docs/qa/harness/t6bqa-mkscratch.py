"""Build the PXB / PXB-amb scratch theme copy for T6b QA (C6b.15).
Usage: python3 -I t6bqa-mkscratch.py <repo> <scratch-dir> [embed-off]
Copies `git archive HEAD` into the scratch dir, then adds templates/index.pxb.json (image-banner section first)
and templates/index.pxbamb.json (the same plus image_behavior=ambient). The repo's templates are never edited.
With `embed-off`, the scratch config/settings_data.json gets the Supercycle app embed block set to disabled=true.
"""
import json, re, subprocess, sys, os, shutil

repo, scratch = sys.argv[1], sys.argv[2]
embed_off = len(sys.argv) > 3 and sys.argv[3] == 'embed-off'

def load(path):
    text = open(path).read()
    text = re.sub(r'^/\*.*?\*/', '', text, count=1, flags=re.S)
    return json.loads(text)

if not os.path.isdir(scratch) or not os.listdir(scratch):
    os.makedirs(scratch, exist_ok=True)
    tar = subprocess.run(['git', '-C', repo, 'archive', 'HEAD'], check=True, capture_output=True).stdout
    subprocess.run(['tar', '-x', '-C', scratch], input=tar, check=True)

tpl = load(os.path.join(repo, 'templates/index.json'))
banner = [k for k, v in tpl['sections'].items() if v['type'] == 'image-banner'][0]
tpl['order'] = [banner] + [k for k in tpl['order'] if k != banner]
open(os.path.join(scratch, 'templates/index.pxb.json'), 'w').write(json.dumps(tpl, indent=2))
tpl['sections'][banner]['settings']['image_behavior'] = 'ambient'
open(os.path.join(scratch, 'templates/index.pxbamb.json'), 'w').write(json.dumps(tpl, indent=2))

settings_src = os.path.join(repo, 'config/settings_data.json')
settings_dst = os.path.join(scratch, 'config/settings_data.json')
if embed_off:
    data = load(settings_src)
    n = 0
    for b in data['current']['blocks'].values():
        if 'supercycle' in b['type']:
            b['disabled'] = True; n += 1
    assert n == 1, n
    open(settings_dst, 'w').write(json.dumps(data, indent=2))
else:
    shutil.copyfile(settings_src, settings_dst)
print('scratch ready, embed', 'OFF' if embed_off else 'ON', 'banner section', banner)
