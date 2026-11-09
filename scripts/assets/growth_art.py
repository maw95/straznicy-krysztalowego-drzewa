"""Cuts the Scenario pictures (GPT Image 2.5 Flare, 2026-11-09) into game files: water tiles, empty gear slots, level shields.
The pictures come with a black background: it is turned into transparency (unmultiplied, so a glow stays a soft glow).
Usage: python3 scripts/assets/growth_art.py <folder with the downloaded jpg files>  (names in SRC below)"""
import sys
from PIL import Image, ImageChops, ImageDraw

SRC = sys.argv[1].rstrip('/')
OUT = 'public/assets'
F = {
    'water_1': 'mcp-scenario-blob-1794233707554-aluxid.jpg',
    'water_2': 'mcp-scenario-blob-1794233715003-5h3290.jpg',
    'weapon': 'mcp-scenario-blob-1794233714576-kkjzj6.jpg',
    'armor': 'mcp-scenario-blob-1794233714555-thncuc.jpg',
    'boots': 'mcp-scenario-blob-1794233714712-p2mcw4.jpg',
    'lvl1': 'mcp-scenario-blob-1794233724834-e29t92.jpg',
    'lvl2': 'mcp-scenario-blob-1794233725019-zlb0ll.jpg',
    'lvl3': 'mcp-scenario-blob-1794233725030-k3zn6q.jpg',
    'lvl4': 'mcp-scenario-blob-1794233724996-jwyj3w.jpg',
    'lvl5': 'mcp-scenario-blob-1794233725555-zj3fe7.jpg',
}
LIM = 28


def cut_black(path: str, size: int) -> Image.Image:
    rgb = Image.open(path).convert('RGB')
    w, h = rgb.size
    mx = ImageChops.lighter(ImageChops.lighter(rgb.getchannel('R'), rgb.getchannel('G')), rgb.getchannel('B'))
    # Background = dark pixels connected to the border (flood fill marks them 128).
    mark = mx.point(lambda v: 255 if v <= LIM else 0)
    for x in range(0, w, 8):
        for y in (0, h - 1):
            if mark.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mark, (x, y), 128)
    for y in range(0, h, 8):
        for x in (0, w - 1):
            if mark.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mark, (x, y), 128)
    px, m, k = rgb.load(), mx.load(), mark.load()
    out = Image.new('RGBA', (w, h))
    o = out.load()
    for y in range(h):
        for x in range(w):
            if k[x, y] == 128:
                a = min(1.0, m[x, y] / LIM)
                r, g, b = px[x, y]
                f = 1 / max(a, 0.05)
                o[x, y] = (min(255, int(r * f)), min(255, int(g * f)), min(255, int(b * f)), int(a * 255))
            else:
                o[x, y] = px[x, y] + (255,)
    bbox = out.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    out = out.crop(bbox)
    side = max(out.size)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2))
    return sq.resize((size, size), Image.LANCZOS)


for n in ('water_1', 'water_2'):
    im = Image.open(f'{SRC}/{F[n]}').convert('RGB')
    # The picture is 1024 x 1182: scale to the tile (260 x 300).
    im.resize((260, 300), Image.LANCZOS).save(f'{OUT}/tiles/{n}.jpg', quality=88)
for n in ('weapon', 'armor', 'boots'):
    cut_black(f'{SRC}/{F[n]}', 128).save(f'{OUT}/ikony/sloty/{n}.webp', quality=88)
for i in range(1, 6):
    cut_black(f'{SRC}/{F[f"lvl{i}"]}', 192).save(f'{OUT}/ikony/poziom/{i}.webp', quality=88)
