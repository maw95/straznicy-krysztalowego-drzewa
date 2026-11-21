"""Portraits of Horde supports cut from their card art (backlog 61g, variant A, 0 CU): the whole figure in the picture, far away.
The square takes `ZOOM` of the art's width (1.0 = the whole width) centred on `cx`; where the scaled strip is lower than the square, the empty top and bottom are
filled with the same picture blurred and darkened, and the strip's edges are feathered into it (no distortion, no black bars).
The dark ones get a little more light and colour ("slightly more vivid", only a bit).
Usage: python3 scripts/assets/horde_portraits.py [outdir]   (default: public/assets/cards/portraits, overwrites)"""
import sys
from PIL import Image, ImageEnhance, ImageFilter

# From the card art: unit: (zoom, cx, brightness, colour). zoom = share of the art's width; h/w (0.70) is the full-height square without bands.
UNITS = {
    'goblinShaman': (0.85, 0.5, 1.0, 1.0),
    'gargoyle': (0.85, 0.5, 1.0, 1.05),
    'goblinSlinger': (0.70, 0.5, 1.0, 1.0),  # the art of 21.11: the whole goblin
    'caveTroll': (0.70, 0.5, 1.0, 1.0),      # the art of 21.11: the whole troll
}
# Kept as in the first version of the portraits (commit before ff45b0e): the author liked that framing; only light and colour are lifted.
# unit: (brightness, colour)
FIRST_FRAMING = {'ratman': (1.30, 1.15), 'hellhound': (1.35, 1.15), 'minotaurChief': (1.30, 1.15)}
FIRST_REV = 'ff45b0e^'
S = 256


def portrait(art: Image.Image, zoom: float, cx: float) -> Image.Image:
    w, h = art.size
    cw = min(w, round(zoom * w))
    left = min(max(round(cx * w - cw / 2), 0), w - cw)
    strip = art.crop((left, 0, left + cw, h))
    sh = round(h * S / cw)
    strip = strip.resize((S, sh), Image.LANCZOS)
    if sh >= S:  # tall enough: plain centred crop
        top = (sh - S) // 2
        return strip.crop((0, top, S, top + S))
    y = (S - sh) // 2
    canvas = Image.new('RGB', (S, S))
    canvas.paste(strip, (0, y))
    # The empty bands continue the picture: the edge rows mirrored outwards, softly blurred, a little darker towards the border.
    top = strip.crop((0, 0, S, min(y, sh))).transpose(Image.FLIP_TOP_BOTTOM)
    bot = strip.crop((0, sh - min(S - y - sh, sh), S, sh)).transpose(Image.FLIP_TOP_BOTTOM)
    canvas.paste(top, (0, y - top.height))
    canvas.paste(bot, (0, y + sh))
    blurred = canvas.filter(ImageFilter.GaussianBlur(4))
    mask = Image.new('L', (S, S), 255)
    mask.paste(0, (0, y + 3, S, y + sh - 3))
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    canvas = Image.composite(blurred, canvas, mask)
    return canvas


if __name__ == '__main__':
    import io, subprocess
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards/portraits'
    for name, (zoom, cx, bright, colour) in UNITS.items():
        art = Image.open(f'public/assets/cards/art/{name}.jpg').convert('RGB')
        img = ImageEnhance.Color(ImageEnhance.Brightness(portrait(art, zoom, cx)).enhance(bright)).enhance(colour)
        img.save(f'{out}/{name}.jpg', quality=86)
    for name, (bright, colour) in FIRST_FRAMING.items():
        src = subprocess.check_output(['git', 'show', f'{FIRST_REV}:public/assets/cards/portraits/{name}.jpg'])
        img = Image.open(io.BytesIO(src)).convert('RGB')
        ImageEnhance.Color(ImageEnhance.Brightness(img).enhance(bright)).enhance(colour).save(f'{out}/{name}.jpg', quality=86)
