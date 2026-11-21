import sys, json, glob
sys.path.insert(0, sys.argv[1])
import cv2
c = cv2.CascadeClassifier(sys.argv[2])
out = {}
fs = sorted(glob.glob(sys.argv[3] + '/*.jpg'))
for k, f in enumerate(fs):
    if k % 2: continue
    g = cv2.equalizeHist(cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY))
    r = c.detectMultiScale(g, 1.1, 6, minSize=(46, 46))
    out[k] = [list(map(int, b)) for b in r]
json.dump(out, open(sys.argv[4], 'w'))
print(cv2.__version__, len(out), sum(len(v) > 0 for v in out.values()))
