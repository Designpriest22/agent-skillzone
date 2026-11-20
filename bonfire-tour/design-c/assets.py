# Grunge zine assets (all at 2x = 2160x2700 canvas scale)
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
rng=np.random.default_rng(3)
W,H=2160,2700
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def noise(f,seed,w=W,h=H):
    r=np.random.default_rng(seed)
    n=Image.fromarray((r.random((max(2,int(f*h/w)),f))*255).astype(np.uint8)).resize((w,h),Image.BICUBIC).filter(ImageFilter.GaussianBlur(w/f*0.3))
    n=np.asarray(n).astype(np.float32)/255; return (n-n.mean())/(n.std()+1e-6)
INK=np.array([22,18,20],np.float32); ORANGE=np.array([255,91,31],np.float32); VIOLET=np.array([123,92,255],np.float32)

# ---------- photocopy paper
paper=np.array([233,228,216],np.float32)+noise(5,1)[...,None]*6+noise(40,2)[...,None]*4+rng.normal(0,7,(H,W,1))
streak=np.asarray(Image.fromarray((rng.random((H//4,W//60))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)).astype(np.float32)/255
paper*=1-np.clip(streak-0.7,0,1)[...,None]*0.18                     # xerox drum streaks
paper*=np.clip(1.06-0.5*np.hypot((xx-W/2)/W,(yy-H/2)/H)**2*1.6,0.7,1)[...,None]   # darker edges
for (x0,y0,x1,y1) in [(0,1310,W,1350),(1060,0,1100,H)]:              # folds
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).line((x0,y0,x1,y1),fill=255,width=4)
    c=np.asarray(m.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
    paper=paper*(1-c[...,None]*0.25)+255*np.roll(c,5,1)[...,None]*0.12
stain=np.clip(noise(7,5)-1.1,0,1)*0.12; paper=paper*(1-stain[...,None])+np.array([170,140,90])*stain[...,None]
Image.fromarray(np.clip(paper,0,255).astype(np.uint8)).save('assets/paper.png')

# ---------- grunge overlay (dust, scratches, toner) as RGBA
g=np.zeros((H,W,4),np.float32)
sp=rng.random((H,W))
dark=(sp<0.0035)|((np.clip(noise(260,7)-2.0,0,1)>0)&(rng.random((H,W))<0.5))
g[dark]=[20,16,18,230]
img=Image.fromarray(g.astype(np.uint8),'RGBA'); d=ImageDraw.Draw(img)
for i in range(90):
    x=rng.uniform(0,W); y=rng.uniform(0,H); L=rng.uniform(30,400); a=rng.normal(1.5708,0.25)
    d.line((x,y,x+np.cos(a)*L,y+np.sin(a)*L),fill=(20,16,18,int(rng.uniform(60,160))),width=int(rng.uniform(1,3)))
for i in range(40):
    x=rng.uniform(0,W); y=rng.uniform(0,H); L=rng.uniform(40,300); a=rng.uniform(0,3.14)
    d.line((x,y,x+np.cos(a)*L,y+np.sin(a)*L),fill=(250,246,236,int(rng.uniform(80,180))),width=2)
img.save('assets/grunge.png')

# ---------- distress mask for type (white = keep)
dm=np.ones((H,W),np.float32)
holes=(rng.random((H,W))<0.06)|(np.clip(noise(180,11),0,9)>1.7)|(np.clip(noise(30,12),0,9)>2.0)
streaks=np.asarray(Image.fromarray((rng.random((H//3,W//300+2))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)).astype(np.float32)/255
dm[holes|(streaks<0.16)]=0
Image.fromarray((dm*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)).convert('L').save('assets/distress.png')

# ---------- Victony: photocopy halftone cutout with rough paper edge + orange offset print
cut=Image.open('../victony_cutout.png').convert('RGBA').crop((0,380,1334,2000))
S=1.32; cut=cut.resize((int(cut.width*S),int(cut.height*S)),Image.LANCZOS)
P=70; w,h=cut.width+2*P,cut.height+P
lay=Image.new('RGBA',(w,h),(0,0,0,0)); lay.paste(cut,(P,P),cut)
a=np.asarray(lay).astype(np.float32)/255; al=a[...,3]; L=a[...,:3]@np.array([.3,.59,.11],np.float32)
vy,vx=np.mgrid[0:h,0:w].astype(np.float32)
# kill straight crop edges at the shoulders
al=al*np.maximum(np.clip((vx-P)/200,0,1)*np.clip((P+cut.width-vx)/200,0,1),np.clip((P+1350-vy)/200,0,1))
Lb=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255
m=al>0.5; lo,hi=np.percentile(Lb[m],[3,97]); Ln=np.clip((Lb-lo)/(hi-lo),0,1)
Ln=np.clip((Ln-0.5)*1.5+0.55,0,1)                          # punchy contrast
# 45-degree amplitude-modulated halftone
cell=11; th=np.deg2rad(45)
u=(vx*np.cos(th)+vy*np.sin(th))/cell; v=(-vx*np.sin(th)+vy*np.cos(th))/cell
du=(u-np.floor(u)-0.5); dv=(v-np.floor(v)-0.5); dist=np.sqrt(du**2+dv**2)
radius=np.sqrt(np.clip(1-Ln,0,1))*0.72
dots=(dist<radius).astype(np.float32)
solid=(Ln<0.18).astype(np.float32)
ink=np.clip(np.maximum(dots,solid),0,1)
ink*=(rng.random((h,w))>0.07)                               # toner dropouts
# rough torn-paper border around him
alI=Image.fromarray((al*255).astype(np.uint8))
border=np.asarray(alI.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)/255
border=(border+noise(60,21,w,h)*0.12+(rng.random((h,w))-0.5)*0.12>0.5).astype(np.float32)
fadeb=np.clip((h-vy)/180,0,1)
border*=fadeb; inkA=ink*np.clip(al*1.2,0,1)*fadeb
paperc=np.array([240,236,226],np.float32)
col=paperc*(1-inkA[...,None])+INK*inkA[...,None]
Image.fromarray(np.dstack([col,np.maximum(border,inkA)*255]).astype(np.uint8),'RGBA').save('assets/victony_halftone.png')
# orange offset print: flat orange silhouette with coarser halftone shadow, for misregistration behind
oc=np.clip(al*1.2,0,1)*fadeb
Image.fromarray(np.dstack([np.broadcast_to(ORANGE,(h,w,3)),oc*(rng.random((h,w))>0.05)*255]).astype(np.uint8),'RGBA').save('assets/victony_orange.png')
print('victony',w,h)

# ---------- black Victony wordmark (for the cream paper)
wm=Image.open('../logos/victony_wordmark.png').convert('RGBA'); wa=np.asarray(wm).astype(np.float32)
Image.fromarray(np.dstack([np.broadcast_to(INK,wa.shape[:2]+(3,)),wa[...,3]]).astype(np.uint8),'RGBA').save('assets/victony_wordmark_black.png')
# black CBP
cb=np.asarray(Image.open('../logos/capital_block_party.png').convert('RGBA')).astype(np.float32)
lum=cb[...,:3].mean(2); col=np.where((lum>150)[...,None],INK,ORANGE)
Image.fromarray(np.dstack([col,cb[...,3]]).astype(np.uint8),'RGBA').save('assets/cbp_ink.png')
