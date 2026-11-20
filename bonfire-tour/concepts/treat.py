import numpy as np
from PIL import Image, ImageFilter
rng=np.random.default_rng(1)
cut=Image.open('../victony_cutout.png').convert('RGBA')        # 1334x2000
a=np.asarray(cut).astype(np.float32)/255; al=a[...,3]; rgb=a[...,:3]
H,W=al.shape; yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
L=rgb@np.array([.3,.59,.11],np.float32)
def ln(L,blur=40,k=1.6,p=(2,98)):
    b=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))).astype(np.float32)/255
    L2=np.clip(L+(L-b)*k,0,1); m=al>0.5; lo,hi=np.percentile(L2[m],p); return np.clip((L2-lo)/(hi-lo),0,1)
def save(c,A,name): Image.fromarray((np.dstack([np.clip(c,0,1),np.clip(A,0,1)])*255).astype(np.uint8),'RGBA').save('assets/'+name)
def gmap(t,stops):
    out=np.zeros(t.shape+(3,),np.float32)
    for c in range(3): out[...,c]=np.interp(t,[s[0] for s in stops],[s[1][c]/255 for s in stops])
    return out
# 1) RED HEAT: hard threshold B&W with grit (white highlights, black shadows), transparent bg
Ln=ln(L,30,2.0)
g=rng.random((H,W)); coarse=np.asarray(Image.fromarray((rng.random((H//4,W//4))*255).astype(np.uint8)).resize((W,H),Image.NEAREST)).astype(np.float32)/255
th=(Ln+(g-0.5)*0.35+(coarse-0.5)*0.15>0.52).astype(np.float32)
c=np.dstack([th]*3)*np.array([0.97,0.95,0.93])+(1-th[...,None])*np.array([0.05,0.04,0.045])
save(c,al,'t1_threshold.png')
# 3) SWISS: duotone black->orange->cream on cutout
Ld=ln(L,40,1.3)
save(gmap(Ld,[(0,(14,12,12)),(0.45,(232,62,20)),(0.8,(255,150,60)),(1,(246,238,224))]),al,'t3_duotone.png')
# 4) THERMAL: smooth luminance -> heat palette; face/skin hot
Lt=np.asarray(Image.fromarray((ln(L,60,1.0,(1,99))*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32)/255
skin=np.clip((rgb[...,0]-rgb[...,2])*3,0,1)                   # warm skin reads hotter
heat=np.clip(Lt*0.55+skin*0.55,0,1)
heat=np.asarray(Image.fromarray((heat*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
tc=gmap(heat,[(0,(10,4,40)),(0.2,(52,10,110)),(0.38,(150,20,140)),(0.55,(230,40,60)),(0.7,(255,120,20)),(0.85,(255,214,60)),(1,(255,255,235))])
save(tc,al,'t4_thermal.png')
print('ok')
# 5) EYES close-up halftone (cream dots on transparent) for retro-print backgrounds
src=Image.open('../victony_cutout.png').convert('RGB').crop((230,800,1130,1160)).resize((1800,720),Image.LANCZOS)
E=np.asarray(src).astype(np.float32)/255@np.array([.3,.59,.11],np.float32)
b=np.asarray(Image.fromarray((E*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(30))).astype(np.float32)/255
E=np.clip(E+(E-b)*1.2,0,1); lo,hi=np.percentile(E,[2,99]); E=np.clip((E-lo)/(hi-lo),0,1)
h,w=E.shape; vy,vx=np.mgrid[0:h,0:w].astype(np.float32); cell=14; t=np.deg2rad(30)
u=(vx*np.cos(t)+vy*np.sin(t))/cell; v=(-vx*np.sin(t)+vy*np.cos(t))/cell
d=np.hypot(u-np.floor(u)-.5,v-np.floor(v)-.5); dots=(d<np.sqrt(E)*0.62).astype(np.float32)
edge=np.clip(vx/260,0,1)*np.clip((w-vx)/260,0,1)*np.clip(vy/120,0,1)*np.clip((h-vy)/120,0,1)
save(np.ones((h,w,3))*np.array([0.95,0.9,0.8]),dots*edge,'t5_eyes_dots.png')
# 6) gritty B&W (softer than threshold, photocopy) on paper colour, opaque-ish for paper cuts
Lg=ln(L,30,1.6)
gg=np.clip((Lg-0.5)*1.7+0.5+(rng.random((H,W))-0.5)*0.22,0,1)
gc=np.array([0.07,0.06,0.06])+(np.array([0.95,0.93,0.89])-np.array([0.07,0.06,0.06]))*gg[...,None]
save(gc,al,'t6_bw.png')
# 1b) threshold with the shirt crushed to black (for type over the chest)
yb=np.clip((yy-1330)/260,0,1)[...,None]
c1=np.where(th[...,None]>0,1,0)*np.array([0.97,0.95,0.93])+(1-th[...,None])*np.array([0.05,0.04,0.045])
c1=c1*(1-yb)+np.array([0.05,0.04,0.045])*yb
save(c1,al,'t1b_threshold_dark.png')
