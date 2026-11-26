"""Pennants and banners of the settlements in the colour of the faction (the author, 26.11.2026), recoloured in place, folds and shading kept:
 - Brotherhood of the Tide: the green cloth of the barracks, the market, the council, the treasury, the wall's banners and the flag of the
   Lobster Knight's dwelling becomes sea turquoise (#2BB3C0);
 - Wild Herd: the red cloth of every building and dwelling becomes amber (the orange of the crest and of #B8731E).
Local, no generation. Run once from the repo root: python3 scripts/assets/pennant_tints.py [out_dir] [picture ...] (out_dir: a trial, the
originals stay; with picture names, e.g. tides_walls2, only those are recoloured: a picture already done must not be saved again).
Run it again after a settlement packer (tides_settlement.py, herds_settlement.py) has made the pictures anew."""
import colorsys
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

SETTLE = 'public/assets/osady'
HERD_UNITS = ['satyrPiper', 'youngAurochs', 'kulan', 'steppeArcher', 'forestBison', 'steppeLamignat', 'warRhino', 'muskOx', 'arkar', 'drumElephant',
              'bullMoose', 'indrik', 'aurochsScout', 'eagleHunter']
TIDES = ['tides_barracks1', 'tides_barracks2', 'tides_market1', 'tides_market2', 'tides_council1', 'tides_treasury2']
# Banners and awnings whose cloth is too pale or mottled for the colour test alone: inside these outlines (pixels of the 380 px picture) a
# much looser green counts as cloth.
REGIONS = {
    'tides_council1': [[(76, 66), (102, 60), (102, 146), (90, 156), (76, 146)], [(42, 152), (74, 148), (74, 206), (58, 220), (44, 204)],
                       [(130, 186), (158, 184), (159, 244), (146, 260), (131, 244)], [(308, 84), (338, 90), (338, 152), (324, 164), (309, 148)],
                       [(319, 184), (342, 182), (343, 232), (330, 244), (320, 230)]],
    # The weed-like flag of the Lobster Knight: only inside its outline (the dwelling is full of weed that stays).
    'dwelling_lobsterKnight': [[(222, 14), (244, 18), (286, 48), (318, 88), (316, 118), (296, 102), (268, 96), (250, 76), (226, 60)]],
    'tides_market2': [[(126, 78), (172, 68), (222, 110), (200, 122), (166, 128), (116, 102)], [(48, 178), (74, 162), (140, 190), (132, 213), (100, 214), (56, 190)],
                      [(174, 198), (214, 183), (250, 206), (236, 221), (188, 224)]],
}


# The wall: its banners are a bluer green than the moss and weed between them, so a narrower test keeps those as they are.
def banner_core(h, s, v, r, g, b):
    return 105 <= h <= 178 and s > 0.22 and v < 0.7


def banner_loose(h, s, v, r, g, b):
    return 90 <= h <= 184 and s > 0.14


def never(*_):
    return False


def green_region(h, s, v, r, g, b):
    return 48 <= h <= 190 and s > 0.1 and g > r * 0.95 and v < 0.8


def green_core(h, s, v, r, g, b):
    return 75 <= h <= 175 and s > 0.28 and v < 0.62 and g > r * 1.08


def green_loose(h, s, v, r, g, b):
    return 62 <= h <= 180 and s > 0.2 and g > r * 1.01


def red_core(h, s, v, r, g, b):
    return (h >= 345 or h <= 13) and s > 0.62 and 0.2 < v < 0.9


def red_loose(h, s, v, r, g, b):
    return (h >= 338 or h <= 18) and s > 0.5 and v > 0.14


# The Lobster Knight's flag is olive, almost brown in its folds: inside its outline everything but the red of the coral is cloth.
def flag_region(h, s, v, r, g, b):
    return 28 <= h <= 200


REGION_TESTS = {'dwelling_lobsterKnight': flag_region}


def recolour(im, core_test, loose_test, new, regions=(), region_test=green_region):
    """`new(s, v)` gives the HSV of a cloth pixel. Cloth = connected-ish patches of the core test (single specks are left), plus looser pixels at their rim."""
    im = im.convert('RGBA')
    px = list(im.getdata())
    hsv = []
    for r, g, b, a in px:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        hsv.append((h * 360, s, v))
    core = Image.new('L', im.size)
    core.putdata([255 if p[3] > 40 and core_test(*c, *p[:3]) else 0 for p, c in zip(px, hsv)])
    core = core.filter(ImageFilter.MedianFilter(3))
    near = list(core.filter(ImageFilter.MaxFilter(5)).getdata())
    core = list(core.getdata())
    outlines = Image.new('L', im.size)
    for poly in regions:
        ImageDraw.Draw(outlines).polygon(poly, fill=255)
    inside = list(outlines.getdata())
    out, n = [], 0
    for p, c, k, m, z in zip(px, hsv, core, near, inside):
        r, g, b, a = p
        if a > 40 and (k or (m and loose_test(*c, r, g, b)) or (z and region_test(*c, r, g, b))):
            r, g, b = (round(x * 255) for x in colorsys.hsv_to_rgb(*new(c[1], c[2])))
            n += 1
        out.append((r, g, b, a))
    res = Image.new('RGBA', im.size)
    res.putdata(out)
    return res, n


def sea(s, v):
    return 185 / 360, min(1, s * 0.95 + 0.12), min(1, v * 1.45 + 0.03)


def amber(s, v):
    return 30 / 360, min(1, s * 1.02), min(1, v * 1.1 + 0.02)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else SETTLE
    os.makedirs(out, exist_ok=True)
    herds = sorted(glob.glob(f'{SETTLE}/herds_*.webp')) + [f'{SETTLE}/dwelling_{u}.webp' for u in HERD_UNITS if os.path.exists(f'{SETTLE}/dwelling_{u}.webp')]
    jobs = [(f'{SETTLE}/{n}.webp', green_core, green_loose, sea) for n in TIDES] + [(f, red_core, red_loose, amber) for f in herds]
    jobs.append((f'{SETTLE}/tides_walls2.webp', banner_core, banner_loose, sea))
    jobs.append((f'{SETTLE}/dwelling_lobsterKnight.webp', never, never, sea))
    only = set(sys.argv[2:])
    for path, core, loose, new in jobs:
        if only and os.path.basename(path)[:-5] not in only:
            continue
        name = os.path.basename(path)[:-5]
        res, n = recolour(Image.open(path), core, loose, new, REGIONS.get(name, ()), REGION_TESTS.get(name, green_region))
        res.save(f'{out}/{os.path.basename(path)}', quality=88, method=6)
        print(os.path.basename(path), n)
