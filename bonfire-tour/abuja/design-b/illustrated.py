# Abuja Design B: illustrated ink sketch + painted colour blocks on light paper (Toronto-flyer direction)
import numpy as np, sys
import backgrounds
STYLE=sys.argv[1] if len(sys.argv)>1 else 'burnt'
TITLE=STYLE=='burnt'
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
if TITLE:
    from PIL import ImageFont
    FONT='../../fonts/Anton-Regular.ttf'
    def textmask(txt,size,xy):
        t=Image.new('L',(W,H),0); ImageDraw.Draw(t).text(xy,txt,font=ImageFont.truetype(FONT,size),fill=255)
        return np.asarray(t).astype(np.float32)/255
    def worn(m,seed,holes=0.10):
        r=np.random.default_rng(seed)
        rough=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32)/255
        m=(rough+(r.random((H,W))-0.5)*0.8+noise(120,seed+3)*0.08>0.5).astype(np.float32)   # chewed print edges
        roller=np.asarray(Image.fromarray((r.random((H//6,W//200+2))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)).astype(np.float32)/255
        scuff=noise(30,seed+1)
        keep=(r.random((H,W))>holes+np.clip(0.55-roller,0,1)*0.9)&(scuff<1.9)          # ink starved streaks + worn patches
        return m*keep
    big=worn(textmask('BONFIRE',585,(210,330-185*585/600)),41,0.12)
    the=worn(textmask('THE',165,(216,150-190*165/600)),42)
    behind=(big+the).clip(0,1)*(1-np.clip(al*1.4,0,1))                      # his head sits in front of the letters
    INK=np.array([20,17,16],np.float32)
    img=img*(1-behind[...,None]*0.96)+INK*behind[...,None]*0.96
img=img*(1-orange[...,None]*0.95)+ORANGE*orange[...,None]*0.95
img=img*(1-red[...,None]*0.95)+RED*red[...,None]*0.95
inkcol=np.array([18,16,18],np.float32)
img=img*(1-inkA[...,None])+inkcol*inkA[...,None]

if TITLE:
    sz=345; ex=textmask('EXPERIENCE',sz,(0,0))
    ys,xs=np.nonzero(ex); ex=ex[ys.min():ys.max()+1,xs.min():xs.max()+1]
    exI=Image.fromarray((ex*255).astype(np.uint8)).rotate(3,expand=True,resample=Image.BICUBIC)
    lay2=Image.new('L',(W,H),0); px=(W-exI.width)//2; py=690
    lay2.paste(exI,(px,py)); em=np.asarray(lay2).astype(np.float32)/255
    em0=em.copy()
    brush=np.asarray(Image.fromarray((rng.random((H//40,W//2))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)).astype(np.float32)/255
    em=em*((brush*0.6+rng.random((H,W))*0.6)>0.16)                         # horizontal dry-brush drag
    em=np.maximum(worn(em,43,0.02),em*0.0)
    grad=np.clip((xx-px)/exI.width,0,1)[...,None]
    PAINT=ORANGE*(1-grad)+RED*grad
    # drips running down from the letters
    dr=Image.new('L',(W,H),0); dd=ImageDraw.Draw(dr)
    ys_,xs_=np.nonzero(em0>0.5); bot={}
    for xv,yv in zip(xs_[::7],ys_[::7]): bot[xv]=max(bot.get(xv,0),yv)
    keys=list(bot.keys())
    for k in rng.choice(keys,size=16,replace=False):
        L_=rng.uniform(30,220)*rng.random()**0.5; wd=rng.uniform(5,13); y0_=bot[k]-6
        dd.line((k,y0_,k,y0_+L_),fill=255,width=int(wd)); dd.ellipse((k-wd*0.7,y0_+L_-wd*0.7,k+wd*0.7,y0_+L_+wd*0.7),fill=255)
    em=np.clip(em+np.asarray(dr).astype(np.float32)/255*(rng.random((H,W))>0.15),0,1)
    # off-register ghost print in dark red
    ghost=np.roll(np.roll(em0,-12,0),-14,1)*(rng.random((H,W))>0.35)
    img=img*(1-ghost[...,None]*0.55)+np.array([120,16,14])*ghost[...,None]*0.55
    shadow=np.roll(np.roll(em,9,0),7,1)*(1-em)
    img=img*(1-shadow[...,None]*0.45)
    img=img*(1-em[...,None]*0.95)+PAINT*em[...,None]*0.95
if TITLE:
    gr=np.random.default_rng(77)
    smudge=np.clip(noise(9,78)-0.9,0,1)*0.22+np.clip(noise(25,79)-1.4,0,1)*0.3
    img=img*(1-smudge[...,None])+np.array([40,30,26])*smudge[...,None]
    dust=gr.random((H,W)); img[dust<0.0025]*=0.35; img[dust>0.9985]=np.minimum(img[dust>0.9985]*1.25,255)
    tone=np.clip(noise(200,80)-2.1,0,1)*(gr.random((H,W))>0.6)          # photocopy toner speckle
    img=img*(1-tone[...,None]*0.5)
    for (x0,y0,x1,y1) in [(0,1180,W,1050),(1300,0,1180,H),(0,420,W,560)]:   # paper creases
        cr=Image.new('L',(W,H),0); cd=ImageDraw.Draw(cr); cd.line((x0,y0,x1,y1),fill=255,width=3)
        c=np.asarray(cr.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32)/255
        c2=np.roll(np.roll(c,4,0),3,1)
        img=img*(1-c[...,None]*0.18)+255*c2[...,None]*0.10
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
