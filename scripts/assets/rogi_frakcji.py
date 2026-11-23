"""Faction-coloured sapphires in the gold corner ornaments (ui/corner_gold_*.webp) -> ui/corner_<faction>_<tl|tr|bl|br>.webp (0 CU).
Only the blue pixels (the gem) change hue, gold stays. Colours are a little stronger than the slate panels. Run from the repo root."""
import colorsys

from PIL import Image

# faction: (hue in degrees, saturation factor, brightness factor)
GEMS = {
    'dawn': (140, 1.0, 1.0), 'horde': (355, 1.1, 1.0), 'herds': (32, 1.0, 1.1), 'undead': (140, 0.55, 1.0), 'clans': (215, 0.35, 1.15),
    'frost': (190, 0.6, 1.25), 'free': (22, 1.1, 1.05), 'sands': (45, 0.8, 1.2), 'swarm': (75, 0.9, 0.95), 'tides': (170, 1.0, 1.0),
}


def recolour(im: Image.Image, hue: float, sat: float, val: float) -> Image.Image:
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.5 < h < 0.72 and s > 0.3:
                r, g, b = colorsys.hsv_to_rgb(hue / 360, min(1, s * sat), min(1, v * val))
                px[x, y] = (round(r * 255), round(g * 255), round(b * 255), a)
    return im


for fid, (hue, sat, val) in GEMS.items():
    for pos in ('tl', 'tr', 'bl', 'br'):
        recolour(Image.open(f'public/assets/ui/corner_gold_{pos}.webp'), hue, sat, val).save(f'public/assets/ui/corner_{fid}_{pos}.webp', quality=90, method=6)
