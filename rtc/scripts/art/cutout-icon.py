#!/usr/bin/env python3
"""
Cut a painted item icon out of its dark vignette background and export a game-ready sprite.
Region-grows the background from the image border (smooth, dark, low-detail), then
feathers the edge, trims, and downsamples to the requested height.

Usage: python3 cutout-icon.py <icon.png> <out.png> <height> [--tol 26]
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter


def main():
    src, out, height = sys.argv[1], sys.argv[2], int(sys.argv[3])
    tol = float(sys.argv[sys.argv.index("--tol") + 1]) if "--tol" in sys.argv else 26.0
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    lum = a.mean(axis=2)
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        q.append((0, x)); q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0)); q.append((y, w - 1))
    for (y, x) in q:
        bg[y, x] = True
    while q:
        y, x = q.popleft()
        c = a[y, x]
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx]:
                d = np.abs(a[ny, nx] - c).sum()
                # background is smooth and fairly dark; stop at edges and bright paint
                if d < tol and lum[ny, nx] < 110:
                    bg[ny, nx] = True
                    q.append((ny, nx))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    # close pin-holes, then soften 1px
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    rgba = im.convert("RGBA"); rgba.putalpha(alpha)
    bbox = rgba.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    rgba = rgba.crop(bbox)
    s = height / rgba.height
    rgba = rgba.resize((max(1, round(rgba.width * s)), height), Image.LANCZOS)
    rgba.save(out, optimize=True)


if __name__ == "__main__":
    main()
