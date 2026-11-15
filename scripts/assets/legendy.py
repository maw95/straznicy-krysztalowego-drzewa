"""Card art (451x332) and portraits (256x256) of the two level 6 legendary units, made from their cut-outs (transparent WebP from arkusz.py)
laid over a painted-looking gradient of the faction's colours. Usage: python3 scripts/assets/legendy.py <folder with phoenix.webp and behemoth.webp>"""
import sys
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1].rstrip('/')
UNITS = {'dawnPhoenix': ('phoenix', (255, 236, 170), (60, 120, 70)), 'doomBehemoth': ('behemoth', (150, 40, 30), (18, 8, 10))}


def background(w, h, inner, outer):
    bg = Image.new('RGB', (w, h), outer)
    glow = Image.new('L', (w, h), 0)
    ImageDraw.Draw(glow).ellipse((w * 0.1, h * 0.05, w * 0.9, h * 0.95), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.16))
    bg.paste(Image.new('RGB', (w, h), inner), (0, 0), glow)
    return bg


for unit, (name, inner, outer) in UNITS.items():
    cut = Image.open(f'{SRC}/{name}.webp').convert('RGBA')
    art = background(451, 332, inner, outer)
    fig = cut.copy()
    fig.thumbnail((440, 322), Image.LANCZOS)
    art.paste(fig, ((451 - fig.width) // 2, 332 - fig.height - 4), fig)
    art.save(f'public/assets/cards/art/{unit}.jpg', quality=84)
    por = background(256, 256, inner, outer)
    # The head lies in the upper part of the cut-out: zoom in on it.
    big = cut.resize((round(cut.width * 420 / cut.height), 420), Image.LANCZOS)
    x = (big.width - 256) // 2 + (40 if name == 'phoenix' else -90)
    por.paste(big, (-x, -6), big)
    por.save(f'public/assets/cards/portraits/{unit}.jpg', quality=84)
    print(unit)
