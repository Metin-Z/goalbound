"""Make every PWA icon size from one or two square master images (PNG, ideally 1024x1024).

Usage:  python tools/make_icons.py master.png [maskable-master.png]
Needs Pillow:  pip install pillow
Without a maskable master, the maskable icons are made from master.png shrunk into the 80% safe zone on the background colour.
"""
import sys, pathlib
from PIL import Image
BG = (7, 6, 6, 255)   # #070606, same as manifest background_color
root = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'icons'
master = Image.open(sys.argv[1]).convert('RGBA')
mask_src = Image.open(sys.argv[2]).convert('RGBA') if len(sys.argv) > 2 else None

# Resize a square image with high-quality filtering
def fit(img, size): return img.resize((size, size), Image.LANCZOS)

# Put an image on an opaque background (iOS and maskable icons must not be transparent)
def flat(img, size, scale=1.0):
    bg = Image.new('RGBA', (size, size), BG); s = round(size * scale); x = (size - s) // 2
    bg.alpha_composite(fit(img, s), (x, x)); return bg.convert('RGB')

for name, size in [('icon-192.png', 192), ('icon-512.png', 512), ('favicon-32.png', 32), ('favicon-16.png', 16)]:
    fit(master, size).save(root / name)
flat(master, 180).save(root / 'apple-touch-icon.png')
for size in (192, 512):
    (flat(mask_src, size) if mask_src else flat(master, size, .8)).save(root / f'icon-maskable-{size}.png')
print('ok ->', root)
