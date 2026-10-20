"""List opaque blobs on a transparent sprite sheet (bounding boxes), largest first."""
import sys
from PIL import Image

def components(path, min_area=2000, alpha_min=40):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    a = im.split()[3].point(lambda v: 255 if v >= alpha_min else 0)
    small = a.resize((w // 4, h // 4))
    sw, sh = small.size
    px = small.load()
    seen = bytearray(sw * sh)
    out = []
    for y in range(sh):
        for x in range(sw):
            if px[x, y] and not seen[y * sw + x]:
                stack = [(x, y)]
                seen[y * sw + x] = 1
                x0 = x1 = x
                y0 = y1 = y
                n = 0
                while stack:
                    cx, cy = stack.pop()
                    n += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < sw and 0 <= ny < sh and px[nx, ny] and not seen[ny * sw + nx]:
                            seen[ny * sw + nx] = 1
                            stack.append((nx, ny))
                if n * 16 >= min_area:
                    out.append((x0 * 4, y0 * 4, (x1 + 1) * 4, (y1 + 1) * 4, n * 16))
    return out

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p)
        for c in sorted(components(p), key=lambda c: (c[1] // 60, c[0])):
            print('  ', c)
