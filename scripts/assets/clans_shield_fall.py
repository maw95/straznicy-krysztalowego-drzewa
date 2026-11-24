"""Mountain Crossbowman death (backlog 86): the video model refused every death prompt for this unit, so the standing shield is made to fall
in post. In the frames after T0 the old upright shield (cut from the last frame) is erased and drawn again tipping over towards the camera
(its screen height shrinks as it lies down), with a small bounce, ending flat. Works on the packed sheet, needs Pillow. Idempotent source: .tmp/zrodla/klany86_a/backup/kusznik_gor."""
import json, math, os, sys
from PIL import Image, ImageDraw

SRC = '.tmp/zrodla/klany86_a/backup/kusznik_gor'; DST = 'public/assets/jednostki/kusznik_gor'
X0, X1, Y0, Y1 = 207, 258, 66, 248          # box of the upright shield in the last frame (dwarf lies left of X0)
T0, T1 = 15, 31                              # frame range of the fall
FLAT = 0.30                                  # screen height of the lying shield as a fraction of its standing height
meta = json.load(open(SRC + '/anim.json')); fw, fh = meta['frame']; n = meta['clips']['smierc']; cols = meta['cols']
sheet = Image.open(SRC + '/smierc.webp').convert('RGBA')
frames = [sheet.crop(((i % cols) * fw, (i // cols) * fh, (i % cols) * fw + fw, (i // cols) * fh + fh)) for i in range(n)]
shield = frames[-1].crop((X0, Y0, X1, Y1))
sb = shield.getchannel('A').getbbox(); shield = shield.crop(sb); sw, sh = shield.size; bottom = Y0 + sb[3]; left = X0 + sb[0]
print('shield', sw, sh, 'bottom', bottom)

def ease(t):                                  # accelerating fall, small bounce at the end
    if t < 0.8: return (t / 0.8) ** 2 * 1.0
    u = (t - 0.8) / 0.2
    return 1 - 0.07 * math.sin(math.pi * u)

out = []
for i, f in enumerate(frames):
    if i < T0:
        out.append(f); continue
    f = f.copy()
    px = f.load()
    for y in range(Y0 - 2, fh):               # erase the old shield (right of the dwarf)
        for x in range(X0, fw):
            px[x, y] = (0, 0, 0, 0)
    k = min(1.0, (i - T0) / (T1 - T0)); th = ease(k) * math.pi / 2
    h = max(4, round(sh * ((1 - math.sin(th)) + FLAT * math.sin(th))))
    img = shield.resize((sw, h), Image.LANCZOS)
    if k > 0.95: img = img.rotate(2, expand=True, resample=Image.BICUBIC)   # settles slightly crooked
    f.alpha_composite(img, (left, bottom - img.height + 2))
    out.append(f)
nsheet = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
for i, f in enumerate(out):
    nsheet.paste(f, ((i % cols) * fw, (i // cols) * fh))
nsheet.save(DST + '/smierc.webp', quality=80, method=6)
out[-1].save(DST + '/martwy.webp', quality=80, method=6)
print('done', DST)
