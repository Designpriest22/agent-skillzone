# Build a layered PSD from per-layer transparent renders (render.js layers mode).
# Layer names ending in "(multiply)" / "(overlay)" / "(screen)" get that Photoshop blend mode.
import json, sys, numpy as np
from PIL import Image
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer
from psd_tools.constants import BlendMode
ldir,out=sys.argv[1],sys.argv[2]
names=json.load(open(f'{ldir}/layers.json'))
first=Image.open(f'{ldir}/00.png'); psd=PSDImage.new('RGB',first.size,color=(0,0,0))
modes={'(multiply)':BlendMode.MULTIPLY,'(overlay)':BlendMode.OVERLAY,'(screen)':BlendMode.SCREEN}
for i,n in enumerate(names):
    im=Image.open(f'{ldir}/{i:02d}.png').convert('RGBA')
    a=np.asarray(im)[...,3]
    if i>0 and (a>250).mean()>0.98: print(f'WARNING: layer "{n}" is fully opaque (background baked in?)')
    bb=im.getbbox()
    if not bb: continue
    L=PixelLayer.frompil(im.crop(bb),psd,n,top=bb[1],left=bb[0])
    for k,m in modes.items():
        if n.endswith(k): L.blend_mode=m
    psd.append(L)
psd.save(out); print('saved',out,len(names),'layers')
