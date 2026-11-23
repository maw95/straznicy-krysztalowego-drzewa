"""Card art (640x442) and portraits (256x256) of the Iron Clan and the Brotherhood of the Tide from the generated 1008x704 pictures (23.11.2026).
Source: .tmp/zrodla/<clans|tides>_cards/<id>.(jpg|png) (Scenario, GPT Image 2.5 Flare, medium, ~3 CU each; chosen variants are copied there, first-round files that
were replaced are in .tmp/zrodla/first_round). The four portraits approved at gate G3 (shieldDwarf, clanColossus, tritonHarpoon, leviathan) stay as they are.
Portrait = a square crop given as (centre x, centre y, side) in shares of the picture's width, height and height, measured on a 10% grid by eye.
Usage: python3 scripts/assets/clans_tides_cards.py [outdir=public/assets/cards]   (then python3 scripts/assets/card_crops.py)"""
import glob
import sys
from PIL import Image

SRC = {'clans': '.tmp/zrodla/clans_cards', 'tides': '.tmp/zrodla/tides_cards'}
KEEP_PORTRAIT = {'shieldDwarf', 'clanColossus', 'tritonHarpoon', 'leviathan'}
CROP = {
    'clans': {
        'ironThane': (.50, .40, .62), 'runeMatron': (.37, .28, .50), 'passWarden': (.44, .35, .50), 'oldMiner': (.47, .28, .52),
        'clanWarrior': (.50, .30, .55), 'mountainCrossbow': (.30, .32, .55), 'forgePriest': (.42, .33, .58), 'shieldDwarf': (.5, .4, .6),
        'bronzeMole': (.50, .55, .80), 'brassSpider': (.50, .52, .90), 'armoredBear': (.50, .52, .80), 'battleSmith': (.46, .30, .52),
        'bronzeSentinel': (.45, .30, .50), 'ramGoat': (.50, .50, .85), 'giantSlayer': (.46, .45, .70), 'skarbnik': (.42, .40, .55),
        'hammerGuard': (.37, .30, .50), 'dwarfCannon': (.58, .50, 1.0), 'clanColossus': (.5, .3, .6),
    },
    'tides': {
        'tritonKing': (.49, .31, .52), 'sirenSinger': (.40, .30, .55), 'seaSerpent': (.55, .50, .90), 'walrusCaptain': (.42, .30, .50),
        'tritonGuard': (.43, .28, .52), 'harpooneer': (.40, .27, .52), 'sefiran': (.52, .58, .55), 'shellTurtle': (.45, .50, .80),
        'tritonHarpoon': (.5, .3, .6), 'frogLeaper': (.47, .33, .52), 'crabShield': (.40, .35, .62), 'inkOctopus': (.52, .50, .70),
        'sharkman': (.45, .28, .52), 'pearlPriestess': (.42, .27, .55), 'lobsterKnight': (.40, .37, .65), 'albatross': (.58, .45, .95),
        'reefGolem': (.53, .33, .62), 'seaWitch': (.43, .35, .58), 'leviathan': (.5, .4, .8),
    },
}
if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards'
    for fac, table in CROP.items():
        for name, (cx, cy, side) in table.items():
            im = Image.open(glob.glob(f'{SRC[fac]}/{name}.*')[0]).convert('RGB')
            im.resize((640, 442), Image.LANCZOS).save(f'{out}/art/{name}.jpg', quality=88)
            if name in KEEP_PORTRAIT:
                continue
            w, h = im.size
            sp = round(side * h)
            left = min(max(round(cx * w - sp / 2), 0), w - sp)
            top = min(max(round(cy * h - sp / 2), 0), h - sp)
            im.crop((left, top, left + sp, top + sp)).resize((256, 256), Image.LANCZOS).save(f'{out}/portraits/{name}.jpg', quality=86)
    print('done')
