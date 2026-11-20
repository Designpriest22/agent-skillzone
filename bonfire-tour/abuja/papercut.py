# Abuja stage 2b: bold B&W photocopy portrait, brutal torn paper cuts
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageOps
from scipy import ndimage
rng=np.random.default_rng(21)
W,H=2160,2700
_y,_x=np.mgrid[0:H,0:W].astype(np.float32)
# plain charcoal black (not pure black) + soft red glow behind the head + film grain
base=np.array([28,26,27],np.float32)
r=np.hypot((_x-W/2)/(W*0.55),(_y-1150)/(H*0.42))
glow=np.exp(-r**2*1.6)
bga=base+glow[...,None]*np.array([150,14,18])*0.9
bga*=np.clip(1.08-0.35*np.hypot((_x-W/2)/W,(_y-H/2)/H)**2*2,0.6,1)[...,None]   # gentle vignette
bga+=rng.normal(0,11,(H,W,1))                                                   # heavy film grain
bg=Image.fromarray(np.clip(bga,0,255).astype(np.uint8)).convert('RGBA')
cut=Image.open('../victony_cutout.png').convert('RGBA')
SC=1.95; TOP=520; HEADTOP=463
cut=cut.resize((int(cut.width*SC),int(cut.height*SC)),Image.LANCZOS)
ox=(W-cut.width)//2; oy=int(TOP-HEADTOP*SC)
layer=Image.new('RGBA',(W,H),(0,0,0,0)); layer.paste(cut,(ox,oy),cut)
a=np.asarray(layer).astype(np.float32)/255; al=a[...,3]; rgb=a[...,:3]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)

# ---------- B&W photocopy / grit treatment
L=rgb@np.array([.3,.59,.11],np.float32)
Li=Image.fromarray((L*255).astype(np.uint8))
blur=np.asarray(Li.filter(ImageFilter.GaussianBlur(50))).astype(np.float32)/255
L=np.clip(L+(L-blur)*1.8,0,1)
m=al>0.5; lo,hi=np.percentile(L[m],[3,99]); L=np.clip((L-lo)/(hi-lo),0,1)
L=L**0.8
grit=rng.random((H,W)).astype(np.float32)
coarse=np.asarray(Image.fromarray((rng.random((H//3,W//3))*255).astype(np.uint8)).resize((W,H),Image.NEAREST)).astype(np.float32)/255
thr=(L+(grit-0.5)*0.45+(coarse-0.5)*0.2>0.5).astype(np.float32)   # stippled threshold
bw=0.62*thr+0.38*np.clip((L-0.5)*1.6+0.5,0,1)                       # keep some midtone
bw=np.clip(bw,0,1)
# paper tone: whites slightly warm off-white, blacks ink
ink=np.array([14,13,13]); paper=np.array([238,233,224])
col=ink+(paper-ink)*bw[...,None]

# fade lower body into dark
fade=np.clip(1-(yy-2150)/450,0,1)**1.3
alpha=al*fade

# ---------- torn paper cuts: jagged cut lines -> separate pieces
cutmask=Image.new('L',(W,H),0); d=ImageDraw.Draw(cutmask)
def jag(p0,p1,width):
    n=60; pts=[]
    for i in range(n+1):
        t=i/n; x=p0[0]+(p1[0]-p0[0])*t; y=p0[1]+(p1[1]-p0[1])*t
        nx,ny=-(p1[1]-p0[1]),(p1[0]-p0[0]); ln=np.hypot(nx,ny); nx/=ln; ny/=ln
        j=rng.normal(0,5)
        pts.append((x+nx*j,y+ny*j))
    for i in range(n):
        d.line([pts[i],pts[i+1]],fill=255,width=int(width*rng.uniform(0.6,1.4)))
# vertical cuts (slightly tilted) and horizontal cuts — grid like tiles
for x0,x1 in [(640,620),(1110,1135),(1560,1540)]:
    jag((x0,300),(x1,2800),26)
for y0,y1 in [(905,890),(1225,1240),(1640,1625),(2050,2065)]:
    jag((0,y0),(W,y1),26)
cm=np.asarray(cutmask.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255
pieces=(alpha>0.02)&(cm<0.5)
lab,n=ndimage.label(pieces)
out=np.zeros((H,W,4),np.float32)
shadow=np.zeros((H,W),np.float32)
for k in range(1,n+1):
    msk=lab==k
    if msk.sum()<4000: continue
    dx,dy=int(rng.normal(0,26)),int(rng.normal(0,18))
    # some tiles get a slightly different exposure (re-photocopied paper)
    gain=rng.uniform(0.78,1.15)
    tile=np.dstack([np.clip(col*gain,0,255),alpha*msk*255])
    tile=np.roll(np.roll(tile,dy,0),dx,1)
    mk=tile[...,3]>0
    out[mk]=tile[mk]
    shadow=np.maximum(shadow,np.roll(np.roll(tile[...,3],dy+10,0),dx+8,1)/255)
outI=Image.fromarray(out.astype(np.uint8),'RGBA')
sh=Image.fromarray((shadow*200).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
shI=Image.new('RGBA',(W,H),(0,0,0,0)); shI.putalpha(sh)


# ---------- glow behind figure (keeps the bonfire link)
hl=Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(70)).point(lambda v:int(v*0.6))
halo=Image.new('RGBA',(W,H),(225,20,26,0)); halo.putalpha(hl)

canvas=bg.copy()
canvas.alpha_composite(halo); canvas.alpha_composite(shI); canvas.alpha_composite(outI)

# ---------- paper-cut sticker: the eyes, pulled out with a torn white border
def torn_rect(w,h,pad,amp):
    m=Image.new('L',(w+2*pad,h+2*pad),0); dd=ImageDraw.Draw(m); pts=[]
    for x in np.linspace(0,w,40): pts.append((pad+x,pad+rng.normal(0,amp)))
    for y in np.linspace(0,h,12): pts.append((pad+w+rng.normal(0,amp),pad+y))
    for x in np.linspace(w,0,40): pts.append((pad+x,pad+h+rng.normal(0,amp)))
    for y in np.linspace(h,0,12): pts.append((pad+rng.normal(0,amp),pad+y))
    dd.polygon(pts,fill=255); return m
full=Image.fromarray(np.dstack([col,np.full((H,W),255)]).astype(np.uint8),'RGBA')
def sticker(box,scale,rot,nudge):
    x0,y0,x1,y1=[int(v) for v in (ox+box[0]*SC,oy+box[1]*SC,ox+box[2]*SC,oy+box[3]*SC)]
    im=full.crop((x0,y0,x1,y1)); im=im.resize((int(im.width*scale),int(im.height*scale)),Image.LANCZOS)
    ew,eh=im.size; P=40
    border=torn_rect(ew+44,eh+44,P,6); inner=torn_rect(ew,eh,P+22,3)
    st=Image.new('RGBA',border.size,(0,0,0,0)); st.paste(Image.new('RGBA',border.size,(244,240,232,255)),(0,0),border)
    l=Image.new('RGBA',border.size,(0,0,0,0)); l.paste(im,(P+22,P+22))
    l.putalpha(Image.fromarray(np.minimum(np.asarray(inner),np.asarray(l.split()[3])))); st.alpha_composite(l)
    st=st.rotate(rot,resample=Image.BICUBIC,expand=True)
    sh_=Image.new('RGBA',st.size,(0,0,0,0)); sh_.putalpha(st.split()[3].filter(ImageFilter.GaussianBlur(14)).point(lambda v:int(v*0.75)))
    cx=(x0+x1)//2-st.width//2+nudge[0]; cy=(y0+y1)//2-st.height//2+nudge[1]
    canvas.alpha_composite(sh_,(cx+14,cy+18)); canvas.alpha_composite(st,(cx,cy))
sticker((330,840,960,1040),1.12,-3,(10,-6))      # eyes
sticker((440,1130,790,1300),1.30,4,(-20,10))     # mouth

# ---------- unify grain
arr=np.asarray(canvas.convert('RGB')).astype(np.float32)+rng.normal(0,6,(H,W,1))
Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).save('abuja_stage2.png')
Image.open('abuja_stage2.png').resize((540,675)).save('/tmp/claude-0/-home-user-agent-skillzone/d0ba4cc2-415a-503a-8bdc-a3ac578a1168/scratchpad/s2b.jpg')
