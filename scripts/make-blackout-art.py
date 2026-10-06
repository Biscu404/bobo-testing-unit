#!/usr/bin/env python3
"""Press a photograph down to the machine's sixteen colours: assets/blackout/<name>.png.

    python3 scripts/make-blackout-art.py park=chickens.jpg city=bridge.jpg boulder=wall.jpg \
        cd=discs.jpg turtle=turtle.jpg lol=league.jpg ultrakill=corridor.jpg

Each picture is cropped, scaled to 320 pixels wide, nudged (colour, contrast, a little
sharpening) and dithered with Floyd-Steinberg onto VGA16 -- the exact sixteen of
kernel/god.js -- then saved as an indexed PNG. The kernel never resamples it, only moves
it by whole rows (kernel/blackout_photo.js, where each picture's pan range lives).
Needs Pillow and numpy; the machine itself never runs this. The crop boxes below are in
pixels of the ORIGINAL photographs, so a different photo needs its own box.
"""
import os, sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

PAL = np.array([[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
                [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]], np.float32)
LUMA = np.array([0.299, 0.587, 0.114], np.float32)          # distance counts green most, blue least
FS = [(1, 0, 7), (-1, 1, 3), (0, 1, 5), (1, 1, 1)]          # Floyd-Steinberg: dx, dy, weight / 16

# name: (crop box in the original or None, height at 320 wide, saturation, contrast, brightness)
JOBS = {
    'park':    (None,                 240, 1.25, 1.15, 1.00),
    'boulder': ((0, 250, 1179, 1250), 271, 1.30, 1.18, 1.05),
    'cd':      ((0, 430, 2352, 1760), 181, 1.20, 1.12, 1.00),
    'turtle':  ((30, 165, 474, 415),  180, 1.25, 1.15, 1.00),
    'lol':     (None,                 180, 1.35, 1.25, 1.45),
    'city':    ((0, 330, 900, 940),   217, 1.25, 1.20, 1.15),
    'ultrakill': (None,               180, 1.35, 1.25, 1.15),
}

def dither(im):
    a = np.asarray(im, np.float32).copy()
    h, w, _ = a.shape
    out = np.zeros((h, w), np.uint8)
    for y in range(h):
        rev = y & 1                                           # serpentine: no diagonal streaks
        for x in (range(w - 1, -1, -1) if rev else range(w)):
            old = a[y, x]
            i = int(np.argmin(np.sum(((old - PAL) * LUMA) ** 2, axis=1)))
            out[y, x] = i
            err = (old - PAL[i]) / 16
            for dx, dy, k in FS:
                xx, yy = (x - dx if rev else x + dx), y + dy
                if 0 <= xx < w and yy < h:
                    a[yy, xx] += err * k
    return out

def make(name, src, out_dir):
    box, h, sat, con, bri = JOBS[name]
    im = Image.open(src).convert('RGB')
    if box:
        im = im.crop(box)
    im = im.resize((320, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=2))
    im = ImageEnhance.Brightness(ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(sat)).enhance(con)).enhance(bri)
    idx = Image.fromarray(dither(im), 'P')
    # padded to 256 entries on purpose: with only sixteen PIL writes 4-bit rows, which deflate worse on dither noise
    idx.putpalette([int(c) for rgb in PAL for c in rgb] + [0] * (768 - 48))
    path = os.path.join(out_dir, name + '.png')
    idx.save(path, optimize=True)
    print(path, idx.size, os.path.getsize(path), 'bytes')

if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'blackout')
    os.makedirs(out_dir, exist_ok=True)
    for arg in sys.argv[1:]:
        name, _, src = arg.partition('=')
        if name not in JOBS or not src:
            sys.exit('usage: make-blackout-art.py name=photo.jpg ...   (names: ' + ', '.join(JOBS) + ')')
        make(name, src, out_dir)
