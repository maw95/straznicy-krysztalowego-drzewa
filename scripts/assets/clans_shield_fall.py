"""Mountain Crossbowman death (backlog 86): the video model refused every death prompt for this unit, so the standing shield is made to fall
in post. In the frames after T0 the old upright shield (cut from the last frame) is erased and drawn again tipping over to the right
round its bottom corner (shorter as it turns a little away from the camera), with a small bounce, ending flat. Works on the packed sheet, needs Pillow. Idempotent source: .tmp/zrodla/klany86_a/backup/kusznik_gor."""
import json, math, os, sys
from PIL import Image, ImageDraw

SRC = '.tmp/zrodla/klany86_a/backup/kusznik_gor'; DST = 'public/assets/jednostki/kusznik_gor'
X0, X1, Y0, Y1 = 207, 258, 66, 248          # box of the upright shield in the last frame (dwarf lies left of X0)
T0, T1 = 15, 31                              # frame range of the fall
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

# The shield tips over to the right round its bottom-right corner and ends lying on the ground. It also turns a little away from
# the camera on the way, so its long side gets shorter (it must stay inside the frame) and its face thinner.
PX0, PY = left + sw, bottom                   # pivot: bottom-right corner, sliding left as it falls so the lying shield touches the dwarf
SHORT_LONG, SHORT_THIN = 0.5, 0.55            # how much of its length and width the lying shield shows
out = []
for i, f in enumerate(frames):
    if i < T0:
        out.append(f); continue
    f = f.copy()
    px = f.load()
    for y in range(Y0 - 2, fh):               # erase the old shield (right of the dwarf)
        for x in range(X0, fw):
            px[x, y] = (0, 0, 0, 0)
    k = min(1.0, (i - T0) / (T1 - T0)); e = ease(k); th = e * math.pi / 2
    L = 1 - (1 - SHORT_LONG) * math.sin(th); W = 1 - (1 - SHORT_THIN) * math.sin(th)
    # Forward map of a shield pixel (u from its right edge leftwards, v from its bottom upwards):
    # scaled (u*W, v*L), rotated clockwise by th round the pivot. Image.transform needs the inverse map.
    c, s_ = math.cos(th), math.sin(th)
    PX = PX0 - sw * W * s_ * 0.85
    # screen = P + R(th) * (-u*W, -v*L) with R clockwise in screen coords (y down): x' = x*c - y*s, y' = x*s + y*c
    # solve for (u, v) given screen (X, Y): local (lx, ly) = R(-th) * (X-PX, Y-PY)
    def inv(X, Y):
        dx, dy = X - PX, Y - PY
        lx = dx * c + dy * s_; ly = -dx * s_ + dy * c
        u = -lx / W; v = -ly / L
        return sw - u, sh - v                   # shield image coords
    a0 = inv(0, 0); ax = inv(1, 0); ay = inv(0, 1)
    coeffs = (ax[0] - a0[0], ay[0] - a0[0], a0[0], ax[1] - a0[1], ay[1] - a0[1], a0[1])
    layer = shield.transform((fw, fh), Image.AFFINE, coeffs, resample=Image.BICUBIC)
    f.alpha_composite(layer)
    out.append(f)
nsheet = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
for i, f in enumerate(out):
    nsheet.paste(f, ((i % cols) * fw, (i // cols) * fh))
nsheet.save(DST + '/smierc.webp', quality=80, method=6)
out[-1].save(DST + '/martwy.webp', quality=80, method=6)
print('done', DST)
