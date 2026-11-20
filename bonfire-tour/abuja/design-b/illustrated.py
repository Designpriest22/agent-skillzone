# Abuja Design B: illustrated ink sketch + painted colour blocks on light paper (Toronto-flyer direction)
import numpy as np, sys, os
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
LAYERS=[('Background - burnt paper',None,None)]
def comp(name,color,alpha):
    global img
    color=np.broadcast_to(np.asarray(color,np.float32),(H,W,3)) if np.ndim(color)<3 else color
    alpha=np.clip(alpha,0,1)
    img=img*(1-alpha[...,None])+color*alpha[...,None]
    LAYERS.append((name,color,alpha))
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
    front=1-np.clip(al*1.4,0,1)                                              # his head sits in front of the letters
    INK=np.array([20,17,16],np.float32)
    comp('Title - THE',INK,the*front*0.96)
    comp('Title - BONFIRE',INK,big*(1-the)*front*0.96)
comp('Flames - orange paint',ORANGE,orange*0.95)
comp('Flames - red paint',RED,red*0.95)
inkcol=np.array([18,16,18],np.float32)
comp('Victony - ink sketch',inkcol,inkA)

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
    comp('Title - EXPERIENCE misprint',[120,16,14],ghost*0.55)
    shadow=np.roll(np.roll(em,9,0),7,1)*(1-em)
    comp('Title - EXPERIENCE shadow',[0,0,0],shadow*0.45)
    comp('Title - EXPERIENCE paint + drips',PAINT,em*0.95)
if TITLE:
    # ================= event info + logos (mirrors the main event flyer) =================
    LOGO='../../logos/'; OSW='../../fonts/Oswald-SemiBold.ttf'
    def place(im,x,y):                                   # RGBA image -> full-canvas colour + alpha
        L_=Image.new('RGBA',(W,H),(0,0,0,0)); L_.paste(im,(int(x),int(y)),im)
        a_=np.asarray(L_).astype(np.float32); return a_[...,:3],a_[...,3]/255
    # -- city + date, top right, level with "THE"
    cd=worn(textmask('ABUJA  4TH DEC',165,(1951-967,150-190*165/600)),44,0.05)
    comp('Info - ABUJA 4TH DEC',RED,cd*0.97)
    # -- POWERED BY + Capital Block Party (inked black with a red offset shadow)
    pw=Image.new('RGBA',(460,70),(0,0,0,0)); ImageDraw.Draw(pw).text((230,35),'P O W E R E D   B Y',font=ImageFont.truetype(OSW,38),fill=(214,28,30,255),anchor='mm')
    c_,a_=place(pw,1765-230,1150); comp('Info - POWERED BY',c_,a_)
    cbp=Image.open(LOGO+'capital_block_party.png').convert('RGBA'); cbp=cbp.resize((400,int(400*cbp.height/cbp.width)),Image.LANCZOS)
    ca=np.asarray(cbp).astype(np.float32); lum=ca[...,:3].mean(2)
    fill_=np.where(lum>150,1.0,0.0)*ca[...,3]/255; shad=np.where(lum<=150,1.0,0.0)*ca[...,3]/255
    sh_im=Image.fromarray(np.dstack([np.full(lum.shape+(3,),[214,28,30]),shad*255]).astype(np.uint8),'RGBA')
    fl_im=Image.fromarray(np.dstack([np.full(lum.shape+(3,),[20,17,16]),fill_*255]).astype(np.uint8),'RGBA')
    c_,a_=place(sh_im,1765-200,1215); comp('Logo - Capital Block Party shadow',c_,a_*worn(np.ones((H,W),np.float32),45,0.06))
    c_,a_=place(fl_im,1765-200,1215); comp('Logo - Capital Block Party',c_,a_*worn(np.ones((H,W),np.float32),46,0.06))
    # -- Victony wordmark on his chest, white with a dark halo so it reads on the ink
    vw=Image.open(LOGO+'victony_wordmark.png').convert('RGBA'); vw=vw.resize((440,int(440*vw.height/vw.width)),Image.LANCZOS)
    vx,vy=P(615,0)[0]-220,2140
    halo=Image.new('RGBA',(W,H),(0,0,0,0)); halo.paste(vw,(int(vx),int(vy)),vw)
    ha=np.asarray(halo.split()[3].filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(18))).astype(np.float32)/255
    comp('Logo - Victony glow',[12,8,8],ha*0.8)
    c_,a_=place(vw,vx,vy); comp('Logo - Victony',c_,a_)
    # -- ticket strip: torn black paper across the bottom
    sx0,sy0,sx1,sy1=110,2410,2050,2590
    sm_=Image.new('L',(W,H),0); sdr=ImageDraw.Draw(sm_); pts=[]
    for xv in np.linspace(sx0,sx1,60): pts.append((xv,sy0+abs(rng.normal(0,7))))
    for yv in np.linspace(sy0,sy1,8): pts.append((sx1-abs(rng.normal(0,7)),yv))
    for xv in np.linspace(sx1,sx0,60): pts.append((xv,sy1-abs(rng.normal(0,7))))
    for yv in np.linspace(sy1,sy0,8): pts.append((sx0+abs(rng.normal(0,7)),yv))
    sdr.polygon(pts,fill=255); sm_=sm_.rotate(-1,center=(W/2,(sy0+sy1)/2),resample=Image.BICUBIC)
    sa=np.asarray(sm_).astype(np.float32)/255
    comp('Ticket strip - shadow',[0,0,0],np.roll(np.roll(sa,12,0),8,1)*(1-sa)*0.5)
    comp('Ticket strip - black paper',[16,13,12],sa*(0.93+0.07*(rng.random((H,W))>0.5)))
    tl=Image.new('RGBA',(W,H),(0,0,0,0)); td=ImageDraw.Draw(tl); f_=ImageFont.truetype(OSW,48)
    parts=[('TICKETS AT ',(244,112,28)),('WWW.OUTLAWVILLE.WORLD',(238,230,214)),('   |   ',(214,28,30)),('MAINLANDBLOCKPARTY.COM',(238,230,214))]
    tw=sum(td.textlength(t,font=f_) for t,_ in parts); x_=W/2-tw/2+5; ym=(sy0+sy1)/2
    for t,cl in parts:
        td.text((x_,ym),t,font=f_,fill=cl+(255,),anchor='lm'); x_+=td.textlength(t,font=f_)
    tl=tl.rotate(-1,center=(W/2,ym),resample=Image.BICUBIC)
    c_,a_=place(tl,0,0); comp('Ticket strip - text',c_,a_)
    plug=Image.open(LOGO+'the_plug.png').convert('RGBA'); plug=plug.resize((int(118*plug.width/plug.height),118),Image.LANCZOS)
    c_,a_=place(plug,sx0+45,ym-59+4); comp('Logo - The Plug',c_,a_)
    cb2=Image.open(LOGO+'capital_block_party.png').convert('RGBA'); cb2=cb2.resize((int(120*cb2.width/cb2.height),120),Image.LANCZOS)
    c_,a_=place(cb2,sx1-45-cb2.width,ym-60-6); comp('Logo - Capital Block Party (strip)',c_,a_)
if TITLE:
    gr=np.random.default_rng(77)
    smudge=np.clip(noise(9,78)-0.9,0,1)*0.22+np.clip(noise(25,79)-1.4,0,1)*0.3
    comp('Grunge - smudges',[40,30,26],smudge)
    dust=gr.random((H,W)); comp('Grunge - dust dark',[0,0,0],(dust<0.0025)*0.65); comp('Grunge - dust light',[255,255,255],(dust>0.9985)*0.2)
    tone=np.clip(noise(200,80)-2.1,0,1)*(gr.random((H,W))>0.6)          # photocopy toner speckle
    comp('Grunge - toner speckle',[0,0,0],tone*0.5)
    crd=np.zeros((H,W),np.float32); crl=np.zeros((H,W),np.float32)
    for (x0,y0,x1,y1) in [(0,1180,W,1050),(1300,0,1180,H),(0,420,W,560)]:   # paper creases
        cr=Image.new('L',(W,H),0); cd=ImageDraw.Draw(cr); cd.line((x0,y0,x1,y1),fill=255,width=3)
        c=np.asarray(cr.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32)/255
        c2=np.roll(np.roll(c,4,0),3,1)
        crd=np.maximum(crd,c*0.18); crl=np.maximum(crl,c2*0.10)
    comp('Grunge - crease shadows',[0,0,0],crd); comp('Grunge - crease highlights',[255,255,255],crl)
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
LAYERS.append(('Smoke',np.full((H,W,3),40,np.float32),np.clip(sm*1.6,0,1)*210/255))

# ---------- final grain
GRAIN=rng.normal(0,5,(H,W,1))
arr=np.asarray(canvas.convert('RGB')).astype(np.float32)+GRAIN
out='abuja_b_stage2.png' if STYLE=='paper' else f'bg-options/abuja_b_{STYLE}.png'
Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).save(out)

# ---------- layered PSD export
if TITLE and os.environ.get('PSD'):
    from psd_tools import PSDImage
    from psd_tools.api.layers import PixelLayer
    from psd_tools.constants import BlendMode
    psd=PSDImage.new('RGB',(W,H),color=(0,0,0))
    def rgba(color,alpha):
        alpha=np.where(alpha<0.01,0,alpha)
        a=np.dstack([np.clip(color,0,255),np.clip(alpha,0,1)[...,None]*255]).astype(np.uint8)
        return Image.fromarray(a,'RGBA')
    for name,color,alpha in LAYERS:
        im=Image.fromarray(np.clip(bg,0,255).astype(np.uint8)).convert('RGBA') if color is None else rgba(color,alpha)
        bb=im.getbbox()
        if bb is None: continue
        lay=PixelLayer.frompil(im.crop(bb),psd,name,top=bb[1],left=bb[0])
        psd.append(lay)
    # film grain as a 50%-grey overlay layer (+/- noise around mid grey)
    g=np.clip(128+GRAIN[...,0]*2.0,0,255).astype(np.uint8)
    gl=PixelLayer.frompil(Image.fromarray(np.dstack([g,g,g,np.full((H,W),255,np.uint8)]),'RGBA'),psd,'Film grain (overlay)',top=0,left=0)
    gl.blend_mode=BlendMode.OVERLAY; psd.append(gl)
    psd.save(os.environ['PSD'])
    print('saved',os.environ['PSD'],len(psd),'layers')
