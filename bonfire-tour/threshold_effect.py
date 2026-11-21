# Red-flyer gritty threshold effect for any photo.
# usage: python3 threshold_effect.py <input.jpg> <out_prefix> [gamma] [split_y]
#   gamma  : <1 lifts shadows before thresholding (0.62 for dark-faced shots, 1.0 = original look)
#   split_y: rows above use the crisp isnet matte (hair/headwear), below blend in the human-body matte
import sys, numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
inp,pre=sys.argv[1],sys.argv[2]; gamma=float(sys.argv[3]) if len(sys.argv)>3 else 0.62
src=Image.open(inp).convert('RGB'); W,H=src.size
split=int(sys.argv[4]) if len(sys.argv)>4 else int(H*0.47)
rng=np.random.default_rng(1); yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
m_is=np.asarray(remove(src,session=new_session('isnet-general-use'),only_mask=True)).astype(np.float32)/255
m_hu=np.asarray(remove(src,session=new_session('u2net_human_seg'),only_mask=True)).astype(np.float32)/255
al=np.maximum(m_is,m_hu*np.clip((yy-split)/(H*0.12),0,1))
from scipy import ndimage
solid=ndimage.binary_fill_holes(ndimage.binary_closing(al>0.5,iterations=6))      # close gaps (e.g. between chainmail strands)
al=np.maximum(al,solid.astype(np.float32))
al=np.asarray(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
Image.fromarray(np.dstack([np.asarray(src),(al*255).astype(np.uint8)]),'RGBA').save(pre+'_cutout.png')
L=np.asarray(src).astype(np.float32)/255@np.array([.3,.59,.11],np.float32)
b=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(30))).astype(np.float32)/255
L2=np.clip(L+(L-b)*2.0,0,1)
g=rng.random((H,W)); coarse=np.asarray(Image.fromarray((rng.random((H//4,W//4))*255).astype(np.uint8)).resize((W,H),Image.NEAREST)).astype(np.float32)/255
WHITE=np.array([0.97,0.95,0.93]); BLACK=np.array([0.05,0.04,0.045])
def thresh(Ln): t=(Ln+(g-0.5)*0.35+(coarse-0.5)*0.15>0.52).astype(np.float32); return t[...,None]*WHITE+(1-t[...,None])*BLACK
m=al>0.5; lo,hi=np.percentile(L2[m],[2,98]); col=thresh(np.clip((L2-lo)/(hi-lo),0,1)**gamma)
out=Image.fromarray((np.dstack([col,al])*255).astype(np.uint8),'RGBA'); out.save(pre+'_threshold.png')
red=Image.new('RGBA',(W,H),(213,22,29,255)); red.alpha_composite(out); red.convert('RGB').save(pre+'_threshold_on_red.jpg',quality=93)
lo2,hi2=np.percentile(L2,[2,98]); Image.fromarray((thresh(np.clip((L2-lo2)/(hi2-lo2),0,1)**gamma)*255).astype(np.uint8)).save(pre+'_threshold_fullframe.jpg',quality=93)
print('done',W,H)
