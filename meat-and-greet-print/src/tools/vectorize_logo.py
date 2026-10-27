"""Trace the Meat & Greet logo (raster, from the event deck) into a flat, layered vector SVG
so it can be used at banner scale. Output: assets/mg-logo-flat.svg"""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import potrace

SRC = sys.argv[1]; OUT = sys.argv[2]
K = 4  # upscale factor
im = Image.open(SRC).convert('RGBA')
W, H = im.size
big = im.resize((W*K, H*K), Image.LANCZOS)
a = np.asarray(big).astype(np.float32)
r, g, b, al = a[...,0], a[...,1], a[...,2], a[...,3]
lum = 0.299*r + 0.587*g + 0.114*b
opaque = al > 140

def smooth(mask, rad=K*0.9):
    m = Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))
    return np.asarray(m) > 127

red = opaque & (r > 140) & (g < 120) & (b < 110) & ((r - g) > 90)
# icon region (flame + steak) sits in the A of MEAT
iy0, iy1, ix0, ix1 = 105*K, 240*K, 570*K, 670*K
icon = np.zeros_like(red); icon[iy0:iy1, ix0:ix1] = True
warm = opaque & ((r - b) > 60) & (r > 120)
icon_warm = warm & icon
icon_dark = icon_warm & (g < 70) & (r < 215)
amp = red & ~icon

light = opaque & (lum >= 115) & ~warm
dark = opaque & (lum < 200) & ~warm
sil = ndi.binary_fill_holes(ndi.binary_closing(light | amp | icon_warm, iterations=3))
sil = ndi.binary_opening(sil, iterations=3)
# keep largest components only (drop stray shadow pixels)
lab, n = ndi.label(sil); sizes = ndi.sum(sil, lab, range(1, n+1))
keep = [i+1 for i, s in enumerate(sizes) if s > 0.02*sizes.max()]
sil = np.isin(lab, keep)
blk = dark & sil & ~ndi.binary_dilation(amp | icon_warm, iterations=1)
blk = ndi.binary_opening(blk, iterations=6)
face = sil & (lum >= 170) & ~warm
holes = ndi.binary_fill_holes(face) & ~face
hl, hn = ndi.label(holes); hs = ndi.sum(holes, hl, range(1, hn+1))
small = np.isin(hl, [i+1 for i, s in enumerate(hs) if s < 2500*K*K/16])
# thin seams between letters: close faces horizontally
seam = ndi.binary_closing(face, structure=np.ones((1, 7*K))) & ~face
blk = blk & ~small & ~(seam & ~ndi.binary_erosion(blk, iterations=3*K))
blk = ndi.binary_fill_holes(blk) & ~ndi.binary_opening(sil & (lum >= 200) & ~warm, iterations=3) if False else blk

def trace(mask, turd=40):
    mask = smooth(mask)
    bm = potrace.Bitmap(~mask)
    path = bm.trace(turdsize=turd, alphamax=1.1, opticurve=True, opttolerance=0.3)
    d = []
    for c in path:
        sp = c.start_point; d.append(f"M{sp.x/K:.2f},{sp.y/K:.2f}")
        for seg in c.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x/K:.2f},{seg.c.y/K:.2f}L{seg.end_point.x/K:.2f},{seg.end_point.y/K:.2f}")
            else:
                d.append(f"C{seg.c1.x/K:.2f},{seg.c1.y/K:.2f} {seg.c2.x/K:.2f},{seg.c2.y/K:.2f} {seg.end_point.x/K:.2f},{seg.end_point.y/K:.2f}")
        d.append("Z")
    return "".join(d)

layers = [
  ('mg-keyline', sil, 200),
  ('mg-panel', blk, 400),
  ('mg-amp', amp, 20),
  ('mg-flame', icon_warm, 8),
  ('mg-steak', icon_dark, 8),
]
ys, xs = np.where(sil)
x0, y0, x1, y1 = xs.min()/K, ys.min()/K, xs.max()/K, ys.max()/K
pad = 2
vb = f"{x0-pad:.1f} {y0-pad:.1f} {x1-x0+2*pad:.1f} {y1-y0+2*pad:.1f}"
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">']
for cls, m, t in layers:
    out.append(f'<path class="{cls}" fill-rule="evenodd" d="{trace(m, t)}"/>')
out.append('</svg>')
open(OUT, 'w').write("\n".join(out))
print("viewBox", vb)
