# Cuts the supplied logo JPEGs into white-on-transparent masks (tinted at runtime) and samples brand colours.
import sys, numpy as np
from PIL import Image
U = sys.argv[1]
def save_mask(a, name, pad=8):
    ys, xs = np.where(a > 0.08)
    a = a[max(ys.min()-pad,0):ys.max()+pad, max(xs.min()-pad,0):xs.max()+pad]
    rgba = np.zeros(a.shape + (4,), np.uint8); rgba[..., :3] = 255; rgba[..., 3] = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgba).save(f'assets/{name}.png', optimize=True); print(name, a.shape)
heart = np.asarray(Image.open(f'{U}/8ea68dc2-image.jpg').convert('RGB')).astype(float)
print('red sample', heart[620, 560], 'cream', np.asarray(Image.open(f'{U}/fe3aed95-image.jpg'))[100, 100], 'purple', np.asarray(Image.open(f'{U}/eca39f8d-image.jpg'))[100, 100], 'black', np.asarray(Image.open(f'{U}/437a0c2e-image.jpg'))[1600, 100])
h = heart[30:1200, 40:1290]
a = (255 - h[..., 1]) / (255 - 53); a = np.clip((a - 0.05) / 0.9, 0, 1)
save_mask(a, 'heart-logo')
sig = np.asarray(Image.open(f'{U}/437a0c2e-image.jpg').convert('L')).astype(float)[40:960, 40:1190]
a = np.clip(((255 - sig) / 255 - 0.08) / 0.85, 0, 1)
save_mask(a, 'signature-logo')
