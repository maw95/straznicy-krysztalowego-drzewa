"""Widen the settlement walls (Fosa / Mury z wieżyczkami) so they span the whole width of the landscape without growing taller.

A uniform scale to the full width would make the wall about twice as tall and hide the front row of the town, and stretching it would show.
So the picture is cut into: the left end (turret), a plain stretch, the middle (gate or bridge), a plain stretch and the right end, and each
plain stretch is repeated (tiles of the source's own plain wall, with a short cross-fade at the seams) until the picture has ASPECT.
Usage: python3 scripts/assets/settlement_walls_widen.py   (reads .tmp/zrodla/mury/<faction>_walls<1|2>.png, writes the cut, widened
picture into .tmp/zrodla/osady_oryginaly/, from where settlement_ground_blend.py blends it into public/assets/osady/)"""
from PIL import Image, ImageFilter

ASPECT = 10.5   # width / height of the result (full stage width at about 20 percent of its height)
H = 200
# Shares of the source width: end piece, plain stretch to repeat (from-to), the middle piece.
END, PLAIN, MID = 0.1, (0.14, 0.3), (0.36, 0.64)


def cut(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).filter(ImageFilter.MinFilter(3))
    bb = a.getbbox()
    im = im.crop((max(0, bb[0] - 3), max(0, bb[1] - 3), min(im.width, bb[2] + 3), min(im.height, bb[3] + 3)))
    return im.resize((round(im.width * H / im.height), H), Image.LANCZOS)


def tile(seg, width, fade=12):
    out = Image.new('RGBA', (width, seg.height), (0, 0, 0, 0))
    x = 0
    step = seg.width - fade
    while x < width:
        piece = seg.copy()
        if x > 0:  # cross-fade the seam: the left edge of the new tile fades in over the previous one
            mask = Image.linear_gradient('L').rotate(90).resize((fade, seg.height))
            a = piece.getchannel('A')
            edge = Image.composite(a.crop((0, 0, fade, seg.height)), Image.new('L', (fade, seg.height), 0), mask.transpose(Image.FLIP_LEFT_RIGHT))
            a.paste(edge, (0, 0)); piece.putalpha(a)
        out.alpha_composite(piece, (x, 0))
        x += step
    return out


def widen(im):
    w, h = im.size
    left, right = im.crop((0, 0, round(w * END), h)), im.crop((round(w * (1 - END)), 0, w, h))
    mid = im.crop((round(w * MID[0]), 0, round(w * MID[1]), h))
    pl = im.crop((round(w * PLAIN[0]), 0, round(w * PLAIN[1]), h))
    pr = im.crop((round(w * (1 - PLAIN[1])), 0, round(w * (1 - PLAIN[0])), h))
    total = round(h * ASPECT)
    side = (total - left.width - right.width - mid.width) // 2
    out = Image.new('RGBA', (total, h), (0, 0, 0, 0))
    # The plain stretches next to the ends and the middle keep the source's own joins: tiles fill the gap between them.
    out.alpha_composite(tile(pl, side), (left.width, 0))
    out.alpha_composite(tile(pr, side), (left.width + side + mid.width, 0))
    out.alpha_composite(left, (0, 0))
    out.alpha_composite(mid, (left.width + side, 0))
    out.alpha_composite(right, (total - right.width, 0))
    return out


if __name__ == '__main__':
    for f in ['clans', 'dawn', 'horde', 'herds', 'tides']:
        for lvl in '12':
            im = widen(cut(Image.open(f'.tmp/zrodla/mury/{f}_walls{lvl}.png').convert('RGBA')))
            im.save(f'.tmp/zrodla/osady_oryginaly/{f}_walls{lvl}.webp', quality=85, method=6)
            print(f, lvl, im.size)
