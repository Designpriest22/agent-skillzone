"""Footage preparation for the cinematic ads.

    python3 prep.py /path/to/IMG_1189.MP4

1. Real-time frames: denoise -> 2x Lanczos upscale (1440x1440) -> gentle sharpen, graded neutral.
2. 50 fps motion-interpolated frames (for speed ramps / slow motion), same finishing.
3. Luma matte for the smoke walk-on shot (dark silhouette against bright haze) so type can sit behind Wizkid.
4. Point track of Wizkid's upper body through the car walk-out shot, for tracked typography.
Outputs: footage/rt/%04d.jpg, footage/slo/%04d.jpg, footage/matte/%04d.png, footage/track.json, footage/meta.json
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
SRC = Path(sys.argv[1])
F = ROOT / 'footage'
for d in ('rt', 'slo', 'matte'):
    (F / d).mkdir(parents=True, exist_ok=True)

FINISH = ("hqdn3d=2.2:1.6:3:3,scale=1440:1440:flags=lanczos,"
          "unsharp=5:5:0.55:5:5:0.0,"
          "eq=contrast=1.04:saturation=1.03")

def ff(*a):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *a], check=True)

ff('-i', str(SRC), '-vf', FINISH, '-q:v', '2', '-start_number', '0', str(F / 'rt/%04d.jpg'))
ff('-i', str(SRC), '-vf', "minterpolate=fps=50:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff:scd_threshold=8," + FINISH,
   '-q:v', '2', '-start_number', '0', str(F / 'slo/%04d.jpg'))

n_rt = len(list((F / 'rt').glob('*.jpg')))
n_slo = len(list((F / 'slo').glob('*.jpg')))

# shots (source frame ranges @25fps, from frame-difference cut detection)
SHOTS = {
    'stage':   [0, 60],    # arms out, pyro, crowd
    'aerial':  [61, 106],  # drone over the festival site
    'arrival': [107, 142], # SUV headlights, security
    'walk':    [143, 197], # steps out, chains, white vest
    'profile': [198, 242], # golden-hour close profile
    'shadow':  [243, 270], # backstage silhouette
    'smoke':   [271, n_rt - 1],  # walk-on through haze
}

# --- luma matte for the smoke shot (alpha = Wizkid, transparent = haze) ---
# the camera holds him at ~x=0.73; the matte is limited to a soft window around his silhouette so the
# unlit right side of frame is not mistaken for him.
yy, xx = np.mgrid[0:720, 0:720] / 720.0
sstep = lambda e0, e1, v: np.clip((v - e0) / (e1 - e0), 0, 1)
window = sstep(0.58, 0.63, xx) * (1 - sstep(0.80, 0.84, xx)) * sstep(0.40, 0.45, yy)
for i in range(SHOTS['smoke'][0], SHOTS['smoke'][1] + 1):
    im = np.asarray(Image.open(F / f'rt/{i:04d}.jpg').convert('L').resize((720, 720), Image.BILINEAR)).astype(float) / 255
    m = np.clip((0.22 - im) / 0.12, 0, 1) * window
    a = Image.fromarray((m * 255).astype(np.uint8)).resize((1440, 1440), Image.BILINEAR)
    o = Image.new("LA", a.size, 255); o.putalpha(a); o.save(F / f"matte/{i:04d}.png")

# --- point track (normalised cross-correlation of a chest/head patch through the walk shot) ---
def gray(i, s=360):
    return np.asarray(Image.open(F / f'rt/{i:04d}.jpg').convert('L').resize((s, s), Image.BILINEAR)).astype(float)

def track(a, b, start_xy, ps=34, sr=26):
    pts = []; x, y = start_xy
    tpl = gray(a)[y - ps:y + ps, x - ps:x + ps]
    for i in range(a, b + 1):
        g = gray(i); best = (-2, x, y)
        t = (tpl - tpl.mean()) / (tpl.std() + 1e-6)
        for dy in range(-sr, sr + 1, 2):
            for dx in range(-sr, sr + 1, 2):
                cx, cy = x + dx, y + dy
                if cx - ps < 0 or cy - ps < 0 or cx + ps > 360 or cy + ps > 360: continue
                p = g[cy - ps:cy + ps, cx - ps:cx + ps]
                s = ((p - p.mean()) / (p.std() + 1e-6) * t).mean()
                if s > best[0]: best = (s, cx, cy)
        _, x, y = best
        tpl = 0.85 * tpl + 0.15 * g[y - ps:y + ps, x - ps:x + ps]  # slow template update
        pts.append([i, x / 360, y / 360])
    return pts

walk_track = track(SHOTS['walk'][0], SHOTS['walk'][1], (int(sys.argv[2]) if len(sys.argv) > 2 else 145, int(sys.argv[3]) if len(sys.argv) > 3 else 150))
(F / 'track.json').write_text(json.dumps({'walk': walk_track}))
(F / 'meta.json').write_text(json.dumps({'srcFps': 25, 'sloFps': 50, 'nRt': n_rt, 'nSlo': n_slo, 'size': 1440, 'shots': SHOTS}, indent=1))
print('rt', n_rt, 'slo', n_slo)
