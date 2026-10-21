"""Cut the board-game markers from docs/grafika/ikony/znaczniki.png into public/assets/markers/.

The empty damage drop (znacznik_obrazen_pusty.png, already transparent) is only trimmed and scaled;
the game writes the number on it.

The parchment around each marker is removed by flood-filling from the crop's edges; then only
the part connected to the marker's centre is kept (neighbouring drops touch each other).
Usage: python3 scripts/assets/markers.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'ikony', 'znaczniki.png')
EMPTY_DROP = os.path.join(ROOT, 'docs', 'grafika', 'ikony', 'znacznik_obrazen_pusty.png')
OUT = os.path.join(ROOT, 'public', 'assets', 'markers')
SIZE = 160

# Crop boxes on the sheet (left, top, right, bottom).
BOXES = {
    'ability_used': (652, 104, 866, 312),
    'rooted': (168, 505, 384, 716),
    'slowed': (468, 505, 684, 716),
    'cursed': (768, 505, 984, 716),
    'attack_up': (1068, 505, 1284, 716),
    'speed_up': (306, 756, 524, 978),
    'shield': (616, 756, 834, 978),
    'vitality': (916, 756, 1134, 978),
}


def cut(sheet, box):
    im = sheet.crop(box).convert('RGB')
    w, h = im.size
    marked = im.copy()
    for x, y in [(x, 0) for x in range(0, w, 6)] + [(x, h - 1) for x in range(0, w, 6)] + [(0, y) for y in range(0, h, 6)] + [(w - 1, y) for y in range(0, h, 6)]:
        r, g, b = marked.getpixel((x, y))
        if (r, g, b) != (255, 0, 255) and r > 150 and g > 130:  # parchment, not the marker rim
            ImageDraw.floodfill(marked, (x, y), (255, 0, 255), thresh=60)
    solid = Image.eval(marked.convert('RGB'), lambda v: v)
    mask = Image.new('L', (w, h), 0)
    px, mp = solid.load(), mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] != (255, 0, 255):
                mp[x, y] = 255
    # Thin lines of the sheet's ornaments that touch a marker are opened away.
    mask = mask.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
    # Keep only the piece connected to the centre.
    keep = mask.copy()
    ImageDraw.floodfill(keep, (w // 2, h // 2), 128)
    keep = keep.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(keep)
    out = out.crop(keep.point(lambda v: 255 if v > 40 else 0).getbbox())
    scale = SIZE / max(out.size)
    return out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)


if __name__ == '__main__':
    sheet = Image.open(SRC)
    os.makedirs(OUT, exist_ok=True)
    for name, box in BOXES.items():
        cut(sheet, box).save(os.path.join(OUT, f'{name}.png'), optimize=True)
    drop = Image.open(EMPTY_DROP).convert('RGBA')
    drop = drop.crop(drop.getchannel('A').getbbox())
    scale = SIZE / max(drop.size)
    drop.resize((round(drop.width * scale), round(drop.height * scale)), Image.LANCZOS).save(os.path.join(OUT, 'damage_empty.png'), optimize=True)
    print('ok ->', OUT)
