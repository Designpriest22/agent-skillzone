"""Prepare newspaper assets: sponsor strip from the official flyer, photos, paper texture.
    python3 tools/prep_assets.py <reference-pdf-image-dir>
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, ImageFilter

ROOT = Path(__file__).parent.parent
OUT = ROOT / "assets" / "img"
REPO = ROOT.parent
src = Path(sys.argv[1])

# sponsor strip: crop both logo rows from the flyer at full resolution, flatten the
# textured background to solid ink so it sits in a printed black band
flyer = Image.open(REPO / "live-out-loud-campaign/assets/flyer.png").convert("RGB")
flyer.copy().save(OUT / "flyer.jpg", quality=92)
strip = np.asarray(flyer.crop((200, 2235, 1975, 2590))).astype(float)
ink = np.array([20, 17, 15], float)
lum = strip.max(axis=2)
a = np.clip((lum - 66) / 40, 0, 1)[..., None]          # background (dark, low) -> ink
out = ink * (1 - a) + strip * a
Image.fromarray(out.astype("uint8")).save(OUT / "sponsors.png")

# photos from the client's reference PDF
Image.open(src / "img-000.png").convert("RGB").save(OUT / "wiz-cover.jpg", quality=92)
Image.open(src / "img-002.png").convert("RGB").save(OUT / "wiz-chair.jpg", quality=92)
Image.open(src / "img-004.png").convert("RGB").save(OUT / "stage.jpg", quality=92)
Image.open(REPO / "assets/talent/wizkid.jpg").convert("RGB").save(OUT / "wiz-portrait.jpg", quality=92)

# newsprint texture (soft fibres + speckle), tiled behind every page
rng = np.random.default_rng(7)
n = rng.normal(0, 1, (540, 540))
fib = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.7))
fib.save(OUT / "paper-noise.png")
print("assets ready")
