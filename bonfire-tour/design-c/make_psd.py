# Build a layered PSD from per-layer transparent renders (render.js layers mode)
import json, sys, numpy as np
from PIL import Image
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer
ldir,out=sys.argv[1],sys.argv[2]
names=json.load(open(f'{ldir}/layers.json'))
first=Image.open(f'{ldir}/00.png'); psd=PSDImage.new('RGB',first.size,color=(0,0,0))
for i,n in enumerate(names):
    im=Image.open(f'{ldir}/{i:02d}.png').convert('RGBA'); bb=im.getbbox()
    if bb: psd.append(PixelLayer.frompil(im.crop(bb),psd,n,top=bb[1],left=bb[0]))
psd.save(out); print('saved',out,len(names),'layers')
