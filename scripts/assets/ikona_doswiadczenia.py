# Cuts the generated experience icon (a bare object on a transparent background) to its visible part, fits it into a square and saves it as a 256 px WebP
# with transparency: public/assets/ikony/mapa/doswiadczenie.webp. Usage: python3 scripts/assets/ikona_doswiadczenia.py <icon.png>
import sys
from PIL import Image

SIZE, MARGIN = 256, 0.015
im = Image.open(sys.argv[1]).convert('RGBA')
im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox())
inner = round(SIZE * (1 - 2 * MARGIN))
k = inner / max(im.size)
w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
out.alpha_composite(im.resize((w, h), Image.LANCZOS), ((SIZE - w) // 2, (SIZE - h) // 2))
out.save('public/assets/ikony/mapa/doswiadczenie.webp', quality=90, method=6)
print(im.size, '->', (w, h))
