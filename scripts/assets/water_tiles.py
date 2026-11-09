"""Draws the water tiles (public/assets/tiles/water_<n>.jpg): the channels between the islands.
Procedural (Pillow only, no AI): a blue-teal gradient, soft blurred noise for depth and light ripple lines.
Usage: python3 scripts/assets/water_tiles.py"""
import math
import random
from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H = 260, 300


def tile(seed: int) -> Image.Image:
    rnd = random.Random(seed)
    # Depth gradient, darker at the top, lighter toward the bottom.
    base = Image.new('RGB', (W, H))
    px = base.load()
    for y in range(H):
        t = y / (H - 1)
        c = (int(18 + 26 * t), int(78 + 52 * t), int(120 + 50 * t))
        for x in range(W):
            px[x, y] = c
    # Large soft blotches of lighter and darker water.
    for _ in range(2):
        noise = Image.effect_noise((W, H), 70 + rnd.randint(0, 30)).convert('RGB').filter(ImageFilter.GaussianBlur(14))
        base = ImageChops.blend(base, ImageChops.multiply(base, noise.point(lambda v: 150 + v // 3)), 0.55)
    # Ripples: thin light wavy lines.
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(16):
        y0 = rnd.randint(-10, H)
        amp = rnd.uniform(3, 7)
        ph = rnd.uniform(0, math.tau)
        freq = rnd.uniform(0.035, 0.07)
        x0 = rnd.randint(-30, 120)
        length = rnd.randint(70, 170)
        pts = [(x, y0 + amp * math.sin(x * freq + ph)) for x in range(x0, min(W + 30, x0 + length), 4)]
        if len(pts) > 1:
            d.line(pts, fill=(205, 238, 248, rnd.randint(70, 150)), width=rnd.choice([1, 2]))
    layer = layer.filter(ImageFilter.GaussianBlur(0.7))
    base = base.convert('RGBA')
    base.alpha_composite(layer)
    # A few sparkles.
    sp = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ds = ImageDraw.Draw(sp)
    for _ in range(14):
        x, y = rnd.randint(8, W - 8), rnd.randint(8, H - 8)
        ds.ellipse((x - 1, y - 1, x + 1, y + 1), fill=(255, 255, 255, 200))
    base.alpha_composite(sp.filter(ImageFilter.GaussianBlur(0.8)))
    return base.convert('RGB')


for n in (1, 2):
    tile(n * 17).save(f'public/assets/tiles/water_{n}.jpg', quality=82)
