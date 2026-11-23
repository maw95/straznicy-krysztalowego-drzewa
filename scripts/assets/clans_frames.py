"""Crest, card frames, ability icons and rune icons of the Iron Clans (G4, 23.11.2026).
Crest: the generated banner (.tmp/zrodla/clans_frames_icons/crest_v1.png) cut to its opaque box and fitted into 425x420 like the other crests.
Frames: the Covenant's frames recoloured (green -> polished steel-brown), the two corner banners replaced by the new crest.
Ability icons: glyphs in .tmp/zrodla/clans_frames_icons/g/<id>.png put into the gold ring of dive.png (scripts/assets/ability_icon_glyph.py).
Rune icons: round crops of g/rune_<kind>.png, 96 px WebP in public/assets/ikony/runy/.
Usage: python3 scripts/assets/clans_frames.py"""
import os, subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = '.tmp/zrodla/clans_frames_icons'
OUT = 'public/assets/cards'
CREST_BOX = (425, 420)
GREEN = (38, 135)      # PIL hue range (0-255) of the greens: about 54-190 degrees
TARGET_H = 20          # about 28 degrees: brown/brass
SAT = 0.50             # steel-brown: much less saturated than the green it replaces
ICONS = ['shieldOath', 'stoneRune', 'bulwark', 'standShot', 'temper', 'bronzeQuills', 'giantBane', 'misleadLight', 'stunBlow', 'ramBlow', 'cannonFire', 'fortify']


def crest() -> Image.Image:
    im = Image.open(f'{SRC}/crest_v1.png').convert('RGBA')
    im = im.crop(im.split()[3].point(lambda v: 255 if v > 8 else 0).getbbox())
    k = min(CREST_BOX[0] / im.width, CREST_BOX[1] / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', CREST_BOX, (0, 0, 0, 0))
    out.paste(im, ((CREST_BOX[0] - im.width) // 2, (CREST_BOX[1] - im.height) // 2), im)
    return out


def recolour(im: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Returns the recoloured frame and the mask of the green pixels (before recolouring)."""
    a = im.split()[3]
    h, s, v = im.convert('RGB').convert('HSV').split()
    green = ImageChops.multiply(h.point(lambda x: 255 if GREEN[0] <= x <= GREEN[1] else 0), s.point(lambda x: 255 if x > 60 else 0))
    h2 = Image.composite(Image.new('L', h.size, TARGET_H), h, green)
    s2 = Image.composite(s.point(lambda x: round(x * SAT)), s, green)
    v2 = Image.composite(v.point(lambda x: min(255, round(x * 1.3))), v, green)
    r, g, b = Image.merge('HSV', (h2, s2, v2)).convert('RGB').split()
    return Image.merge('RGBA', (r, g, b, a)), green


def frames(c: Image.Image):
    for kind in ('hero', 'support'):
        src = Image.open(f'{OUT}/frames/dawn_{kind}.png').convert('RGBA')
        fr, green = recolour(src)
        w, h = src.size
        for x0, x1 in ((0, w // 4), (3 * w // 4, w)):
            box = green.crop((x0, 0, x1, h // 7)).getbbox()
            if not box: continue
            bx0, by0, bx1, by1 = box[0] + x0, box[1], box[2] + x0, box[3]
            bw, bh = bx1 - bx0, by1 - by0
            k = min(bw / CREST_BOX[0], bh / CREST_BOX[1])
            ci = c.resize((max(1, round(CREST_BOX[0] * k)), max(1, round(CREST_BOX[1] * k))), Image.LANCZOS)
            fr.alpha_composite(ci, (bx0 + bw // 2 - ci.width // 2, by0 + bh // 2 - ci.height // 2))
        fr.save(f'{OUT}/frames/clans_{kind}.png')


def icons():
    for ab in ICONS:
        subprocess.run(['python3', 'scripts/assets/ability_icon_glyph.py', f'{SRC}/g1024/{ab}.png', ab, 'dive'], check=True)


def runes():
    os.makedirs('public/assets/ikony/runy', exist_ok=True)
    for kind in ('attack', 'life', 'armour'):
        g = Image.open(f'{SRC}/g/rune_{kind}.png').convert('RGB')
        g = g.crop((40, 40, 472, 472)).resize((96, 96), Image.LANCZOS).convert('RGBA')
        m = Image.new('L', (96, 96), 0)
        ImageDraw.Draw(m).ellipse((1, 1, 94, 94), fill=255)
        g.putalpha(m.filter(ImageFilter.GaussianBlur(0.8)))
        g.save(f'public/assets/ikony/runy/{kind}.webp', quality=88, method=6)


if __name__ == '__main__':
    c = crest()
    c.save(f'{OUT}/crests/clans.png')
    frames(c)
    icons()
    runes()
    print('done')
