#!/usr/bin/env python3
"""Gives every round menu icon the same painted ring: the ring of `ksiestwo.webp` (the pattern, decision of the author 20.11).

The icons of public/assets/ui/menu and public/assets/ikony/menu are medallions with a ring baked into each picture, and the rings differ (thin, plain, ornate, clipped by the
canvas). For each icon the script finds the centre of the medallion, cuts out the picture inside the ring, and puts it under the ring of the pattern icon (which keeps the
four lilies). Run from the repository root: `python3 scripts/assets/unify_rings.py` (needs Pillow). The originals stay in git history; running it twice changes nothing visible
only if the first run's results are not the input of the second, so run it once on fresh icons (the pattern itself is left untouched).
"""
import glob, math, os, sys
from PIL import Image, ImageDraw, ImageFilter

SIZE = 256
C = SIZE / 2
R_ART = 111.0          # the picture is shown inside this radius; the ring of the pattern starts here
PATTERN = 'public/assets/ui/menu/ksiestwo.webp'
FAMILIES = ['ui/menu', 'ikony/menu', 'ikony/czary', 'ikony/drzewko', 'ikony/umiejetnosci']
FILES = [f for fam in FAMILIES for f in sorted(glob.glob(f'public/assets/{fam}/*.webp'))]
R_OUT = 126.0          # outer radius of the pattern's ring


def centre(im):
    """The centre of the medallion from the alpha edges of its top and bottom rows (the sides may be clipped)."""
    a = im.getchannel('A').point(lambda v: 255 if v > 128 else 0)
    box = a.getbbox()
    cy = (box[1] + box[3]) / 2
    xs = []
    for y in (box[1] + 8, box[3] - 9):
        row = [x for x in range(im.width) if a.getpixel((x, y))]
        if row:
            xs.append((row[0] + row[-1]) / 2 + 0.5)
    return (sum(xs) / len(xs) if xs else (box[0] + box[2]) / 2), cy


def ring_of(pattern):
    """The pattern's ring as an RGBA layer: everything from R_ART outward, plus the four lilies that reach inside it."""
    cx, cy = centre(pattern)
    layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    src = pattern.load()
    dst = layer.load()
    for y in range(SIZE):
        for x in range(SIZE):
            sx, sy = x + (cx - C), y + (cy - C)
            if not (0 <= sx < pattern.width and 0 <= sy < pattern.height):
                continue
            r = math.hypot(x - C, y - C)
            ang = math.degrees(math.atan2(y - C, x - C)) % 90
            near_lily = min(ang, 90 - ang) < 9 and r >= 94
            if r >= R_ART or near_lily:
                p = src[int(sx), int(sy)]
                if near_lily and r < R_ART and not (p[0] > 120 and p[0] - p[2] > 50):
                    continue  # inside the lily's window keep only gold, not the picture
                dst[x, y] = p
    return layer


def disc_mask():
    m = Image.new('L', (SIZE * 4, SIZE * 4), 0)
    ImageDraw.Draw(m).ellipse([(C - R_ART - 1.5) * 4, (C - R_ART - 1.5) * 4, (C + R_ART + 1.5) * 4, (C + R_ART + 1.5) * 4], fill=255)
    return m.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    pattern = Image.open(PATTERN).convert('RGBA')
    ring = ring_of(pattern)
    mask = disc_mask()
    for f in FILES:
        if os.path.abspath(f) == os.path.abspath(PATTERN):
            continue
        im = Image.open(f).convert('RGBA')
        size = im.size
        cx, cy = centre(im)
        a = im.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()
        r_out = (a[3] - a[1]) / 2  # the height is never clipped
        k = R_OUT / r_out
        # Scale so that the medallion's outer radius equals the pattern's, centre it on the canvas; the picture inside the ring is then cut round.
        scaled = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        shifted = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        shifted.paste(scaled, (round(C - cx * k), round(C - cy * k)))
        art = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        art.paste(shifted, (0, 0), mask)
        out = Image.alpha_composite(art, ring)
        if size != (SIZE, SIZE):
            out = out.resize((size[1], size[1]), Image.LANCZOS)
        out.save(f, 'WEBP', quality=92, method=6)
        print('ok', f, 'centre', round(cx, 1), round(cy, 1))


if __name__ == '__main__':
    sys.exit(main())
