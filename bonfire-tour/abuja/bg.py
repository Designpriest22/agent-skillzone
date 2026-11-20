import numpy as np
from PIL import Image, ImageFilter, ImageDraw
W,H=2160,2700
rng=np.random.default_rng(11)
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def fnoise(octs,seed=0):
    r=np.random.default_rng(seed); acc=np.zeros((H,W),np.float32); tot=0
    for f,a in octs:
        n=Image.fromarray((r.random((max(2,int(f*H/W)),f))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)
        n=n.filter(ImageFilter.GaussianBlur(W/f*0.35))
        n=np.asarray(n).astype(np.float32)/255; n=(n-n.mean())/(n.std()+1e-6)
        acc+=a*n; tot+=a
    return acc/tot
def grad(t,stops):
    out=np.zeros(t.shape+(3,),np.float32)
    for c in range(3): out[...,c]=np.interp(t,[s[0] for s in stops],[s[1][c] for s in stops])
    return out
hor=H*0.70  # horizon line
# sky: near-black top -> smoky charcoal -> ember glow at horizon
t=np.clip(yy/hor,0,1)
sky=grad(t,[(0,(9,9,11)),(0.45,(22,20,22)),(0.75,(58,30,22)),(0.92,(150,52,22)),(1,(214,84,30))])
# horizon glow, centred, falls off sideways
gx=np.exp(-((xx-W*0.5)/(W*0.42))**2)
gy=np.exp(-((yy-hor)/(H*0.16))**2)
glow=gx*gy
sky=sky*(0.55+0.45*gx[...,None])+glow[...,None]*np.array([255,96,32])*0.55
# smoke
sm=fnoise([(4,1),(9,.6),(22,.35),(60,.15)],3)
smoke_mask=np.clip((sm+0.2)*0.8,0,1)*np.clip(yy/hor,0.3,1)
smoke_col=np.array([60,52,50],np.float32)+glow[...,None]*np.array([140,60,20])
sky=sky*(1-smoke_mask[...,None]*0.6)+smoke_col*smoke_mask[...,None]*0.6
# Aso Rock silhouette (broad granite monolith with a domed crest and a second shoulder)
x=np.arange(W,dtype=np.float32)
u=(x-W*0.5)/W
prof=hor-( 430*np.clip(1-(np.abs(u+0.03)/0.29)**1.7,0,1)**0.8   # broad rounded granite dome
          +110*np.exp(-((u-0.10)/0.09)**2)      # crest bulge
          +150*np.exp(-((u+0.33)/0.10)**2)      # left boulder hill
          + 95*np.exp(-((u-0.36)/0.09)**2)      # right boulder hill
          + 40*np.exp(-((u+0.45)/0.2)**2))
rough=fnoise([(40,1),(110,.3)],5)[0]*7
prof=prof+rough
rock=(yy>prof[None,:]).astype(np.float32)
# rim light along rock top edge (fire glow from behind)
d=yy-prof[None,:]
rim=np.clip(1-d/14,0,1)*rock*np.exp(-((xx-W*0.5)/(W*0.5))**2)
rock_tex=fnoise([(30,1),(120,.6)],7)
rock_col=np.array([12,10,10],np.float32)[None,None,:]*(1+0.25*rock_tex[...,None])
# rock face faint ember-lit striations
rock_col+= (np.clip(1-d/260,0,1)*0.25*gx)[...,None]*np.array([120,40,14])
img=sky*(1-rock[...,None])+rock_col*rock[...,None]+rim[...,None]*np.array([255,120,40])*0.9
# ground haze/smoke in front of the base
fog=np.clip(fnoise([(6,1),(16,.5)],9)*0.5+0.5,0,1)*np.exp(-((yy-H*0.80)/(H*0.10))**2)
img=img*(1-fog[...,None]*0.5)+fog[...,None]*np.array([70,40,30])*0.5
# bottom fade to black (space for type later)
bf=np.clip((yy-H*0.80)/(H*0.20),0,1)**1.2
img=img*(1-bf[...,None]*0.85)
# vignette
r=np.sqrt(((xx-W/2)/(W*0.75))**2+((yy-H*0.55)/(H*0.75))**2)
img=img*np.clip(1.15-r**2*0.9,0.25,1)[...,None]
# film grain + gritty specks (from the original flyer)
img=img+(rng.normal(0,1,(H,W,1))*9)
sp=rng.random((H,W))
img=np.where((sp<0.004)[...,None],img*0.4,img)
img=np.clip(img,0,255).astype(np.uint8)
base=Image.fromarray(img)
# embers: a sparse first spark, rising from the horizon
em=Image.new('RGBA',(W,H),(0,0,0,0)); dr=ImageDraw.Draw(em)
for i in range(140):
    x0=rng.normal(W*0.5,W*0.25); y0=hor-300-abs(rng.normal(0,H*0.28))
    rr=rng.random()**2.5*6+1.2
    a=int(140+rng.random()*115*(y0/hor))
    c=(255,int(110+rng.random()*120),int(30+rng.random()*40),a)
    if rng.random()<0.25:  # streaked ember (motion)
        L=rr*rng.uniform(4,10); ang=-np.pi/2+rng.normal(0,0.35)
        dr.line((x0,y0,x0+np.cos(ang)*L,y0+np.sin(ang)*L),fill=c,width=max(2,int(rr)))
    else: dr.ellipse((x0-rr,y0-rr,x0+rr,y0+rr),fill=c)
g=em.filter(ImageFilter.GaussianBlur(9))
skym=Image.fromarray(((1-rock)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
def msk(l):
    a=np.asarray(l).copy(); a[...,3]=(a[...,3].astype(np.float32)*np.asarray(skym)/255).astype(np.uint8); return Image.fromarray(a)
g=msk(g); em=msk(em)
base=base.convert('RGBA'); base.alpha_composite(g); base.alpha_composite(g); base.alpha_composite(em)
base.convert('RGB').save('abuja_bg.png')
base.convert('RGB').resize((540,675)).save('abuja_prev.jpg')
