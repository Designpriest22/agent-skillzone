# applies repo-relative paths to tools/render.py (scratch build used absolute upload paths)
import re,sys
p=sys.argv[1]; s=open(p).read()
s=s.replace("FD = D + '/../fonts/'","FD = A + 'fonts/'")
s=s.replace("TITLE = np.array(Image.open(U + 'dbf355d5-image.png'))","TITLE = np.array(Image.open(A + 'title-chrome.png'))")
s=s.replace("U = '/root/.claude/uploads/ea6f5710-c3d5-54c2-aaef-1dd27bc60283/'\n","")
s=s.replace("f'{D}/fr/{i + 1:05d}.jpg'","f'{D}/../fr/{i + 1:05d}.jpg'")
s=s.replace("f'{D}/prev/","f'{D}/../out/prev_")
open(p,'w').write(s)
