"""Cut the flyer's sponsor strip (assets/img/sponsors.png) into one PNG per logo.
    python3 tools/split_sponsors.py  -> assets/img/sponsors/NN.png
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent.parent
strip = Image.open(ROOT / "assets/img/sponsors.png").convert("RGB")
a = np.asarray(strip).astype(int)
mask = a.max(axis=2) > 95

def runs(v, min_gap):
    on = np.flatnonzero(v); out = []
    if not len(on): return out
    s = p = on[0]
    for x in on[1:]:
        if x - p > min_gap: out.append((s, p)); s = x
        p = x
    out.append((s, p)); return out

rows = runs(mask.sum(1) > 2, 12)
out = ROOT / "assets/img/sponsors"; out.mkdir(exist_ok=True)
for f in out.glob("*.png"): f.unlink()
n = 0
for (y0, y1) in rows:
    for (x0, x1) in runs(mask[y0:y1 + 1].sum(0) > 0, 26):
        sub = mask[y0:y1 + 1, x0:x1 + 1]
        ys = np.flatnonzero(sub.sum(1)); t, b = y0 + ys[0], y0 + ys[-1]
        pad = 8
        n += 1
        strip.crop((max(0, x0 - pad), max(0, t - pad), min(strip.width, x1 + pad + 1), min(strip.height, b + pad + 1))).save(out / f"{n:02d}.png")
        print(n, (x0, t, x1, b))
print("logos:", n)
