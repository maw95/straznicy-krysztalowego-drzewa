"""Map medallions of the factions that have none: osada_<race>.webp (settlement, 256 px) and kontrola_<race>.webp (control point, 128 px) in ikony/mapa.
The gold ring is taken from the painted originals (Przymierze), the field inside is the colour of the faction with its crest on it.
Usage: python3 scripts/assets/map_icons.py"""
import math
from PIL import Image, ImageDraw, ImageFilter

D = 'public/assets/ikony/mapa'
CRESTS = 'public/assets/cards/crests'
# race: field colour (centre, edge) in the colours of the faction rings (src/ui/common.tsx FACTION_RING)
COLORS = {
    'herds': ((196, 120, 40), (92, 48, 14)), 'undead': ((120, 76, 170), (44, 24, 70)), 'clans': ((140, 138, 140), (50, 52, 58)),
    'frost': ((92, 160, 200), (24, 52, 84)), 'free': ((130, 90, 56), (50, 32, 18)), 'sands': ((214, 170, 52), (104, 72, 14)),
    'swarm': ((72, 150, 120), (20, 56, 46)), 'tides': ((52, 190, 200), (12, 70, 82)),
}

def medallion(ring_src, size, race, crest_scale):
    ring = Image.open(f'{D}/{ring_src}.webp').convert('RGBA').resize((size, size), Image.LANCZOS)
    c, e = COLORS[race]
    field = Image.new('RGBA', (size, size))
    px = field.load()
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2)
            t = min(1, r / 0.9) ** 1.6
            px[x, y] = tuple(round(c[i] + (e[i] - c[i]) * t) for i in range(3)) + (255,)
    crest = Image.open(f'{CRESTS}/{race}.png').convert('RGBA')
    k = size * crest_scale / max(crest.size)
    crest = crest.resize((round(crest.width * k), round(crest.height * k)), Image.LANCZOS)
    shadow = Image.new('RGBA', field.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 150), (round((size - crest.width) / 2) + size // 64, round((size - crest.height) / 2) + size // 48), crest)
    field = Image.alpha_composite(field, shadow.filter(ImageFilter.GaussianBlur(size / 60)))
    field.alpha_composite(crest, (round((size - crest.width) / 2), round((size - crest.height) / 2)))
    # inside the ring only; the ring (r > 0.8) comes from the original on top
    inner = Image.new('L', (size, size), 0)
    ImageDraw.Draw(inner).ellipse((size * 0.08, size * 0.08, size * 0.92, size * 0.92), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(field, (0, 0), inner)
    ring_mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(ring_mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    ImageDraw.Draw(ring_mask).ellipse((size * 0.1, size * 0.1, size * 0.9, size * 0.9), fill=0)
    ring.putalpha(Image.composite(ring.getchannel('A'), Image.new('L', (size, size), 0), ring_mask))
    out.alpha_composite(ring)
    return out

for race in COLORS:
    medallion('osada_dawn', 256, race, 0.62).save(f'{D}/osada_{race}.webp', quality=90, method=6)
    medallion('kontrola_dawn', 128, race, 0.5).save(f'{D}/kontrola_{race}.webp', quality=90, method=6)
    print(race)
