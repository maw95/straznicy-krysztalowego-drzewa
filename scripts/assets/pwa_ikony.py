# Builds the browser and PWA icons (public/pwa/icon-192.png, icon-512.png, apple-touch-icon.png) from the logo (public/assets/ui/logo.png):
# cut to the visible part, fitted into the square with a hair of margin, transparent background. Usage: python3 scripts/assets/pwa_ikony.py
from PIL import Image

src = Image.open('public/assets/ui/logo.png').convert('RGBA')
# Only what is really visible (faint haze at the edge of the glow does not count).
bbox = src.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
logo = src.crop(bbox)
print('visible part', bbox, logo.size)

def icon(size, margin=0.01):
    inner = round(size * (1 - 2 * margin))
    k = inner / max(logo.size)
    w, h = max(1, round(logo.width * k)), max(1, round(logo.height * k))
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.alpha_composite(logo.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return out

for name, size in [('icon-192', 192), ('icon-512', 512), ('apple-touch-icon', 180)]:
    icon(size).save(f'public/pwa/{name}.png', optimize=True)
    print(name, size)
