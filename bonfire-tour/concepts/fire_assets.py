import numpy as np
from PIL import Image, ImageFilter
rng=np.random.default_rng(12); W,H=2160,2700
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def fbm(octs,seed):
    r=np.random.default_rng(seed); acc=np.zeros((H,W),np.float32); t=0
    for f,a in octs:
        n=Image.fromarray((r.random((max(2,int(f*H/W)),f))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC).filter(ImageFilter.GaussianBlur(W/f*0.3))
        n=np.asarray(n).astype(np.float32)/255; acc+=a*(n-n.mean())/(n.std()+1e-6); t+=a
    return acc/t
# grunge flames: explicit licking tongues (outer black, dark red, orange core), warped + gritty
x=np.arange(W,dtype=np.float32)
def tongues(seed,n,hmin,hmax,wmin,wmax,edge_boost=1.0):
    r=np.random.default_rng(seed); pk=np.zeros(W,np.float32)
    for i in range(n):
        px=r.uniform(-100,W+100); side=np.clip(abs(px-W/2)/(W*0.45),0,1)
        hgt=r.uniform(hmin,hmax)*(0.45+0.55*side*edge_boost); wd=r.uniform(wmin,wmax)
        pk=np.maximum(pk,hgt*np.clip(1-np.abs(x-px)/wd,0,1)**1.6)
    return pk
warp=fbm([(18,1),(50,.4)],6)*45
xi=np.clip((xx+warp*np.clip((H-yy)/H*2,0,1)).astype(int),0,W-1)
base=H+40
layers=[(tongues(1,46,700,1900,60,170),(16,8,10),235),     # outer black
        (tongues(2,40,450,1350,50,140),(110,6,10),235),     # dark red
        (tongues(3,34,250,800,40,110),(255,90,30),230),     # orange
        (tongues(4,24,100,380,30,80),(255,190,90),220)]     # hot core
out=np.zeros((H,W,4),np.float32)
for pk,c,al in layers:
    m=yy>(base-pk)[xi]; out[m,:3]=c; out[m,3]=al
# halftone sparks/dots above the outer flame
s=18; cxg=(xx%s)-s/2; cyg=(yy%s)-s/2
outer=(base-layers[0][0])[xi]
dist=np.clip((yy-(outer-260))/260,0,1)
dots=(np.hypot(cxg,cyg)<dist*s*0.42)&(yy<=outer)
out[dots,:3]=(16,8,10); out[dots,3]=200
out[...,3]*=(rng.random((H,W))>0.10)          # dry-brush grit
Image.fromarray(out.astype(np.uint8),'RGBA').save('assets/fire_grunge.png')
# Victony cross -> worn black stamp
c=Image.open('../logos/victony_cross.png').convert('RGBA'); c=c.crop(c.getbbox())
a=np.asarray(c).astype(np.float32)[...,3]/255
a=(a>0.35).astype(np.float32)
cw,ch=a.shape[1],a.shape[0]
wear=(rng.random((ch,cw))>0.12).astype(np.float32)
blot=np.asarray(Image.fromarray((rng.random((ch//14,cw//14))*255).astype(np.uint8)).resize((cw,ch),Image.BICUBIC)).astype(np.float32)/255
a=a*wear*(blot<0.8)
Image.fromarray(np.dstack([np.full((ch,cw),14),np.full((ch,cw),8),np.full((ch,cw),10),a*255]).astype(np.uint8),'RGBA').save('assets/cross_stamp.png')
print(c.size)
