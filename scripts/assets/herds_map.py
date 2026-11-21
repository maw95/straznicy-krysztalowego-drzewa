"""Arena, obstacles and map tiles of the Wild Herd from the generated pictures in .tmp/zrodla/herds_map (backlog 61g, 21.11.2026).
 - arena/cyfrowa/herds.webp: the generated steppe with the clean plate under the board (arena_cyfrowa.clean_plate);
 - arena/cyfrowa/<obstacle>.webp: the transparent sprites cut to their box (arena_cyfrowa.sprite);
 - tiles/steppe_<n>.jpg, baseHerds_1.jpg, treasureHerds_<n>.jpg: the picture cropped to the 260x300 hex and put inside the border of an existing tile
   (meadow_1.jpg), so every tile of the map has the same frame.
Usage: python3 scripts/assets/herds_map.py"""
import os
import sys

from PIL import Image, ImageChops, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from arena_cyfrowa import clean_plate, sprite  # noqa: E402

SRC = '.tmp/zrodla/herds_map'
OUT = 'public/assets'
OBSTACLES = ['rockledge', 'stonecircle', 'boulderfield', 'menhir', 'cairn', 'thornbush', 'grasstuft']
TILES = {'steppe_1': 'steppe_1', 'steppe_2': 'steppe_2', 'steppe_3': 'steppe_3', 'steppe_4': 'steppe_4', 'baseHerds_1': 'baseHerds_1',
         'treasureHerds_1': 'treasureHerds_1', 'treasureHerds_2': 'treasureHerds_2'}
BORDER = 5  # px of the template frame that stays


def hex_mask(tpl: Image.Image) -> Image.Image:
    bg = tpl.getpixel((2, 2))
    diff = ImageChops.difference(tpl.convert('RGB'), Image.new('RGB', tpl.size, bg)).convert('L')
    return diff.point(lambda v: 255 if v > 18 else 0).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))


def tile(src: Image.Image, tpl: Image.Image, inner: Image.Image) -> Image.Image:
    w, h = tpl.size
    k = h / w
    cw = round(src.height / k)
    left = (src.width - cw) // 2
    pic = src.crop((left, 0, left + cw, src.height)).resize((w, h), Image.LANCZOS)
    out = tpl.copy()
    out.paste(pic, (0, 0), inner)
    return out


if __name__ == '__main__':
    clean_plate(Image.open(f'{SRC}/arena_raw.png').convert('RGB')).save(f'{OUT}/arena/cyfrowa/herds.webp', quality=82, method=6)
    for n in OBSTACLES:
        sprite(Image.open(f'{SRC}/{n}.png').convert('RGBA')).save(f'{OUT}/arena/cyfrowa/{n}.webp', quality=85, method=6)
    tpl = Image.open(f'{OUT}/tiles/meadow_1.jpg').convert('RGB')
    inner = hex_mask(tpl).filter(ImageFilter.MinFilter(2 * BORDER + 1)).filter(ImageFilter.GaussianBlur(1.5))
    for name in TILES:
        tile(Image.open(f'{SRC}/{name}.png').convert('RGB'), tpl, inner).save(f'{OUT}/tiles/{name}.jpg', quality=88)
    print('done')
