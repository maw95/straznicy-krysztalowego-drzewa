"""Contact sheet of an effect sheet on a dark ground (checking BACKLOG 81 effects). Usage: python3 scripts/assets/fx_contact.py <name> ..."""
import sys

from PIL import Image

for name in sys.argv[1:]:
    im = Image.open(f"public/assets/efekty/{name}.webp").convert("RGBA")
    n = im.width // 192
    pick = [0, 3, 6, 9, 12, 15, 18, 21]
    out = Image.new("RGB", (192 * 4, 192 * 2), (40, 50, 60))
    for k, i in enumerate(pick):
        f = im.crop((i * 192, 0, i * 192 + 192, 192))
        out.paste(f, ((k % 4) * 192, (k // 4) * 192), f)
    out.save(f".tmp/fx_{name}.png")
