"""Paints the cloth of the primary buttons (`.prim`, ui/cloth_<faction>.jpg) for the factions that have none: the cloth of an original (cloth_g/r/b) turned to the hue
of the faction, the same numbers as the ribbons (scripts/assets/ribbon_tints.py). Usage: python3 scripts/assets/cloth_tints.py"""
import colorsys
from PIL import Image

D = 'public/assets/ui'
# faction: (source cloth, target hue in degrees, saturation factor, value factor)
TINTS = {'herds': ('r', 24, 1.0, 1.05), 'sands': ('r', 46, 0.9, 1.15), 'free': ('r', 20, 0.55, 0.75), 'swarm': ('g', 172, 1.0, 1.0), 'tides': ('b', 192, 1.0, 1.05),
         'clans': ('r', 40, 0.14, 0.82), 'undead': ('b', 275, 0.95, 0.9)}
SRC_HUE = {'g': 145, 'r': 355, 'b': 218}
for fac, (src, hue, sat, val) in TINTS.items():
    im = Image.open(f'{D}/cloth_{src}.jpg').convert('RGB')
    out = []
    for r, g, b in im.getdata():
        h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        h = ((h * 360 + hue - SRC_HUE[src]) % 360) / 360
        r, g, b = (round(c * 255) for c in colorsys.hsv_to_rgb(h, min(1, s_ * sat), min(1, v * val)))
        out.append((r, g, b))
    t = Image.new('RGB', im.size)
    t.putdata(out)
    t.save(f'{D}/cloth_{fac}.jpg', quality=90)
    print(fac, src)
