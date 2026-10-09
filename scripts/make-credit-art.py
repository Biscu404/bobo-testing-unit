#!/usr/bin/env python3
"""Press the four portraits of the credits screen to the sixteen colours: assets/credits/<name>.png.

    python3 scripts/make-credit-art.py teiteotei=tei.jpeg biscu=biscu.png thea=thea.jpeg gheghe=gheghe.png

Each is a square crop of the face, pixelated to 64 x 64 and dithered onto VGA16 (vga_dither.py).
The halo round the creator's portrait is drawn by the credits screen itself (apps/credits), not
here: a photograph of a lit wall would only turn the face grey. Needs Pillow
and numpy; the machine itself never runs this. Crop boxes are in pixels of the ORIGINAL photo.
"""
import os, sys
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
from vga_dither import dither, save_indexed, save_rgba

N = 64
# name: (crop box in the original, saturation, contrast, brightness, round: a circle of the face is kept, the rest see-through)
JOBS = {
    'teiteotei': ((390, 330, 900, 840), 1.10, 1.10, 1.10, True),
    'biscu':     ((150, 130, 510, 490), 1.20, 1.15, 1.05, False),
    'thea':      ((700, 560, 1000, 860), 1.20, 1.10, 1.10, False),
    'gheghe':    ((55, 0, 175, 120),    1.25, 1.15, 1.05, False),
}

def make(name, src, out_dir):
    box, sat, con, bri, round_ = JOBS[name]
    im = Image.open(src).convert('RGB').crop(box)
    im = im.resize((N, N), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.8, percent=120, threshold=2))
    im = ImageEnhance.Brightness(ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(sat)).enhance(con)).enhance(bri)
    path = os.path.join(out_dir, name + '.png')
    if round_:
        # the creator's portrait is a disc, so the halo of the credits screen is round his head, not a box round a photo
        yy, xx = np.mgrid[0:N, 0:N]
        alpha = (((xx + 0.5 - N / 2) / (N / 2 - 1)) ** 2 + ((yy + 0.5 - N / 2) / (N / 2 - 1)) ** 2 <= 1).astype(np.uint8) * 255
        save_rgba(dither(im), alpha, path)
    else:
        save_indexed(dither(im), path)
    print(path, (N, N), os.path.getsize(path), 'bytes')

if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'credits')
    os.makedirs(out_dir, exist_ok=True)
    for arg in sys.argv[1:]:
        name, _, src = arg.partition('=')
        if name not in JOBS or not src:
            sys.exit('usage: make-credit-art.py name=photo ...   (names: ' + ', '.join(JOBS) + ')')
        make(name, src, out_dir)
