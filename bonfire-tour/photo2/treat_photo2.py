# Same gritty threshold effect as the red flyer (concepts/treat.py "t1"), applied to photo 2
import numpy as np
from PIL import Image, ImageFilter
rng=np.random.default_rng(1)
src=Image.open('victony_photo2_original.jpg').convert('RGB')
W,H=src.size; yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
m_isnet=np.asarray(Image.open('victony_photo2_cutout.png'))[...,3].astype(np.float32)/255
m_human=np.asarray(Image.open('/tmp/claude-0/-home-user-agent-skillzone/d0ba4cc2-415a-503a-8bdc-a3ac578a1168/scratchpad/m.png')).astype(np.float32)/255
# hair/head from isnet (crisp), body from the human model, blended across the shoulders
t=np.clip((yy-950)/250,0,1)
al=np.maximum(m_isnet,m_human*t)
al=np.asarray(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
rgb=np.asarray(src).astype(np.float32)/255; L=rgb@np.array([.3,.59,.11],np.float32)
b=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(30))).astype(np.float32)/255
L2=np.clip(L+(L-b)*2.0,0,1); m=al>0.5; lo,hi=np.percentile(L2[m],[2,98]); Ln=np.clip((L2-lo)/(hi-lo),0,1)**0.62   # lift the shadowed face
g=rng.random((H,W)); coarse=np.asarray(Image.fromarray((rng.random((H//4,W//4))*255).astype(np.uint8)).resize((W,H),Image.NEAREST)).astype(np.float32)/255
th=(Ln+(g-0.5)*0.35+(coarse-0.5)*0.15>0.52).astype(np.float32)
WHITE=np.array([0.97,0.95,0.93]); BLACK=np.array([0.05,0.04,0.045])
col=th[...,None]*WHITE+(1-th[...,None])*BLACK
out=Image.fromarray((np.dstack([col,al])*255).astype(np.uint8),'RGBA'); out.save('victony_photo2_threshold.png')
# previews: on the flyer red, and full-frame (background thresholded too)
red=Image.new('RGBA',(W,H),(213,22,29,255)); red.alpha_composite(out); red.convert('RGB').save('victony_photo2_threshold_on_red.jpg',quality=93)
lo2,hi2=np.percentile(L2,[2,98]); Lf=np.clip((L2-lo2)/(hi2-lo2),0,1)**0.62
thf=(Lf+(g-0.5)*0.35+(coarse-0.5)*0.15>0.52).astype(np.float32)
Image.fromarray(((thf[...,None]*WHITE+(1-thf[...,None])*BLACK)*255).astype(np.uint8)).save('victony_photo2_threshold_fullframe.jpg',quality=93)
