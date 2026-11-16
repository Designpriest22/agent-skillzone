"""Stop-motion threshold cut-outs of the walk-out footage + ink sketch of the crowd.
    python3 tools/stopmo.py -> clips/stopmo/w_NN.png, assets/crowd-sketch.png"""
import glob
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session
sess = new_session('u2net_human_seg')
INK, CREAM = np.array([20, 16, 14]), np.array([246, 238, 226])
for i, f in enumerate(sorted(glob.glob('clips/src/s_*.jpg'))):
    im = Image.open(f).convert('RGB')
    a = np.asarray(remove(im, session=sess, only_mask=True)).astype(float) / 255
    a = ndi.binary_opening(a > .5, iterations=2); a = ndi.binary_fill_holes(a)
    lab, n = ndi.label(a)
    if n: a = lab == (np.argmax(ndi.sum(a, lab, range(1, n + 1))) + 1)
    g = np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(1.2))).astype(float) / 255
    # equalise inside the figure so the face keeps detail, then hard threshold (photocopy look)
    eq = np.zeros_like(g); v = g[a]; eq[a] = np.argsort(np.argsort(v)) / max(1, v.size - 1)
    paper = ndi.binary_opening(eq > .52, iterations=1)
    rgb = np.where(paper[..., None], CREAM, INK)
    border = ndi.binary_dilation(a, iterations=14) & ~a        # white sticker edge
    rgb = np.where(border[..., None], CREAM, rgb)
    alpha = (ndi.binary_dilation(a, iterations=14)) * 255
    out = Image.fromarray(np.dstack([rgb, alpha]).astype('uint8'), 'RGBA')
    bb = out.getbbox(); out.save(f'clips/stopmo/w_{i + 1:02d}.png'); print(i + 1, bb)
# crowd sketch: two-tone linocut crowd (ink silhouettes, cream light) with fine sketch lines
c = np.asarray(Image.open('assets/crowd-src.jpg').convert('L')).astype(float) / 255
c = c[int(c.shape[0] * .3):]                                    # heads and raised hands
c = (c - np.percentile(c, 2)) / (np.percentile(c, 99) - np.percentile(c, 2))
b = ndi.gaussian_filter(c, 1.6)
light = b > np.percentile(b, 62)
light = ndi.binary_opening(ndi.binary_closing(light, iterations=1), iterations=1)
dog = ndi.gaussian_filter(c, 1.0) - ndi.gaussian_filter(c, 2.6)
lines = (np.abs(dog) > .07) & light                             # sketch strokes inside the lit areas
rgb = np.where((light & ~lines)[..., None], CREAM, INK)
Image.fromarray(rgb.astype('uint8')).save('assets/crowd-sketch.png')
print('sketch ok', c.shape)
