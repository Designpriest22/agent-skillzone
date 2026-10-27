"""Quick review sheet: python3 tools/sheet.py out.png width pattern..."""
import sys, glob
from PIL import Image
out, W = sys.argv[1], int(sys.argv[2])
fs = []
for pat in sys.argv[3:]:
    fs += sorted(glob.glob(pat))
ims = [Image.open(f).convert('RGB') for f in fs]
# simple row packing by height 380
rowh, gap = int(sys.argv[2]) // 4, 10
rows, cur, cw = [], [], 0
for im in ims:
    w = int(im.width * rowh / im.height)
    if w > W:
        w = W
    if cur and cw + w > W:
        rows.append(cur); cur, cw = [], 0
    cur.append((im, w)); cw += w + gap
rows.append(cur)
H = len(rows) * (rowh + gap)
sheet = Image.new('RGB', (W, H), (70, 70, 70))
y = 0
for r in rows:
    x = 0
    for im, w in r:
        h = int(im.height * w / im.width)
        sheet.paste(im.resize((w, h)), (x, y)); x += w + gap
    y += rowh + gap
sheet.save(out)
print(len(ims), sheet.size)
