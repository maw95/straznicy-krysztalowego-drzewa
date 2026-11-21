"""Paints the faction ribbons: copies of the four ribbons (wstazka_g/r/b/p.webp) with the cloth turned to the hue of a faction while the gold trim stays gold.
Usage: python3 scripts/assets/ribbon_tints.py   (writes public/assets/ui/wstazka_<faction>.webp for the factions that have no ribbon of their own)"""
import colorsys
from PIL import Image

D = 'public/assets/ui'
# faction: (source ribbon, target hue of the cloth in degrees, saturation factor, value factor)
TINTS = {'herds': ('r', 24, 1.0, 1.05), 'sands': ('r', 46, 0.9, 1.15), 'free': ('r', 20, 0.55, 0.75), 'swarm': ('g', 172, 1.0, 1.0), 'tides': ('b', 192, 1.0, 1.05), 'clans': ('p', 322, 1.0, 1.0)}

for fac, (src, hue, sat, val) in TINTS.items():
    im = Image.open(f'{D}/wstazka_{src}.webp').convert('RGBA')
    px = list(im.getdata())
    hs = []
    for r, g, b, al in px:
        if al > 230:
            h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s_ > 0.45 and (h * 360 < 20 or h * 360 > 70):
                hs.append(h * 360)
    hs.sort()
    cloth = hs[len(hs) // 2]
    out = []
    for r, g, b, al in px:
        h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if not (28 < h * 360 < 66 and v > 0.55 and s_ > 0.25):   # the gold trim stays
            h = ((h * 360 + hue - cloth) % 360) / 360
            s_ = min(1, s_ * sat)
            v = min(1, v * val)
            r, g, b = (round(c * 255) for c in colorsys.hsv_to_rgb(h, s_, v))
        out.append((r, g, b, al))
    t = Image.new('RGBA', im.size)
    t.putdata(out)
    t.save(f'{D}/wstazka_{fac}.webp', quality=88, method=6)
    print(fac, src, round(cloth))
