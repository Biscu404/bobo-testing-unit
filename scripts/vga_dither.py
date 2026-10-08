"""The machine's picture pipeline, shared by make-blackout-art.py and make-credit-art.py:
an image pressed down to the sixteen colours of kernel/god.js (VGA16) with Floyd-Steinberg
dithering, so no pixel is ever a colour the machine does not have. Needs Pillow and numpy;
the machine itself never runs this.
"""
import numpy as np

PAL = np.array([[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
                [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]], np.float32)
LUMA = np.array([0.299, 0.587, 0.114], np.float32)          # distance counts green most, blue least
FS = [(1, 0, 7), (-1, 1, 3), (0, 1, 5), (1, 1, 1)]          # Floyd-Steinberg: dx, dy, weight / 16

def dither(im):
    """An RGB PIL image in, a uint8 array of palette indices out (0..15)."""
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

def save_indexed(idx, path):
    """Writes the indices as an indexed PNG with the sixteen colours (padded to 256 entries on purpose:
    with only sixteen PIL writes 4-bit rows, which deflate worse on dither noise)."""
    from PIL import Image
    im = Image.fromarray(idx, 'P')
    im.putpalette([int(c) for rgb in PAL for c in rgb] + [0] * (768 - 48))
    im.save(path, optimize=True)

def save_rgba(idx, alpha, path):
    """The same sixteen colours, with a mask: where alpha is 0 the picture is see-through (the credits' halo shows through)."""
    from PIL import Image
    rgb = PAL[idx].astype(np.uint8)
    im = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    im.save(path, optimize=True)
