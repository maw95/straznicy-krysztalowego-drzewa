"""Grow a unit's common frame (a new clip reaches further than the old crop box): pads every sheet and still with empty pixels on top,
on the right, on the left and at the bottom, so the old clips stay exactly where they were.

Usage: python3 scripts/assets/grow_frame.py <unit folder> <source px up> [<right> [<left> [<bottom>]]]
The numbers are source-frame pixels, each limited by the source frame's edge. anim.json gets the new crop, frame size, feet line, cx and body
(cx and body are fractions of the frame width, so they are rescaled). Lossless for the old clips (they only get transparent pixels). Run it
before scripts/assets/clans_fix_clips.py so the new clip is cut with the larger box. Needs Pillow."""
import json, math, os, sys
from PIL import Image

folder = sys.argv[1]
want = [int(v) for v in sys.argv[2:6]] + [0] * (6 - len(sys.argv))
meta = json.load(open(os.path.join(folder, 'anim.json')))
x0, y0, cw, ch = meta['crop']; S = meta['source_frame']; sc = meta['scale']
src = {'top': min(want[0], y0), 'right': min(want[1], S - x0 - cw), 'left': min(want[2], x0), 'bottom': min(want[3], S - y0 - ch)}
pad = {k: round(v * sc) for k, v in src.items()}
fw, fh = meta['frame']; cols = meta['cols']
nw, nh = fw + pad['left'] + pad['right'], fh + pad['top'] + pad['bottom']
if (nw, nh) == (fw, fh):
    sys.exit('nothing to grow')
for name, n in meta['clips'].items():
    p = os.path.join(folder, name + '.webp')
    sheet = Image.open(p).convert('RGBA')
    out = Image.new('RGBA', (cols * nw, math.ceil(n / cols) * nh), (0, 0, 0, 0))
    for i in range(n):
        c, r = i % cols, i // cols
        out.paste(sheet.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)), (c * nw + pad['left'], r * nh + pad['top']))
    out.save(p, quality=80, method=6)
for still in ('stoi', 'martwy'):
    p = os.path.join(folder, still + '.webp')
    im = Image.open(p).convert('RGBA')
    k = im.height / fh  # stills may be stored at another size than the frame
    out = Image.new('RGBA', (round(nw * k), round(nh * k)), (0, 0, 0, 0))
    out.paste(im, (round(pad['left'] * k), round(pad['top'] * k)))
    out.save(p, quality=80, method=6)
meta['crop'] = [x0 - src['left'], y0 - src['top'], cw + src['left'] + src['right'], ch + src['top'] + src['bottom']]
meta['feet'] = round((meta['feet'] * fh + pad['top']) / nh, 4)
meta['cx'] = round((meta['cx'] * fw + pad['left']) / nw, 4)
meta['body'] = round(meta['body'] * fw / nw, 4)
meta['frame'] = [nw, nh]
json.dump(meta, open(os.path.join(folder, 'anim.json'), 'w'), indent=1)
print(folder, 'grown by', pad, '; frame', meta['frame'], 'feet', meta['feet'], 'cx', meta['cx'])
