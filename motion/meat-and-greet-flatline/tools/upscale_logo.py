# 4x upscale of the 319px MEAT & GREET logo: premultiplied Lanczos + unsharp mask (keeps edges crisp at 760px)
from PIL import Image, ImageFilter
import numpy as np
src = Image.open('logo-src.png').convert('RGBA'); S = 4; W, H = src.size
a = np.array(src).astype(np.float32) / 255; pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
def up(ch): return np.array(Image.fromarray((ch * 255).clip(0, 255).astype(np.uint8)).resize((W * S, H * S), Image.LANCZOS)).astype(np.float32) / 255
def usm(x, r, amt):
    bl = np.array(Image.fromarray((x * 255).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255
    return x + (x - bl) * amt
big = np.stack([usm(up(pm[..., i]), 3.0, 1.4) for i in range(4)], -1).clip(0, 1)
al = big[..., 3]
rgb = np.where(al[..., None] > 1e-3, big[..., :3] / np.maximum(al[..., None], 1e-3), 0).clip(0, 1)
Image.fromarray((np.dstack([rgb, al]) * 255).astype(np.uint8)).save('logo-4x.png')
