"""Re-crops the portraits of six Horde supports from their card art (backlog 61g, variant A, 0 CU).
The old crop zoomed so far in that heads were cut at the edges; here the square takes the full height of the art, centred on the figure's head
(cx = fraction of the width), and the dark ones get a little more light and colour ("slightly more vivid", only a bit).
Usage: python3 scripts/assets/horde_portraits.py [outdir]   (default: public/assets/cards/portraits, overwrites)"""
import sys
from PIL import Image, ImageEnhance

# unit: (cx, brightness, colour)
UNITS = {
    'ratman': (0.30, 1.30, 1.15),
    'goblinSlinger': (0.52, 1.0, 1.05),
    'gargoyle': (0.56, 1.0, 1.05),
    'hellhound': (0.55, 1.35, 1.15),
    'caveTroll': (0.46, 1.0, 1.05),
    'minotaurChief': (0.56, 1.30, 1.15),
}
out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards/portraits'
for name, (cx, bright, colour) in UNITS.items():
    art = Image.open(f'public/assets/cards/art/{name}.jpg').convert('RGB')
    w, h = art.size
    left = min(max(round(cx * w - h / 2), 0), w - h)
    img = art.crop((left, 0, left + h, h)).resize((256, 256), Image.LANCZOS)
    img = ImageEnhance.Brightness(img).enhance(bright)
    img = ImageEnhance.Color(img).enhance(colour)
    img.save(f'{out}/{name}.jpg', quality=84)
