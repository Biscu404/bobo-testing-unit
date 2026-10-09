#!/usr/bin/env python3
"""Press the four portraits of the credits screen to the sixteen colours: assets/credits/<name>.png.

    python3 scripts/make-credit-art.py teiteotei=tei.jpeg biscu=biscu.png thea=thea.jpeg gheghe=gheghe.png
    python3 scripts/make-credit-art.py thea=thea.jpeg --zoom thea=3.6 --shift thea=0.1,-0.05 --size thea=128

Each is a square crop of the ORIGINAL photograph, pixelated to N x N and dithered onto VGA16 (vga_dither.py). A crop is a centre and
a side, both in pixels of the original, and ZOOM is how many times wider than the face-sized crop it looks: the first four portraits were
tight on the face, and the owner's cat and Thea's big bear were left outside them, so the defaults below look further out (the owner's 2.3 times,
Thea's 3.2). If the thing you want in the picture is not there yet, move the crop with --shift (a fraction of the crop's side, x then y: 0.2,0
moves it a fifth of its width to the right) or widen it with --zoom; a crop that would leave the photograph is slid back inside it, never padded with black.
The credits screen (apps/credits/layout.js) reads each picture's own size, so 96 or 128 pixels instead of 64 needs no change there.
The halo round the creator's portrait is drawn by the credits screen itself, not here: a photograph of a lit wall would only turn the face grey.
Needs Pillow and numpy; the machine itself never runs this.
"""
import argparse, os, sys
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
from vga_dither import dither, save_indexed, save_rgba

# name: (centre x, centre y, side of the first, tight crop, ZOOM, saturation, contrast, brightness, N, round)
# round: a circle of the picture is kept and the rest is see-through (the creator's: the halo of the credits screen is round his head)
JOBS = {
    'teiteotei': (645, 585, 510, 2.3, 1.10, 1.10, 1.10, 96, True),
    'biscu':     (330, 310, 360, 1.5, 1.20, 1.15, 1.05, 128, False),
    'thea':      (850, 710, 300, 3.2, 1.20, 1.10, 1.10, 128, False),
    'gheghe':    (115, 60, 120, 1.2, 1.25, 1.15, 1.05, 128, False),
}

def crop_box(size, centre, side, shift=(0.0, 0.0)):
    """The square crop of a photograph `size` wide and high: centred on `centre` moved by `shift` (fractions of the side), `side` wide,
    but never wider than the photograph and always inside it (slid back, not padded)."""
    w, h = size
    side = max(8, min(int(round(side)), w, h))
    cx, cy = centre[0] + shift[0] * side, centre[1] + shift[1] * side
    left = int(round(min(max(cx - side / 2, 0), w - side)))
    top = int(round(min(max(cy - side / 2, 0), h - side)))
    return (left, top, left + side, top + side)

def make(name, src, out_dir, zoom=None, shift=(0.0, 0.0), n=None):
    cx, cy, side, z, sat, con, bri, n0, round_ = JOBS[name]
    n = n or n0
    im = Image.open(src).convert('RGB')
    box = crop_box(im.size, (cx, cy), side * (zoom or z), shift)
    im = im.crop(box).resize((n, n), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.8, percent=120, threshold=2))
    im = ImageEnhance.Brightness(ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(sat)).enhance(con)).enhance(bri)
    path = os.path.join(out_dir, name + '.png')
    if round_:
        yy, xx = np.mgrid[0:n, 0:n]
        alpha = (((xx + 0.5 - n / 2) / (n / 2 - 1)) ** 2 + ((yy + 0.5 - n / 2) / (n / 2 - 1)) ** 2 <= 1).astype(np.uint8) * 255
        save_rgba(dither(im), alpha, path)
    else:
        save_indexed(dither(im), path)
    print(path, (n, n), 'from', box, os.path.getsize(path), 'bytes')

def pairs(items, parse):
    out = {}
    for it in items or []:
        name, _, val = it.partition('=')
        if name not in JOBS or not val:
            sys.exit('expected NAME=VALUE with NAME one of: ' + ', '.join(JOBS) + '   (got ' + it + ')')
        out[name] = parse(val)
    return out

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('jobs', nargs='+', metavar='name=photo')
    ap.add_argument('--zoom', action='append', metavar='NAME=X', help='how many times wider than the first crop to look (default per portrait: see JOBS)')
    ap.add_argument('--shift', action='append', metavar='NAME=DX,DY', help='move the crop by a fraction of its side')
    ap.add_argument('--size', action='append', metavar='NAME=N', help='the portrait is N x N pixels (default 96 for the creator, 128 for the rest)')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'credits'), help='where to write (default assets/credits)')
    a = ap.parse_args()
    zoom = pairs(a.zoom, float)
    shift = pairs(a.shift, lambda v: tuple(float(x) for x in v.split(',')))
    size = pairs(a.size, int)
    os.makedirs(a.out, exist_ok=True)
    for job in a.jobs:
        name, _, src = job.partition('=')
        if name not in JOBS or not src:
            sys.exit('usage: make-credit-art.py name=photo ...   (names: ' + ', '.join(JOBS) + ')')
        make(name, src, a.out, zoom.get(name), shift.get(name, (0.0, 0.0)), size.get(name))
