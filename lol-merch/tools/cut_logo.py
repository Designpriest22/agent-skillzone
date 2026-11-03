"""Cut the official LOL logo out of the flyer without redrawing it.
Keeps the original pixels; only the background is removed.
    python3 tools/cut_logo.py -> assets/lol-logo.png (RGBA), assets/lol-logo-wordmark.png (letters only)
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).parent.parent
src = Image.open(ROOT / "assets/logo_crop_src.png").convert("RGB")
a = np.asarray(src).astype(float) / 255
mx, mn = a.max(2), a.min(2)
V, S = mx, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
# gold/orange letter faces + orange extrusions, cream type and brackets, orange zig-zag
warm = (R > 0.55) & (R >= G * 0.93) & (G >= B * 0.9)
fg = ((V > 0.70) & warm) | ((V > 0.80) & (S < 0.35)) | ((R > 0.72) & (S > 0.55) & (G < R * 0.75))
fg = ndi.binary_closing(fg, iterations=1)
# recover the letters' own deep shadow crevices: thin gaps bridged by a closing, kept only where the
# pixel is warm-toned (brown/orange shading), so grey background between letters stays out
bridged = ndi.binary_closing(fg, structure=np.ones((3, 3)), iterations=5) & ~fg
warm_dark = (R > G) & (G >= B * 0.8) & (S > 0.35) & (R > 0.18)
fg = fg | (bridged & warm_dark)
# fill only small pinholes; large enclosed areas are real background between letters
holes = ndi.binary_fill_holes(fg) & ~fg
hl, hn = ndi.label(holes)
hs = ndi.sum(holes, hl, range(1, hn + 1))
small = np.zeros(hn + 1, bool); small[1:] = hs < 120
fg = fg | small[hl]
# thin cracks fully inside the lettering are the logo's own bevel shadows: keep them (original pixels)
fg = fg | (ndi.gaussian_filter(fg.astype(float), 3.0) > 0.62)
lab, n = ndi.label(fg)
sizes = ndi.sum(fg, lab, range(1, n + 1))
keep = np.zeros(n + 1, bool); keep[1:] = sizes > 40
fg = keep[lab]
# soft edge: feather 1px for a clean antialiased matte
alpha = ndi.gaussian_filter(fg.astype(float), 0.8)
alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
rgba = np.dstack([np.asarray(src), (alpha * 255).astype("uint8")])
img = Image.fromarray(rgba, "RGBA")
img = img.crop(img.getbbox())
img.save(ROOT / "assets/lol-logo.png")
print("logo", img.size, "components kept", int(keep.sum()))
