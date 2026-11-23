"""Tiles of the Wild Herd's own land (backlog 61g, G4 tiles, 23.11.2026): the generated pictures in .tmp/zrodla/herds_tiles become
 - tiles/herds_<terrain>_<n>.jpg (hill, river, bridge, mountain, chasm, barren): the picture cropped to the 260x300 hex and put into the frame of meadow_1.jpg
   (the same way as the steppe in herds_map.py);
 - tiles/herds_obj_<name>.jpg and tiles/herds_osada_1.jpg: the steppe versions of the map objects (shrine, camp, chest, well, sawmill, mines, ...) and of a
   settlement, cropped to 260x300 without a frame (the map clips them to a hex);
 - tiles/back_herds.jpg: the reverse of the tiles of the Herd's half of the map: the red back of the Horde recoloured to ochre with a medallion of the crossed horns.
The list of what exists is FACTION_TILE_ART in src/ui/common.tsx. Usage: python3 scripts/assets/herds_tiles.py"""
import colorsys
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from herds_map import BORDER, hex_mask, tile  # noqa: E402

SRC = '.tmp/zrodla/herds_tiles'
OUT = 'public/assets/tiles'
GROUND = ['hill_1', 'hill_2', 'river_1', 'river_2', 'bridge_1', 'mountain_1', 'mountain_2', 'chasm_1', 'chasm_2', 'barren_1', 'barren_2']
OBJECTS = ['obj_shrine', 'obj_camp', 'obj_chest', 'obj_studnia', 'obj_tartak', 'obj_kopalnia', 'obj_kopalnia_ruda', 'obj_zrodlo_pylu', 'obj_chatka',
           'obj_skladnica', 'obj_odlamek', 'obj_mlyn']


def crop_tile(im: Image.Image) -> Image.Image:
    w = round(im.height * 260 / 300)
    left = (im.width - w) // 2
    return im.crop((left, 0, left + w, im.height)).resize((260, 300), Image.LANCZOS)


def recolor(im: Image.Image) -> Image.Image:
    """The reds of the Horde back go to ochre-brown; the gold stays (its hue is already near ochre)."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y][:3]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.45 and (h > 0.93 or h < 0.04):
                h = 0.075 if v > 0.25 else 0.06
                s *= 0.82
                r, g, b = colorsys.hsv_to_rgb(h, s, v * 1.08 if v < 0.9 else v)
                px[x, y] = (round(r * 255), round(g * 255), round(b * 255))
    return im


def back() -> Image.Image:
    im = recolor(Image.open(f'{OUT}/back_horde.jpg').convert('RGB'))
    cx, cy, r = 130, 150, 76
    # Clear the helmet: a dark ochre disc with a soft edge, then two gold rings and the crest cloth with the crossed horns inside.
    disc = Image.new('L', im.size, 0)
    ImageDraw.Draw(disc).ellipse((cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6), fill=255)
    disc = disc.filter(ImageFilter.GaussianBlur(3))
    im.paste(Image.new('RGB', im.size, (88, 48, 20)), (0, 0), disc)
    crest = Image.open('public/assets/cards/crests/herds.png').convert('RGBA')
    ccx, ccy, cr = 212, 232, 100
    cloth = crest.crop((ccx - cr, ccy - cr, ccx + cr, ccy + cr)).resize((2 * r - 14, 2 * r - 14), Image.LANCZOS)
    mask = Image.new('L', cloth.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, cloth.width - 1, cloth.height - 1), fill=255)
    mask = ImageChops.multiply(mask.filter(ImageFilter.GaussianBlur(1)), cloth.getchannel('A'))
    im.paste(cloth.convert('RGB'), (cx - cloth.width // 2, cy - cloth.height // 2), mask)
    d = ImageDraw.Draw(im)
    gold = (222, 178, 78)
    for rr, wd in ((r, 4), (r - 9, 2)):
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=gold, width=wd)
    for dx, dy in ((0, -r - 4), (0, r + 4), (-r - 4, 0), (r + 4, 0)):  # small diamonds on the ring
        d.polygon([(cx + dx, cy + dy - 6), (cx + dx + 5, cy + dy), (cx + dx, cy + dy + 6), (cx + dx - 5, cy + dy)], fill=gold)
    return im


if __name__ == '__main__':
    tpl = Image.open(f'{OUT}/meadow_1.jpg').convert('RGB')
    inner = hex_mask(tpl).filter(ImageFilter.MinFilter(2 * BORDER + 1)).filter(ImageFilter.GaussianBlur(1.5))
    for n in GROUND:
        tile(Image.open(f'{SRC}/{n}.jpg').convert('RGB'), tpl, inner).save(f'{OUT}/herds_{n}.jpg', quality=88)
    for n in OBJECTS:
        crop_tile(Image.open(f'{SRC}/{n}.jpg').convert('RGB')).save(f'{OUT}/herds_{n}.jpg', quality=88)
    crop_tile(Image.open(f'{SRC}/osada.jpg').convert('RGB')).save(f'{OUT}/herds_osada_1.jpg', quality=88)
    back().save(f'{OUT}/back_herds.jpg', quality=90)
    print('done')
