# Abuja Design B: illustrated ink sketch + painted colour blocks on light paper (Toronto-flyer direction)
import numpy as np, sys
import backgrounds
STYLE=sys.argv[1] if len(sys.argv)>1 else 'paper'
from PIL import Image, ImageFilter, ImageDraw
rng=np.random.default_rng(5)
W,H=2160,2700
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def noise(f,seed,blur=None):
    r=np.random.default_rng(seed)
    n=Image.fromarray((r.random((max(2,int(f*H/W)),f))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)
    n=n.filter(ImageFilter.GaussianBlur(blur if blur else W/f*0.3))
    n=np.asarray(n).astype(np.float32)/255; return (n-n.mean())/(n.std()+1e-6)
RED=np.array([214,28,30],np.float32); ORANGE=np.array([244,112,28],np.float32)

# ---------- paper background
_=rng.normal(0,5,(H,W,1))   # keep the portrait's random stream unchanged
bg=backgrounds.make(STYLE)

# ---------- place portrait
cut=Image.open('../../victony_cutout.png').convert('RGBA')
SC=1.55; TOP=780; HEADTOP=463
cut=cut.resize((int(cut.width*SC),int(cut.height*SC)),Image.LANCZOS)
ox=(W-cut.width)//2; oy=int(TOP-HEADTOP*SC)
lay=Image.new('RGBA',(W,H),(0,0,0,0)); lay.paste(cut,(ox,oy),cut)
a=np.asarray(lay).astype(np.float32)/255; al=a[...,3]; rgb=a[...,:3]
P=lambda x,y:(ox+x*SC,oy+y*SC)   # cutout coords -> canvas

# ---------- ink drawing from the photo
L=rgb@np.array([.3,.59,.11],np.float32)
Li=Image.fromarray((L*255).astype(np.uint8))
b1=np.asarray(Li.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32)/255
b2=np.asarray(Li.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)/255
dog=b2-b1                                     # dark lines/edges
lines=np.clip(dog*9,0,1)
m=(al>0.5)&(yy<P(0,1420)[1]); lo,hi=np.percentile(L[m],[2,99.5]); Ln=np.clip((L-lo)/(hi-lo),0,1)
# hatched shading: diagonal hatch lines appear where it is dark
hatch1=(np.sin((xx+yy)*0.42)>0.15).astype(np.float32)
hatch2=(np.sin((xx-yy)*0.42)>0.35).astype(np.float32)
shade=np.where(Ln<0.22,1,0)*0.95 + np.where((Ln>=0.22)&(Ln<0.42),np.maximum(hatch1,hatch2),0)*0.85 + np.where((Ln>=0.42)&(Ln<0.60),hatch1,0)*0.7
grit=rng.random((H,W))
inkA=np.clip(np.maximum(lines,shade)*(0.75+0.25*(grit>0.25)),0,1)*al
# lower body: fewer details, just sketch lines (like the reference)
body=np.clip((yy-P(0,1480)[1])/300,0,1)
inkA=inkA*(1-body*0.92)+np.clip(lines*1.6-0.5,0,1)*al*body*0.5
inkA*=np.clip(1-(yy-2450)/250,0,1)

# ---------- painted flames: red + orange dry-brush tongues rising from the shoulders
cx=P(615,0)[0]
alI=Image.fromarray((al*255).astype(np.uint8))
wide=np.asarray(alI.filter(ImageFilter.MaxFilter(61)).filter(ImageFilter.GaussianBlur(60))).astype(np.float32)/255
# flame top edge per column: tall licks at the sides of the face, low in the centre so the face stays clear
x=np.arange(W,dtype=np.float32)
base=P(0,1270)[1]
peaks=np.zeros(W,np.float32)
for i in range(22):
    px=rng.uniform(P(150,0)[0],P(1180,0)[0]); hgt=rng.uniform(300,950); wdt=rng.uniform(40,110)
    centre=np.exp(-((px-cx)/(W*0.13))**2)          # keep licks short over the face centre
    peaks=np.maximum(peaks,hgt*(1-0.8*centre)*np.clip(1-np.abs(x-px)/wdt,0,1)**1.8)
top=base-peaks
# wobble the tongues sideways as they rise (flame curl)
wob=noise(14,8)*35
streak=np.asarray(Image.fromarray((rng.random((H//3,W//30))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)).astype(np.float32)/255
dry=streak*0.7+rng.random((H,W))*0.45
fl=((yy>top[np.clip((xx+wob).astype(int),0,W-1)])&(wide>0.12)).astype(np.float32)
fl*=(dry+np.clip((yy-base)/200,0,1)>0.55)   # broken dry-brush texture, solid lower down
fl*=np.clip(1-(yy-2560)/140,0,1)
# split: orange on his right side (viewer left), red on the other; ragged brushed seam
seam=cx+noise(20,9)*50
orange=fl*(xx<seam); red=fl*(xx>=seam)
img=bg.copy()
img=img*(1-orange[...,None]*0.95)+ORANGE*orange[...,None]*0.95
img=img*(1-red[...,None]*0.95)+RED*red[...,None]*0.95
inkcol=np.array([18,16,18],np.float32)
img=img*(1-inkA[...,None])+inkcol*inkA[...,None]

canvas=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).convert('RGBA')
d=ImageDraw.Draw(canvas)

# ---------- smoke curling up on the left (bonfire smoke)
smk=Image.new('L',(W,H),0); smd=ImageDraw.Draw(smk)
for s in range(7):
    x=P(300,1180)[0]+rng.normal(0,30); y=P(0,1180)[1]+rng.normal(0,40)
    ph=rng.uniform(0,6.28); amp=rng.uniform(20,70); w=rng.uniform(8,18)
    pts=[]
    for t in range(140):
        y_=y-t*7; x_=x-t*1.6+np.sin(t*0.05+ph)*amp*(1+t/50)
        pts.append((x_,y_))
    smd.line(pts,fill=int(rng.uniform(60,120)),width=int(w))
smk=smk.filter(ImageFilter.GaussianBlur(16))
sm=np.asarray(smk).astype(np.float32)/255*np.clip((yy-P(0,600)[1])/500,0,1)
smL=np.zeros((H,W,4),np.uint8); smL[...,:3]=40; smL[...,3]=(np.clip(sm*1.6,0,1)*210).astype(np.uint8)
canvas.alpha_composite(Image.fromarray(smL))

# ---------- final grain
arr=np.asarray(canvas.convert('RGB')).astype(np.float32)+rng.normal(0,5,(H,W,1))
out='abuja_b_stage2.png' if STYLE=='paper' else f'bg-options/abuja_b_{STYLE}.png'
Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).save(out)
