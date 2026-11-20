"""Puts a Scenario glyph (1024x1024, red neon on dark crimson) into the gold ring of an existing ability icon and writes <id>.png (192 px) and <id>_inner.png (160 px).
Usage: python3 scripts/assets/ability_icon_glyph.py <glyph.png> <new id> <template id>   (e.g. huntDive.png huntDive dive)"""
import sys
from PIL import Image, ImageDraw, ImageFilter

glyph, new, tpl = sys.argv[1:4]
OUT = 'public/assets/cards/abilities'
ring = Image.open(f'{OUT}/{tpl}.png').convert('RGBA')
S = ring.size[0]
d = round(S * 0.72)
g = Image.open(glyph).convert('RGB')
c = 1024 * 0.46
disc = g.crop((round(512 - c), round(512 - c), round(512 + c), round(512 + c))).resize((d, d), Image.LANCZOS).convert('RGBA')
m = Image.new('L', (d, d), 0)
ImageDraw.Draw(m).ellipse((1, 1, d - 2, d - 2), fill=255)
disc.putalpha(m.filter(ImageFilter.GaussianBlur(1.2)))
full = ring.copy()
full.alpha_composite(disc, ((S - d) // 2, (S - d) // 2))
full.save(f'{OUT}/{new}.png')
disc.resize((160, 160), Image.LANCZOS).save(f'{OUT}/{new}_inner.png')
