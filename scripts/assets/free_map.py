"""Arena, obstacles, map tiles and battle markers of the Free Company from the generated pictures in .tmp/zrodla/free_map and .tmp/zrodla/free_tiles
(G4 map phase, 26.11.2026); the same way as the Tides' (tides_map.py):
 - arena/cyfrowa/free.webp: the forest camp by the ruined mill with the clean plate under the board; arena/cyfrowa/<obstacle>.webp: the transparent sprites;
 - tiles/glade_<n>.jpg, baseFree_1.jpg, treasureFree_1.jpg: the pictures put into the frame of meadow_1.jpg (new terrain types glade, baseFree, treasureFree);
 - tiles/free_<terrain>_<n>.jpg (hill, river, bridge, mountain, chasm, barren), free_obj_<name>.jpg, free_osada_1.jpg: the forest versions of the shared ground, objects and settlement;
 - tiles/back_free.jpg: the green Covenant back recoloured to burgundy with the crest (fox head over crossed arrows) in the medallion;
 - markers/free_snare.png (a hidden trap on its hex) and free_mark.png (the Raven's mark on a unit).
The list of what exists is FACTION_TILE_ART in src/ui/common.tsx. Usage: python3 scripts/assets/free_map.py"""
import colorsys
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from arena_cyfrowa import clean_plate, sprite  # noqa: E402
from herds_map import BORDER, hex_mask, tile  # noqa: E402
from herds_tiles import crop_tile  # noqa: E402

SRC = '.tmp/zrodla/free_map'
TILES_SRC = '.tmp/zrodla/free_tiles'
OUT = 'public/assets'
OBSTACLES = ['felledoak', 'campwagon', 'barrelstack', 'stakefence', 'millstones', 'woodpile', 'campfire']
FRAMED = ['glade_1', 'glade_2', 'baseFree_1', 'treasureFree_1']
GROUND = ['hill_1', 'river_1', 'bridge_1', 'mountain_1', 'chasm_1', 'barren_1']
OBJECTS = ['obj_shrine', 'obj_camp', 'obj_chest', 'obj_studnia', 'obj_tartak', 'obj_kopalnia', 'obj_kopalnia_ruda', 'obj_zrodlo_pylu', 'obj_chatka',
           'obj_skladnica', 'obj_odlamek', 'obj_mlyn']
MARKERS = {'snare': 'free_snare', 'ravenmark': 'free_mark'}


def back() -> Image.Image:
    im = Image.open(f'{OUT}/tiles/back_dawn.jpg').convert('RGB')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y][:3]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.3 and 0.2 < h < 0.45:  # greens -> burgundy (#6B1A33)
                r, g, b = colorsys.hsv_to_rgb(0.945, min(1, s * 0.92), v * 0.95)
                px[x, y] = (round(r * 255), round(g * 255), round(b * 255))
    cx, cy, r = 130, 150, 76
    disc = Image.new('L', im.size, 0)
    ImageDraw.Draw(disc).ellipse((cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6), fill=255)
    disc = disc.filter(ImageFilter.GaussianBlur(3))
    im.paste(Image.new('RGB', im.size, (62, 14, 30)), (0, 0), disc)
    crest = Image.open(f'{OUT}/cards/crests/free.png').convert('RGBA')
    ccx, ccy, cr = 212, 230, 112  # the fox head and the arrows of the banner
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
    clean_plate(Image.open(f'{SRC}/arena_raw.png').convert('RGB')).save(f'{OUT}/arena/cyfrowa/free.webp', quality=82, method=6)
    for n in OBSTACLES:
        sprite(Image.open(f'{SRC}/{n}.png').convert('RGBA')).save(f'{OUT}/arena/cyfrowa/{n}.webp', quality=85, method=6)
    for src, name in MARKERS.items():
        sprite(Image.open(f'{SRC}/{src}.png').convert('RGBA'), 128).save(f'{OUT}/markers/{name}.png', optimize=True)
    tpl = Image.open(f'{OUT}/tiles/meadow_1.jpg').convert('RGB')
    inner = hex_mask(tpl).filter(ImageFilter.MinFilter(2 * BORDER + 1)).filter(ImageFilter.GaussianBlur(1.5))
    for n in FRAMED:
        tile(Image.open(f'{TILES_SRC}/{n}.png').convert('RGB'), tpl, inner).save(f'{OUT}/tiles/{n}.jpg', quality=88)
    for n in GROUND:
        tile(Image.open(f'{TILES_SRC}/{n}.png').convert('RGB'), tpl, inner).save(f'{OUT}/tiles/free_{n}.jpg', quality=88)
    for n in OBJECTS:
        crop_tile(Image.open(f'{TILES_SRC}/{n}.png').convert('RGB')).save(f'{OUT}/tiles/free_{n}.jpg', quality=88)
    crop_tile(Image.open(f'{TILES_SRC}/osada.png').convert('RGB')).save(f'{OUT}/tiles/free_osada_1.jpg', quality=88)
    back().save(f'{OUT}/tiles/back_free.jpg', quality=90)
    print('done')
