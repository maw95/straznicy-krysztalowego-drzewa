"""Shrinks a unit's finished sprite sheets in place (docs/POTOK_ANIMACJI.md, "Pamięć i płynność").

A 512 px frame sheet of a long clip is ~19 megapixels (80 MB decoded): the browser stalls for 200-400 ms on its first draw, cannot keep
more than a couple of them decoded, and decodes them again and again. This makes every clip sheet smaller: frames are scaled by SCALE
and only every STEP-th frame is kept (always including the last one: it is the corpse pose of a death clip); the game blends the
neighbouring frames, so the motion stays smooth. anim.json keeps the clip lengths in time (fps / STEP).
Usage: python3 scripts/animacje/shrink_unit.py <unit folder> [scale=0.75] [step=2]   (run once per folder: it refuses a folder already shrunk)"""
import json
import math
import os
import sys

from PIL import Image

folder = sys.argv[1]
scale = float(sys.argv[2]) if len(sys.argv) > 2 else 0.75
step = int(sys.argv[3]) if len(sys.argv) > 3 else 2
meta_path = os.path.join(folder, 'anim.json')
meta = json.load(open(meta_path))
if meta.get('step'):
    sys.exit(f'{folder}: already shrunk (step {meta["step"]})')
fw, fh = meta['frame']
cols = meta['cols']
nw, nh = round(fw * scale), round(fh * scale)
q = int(os.environ.get('WEBP_Q', '82'))
new_clips = {}
for name, n in meta['clips'].items():
    sheet = Image.open(os.path.join(folder, name + '.webp')).convert('RGBA')
    keep = list(range(0, n, step))
    if keep[-1] != n - 1:
        keep.append(n - 1)
    rows = math.ceil(len(keep) / cols)
    out = Image.new('RGBA', (cols * nw, rows * nh), (0, 0, 0, 0))
    for j, i in enumerate(keep):
        fr = sheet.crop(((i % cols) * fw, (i // cols) * fh, (i % cols) * fw + fw, (i // cols) * fh + fh)).resize((nw, nh), Image.LANCZOS)
        out.paste(fr, ((j % cols) * nw, (j // cols) * nh))
    out.save(os.path.join(folder, name + '.webp'), quality=q, method=6)
    new_clips[name] = len(keep)
for still in ('stoi', 'martwy'):
    p = os.path.join(folder, still + '.webp')
    im = Image.open(p).convert('RGBA')
    im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS).save(p, quality=q, method=6)
meta.update({'frame': [nw, nh], 'clips': new_clips, 'fps': meta['fps'] / step, 'step': step, 'scale': scale})
json.dump(meta, open(meta_path, 'w'), indent=1)
print(folder, meta['frame'], new_clips)
