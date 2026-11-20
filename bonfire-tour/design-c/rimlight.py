# Victony as a rim-lit silhouette: near-black body, orange fire rim, violet-blue accent on the left edge
import numpy as np
from PIL import Image, ImageFilter
cut=Image.open('../victony_cutout.png').convert('RGBA')
cut=cut.crop((0,380,1334,2000))                       # head + shoulders
PAD=160
W,H=cut.width+2*PAD,cut.height+PAD
lay=Image.new('RGBA',(W,H),(0,0,0,0)); lay.paste(cut,(PAD,PAD),cut)
a=np.asarray(lay).astype(np.float32)/255; rgb=a[...,:3]; al=a[...,3]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
sidefade=np.clip((xx-PAD)/260,0,1)*np.clip((PAD+1334-xx)/260,0,1)
sidefade=np.maximum(sidefade,np.clip((PAD+1050-yy)/200,0,1))   # only below the shoulders' top
al=al*sidefade
L=rgb@np.array([.3,.59,.11],np.float32)
# body: deep shadow with a hint of detail, slightly warm
Lb=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)/255
facemask=np.clip(1-(yy-(PAD+1000))/250,0.25,1)   # keep the face a touch more visible than the shirt
body=np.clip(Lb**1.35*0.45*facemask,0,1)[...,None]*np.array([1.0,0.80,0.72])+np.array([0.035,0.025,0.04])
# rim: thin bright edge from the alpha matte
alI=Image.fromarray((al*255).astype(np.uint8))
er=np.asarray(alI.filter(ImageFilter.MinFilter(13)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32)/255
rim=np.clip((al-er)*1.7,0,1)**1.2
side=np.clip((xx-W*0.40)/(W*0.25),0,1)                       # 0 = left (violet), 1 = right (orange)
top_boost=np.clip(1-(yy-PAD)/(H*0.9),0.45,1)
ORG=np.array([1.0,0.55,0.12]); VIO=np.array([0.45,0.40,1.0])
rimcol=VIO*(1-side[...,None])+ORG*side[...,None]
col=body*(1-rim[...,None])+rimcol*rim[...,None]*1.75*top_boost[...,None]
# hot core on the rim
col=np.clip(col+rim[...,None]**4*np.array([1,0.85,0.6])*0.35,0,1)
# outer glow: soft halo laid UNDER the figure (no seam)
gl=np.asarray(alI.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(30))).astype(np.float32)/255
glowA=np.clip(gl*1.6,0,1)*0.95
fade=np.clip((H-yy)/(H*0.25),0,1)
A_body=al; A_glow=glowA
A=A_body+A_glow*(1-A_body)
C=(col*A_body[...,None]+rimcol*(A_glow*(1-A_body))[...,None])/np.maximum(A,1e-4)[...,None]
A=A*fade
Image.fromarray((np.dstack([np.clip(C,0,1),A])*255).astype(np.uint8)).save('victony_rim.png')
print(W,H)
