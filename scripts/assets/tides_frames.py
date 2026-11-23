"""Crest and card frames of the Brotherhood of the Tide (G4, 23.11.2026).
Crest: the generated banner (.tmp/zrodla/tides_frames_icons/crest_v1.png) cut to its opaque box and fitted into 425x420 like the other crests.
Frames: the Covenant's frames recoloured (green -> sea-green jade), the two corner banners replaced by the new crest.
Usage: python3 scripts/assets/tides_frames.py"""
from PIL import Image, ImageChops

SRC = '.tmp/zrodla/tides_frames_icons/crest_v1.png'
OUT = 'public/assets/cards'
CREST_BOX = (425, 420)
GREEN = (38, 135)      # PIL hue range (0-255) of the greens: about 54-190 degrees
TARGET_H = 112         # about 158 degrees: sea-green jade (the Covenant stays at about 130)


def crest() -> Image.Image:
    im = Image.open(SRC).convert('RGBA')
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
    s2 = Image.composite(s.point(lambda x: min(255, round(x * 1.05))), s, green)
    v2 = Image.composite(v.point(lambda x: min(255, round(x * 1.25))), v, green)
    r, g, b = Image.merge('HSV', (h2, s2, v2)).convert('RGB').split()
    return Image.merge('RGBA', (r, g, b, a)), green


if __name__ == '__main__':
    c = crest()
    c.save(f'{OUT}/crests/tides.png')
    for kind in ('hero', 'support'):
        src = Image.open(f'{OUT}/frames/dawn_{kind}.png').convert('RGBA')
        fr, green = recolour(src)
        # corner banners: the green blobs in the two top corners
        w, h = src.size
        for x0, x1 in ((0, w // 4), (3 * w // 4, w)):
            box = green.crop((x0, 0, x1, h // 7)).getbbox()
            if not box: continue
            bx0, by0, bx1, by1 = box[0] + x0, box[1], box[2] + x0, box[3]
            bw, bh = bx1 - bx0, by1 - by0
            k = min((bw * 1.0) / CREST_BOX[0], (bh * 1.0) / CREST_BOX[1])
            ci = c.resize((max(1, round(CREST_BOX[0] * k)), max(1, round(CREST_BOX[1] * k))), Image.LANCZOS)
            fr.alpha_composite(ci, (bx0 + bw // 2 - ci.width // 2, by0 + bh // 2 - ci.height // 2))
        fr.save(f'{OUT}/frames/tides_{kind}.png')
    print('done')
