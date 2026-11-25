"""Grow a unit's common frame upwards (a new clip reaches higher than the old crop box): pads every sheet and still with empty rows on top.

Usage: python3 scripts/assets/grow_frame.py <unit folder> <source px>   (moves crop[1] up by that many source-frame pixels, at most to 0)
Lossless for the old clips (they only get transparent rows); anim.json gets the new crop, frame height and feet line. Run it before
scripts/assets/clans_fix_clips.py so the new clip is cut with the taller box. Needs Pillow."""
import json, math, os, sys
from PIL import Image

folder, want = sys.argv[1], int(sys.argv[2])
meta = json.load(open(os.path.join(folder, 'anim.json')))
src = min(want, meta['crop'][1])
fw, fh = meta['frame']; cols = meta['cols']
pad = round(src * meta['scale'])
if pad <= 0:
    sys.exit('nothing to grow')
for name, n in meta['clips'].items():
    p = os.path.join(folder, name + '.webp')
    sheet = Image.open(p).convert('RGBA')
    rows = math.ceil(n / cols)
    out = Image.new('RGBA', (sheet.width, rows * (fh + pad)), (0, 0, 0, 0))
    for r in range(rows):
        out.paste(sheet.crop((0, r * fh, sheet.width, (r + 1) * fh)), (0, r * (fh + pad) + pad))
    out.save(p, quality=80, method=6)
for still in ('stoi', 'martwy'):
    p = os.path.join(folder, still + '.webp')
    im = Image.open(p).convert('RGBA')
    k = im.height / fh  # stills may be stored at another size than the frame
    out = Image.new('RGBA', (im.width, im.height + round(pad * k)), (0, 0, 0, 0))
    out.paste(im, (0, round(pad * k)))
    out.save(p, quality=80, method=6)
meta['crop'][1] -= src; meta['crop'][3] += src
meta['frame'][1] = fh + pad
meta['feet'] = round((meta['feet'] * fh + pad) / (fh + pad), 4)
json.dump(meta, open(os.path.join(folder, 'anim.json'), 'w'), indent=1)
print(folder, 'grown by', pad, 'px; frame', meta['frame'], 'feet', meta['feet'])
