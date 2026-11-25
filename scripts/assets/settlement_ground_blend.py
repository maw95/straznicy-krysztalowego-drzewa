"""Blend the ground patch under each settlement building into its faction's landscape (0 CU).

Every building picture stands on its own little island of rock, grass or sand with a hard edge, in colours that differ from the landscape
(osady/land_<faction>.jpg). For the lower part of each picture (the base) this script
  - feathers the outline: alpha fades to 0 over FEATHER px towards the transparent outside, so the base melts into the ground;
  - shifts the colours of the base towards the mean colour of the landscape's ground (the texture stays, only the mean moves).
The upper part (walls, roofs, towers) is left as it is. Always reads the untouched pictures from SRC, so it can be re-run with new numbers.
Usage: python3 scripts/assets/settlement_ground_blend.py <faction> [file ...]   (SRC=.tmp/zrodla/osady_oryginaly, OUT=public/assets/osady;
the strength per faction and per picture is in FACTION and PICTURE below)
Dwellings (dwelling_<unit>.webp) take the faction of their unit: pass their files explicitly."""
import os, sys
from PIL import Image, ImageChops, ImageFilter, ImageStat

SRC = os.environ.get('SRC', '.tmp/zrodla/osady_oryginaly')
OUT = os.environ.get('OUT', 'public/assets/osady')
BASE_FROM, BASE_TO = 0.55, 0.78                  # share of the picture's height where the base effect ramps from 0 to full
# (feather px of the 380 px tall picture, how far the base's mean colour moves towards the ground's). Chosen by the author on 25.11:
# strong where the islands of ground clashed with the land, weak where the blending ate into the walls of the buildings.
STRONG, WEAK = (34, 0.6), (16, 0.25)
FACTION = {'clans': STRONG, 'tides': STRONG, 'herds': STRONG, 'free': STRONG, 'dawn': WEAK, 'horde': WEAK}
PICTURE = {'clans_magic1.webp': WEAK, 'clans_magic2.webp': WEAK, 'dwelling_bronzeSentinel.webp': WEAK, 'tides_magic1.webp': WEAK, 'tides_magic2.webp': WEAK}


def ground_colour(faction):
    land = Image.open(os.path.join(OUT, f'land_{faction}.jpg')).convert('RGB')
    w, h = land.size
    return ImageStat.Stat(land.crop((int(w * 0.15), int(h * 0.45), int(w * 0.85), int(h * 0.9)))).mean


def blend(path_in, path_out, ground, FEATHER, TINT):
    im = Image.open(path_in).convert('RGBA')
    w, h = im.size
    a = im.getchannel('A')
    solid = a.point(lambda v: 255 if v > 40 else 0)
    # Inside distance in px (capped at FEATHER) by repeated erosion.
    dist = Image.new('L', (w, h), 0)
    cur = solid
    step = max(1, 255 // FEATHER)
    for _ in range(FEATHER):
        cur = cur.filter(ImageFilter.MinFilter(3))
        dist = ImageChops.add(dist, cur.point(lambda v, s=step: s if v else 0))
    bbox = solid.getbbox() or (0, 0, w, h)
    top, bottom = bbox[1], bbox[3]
    ramp = Image.new('L', (1, h))
    for y in range(h):
        t = (y - top) / max(1, bottom - top)
        ramp.putpixel((0, y), int(255 * min(1, max(0, (t - BASE_FROM) / (BASE_TO - BASE_FROM)))))
    ramp = ramp.resize((w, h))
    # alpha' = a * (1 - ramp * (1 - dist)): only the base's outline fades.
    fade = ImageChops.multiply(ramp, ImageChops.invert(dist.point(lambda v: min(255, v))))
    a2 = ImageChops.multiply(a, ImageChops.invert(fade))
    # Colour: move the base's mean towards the ground's mean.
    rgb = im.convert('RGB')
    base_mask = ImageChops.multiply(ramp, solid)
    mean = ImageStat.Stat(rgb, base_mask).mean
    shift = [int(round((g - m) * TINT)) for g, m in zip(ground, mean)]
    moved = Image.merge('RGB', [c.point(lambda v, d=d: max(0, min(255, v + d))) for c, d in zip(rgb.split(), shift)])
    rgb2 = Image.composite(moved, rgb, ramp)
    out = rgb2.convert('RGBA')
    out.putalpha(a2)
    out.save(path_out, quality=82, method=6)


faction = sys.argv[1]
files = sys.argv[2:] or sorted(f for f in os.listdir(SRC) if f.startswith(faction + '_'))
g = ground_colour(faction)
for f in files:
    blend(os.path.join(SRC, f), os.path.join(OUT, f), g, *PICTURE.get(f, FACTION.get(faction, STRONG)))
print(faction, 'ground', [round(v) for v in g], len(files), 'pictures')
