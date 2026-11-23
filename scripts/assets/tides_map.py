"""Arena, obstacles and map tiles of the Brotherhood of the Tide from the generated pictures in .tmp/zrodla/tides_map and .tmp/zrodla/tides_tiles
(G4 map phase, 23.11.2026); the same way as the Wild Herd's (herds_map.py, herds_tiles.py):
 - arena/cyfrowa/tides.webp: the beach at low tide with the clean plate under the board; arena/cyfrowa/<obstacle>.webp: the transparent sprites;
 - tiles/shore_<n>.jpg, baseTides_1.jpg, treasureTides_1.jpg: the pictures put into the frame of meadow_1.jpg (new terrain types shore, baseTides, treasureTides);
 - tiles/tides_<terrain>_<n>.jpg (hill, river, bridge, mountain, chasm, barren), tides_obj_<name>.jpg, tides_osada_1.jpg: the shore versions of the shared ground, objects and settlement;
 - tiles/back_tides.jpg: the green Covenant back recoloured to sea-green jade with the crest (trident in a shell) in the medallion.
The list of what exists is FACTION_TILE_ART in src/ui/common.tsx. Usage: python3 scripts/assets/tides_map.py"""
import colorsys
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from arena_cyfrowa import clean_plate, sprite  # noqa: E402
from herds_map import BORDER, hex_mask, tile  # noqa: E402
from herds_tiles import crop_tile  # noqa: E402

SRC = '.tmp/zrodla/tides_map'
TILES_SRC = '.tmp/zrodla/tides_tiles'
OUT = 'public/assets'
OBSTACLES = ['reefledge', 'wreck', 'netrack', 'seastack', 'driftwood', 'tidepool', 'kelpheap']
FRAMED = {'shore_1': 'shore_1', 'shore_2': 'shore_2', 'baseTides_1': 'baseTides_1', 'treasureTides_1': 'treasureTides_1'}
GROUND = ['hill_1', 'river_1', 'bridge_1', 'mountain_1', 'chasm_1', 'barren_1']
OBJECTS = ['obj_shrine', 'obj_camp', 'obj_chest', 'obj_studnia', 'obj_tartak', 'obj_kopalnia', 'obj_kopalnia_ruda', 'obj_zrodlo_pylu', 'obj_chatka',
           'obj_skladnica', 'obj_odlamek', 'obj_mlyn']


def back() -> Image.Image:
    im = Image.open(f'{OUT}/tiles/back_dawn.jpg').convert('RGB')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y][:3]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.3 and 0.2 < h < 0.45:  # greens -> jade (a little towards teal, no blue)
                r, g, b = colorsys.hsv_to_rgb(0.43, s * 0.8, v)
                px[x, y] = (round(r * 255), round(g * 255), round(b * 255))
    cx, cy, r = 130, 150, 76
    disc = Image.new('L', im.size, 0)
    ImageDraw.Draw(disc).ellipse((cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6), fill=255)
    disc = disc.filter(ImageFilter.GaussianBlur(3))
    im.paste(Image.new('RGB', im.size, (18, 70, 62)), (0, 0), disc)
    crest = Image.open(f'{OUT}/cards/crests/tides.png').convert('RGBA')
    ccx, ccy, cr = 212, 250, 120  # the trident and the shell of the banner
    cloth = crest.crop((ccx - cr, ccy - cr, ccx + cr, ccy + cr)).resize((2 * r - 14, 2 * r - 14), Image.LANCZOS)
    mask = Image.new('L', cloth.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, cloth.width - 1, cloth.height - 1), fill=255)
    mask = ImageChops.multiply(mask.filter(ImageFilter.GaussianBlur(1)), cloth.getchannel('A'))
    im.paste(cloth.convert('RGB'), (cx - cloth.width // 2, cy - cloth.height // 2), mask)
    d = ImageDraw.Draw(im)
    gold = (222, 178, 78)
    for rr, wd in ((r, 4), (r - 9, 2)):
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=gold, width=wd)
    for dx, dy in ((0, -r - 4), (0, r + 4), (-r - 4, 0), (r + 4, 0)):
        d.polygon([(cx + dx, cy + dy - 6), (cx + dx + 5, cy + dy), (cx + dx, cy + dy + 6), (cx + dx - 5, cy + dy)], fill=gold)
    return im


if __name__ == '__main__':
    clean_plate(Image.open(f'{SRC}/arena_raw.png').convert('RGB')).save(f'{OUT}/arena/cyfrowa/tides.webp', quality=82, method=6)
    for n in OBSTACLES:
        sprite(Image.open(f'{SRC}/{n}.png').convert('RGBA')).save(f'{OUT}/arena/cyfrowa/{n}.webp', quality=85, method=6)
    tpl = Image.open(f'{OUT}/tiles/meadow_1.jpg').convert('RGB')
    inner = hex_mask(tpl).filter(ImageFilter.MinFilter(2 * BORDER + 1)).filter(ImageFilter.GaussianBlur(1.5))
    for n in FRAMED:
        tile(Image.open(f'{TILES_SRC}/{n}.png').convert('RGB'), tpl, inner).save(f'{OUT}/tiles/{n}.jpg', quality=88)
    for n in GROUND:
        tile(Image.open(f'{TILES_SRC}/{n}.png').convert('RGB'), tpl, inner).save(f'{OUT}/tiles/tides_{n}.jpg', quality=88)
    for n in OBJECTS:
        crop_tile(Image.open(f'{TILES_SRC}/{n}.png').convert('RGB')).save(f'{OUT}/tiles/tides_{n}.jpg', quality=88)
    crop_tile(Image.open(f'{TILES_SRC}/osada.png').convert('RGB')).save(f'{OUT}/tiles/tides_osada_1.jpg', quality=88)
    back().save(f'{OUT}/tiles/back_tides.jpg', quality=90)
    print('done')
