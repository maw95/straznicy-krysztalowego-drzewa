# Draws the placeholder pictures that scripts/placeholders.ts asks for (reads a JSON list of jobs from stdin). Small on purpose: a few KB each.
import json
import sys
from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default()


def wrap(draw, text, fnt, width):
    lines, cur = [], ''
    for word in text.split():
        trial = f'{cur} {word}'.strip()
        if draw.textlength(trial, font=fnt) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


def tint(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)


def gradient(size, color):
    w, h = size
    im = Image.new('RGB', size, color)
    px = ImageDraw.Draw(im)
    for y in range(h):
        k = 1.15 - 0.6 * y / h
        px.line([(0, y), (w, y)], fill=tint(color, k))
    return im


def label(im, text, sub):
    d = ImageDraw.Draw(im)
    w, h = im.size
    big = font(max(14, w // 12))
    lines = wrap(d, text, big, w * 0.86)
    total = len(lines) * big.size * 1.25
    y = (h - total) / 2
    for ln in lines:
        tw = d.textlength(ln, font=big)
        d.text(((w - tw) / 2 + 2, y + 2), ln, font=big, fill=(0, 0, 0))
        d.text(((w - tw) / 2, y), ln, font=big, fill=(250, 240, 210))
        y += big.size * 1.25
    small = font(max(10, w // 26))
    tw = d.textlength(sub, font=small)
    d.text(((w - tw) / 2, h - small.size * 2), sub, font=small, fill=(235, 225, 190))


def draw(job):
    kind, color, text = job['kind'], tuple(job['color']), job['label']
    if kind == 'art':
        im = gradient((452, 314), color)
        label(im, text, 'ZASTĘPCZA GRAFIKA')
        im.save(job['out'], 'JPEG', quality=55, optimize=True)
    elif kind == 'portrait':
        im = gradient((256, 256), color)
        d = ImageDraw.Draw(im)
        d.ellipse((38, 24, 218, 204), outline=(250, 240, 210), width=5)
        initial = font(110)
        ch = text[0]
        tw = d.textlength(ch, font=initial)
        d.text(((256 - tw) / 2, 36), ch, font=initial, fill=(250, 240, 210))
        small = font(18)
        short = text if len(text) <= 22 else text[:21] + '…'
        tw = d.textlength(short, font=small)
        d.text(((256 - tw) / 2, 222), short, font=small, fill=(250, 240, 210))
        im.save(job['out'], 'JPEG', quality=55, optimize=True)
    elif kind == 'crest':
        im = Image.new('RGBA', (425, 420), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        shield = [(40, 30), (385, 30), (385, 230), (212, 395), (40, 230)]
        d.polygon(shield, fill=color + (255,), outline=(250, 240, 210, 255))
        d.line(shield + [shield[0]], fill=(250, 240, 210, 255), width=9)
        big = font(170)
        ch = text[0]
        tw = d.textlength(ch, font=big)
        d.text(((425 - tw) / 2, 90), ch, font=big, fill=(250, 240, 210, 255))
        im = im.quantize(colors=32, method=Image.FASTOCTREE)
        im.save(job['out'], 'PNG', optimize=True)
    elif kind == 'arena':
        # A tinted copy of the arena of Przymierze (the same size), until the faction has its own.
        src = Image.open('public/assets/arena/cyfrowa/dawn.webp').convert('RGB')
        over = Image.new('RGB', src.size, color)
        Image.blend(src, over, 0.35).save(job['out'], 'WEBP', quality=55)


for job in json.load(sys.stdin):
    draw(job)
    print('  ', job['out'])
