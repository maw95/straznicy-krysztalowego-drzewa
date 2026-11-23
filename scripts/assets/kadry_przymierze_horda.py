"""Portrait crops of the Covenant (dawn) and the Horde units, 0 CU (backlog 62e). From the card art (cards/art, 640x442 or 451x332: the originals in high quality are not in the repo).
Square crop: (cx, cy, side) = centre as shares of the art's width / height, side as a share of the art's height (1.0 = the full height); moved inside the picture when it sticks out.
Usage: python3 scripts/assets/kadry_przymierze_horda.py            -> the preview .tmp/kadry_przymierze_horda.html (original with the frame, current and new portrait)
       python3 scripts/assets/kadry_przymierze_horda.py --apply    -> writes the new portraits to public/assets/cards/portraits (after the author's acceptance)"""
import os
import sys

from PIL import Image

ART = 'public/assets/cards/art'
OUT = 'public/assets/cards/portraits'
S = 256
CROPS = {
    # Covenant
    'goldDragon': (.60, .38, .70), 'unicornKing': (.66, .38, .72), 'ancientBear': (.72, .38, .72), 'braveDuck': (.42, .42, .72),
    'moonWolf': (.54, .32, .68), 'elfDruid': (.58, .38, .74), 'nymph': (.34, .40, .78), 'pegasus': (.55, .45, 1.0),
    'hedgehog': (.66, .62, .60), 'centaur': (.30, .38, .78), 'boar': (.50, .50, .95), 'treeGuardian': (.55, .50, 1.0),
    'silverFox': (.38, .52, .85), 'dawnOwl': (.50, .50, .85), 'dryadArcher': (.55, .50, .90), 'whiteStag': (.32, .50, .95),
    'dawnPhoenix': (.50, .50, .95), 'dawnKnight': (.50, .42, .75), 'dawnHuntress': (.45, .42, .80), 'dawnSage': (.52, .40, .78),
    # Horde
    'blackDragon': (.72, .38, .78), 'werewolfLord': (.58, .45, .88), 'ironFistOgre': (.50, .40, .80), 'duskManticore': (.62, .50, .78),
    'goblinShaman': (.45, .50, .85), 'caveSpider': (.50, .50, .75), 'shadowBat': (.55, .38, .72), 'ratman': (.52, .45, .78),
    'hellhound': (.52, .55, .78), 'salamander': (.62, .45, .85), 'minotaurChief': (.50, .45, .90), 'goblinSlinger': (.50, .52, .72),
    'gargoyle': (.55, .48, .72), 'caveTroll': (.34, .55, .85), 'shadowWyvern': (.68, .50, .88), 'doomBehemoth': (.52, .50, .95),
    'hordeWarlord': (.52, .42, .78), 'hordeCrossbow': (.55, .50, .78), 'hordeShadow': (.50, .50, .78),
}


def box(im: Image.Image, crop):
    w, h = im.size
    cx, cy, s = crop
    sp = round(s * h)
    l = min(max(round(cx * w - sp / 2), 0), w - sp)
    t = min(max(round(cy * h - sp / 2), 0), h - sp)
    return l, t, sp


def main() -> None:
    apply = '--apply' in sys.argv
    os.makedirs('.tmp/kadry_ph', exist_ok=True)
    cards = ''
    for n, crop in CROPS.items():
        im = Image.open(f'{ART}/{n}.jpg').convert('RGB')
        l, t, sp = box(im, crop)
        new = im.crop((l, t, l + sp, t + sp)).resize((S, S), Image.LANCZOS)
        if apply:
            new.save(f'{OUT}/{n}.jpg', quality=88)
            continue
        new.save(f'.tmp/kadry_ph/{n}.jpg', quality=88)
        w, h = im.size
        cards += f'''<section><h3>{n}</h3><div class="row"><div class="orig"><img src="../{ART}/{n}.jpg"><div class="r" style="left:{l / w * 100:.2f}%;top:{t / h * 100:.2f}%;width:{sp / w * 100:.2f}%;height:{sp / h * 100:.2f}%"></div></div>
<figure><img src="../{OUT}/{n}.jpg"><figcaption>obecny</figcaption></figure><figure><img src="kadry_ph/{n}.jpg"><figcaption>propozycja (zielony)</figcaption></figure></div></section>'''
    if apply:
        print('applied', len(CROPS))
        return
    open('.tmp/kadry_przymierze_horda.html', 'w').write(f'''<!doctype html><meta charset=utf-8><title>Kadry portretów Przymierza i Hordy</title>
<style>body{{background:#1c1814;color:#eee;font:14px sans-serif;margin:20px}}section{{margin-bottom:22px}}h3{{margin:0 0 6px}}
.row{{display:flex;gap:14px;align-items:flex-start}}.orig{{position:relative;width:520px}}.orig img{{width:100%;display:block}}
.r{{position:absolute;border:3px solid #3d3;box-sizing:border-box}}figure{{margin:0}}figure img{{width:256px;height:256px;display:block;border:1px solid #555}}figcaption{{font-size:12px;color:#bbb}}</style>
<h1>Kadry portretów Przymierza i Hordy (z kart 640x442 / 451x332; ilustracje w wyższej jakości nie są w repozytorium)</h1>{cards}''')
    print('ok', len(CROPS))


if __name__ == '__main__':
    main()
