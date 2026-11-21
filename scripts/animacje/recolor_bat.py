"""Recolours the old Shadow Bat sprite sheets (plum fur, crimson wings, cream chest) into the serious palette of the new portrait
(slate-grey brown fur, rust wings, grey-beige chest) without generating anything (backlog 61g).
The originals are read from git (`BASE`), so the script can be run again with other numbers. Hue ranges are in PIL's 0-255 scale.
Usage: python3 scripts/animacje/recolor_bat.py [outdir=public/assets/jednostki/nietoperz_cienia]"""
import io, subprocess, sys
from PIL import Image, ImageChops

BASE = '277c526'
FOLDER = 'public/assets/jednostki/nietoperz_cienia'
FILES = ['stoi', 'martwy', 'atak', 'lot', 'smierc', 'trafienie', 'wzbicie']
FUR = (190, 238)      # plum / magenta
CHEST = (16, 60)      # cream
WING_H = 12           # rust, about 15 degrees
FUR_H, FUR_S, FUR_V = 15, 0.55, 0.78
WING_S, WING_V = 0.97, 0.92
CHEST_S, CHEST_V = 0.5, 0.95


def band(h, lo, hi):
    return h.point(lambda v: 255 if lo <= v < hi else 0)


def recolor(im: Image.Image) -> Image.Image:
    a = im.split()[3]
    h, s, v = im.convert('RGB').convert('HSV').split()
    fur, chest = band(h, *FUR), band(h, *CHEST)
    wing = ImageChops.invert(ImageChops.lighter(fur, chest))
    # wings: reds around 0 (both sides of the wrap) -> rust, hue spread kept small
    h_wing = h.point(lambda x: round(WING_H + 0.3 * (x if x < 128 else x - 256)) % 256)
    h2 = Image.composite(Image.new('L', h.size, FUR_H), Image.composite(h, h_wing, chest), fur)
    s2 = Image.composite(s.point(lambda x: round(x * FUR_S)), Image.composite(s.point(lambda x: round(x * CHEST_S)), s.point(lambda x: round(min(255, x * WING_S))), chest), fur)
    v2 = Image.composite(v.point(lambda x: min(255, round(x * FUR_V))), Image.composite(v.point(lambda x: round(x * CHEST_V)), v.point(lambda x: round(x * WING_V)), chest), fur)
    r, g, b = Image.merge('HSV', (h2, s2, v2)).convert('RGB').split()
    return Image.merge('RGBA', (r, g, b, a))


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else FOLDER
    for n in FILES:
        src = subprocess.check_output(['git', 'show', f'{BASE}:{FOLDER}/{n}.webp'])
        recolor(Image.open(io.BytesIO(src)).convert('RGBA')).save(f'{out}/{n}.webp', 'WEBP', quality=82, alpha_quality=100, method=4)
    print('done', out)
