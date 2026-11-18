# python3 tools_sheet.py out.jpg img1 img2 ... -> 2-column contact sheet (dev aid)
import sys
from PIL import Image
o, fs = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in fs]; w = 960; ims = [i.resize((w, int(i.height * w / i.width))) for i in ims]
cols = 2; rows = (len(ims) + 1) // 2; h = max(i.height for i in ims)
s = Image.new('RGB', (w * cols + 10, (h + 10) * rows), (60, 60, 60))
for k, i in enumerate(ims): s.paste(i, ((k % cols) * (w + 10), (k // cols) * (h + 10)))
s.save(o, quality=85)
