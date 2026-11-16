"""Photocopy/halftone treatments for the ad (moodboard look).  python3 tools/prep.py"""
import numpy as np
from PIL import Image, ImageFilter
A = 'assets/'
def screen(lum, cell=7, angle=45):
    h, w = lum.shape; yy, xx = np.mgrid[0:h, 0:w].astype(float)
    a = np.deg2rad(angle); u = (xx * np.cos(a) + yy * np.sin(a)) / cell; v = (-xx * np.sin(a) + yy * np.cos(a)) / cell
    d = np.hypot(u - np.round(u), v - np.round(v)) / .7071           # 0 at dot centre, 1 at corner
    return lum > (1 - d) ** .9                                          # True = paper, False = ink
# artist cut-out -> b&w halftone with original alpha
im = Image.open(A + 'wizkid-cutout.png').convert('RGBA'); al = np.asarray(im)[..., 3]
g = np.asarray(im.convert('L')).astype(float) / 255
g = np.clip((g - .03) / .55, 0, 1) ** .75                             # lift the shadows so the face reads
paper = screen(g, cell=6)
ink, cream = np.array([18, 16, 15]), np.array([244, 238, 228])
rgb = np.where(paper[..., None], cream, ink).astype('uint8')
Image.fromarray(np.dstack([rgb, al]), 'RGBA').save(A + 'wizkid-halftone.png')
# crowd for the type fill: dark, contrasty greyscale
c = Image.open(A + 'aerial-crowd.jpg').convert('L').filter(ImageFilter.UnsharpMask(3, 120))
ca = np.asarray(c).astype(float) / 255; ca = np.clip((ca - .08) / .7, 0, 1) ** 1.1
Image.fromarray((ca * 235 + 10).astype('uint8')).save(A + 'crowd-gray.jpg', quality=90)
print('prep ok')
