"""Hammer Guard attack: the clip ends with a white glare on the hammer head and a grey dust ring; tint the glare to bronze and drop the dust.

Usage: python3 scripts/assets/clans_dust_fix.py <sheet.webp in> <anim.json> <out.webp> [first frame=16]
Only pixels that are bright and nearly colourless change: the bronze armour is saturated and stays as it is.
"""
import colorsys
import json
import sys

from PIL import Image

src, meta, out = sys.argv[1:4]
first = int(sys.argv[4]) if len(sys.argv) > 4 else 16
m = json.load(open(meta))
fw, fh = m['frame']
cols = m['cols']
n = m['clips']['atak']
im = Image.open(src).convert('RGBA')
px = im.load()
BRONZE = (0.09, 0.62)  # hue, saturation of the hammer head
for i in range(first, n):
    x0, y0 = (i % cols) * fw, (i // cols) * fh
    for y in range(y0, y0 + fh):
        for x in range(x0, x0 + fw):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.22 and v > 0.45:
                if a < 235:  # dust: translucent grey
                    px[x, y] = (r, g, b, 0)
                else:  # glare on the hammer: bronze of the same lightness, a bit darker
                    rr, gg, bb = colorsys.hsv_to_rgb(BRONZE[0], BRONZE[1], v * 0.72)
                    px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
            elif s < 0.22 and a < 200 and v > 0.25:  # thin grey smoke edge
                px[x, y] = (r, g, b, 0)
im.save(out, 'WEBP', quality=80, method=6)
