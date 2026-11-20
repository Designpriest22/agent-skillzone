# Background styles for Abuja Design B
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
W,H=2160,2700
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def noise(f,seed,blur=None):
    r=np.random.default_rng(seed)
    n=Image.fromarray((r.random((max(2,int(f*H/W)),f))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)
    n=n.filter(ImageFilter.GaussianBlur(blur if blur else W/f*0.3))
    n=np.asarray(n).astype(np.float32)/255; return (n-n.mean())/(n.std()+1e-6)
def vign(s=0.12): return np.clip(1.03-s*np.hypot((xx-W/2)/W,(yy-H/2)/H)**2*3,0.7,1)[...,None]
FONT='/home/user/agent-skillzone/bonfire-tour/fonts/Anton-Regular.ttf'

def paper(r):
    bg=np.array([224,223,219],np.float32)+noise(6,1)[...,None]*5+noise(40,2)[...,None]*3+r.normal(0,5,(H,W,1))
    return bg*vign()

def newsprint(r):
    bg=np.array([236,226,204],np.float32)+noise(5,3)[...,None]*7+noise(60,4)[...,None]*3+r.normal(0,6,(H,W,1))
    # big faint halftone dots, denser toward the top corners
    s=26; cx=(xx%s)-s/2; cy=(yy%s)-s/2
    dens=np.clip(0.55-np.hypot((xx-W/2)/W,(yy-H*0.35)/H)*0.2+noise(4,5)*0.12,0,1)*0.6
    dot=(np.hypot(cx,cy)<dens*s*0.5)
    bg[dot]*=0.86
    # fold creases (one vertical, one horizontal) with light/dark edge
    for pos,axis in ((W*0.5+18,'x'),(H*0.5-40,'y')):
        d=(xx-pos) if axis=='x' else (yy-pos)
        bg*= (1-0.07*np.exp(-(d/3)**2)+0.04*np.exp(-((d-6)/5)**2))[...,None]
    bg*=(1-0.18*np.clip(noise(3,6),0,2)[...,None]*0.3)   # yellowed stains
    return bg*vign(0.2)

def wheatpaste(r):
    bg=np.array([150,148,145],np.float32)+noise(8,7)[...,None]*10+r.normal(0,10,(H,W,1))
    img=Image.fromarray(np.clip(bg,0,255).astype(np.uint8)).convert('RGBA')
    for i in range(34):
        w=int(r.uniform(500,1300)); h=int(r.uniform(400,1100))
        tone=r.choice([228,220,236,212,240]); tint=(tone,tone-r.integers(0,8),tone-r.integers(4,16))
        sheet=Image.new('RGBA',(w,h),tint+(255,))
        sd=ImageDraw.Draw(sheet)
        if r.random()<0.5:   # faint old print on some sheets
            y=r.uniform(20,80); lh=r.uniform(14,26); x0_=r.uniform(20,60)
            if r.random()<0.4:   # a big faded headline block
                sd.rectangle((x0_,y,x0_+r.uniform(w*0.3,w*0.8),y+r.uniform(60,140)),fill=(tint[0]-40,tint[1]-40,tint[2]-40,int(r.uniform(25,55)))); y+=170
            while y<h-30:        # lines of small text
                sd.rectangle((x0_,y,x0_+r.uniform(w*0.4,w-2*x0_),y+lh*0.35),fill=(tint[0]-45,tint[1]-45,tint[2]-45,int(r.uniform(20,45)))); y+=lh
        m=Image.new('L',(w,h),0); md=ImageDraw.Draw(m); pts=[]
        for x in np.linspace(0,w,30): pts.append((x,abs(r.normal(0,14))))
        for y in np.linspace(0,h,24): pts.append((w-abs(r.normal(0,14)),y))
        for x in np.linspace(w,0,30): pts.append((x,h-abs(r.normal(0,14))))
        for y in np.linspace(h,0,24): pts.append((abs(r.normal(0,14)),y))
        md.polygon(pts,fill=255); sheet.putalpha(m)
        sheet=sheet.rotate(r.uniform(-6,6),expand=True,resample=Image.BICUBIC)
        x0=int(r.uniform(-300,W-200)); y0=int(r.uniform(-300,H-200))
        sh=Image.new('RGBA',sheet.size,(0,0,0,0)); sh.putalpha(sheet.split()[3].filter(ImageFilter.GaussianBlur(8)).point(lambda v:int(v*0.35)))
        img.alpha_composite(sh,(x0+6,y0+8)) if x0>=0 and y0>=0 else img.paste(sh,(x0+6,y0+8),sh)
        img.paste(sheet,(x0,y0),sheet)
    bg=np.asarray(img.convert('RGB')).astype(np.float32)
    bg*= (1+noise(30,8)[...,None]*0.03)   # paste wrinkles
    return bg*vign(0.18)

def concrete(r):
    bg=np.array([176,174,172],np.float32)+noise(4,9)[...,None]*14+noise(20,10)[...,None]*8+noise(90,11)[...,None]*5+r.normal(0,12,(H,W,1))
    sp=r.random((H,W)); bg[sp<0.012]*=0.45; bg[sp>0.994]*=1.15
    img=Image.fromarray(np.clip(bg,0,255).astype(np.uint8)); d=ImageDraw.Draw(img)
    for i in range(60):   # scratches
        x=r.uniform(0,W); y=r.uniform(0,H); L=r.uniform(40,300); a=r.uniform(0,np.pi)
        d.line((x,y,x+np.cos(a)*L,y+np.sin(a)*L),fill=(int(r.uniform(90,130)),)*3,width=1)
    bg=np.asarray(img).astype(np.float32)
    return bg*vign(0.3)

def burnt(r):
    bg=np.array([232,222,200],np.float32)+noise(5,12)[...,None]*6+noise(50,13)[...,None]*3+r.normal(0,5,(H,W,1))
    edge=np.minimum.reduce([xx,yy,W-xx,H-yy])+noise(10,14)*35+noise(40,15)*12
    burn=np.clip((80-edge)/30,0,1)            # charred margin
    scorch=np.clip((230-edge)/150,0,1)**1.6    # brown scorch gradient
    bg=bg*(1-scorch[...,None]*0.55)+np.array([120,62,22])*scorch[...,None]*0.55
    bg=bg*(1-burn[...,None])+np.array([16,12,10])*burn[...,None]
    glow=np.exp(-((edge-80)/8)**2)*(noise(30,16)>0.6)   # embers on the burning edge
    bg+=glow[...,None]*np.array([200,70,10])
    return bg

def citytype(r):
    bg=paper(r)
    t=Image.new('L',(W,H),0); d=ImageDraw.Draw(t)
    f=ImageFont.truetype(FONT,1050)
    for i,y in enumerate((-260,560,1380,2200)):
        d.text((-40-(i%2)*420,y),'ABUJA ABUJA',font=f,fill=255)
    tm=np.asarray(t.filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
    tm*=(r.random((H,W))>0.18)                 # worn print
    return bg*(1-tm[...,None]*0.09)

STYLES={'paper':paper,'newsprint':newsprint,'wheatpaste':wheatpaste,'concrete':concrete,'burnt':burnt,'citytype':citytype}
def make(style,seed=1): return STYLES[style](np.random.default_rng(seed))
