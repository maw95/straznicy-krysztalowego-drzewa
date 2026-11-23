"""Faction-coloured versions of the slate panel texture (ui/slate.jpg) -> ui/slate_<faction>.jpg (backlog 62a, 0 CU: recoloured from the original).
Hue is moved to the faction's colour (the same hue shift for every pixel keeps the texture), saturation and brightness are scaled per faction.
Run from the repo root: python3 scripts/assets/slate_frakcji.py [--sheet]   (--sheet also writes .tmp/slate_arkusz.png for a look)"""
import colorsys
import sys

from PIL import Image

SRC = 'public/assets/ui/slate.jpg'
# faction: (target hue in degrees, saturation factor, brightness factor); colours as in SEAT_TINT / SIDE_RING
FACTIONS = {
    'dawn': (150, 1.0, 1.0),     # green
    'horde': (352, 1.0, 1.05),   # burgundy
    'herds': (38, 0.95, 1.2),    # ochre
    'undead': (135, 0.3, 1.05),  # ash green
    'clans': (215, 0.28, 1.1),   # steel
    'frost': (200, 0.8, 1.2),   # ice blue
    'free': (24, 1.3, 1.2),     # rust orange
    'sands': (42, 0.65, 1.3),     # sand
    'swarm': (62, 0.6, 1.0),     # umber and moss
    'tides': (172, 1.0, 1.0),    # sea green
}


def recolour(im: Image.Image, hue: float, sat: float, val: float) -> Image.Image:
    h, s, v = im.convert('HSV').split()
    # the original's mean hue (weighted by saturation) is the point the shift is measured from
    hs, ss = h.getdata(), s.getdata()
    tot = sum(ss) or 1
    base = sum(a * b for a, b in zip(hs, ss)) / tot
    shift = hue / 360 * 255 - base
    h = h.point(lambda x: int((x + shift) % 256))
    s = s.point(lambda x: min(255, int(x * sat)))
    v = v.point(lambda x: min(255, int(x * val)))
    return Image.merge('HSV', (h, s, v)).convert('RGB')


def main() -> None:
    src = Image.open(SRC).convert('RGB')
    outs = []
    for fid, (hue, sat, val) in FACTIONS.items():
        im = recolour(src, hue, sat, val)
        im.save(f'public/assets/ui/slate_{fid}.jpg', quality=82, optimize=True)
        outs.append((fid, im))
    if '--sheet' in sys.argv:
        w = 200
        sheet = Image.new('RGB', (w * 5, w * 2 + 0))
        for i, (_, im) in enumerate(outs):
            sheet.paste(im.resize((w, w)), ((i % 5) * w, (i // 5) * w))
        sheet.save('.tmp/slate_arkusz.png')


if __name__ == '__main__':
    main()
