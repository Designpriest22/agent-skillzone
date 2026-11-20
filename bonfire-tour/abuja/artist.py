import numpy as np, sys
from PIL import Image, ImageFilter
S=''
SC=float(sys.argv[1]) if len(sys.argv)>1 else 1.45; TOP=int(sys.argv[2]) if len(sys.argv)>2 else 700
bg=Image.open('abuja_bg.png').convert('RGB'); W,H=bg.size
cut=Image.open('../victony_cutout.png').convert('RGBA')
bb=cut.getbbox(); headtop=bb[1]
cut=cut.resize((int(cut.width*SC),int(cut.height*SC)),Image.LANCZOS)
a=np.asarray(cut).astype(np.float32)/255; rgb=a[...,:3]; al=a[...,3]
h,w=al.shape; yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
L=rgb@np.array([.3,.59,.11],np.float32)
# moody grade: crush, partial desat, cool-dark shadows
sat=0.55
g=L[...,None]+(rgb-L[...,None])*sat
g=np.clip((g-0.04)*1.15,0,1)**1.25
g=g*np.array([0.92,0.90,0.95])
# firelight from behind/right & below: warm wash stronger on right side
cx=w*0.5
side=np.clip((xx-cx)/(w*0.35)+0.35,0,1)
warm=np.array([1.35,0.72,0.42])
g=g*(1-side[...,None]*0.75)+g*warm*side[...,None]*0.75*1.25
# rim light: edge of alpha, from behind
alI=Image.fromarray((al*255).astype(np.uint8))
er=np.asarray(alI.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)/255
rim=np.clip(al-er,0,1)
rim=rim*(0.45+0.55*np.clip((xx-w*0.2)/(w*0.6),0,1))
g=g+rim[...,None]*np.array([1.0,0.45,0.12])*1.4
g=np.clip(g,0,1)
# fade bottom into the dark
y0=headtop*SC
cy=yy+int(TOP-y0)  # canvas y
fade=np.clip(1-(cy-2050)/520,0,1)**1.4
al2=al*fade
g=g*np.clip(1-(cy-1750)/1400,0.35,1)[...,None]
out=Image.fromarray((np.dstack([g,al2])*255).astype(np.uint8))
canvas=bg.convert('RGBA')
# soft glow halo behind the figure
halo=Image.new('RGBA',(W,H),(0,0,0,0))
hl=out.split()[3].filter(ImageFilter.GaussianBlur(60))
hlay=Image.new('RGBA',out.size,(255,90,30,0)); hlay.putalpha(hl.point(lambda v:int(v*0.55)))
ox=(W-w)//2; oy=int(TOP-y0)
halo.paste(hlay,(ox,oy),hlay); canvas.alpha_composite(halo)
canvas.alpha_composite(out,(ox,oy)) if ox>=0 and oy>=0 else None
if ox<0 or oy<0:
    tmp=Image.new('RGBA',(W,H),(0,0,0,0)); tmp.paste(out,(ox,oy),out); canvas.alpha_composite(tmp)
# grain over everything to unify
arr=np.asarray(canvas.convert('RGB')).astype(np.float32)
arr+=np.random.default_rng(1).normal(0,7,(H,W,1))
Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).save('abuja_stage2.png')
Image.open('abuja_stage2.png').resize((540,675)).save('s2_prev.jpg')
