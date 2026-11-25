"""Remove the splashing water the video model painted round the Siren's and the Sea Witch's attack (the author, 25.11: the spell flies as a
projectile drawn by the arena instead, styles.css .projectile.water).
The Tides units have no blue or turquoise in them (docs/frakcje/tides.md, palette), so a pixel whose blue clearly beats its red, and whose blue is
at least its green, is water; any opaque island not connected to the figure (the biggest piece of the frame) goes too, as do pale grey-cyan droplets.
Usage: python3 scripts/assets/tides_splash_fix.py <unit folder> [clip=atak]   (works on the sheet in place; keep a copy)"""
import json, math, os, sys
from collections import deque
from PIL import Image

folder = sys.argv[1]
clip = sys.argv[2] if len(sys.argv) > 2 else 'atak'
meta = json.load(open(os.path.join(folder, 'anim.json')))
fw, fh = meta['frame']; cols = meta['cols']; n = meta['clips'][clip]
path = os.path.join(folder, clip + '.webp')
sheet = Image.open(path).convert('RGBA')


def water(r, g, b):
    return (b > r + 12 and b >= g - 6) or (b > r + 4 and g > r + 4 and r + g + b > 420)


def clean(f):
    px = f.load(); w, h = f.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and water(r, g, b): px[x, y] = (0, 0, 0, 0)
    # keep only the biggest connected piece (4-neighbours on alpha > 24)
    seen = bytearray(w * h); best = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0 * w + x0] or px[x0, y0][3] <= 24: continue
            comp = []; q = deque([(x0, y0)]); seen[y0 * w + x0] = 1
            while q:
                x, y = q.popleft(); comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny][3] > 24:
                        seen[ny * w + nx] = 1; q.append((nx, ny))
            if len(comp) > len(best): best = comp
    keep = bytearray(w * h)
    for x, y in best: keep[y * w + x] = 1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and not keep[y * w + x]:
                # faint edge pixels next to the figure stay (anti-aliasing)
                if not any(0 <= x + dx < w and 0 <= y + dy < h and keep[(y + dy) * w + x + dx] for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
                    px[x, y] = (0, 0, 0, 0)
    return f


out = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
for i in range(n):
    c, r = i % cols, i // cols
    out.paste(clean(sheet.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh))), (c * fw, r * fh))
out.save(path, quality=80, method=6)
print(folder, clip, n, 'frames cleaned')
