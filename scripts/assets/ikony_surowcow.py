# Cuts the generated resource icons (gold, wood, ore, Star Dust: bare objects on a transparent background) to their visible part, fits them into a square with a
# hair of margin and saves them as 256 px WebP with transparency in public/assets/ikony/mapa/. Usage: python3 scripts/assets/ikony_surowcow.py <dir with zloto.png drewno.png ruda.png pyl.png>
import sys
from PIL import Image

src = sys.argv[1]
SIZE, MARGIN = 256, 0.015
for name in ['zloto', 'drewno', 'ruda', 'pyl']:
    im = Image.open(f'{src}/{name}.png').convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox())
    inner = round(SIZE * (1 - 2 * MARGIN))
    k = inner / max(im.size)
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    out.alpha_composite(im.resize((w, h), Image.LANCZOS), ((SIZE - w) // 2, (SIZE - h) // 2))
    out.save(f'public/assets/ikony/mapa/{name}.webp', quality=90, method=6)
    print(name, im.size, '->', (w, h))
