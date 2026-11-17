#!/usr/bin/env python3
"""RISE OF THE MACHINE — ODUMODUBLVCK promo renderer.
usage: render.py W H out.mp4|stills [t1,t2,...]
"""
import sys, os, math, random, subprocess
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

cv2.setNumThreads(1)
D = os.path.dirname(os.path.abspath(__file__))
A = D + '/../assets/'
FD = A + 'fonts/'
FONTS = {
    'anton': FD + 'Anton.ttf',
    'archivo': FD + 'ArchivoBlack.ttf',
    'mono': '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf',
}
FPS = 30
DUR = 40.0
N = int(DUR * FPS)
SRC_FPS = 5969 / 200
NSRC = 1298
OFF = 3.0  # ad t=0 == source audio 3.0s

W, H = int(sys.argv[1]), int(sys.argv[2])
OUT = sys.argv[3]
asp = W / H
LAY = 'tall' if asp < 0.7 else 'mid' if asp < 0.9 else 'sq' if asp < 1.2 else 'wide'
M = min(W, H)
u = M / 1080.0
RED = np.array([227, 0, 15], np.uint8)
BLK = np.array([10, 9, 9], np.uint8)
WHT = np.array([242, 239, 234], np.uint8)

KICKS = [k - OFF for k in [10.995, 11.877, 12.156, 12.597, 13.015, 13.619, 13.897, 15.662, 15.94, 16.219,
        17.252, 17.67, 18.541, 19.133, 19.598, 20.317, 20.596, 20.886, 21.92, 22.338, 22.941, 23.22,
        25.263, 25.542, 26.575, 26.993, 27.597, 27.864, 28.166, 28.456, 28.909, 29.617, 31.66, 32.543,
        34.307, 34.586, 34.865, 36.316, 37.779, 38.232, 39.242, 39.52, 40.972, 41.866]]
EXTRA_HITS = [3.6, 4.2, 4.8, 8.877, 17.317, 20.22, 33.316, 34.779, 35.232, 36.242]

# ---------------------------------------------------------------- helpers
def R(seed):
    return random.Random(seed)

_fc = {}
def src_frame(sec):
    i = int(round(sec * SRC_FPS))
    i = max(0, min(NSRC - 1, i))
    if i in _fc:
        return _fc[i]
    im = cv2.imread(f'{D}/../fr/{i + 1:05d}.jpg')[:, :, ::-1].copy()
    if len(_fc) > 80:
        _fc.pop(next(iter(_fc)))
    _fc[i] = im
    return im

def affine_cover(sw, sh, w, h, zoom=1.0, fx=0.5, fy=0.45, dx=0.0, dy=0.0, rot=0.0):
    ta = w / h
    if sw / sh > ta:
        ch = sh; cw = sh * ta
    else:
        cw = sw; ch = sw / ta
    cw /= zoom; ch /= zoom
    cx = fx * sw + dx * cw
    cy = fy * sh + dy * ch
    cx = min(max(cx, cw / 2), sw - cw / 2)
    cy = min(max(cy, ch / 2), sh - ch / 2)
    s = w / cw
    Mx = np.array([[s, 0, -(cx - cw / 2) * s], [0, s, -(cy - ch / 2) * s], [0, 0, 1]], np.float64)
    if rot:
        Rm = np.vstack([cv2.getRotationMatrix2D((w / 2, h / 2), rot, 1.0), [0, 0, 1]])
        Mx = Rm @ Mx
    return Mx[:2].astype(np.float32)

def cover(img, w, h, **kw):
    Mx = affine_cover(img.shape[1], img.shape[0], w, h, **kw)
    return cv2.warpAffine(img, Mx, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def lut(fn):
    x = np.arange(256) / 255.0
    return (np.clip(fn(x), 0, 1) * 255).astype(np.uint8)

def scurve(x, k=0.85):
    s = x * x * (3 - 2 * x)
    return x + (s - x) * k

LUT_GRADE = np.dstack([
    lut(lambda x: (scurve(x) * 1.06 - 0.03) / 0.97),
    lut(lambda x: (scurve(x) * 0.95 - 0.035) / 0.97),
    lut(lambda x: (scurve(x) ** 1.08 * 0.9 - 0.035) / 0.97),
]).reshape(1, 256, 3)

def grad_lut(stops):
    x = np.arange(256) / 255.0
    out = np.zeros((256, 3))
    ps = [s[0] for s in stops]
    for c in range(3):
        out[:, c] = np.interp(x, ps, [s[1][c] for s in stops])
    return out.astype(np.uint8)

LUT_DUO = grad_lut([(0, (6, 0, 2)), (0.45, (150, 0, 12)), (0.7, (235, 20, 25)), (1, (255, 236, 226))])
LUT_BW = grad_lut([(0, (5, 5, 5)), (0.2, (12, 12, 12)), (0.8, (238, 236, 232)), (1, (255, 255, 255))])

rng0 = np.random.default_rng(7)
GRAIN = [rng0.normal(0, 1, (H, W)).astype(np.float32) for _ in range(6)]

def treat(img, kind, f=0):
    if kind == 'grade':
        return cv2.LUT(img, LUT_GRADE)
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    if kind == 'duo':
        return LUT_DUO[g]
    if kind == 'bw':
        return LUT_BW[g]
    if kind == 'copy':
        h, w = g.shape
        n = GRAIN[f % 6][:h, :w] if (h <= H and w <= W) else 0
        v = g.astype(np.float32) / 255 + n * 0.07
        out = np.empty((h, w, 3), np.uint8)
        out[:] = WHT
        out[v < 0.62] = RED
        out[v < 0.33] = BLK
        return out
    if kind == 'dark':
        return (cv2.LUT(img, LUT_GRADE) * 0.45).astype(np.uint8)
    return img

def blit(cv, rgba, x, y, op=1.0):
    h, w = rgba.shape[:2]
    x = int(round(x)); y = int(round(y))
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(cv.shape[1], x + w), min(cv.shape[0], y + h)
    if x1 <= x0 or y1 <= y0:
        return
    sub = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
    reg = cv[y0:y1, x0:x1]
    if sub.shape[2] == 3:
        if op >= 1:
            reg[:] = sub
        else:
            reg[:] = (reg * (1 - op) + sub * op).astype(np.uint8)
        return
    a = sub[:, :, 3:4].astype(np.float32) * (op / 255.0)
    reg[:] = (reg * (1 - a) + sub[:, :, :3] * a).astype(np.uint8)

def blitc(cv, rgba, cx, cy, op=1.0):
    blit(cv, rgba, cx - rgba.shape[1] / 2, cy - rgba.shape[0] / 2, op)

def rscale(rgba, s):
    if abs(s - 1) < 1e-3:
        return rgba
    h, w = rgba.shape[:2]
    return cv2.resize(rgba, (max(1, int(w * s)), max(1, int(h * s))), interpolation=cv2.INTER_LINEAR if s > 1 else cv2.INTER_AREA)

# ---------------------------------------------------------------- typography
_tc = {}
def glyph_mask(txt, font, px, track=0.0):
    key = (txt, font, px, track)
    if key in _tc:
        return _tc[key]
    f = ImageFont.truetype(FONTS[font], px)
    pad = px
    if track == 0:
        bb = f.getbbox(txt)
        im = Image.new('L', (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), 0)
        ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=f, fill=255)
    else:
        ws = [f.getlength(c) for c in txt]
        tw = int(sum(ws) + track * px * (len(txt) - 1)) + 2 * pad
        im = Image.new('L', (tw, int(px * 1.6) + 2 * pad), 0)
        dr = ImageDraw.Draw(im); x = pad
        for c, w_ in zip(txt, ws):
            dr.text((x, pad), c, font=f, fill=255)
            x += w_ + track * px
    a = np.array(im)
    ys, xs = np.where(a > 0)
    if len(ys) == 0:
        a = np.zeros((2, 2), np.uint8)
    else:
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    _tc[key] = a
    return a

def fit_px(txt, font, tw, th=None, track=0.0):
    m = glyph_mask(txt, font, 200, track)
    px = 200 * tw / m.shape[1]
    if th:
        px = min(px, 200 * th / m.shape[0])
    return max(6, int(px))

def colorize(mask, col):
    out = np.zeros(mask.shape + (4,), np.uint8)
    out[:, :, :3] = col
    out[:, :, 3] = mask
    return out

def boxed(mask, fg, bg, padx, pady):
    h, w = mask.shape
    out = np.zeros((h + 2 * pady, w + 2 * padx, 4), np.uint8)
    out[:, :, :3] = bg
    out[:, :, 3] = 255
    reg = out[pady:pady + h, padx:padx + w, :3]
    a = mask[:, :, None].astype(np.float32) / 255
    reg[:] = (reg * (1 - a) + np.array(fg) * a).astype(np.uint8)
    return out

def shadowed(mask, fg, sh, off):
    h, w = mask.shape
    out = np.zeros((h + off, w + off, 4), np.uint8)
    a = np.zeros((h + off, w + off), np.uint8)
    a[off:, off:] = mask
    out[:, :, :3] = sh
    out[:, :, 3] = a
    m2 = np.zeros_like(a); m2[:h, :w] = mask
    af = m2[:, :, None].astype(np.float32) / 255
    out[:, :, :3] = (out[:, :, :3] * (1 - af) + np.array(fg) * af).astype(np.uint8)
    out[:, :, 3] = np.maximum(a, m2)
    return out

def outline(mask, col, th):
    k = np.ones((2 * th + 1, 2 * th + 1), np.uint8)
    m = np.pad(mask, th + 1)
    edge = cv2.subtract(cv2.dilate(m, k), cv2.erode(m, np.ones((3, 3), np.uint8), iterations=max(1, th // 2)))
    return colorize(edge, col)

_sc = {}
def styled(lines, style, tw, th):
    key = (tuple(lines), style, tw, th)
    if key in _sc:
        return _sc[key]
    font = 'anton'
    imgs = []
    for ln in lines:
        px = fit_px(ln, font, tw, th)
        m = glyph_mask(ln, font, px)
        if style == 'block':
            im = boxed(m, WHT, BLK, int(px * 0.12), int(px * 0.09))
        elif style == 'red':
            im = boxed(m, WHT, RED, int(px * 0.12), int(px * 0.09))
        elif style == 'out':
            im = outline(m, WHT, max(2, int(px * 0.022)))
        elif style == 'redtxt':
            im = shadowed(m, RED, BLK, max(3, int(px * 0.035)))
        else:  # huge
            im = shadowed(m, WHT, BLK, max(3, int(px * 0.035)))
        imgs.append(im)
    gap = 0 if style in ('block', 'red') else int(tw * 0.02)
    ow = max(i.shape[1] for i in imgs)
    oh = sum(i.shape[0] for i in imgs) + gap * (len(imgs) - 1)
    out = np.zeros((oh, ow, 4), np.uint8)
    y = 0
    for i in imgs:
        x = (ow - i.shape[1]) // 2
        out[y:y + i.shape[0], x:x + i.shape[1]] = i
        y += i.shape[0] + gap
    _sc[key] = out
    return out

def mono(txt, px, fg=WHT, bg=None, track=0.08):
    key = ('mono', txt, px, tuple(fg), None if bg is None else tuple(bg))
    if key in _sc:
        return _sc[key]
    m = glyph_mask(txt, 'mono', px, track)
    im = boxed(m, fg, bg, int(px * 0.5), int(px * 0.35)) if bg is not None else colorize(m, fg)
    _sc[key] = im
    return im

def archivo(txt, tw, col=WHT, th=None, track=0.02):
    key = ('arch', txt, tw, tuple(col), th)
    if key in _sc:
        return _sc[key]
    px = fit_px(txt, 'archivo', tw, th, track)
    im = colorize(glyph_mask(txt, 'archivo', px, track), col)
    _sc[key] = im
    return im

def star_mask(px):
    im = Image.new('L', (px, px), 0)
    c = px / 2; pts = []
    for k in range(10):
        r = c * (1 if k % 2 == 0 else 0.42)
        a = -math.pi / 2 + k * math.pi / 5
        pts.append((c + r * math.cos(a), c + r * math.sin(a) + px * 0.04))
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.array(im)

def date_img(tw):
    key = ('date', tw)
    if key in _sc:
        return _sc[key]
    px = 200
    a = glyph_mask('DEC. 20TH', 'archivo', px, 0.02); b = glyph_mask('ABUJA', 'archivo', px, 0.02)
    st = star_mask(int(a.shape[0] * 0.95)); gap = int(px * 0.22)
    hh = max(a.shape[0], st.shape[0])
    w_ = a.shape[1] + b.shape[1] + st.shape[1] + 2 * gap
    out = np.zeros((hh, w_, 4), np.uint8)
    def put(m, x, col):
        y = (hh - m.shape[0]) // 2
        reg = out[y:y + m.shape[0], x:x + m.shape[1]]
        reg[:, :, :3] = np.where(m[:, :, None] > 0, np.array(col, np.uint8), reg[:, :, :3])
        reg[:, :, 3] = np.maximum(reg[:, :, 3], m)
    put(a, 0, WHT); put(st, a.shape[1] + gap, RED); put(b, a.shape[1] + st.shape[1] + 2 * gap, WHT)
    out = cv2.resize(out, (tw, int(hh * tw / w_)), interpolation=cv2.INTER_AREA)
    _sc[key] = out
    return out

def slam_scale(t, t0):
    k = int((t - t0) * FPS + 1e-6)
    return [1.32, 1.12, 1.03][k] if k < 3 else 1.0

def boil(t, t0, amp):
    k = int((t - t0) * FPS / 4)
    r = R(int(t0 * 1000) * 31 + k)
    return r.uniform(-amp, amp), r.uniform(-amp, amp)

TXT_W = {'tall': 0.86, 'mid': 0.80, 'sq': 0.76, 'wide': 0.56}[LAY]
TXT_H = {'tall': 0.17, 'mid': 0.20, 'sq': 0.24, 'wide': 0.30}[LAY]
TXT_Y = {'tall': 0.43, 'mid': 0.46, 'sq': 0.5, 'wide': 0.5}[LAY]

def draw_words(cv, t, t0, lines, style, y=None, wmul=1.0):
    im = styled(lines, style, int(W * TXT_W * wmul), int(H * TXT_H))
    im = rscale(im, slam_scale(t, t0))
    bx, by = boil(t, t0, 3 * u)
    blitc(cv, im, W / 2 + bx, H * (y or TXT_Y) + by)

# ---------------------------------------------------------------- art assets
HEAD = np.array(Image.open(A + 'head.png'))  # RGBA 1640x1500
EYE = (678, 696)
TITLE = np.array(Image.open(A + 'title-chrome.png'))
KAL = np.array(Image.open(A + 'kal.png'))
SP = np.array(Image.open(A + 'spons.jpg'))
_sp_a = np.ones(SP.shape[:2], np.float32)
fe = int(SP.shape[1] * 0.04)
ramp = np.linspace(0, 1, fe)
_sp_a[:, :fe] *= ramp; _sp_a[:, -fe:] *= ramp[::-1]
fe2 = int(SP.shape[0] * 0.12)
r2 = np.linspace(0, 1, fe2)
_sp_a[:fe2] *= r2[:, None]; _sp_a[-fe2:] *= r2[::-1, None]
SPONS = np.dstack([SP, (_sp_a * 255).astype(np.uint8)])

_ac = {}
def asset_w(name, arr, w):
    key = (name, int(w))
    if key not in _ac:
        s = w / arr.shape[1]
        _ac[key] = cv2.resize(arr, (int(w), max(1, int(arr.shape[0] * s))), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    return _ac[key]

def place_head(cv, cx, cy, w, rot=0.0, op=1.0):
    im = asset_w('head', HEAD, w)
    if rot:
        h_, w_ = im.shape[:2]
        Mr = cv2.getRotationMatrix2D((w_ / 2, h_ / 2), rot, 1.0)
        im = cv2.warpAffine(im, Mr, (w_, h_), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    blitc(cv, im, cx, cy, op)
    s = w / HEAD.shape[1]
    return cx + (EYE[0] - HEAD.shape[1] / 2) * s, cy + (EYE[1] - HEAD.shape[0] / 2) * s

def glow(cv, x, y, r, inten, col=(255, 20, 20)):
    r = int(max(2, r))
    x0, y0 = int(x - r), int(y - r)
    yy, xx = np.mgrid[-r:r, -r:r].astype(np.float32)
    g = np.exp(-(xx * xx + yy * yy) / (2 * (r / 3) ** 2)) * inten
    x1, y1 = x0 + 2 * r, y0 + 2 * r
    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if cx1 <= cx0 or cy1 <= cy0:
        return
    gg = g[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0, None]
    reg = cv[cy0:cy1, cx0:cx1].astype(np.float32)
    cv[cy0:cy1, cx0:cx1] = np.clip(reg + gg * np.array(col, np.float32), 0, 255).astype(np.uint8)

# textured red/black backgrounds (3 boil variants = stop-motion texture)
def make_tex(seed):
    r = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * 0.45) / H) ** 2)
    base = np.clip(1 - d * 1.5, 0, 1)[:, :, None]
    lo = np.array([14, 2, 3], np.float32); hi = np.array([120, 8, 14], np.float32)
    img = lo + (hi - lo) * base
    n = r.random((H // 2 + 1, W // 2 + 1)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_NEAREST)
    img = img * (0.55 + 0.9 * n[:, :, None])
    return np.clip(img, 0, 255).astype(np.uint8)
TEX = [make_tex(s) for s in (1, 2, 3)]
def tex(t):
    return TEX[int(t * FPS / 3) % 3].copy()

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - 0.38 * np.clip((((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) - 0.25, 0, 1.2))[:, :, None].astype(np.float32)
del yy, xx

# ---------------------------------------------------------------- shot list
# (t0, src_sec, speed, treat, layout, step)
SH = [
    (0.000, 'KAL'), (1.100, 'EYE'), (2.400, 'KNOCK'),
    (3.000, 0.62, 1.0, 'grade', 'tri', 1),
    (3.600, 11.40, 0.8, 'copy', 'tri', 2),
    (4.200, 14.62, 1.0, 'grade', 'tri', 1),
    (4.800, 33.35, 0.8, 'duo', 'tri', 3),
    (5.700, 'COLLAGE'), (7.800, 'FLICKER'), (8.877, 'NAME'),
    (9.597, 11.03, 0.8, 'grade', 'tri', 1),
    (10.015, 14.60, 1.0, 'grade', 'tri', 1),
    (10.619, 4.13, 0.6, 'grade', 'full', 2),
    (10.897, 16.09, 1.0, 'grade', 'tri', 1),
    (11.800, 15.39, 0.8, 'grade', 'tri', 1),
    (12.662, 22.97, 1.0, 'copy', 'tri', 2),
    (12.940, 11.38, 1.0, 'grade', 'tri', 1),
    (13.219, 23.88, 1.0, 'grade', 'full', 1),
    (14.252, 28.00, 1.0, 'grade', 'tri', 1),
    (14.670, 28.50, 1.0, 'grade', 'tri', 1),
    (15.541, 33.30, 1.0, 'grade', 'tri', 1),
    (16.133, 18.50, 1.0, 'grade', 'tri', 1),
    (16.598, 34.40, 1.0, 'grade', 'full', 1),
    (17.317, 34.85, 0.0, 'copy', 'full', 1),
    (17.596, 10.05, 1.0, 'bw', 'tri', 1),
    (17.886, 1.15, 1.0, 'grade', 'tri', 1),
    (18.920, 12.40, 1.0, 'grade', 'tri', 1),
    (19.338, 13.00, 1.0, 'grade', 'tri', 1),
    (19.941, 'HEADSTOP'), (20.220, 'TITLE'),
    (22.263, 31.55, 1.0, 'grade', 'tri', 1),
    (22.542, 28.90, 1.0, 'grade', 'tri', 1),
    (23.575, 34.50, 1.0, 'grade', 'full', 3),
    (23.993, 14.68, 1.0, 'copy', 'tri', 2),
    (24.597, 11.40, 1.0, 'grade', 'tri', 1),
    (24.864, 23.40, 1.0, 'duo', 'tri', 1),
    (25.166, 4.14, 0.6, 'grade', 'tri', 1),
    (25.456, 16.40, 1.0, 'grade', 'tri', 1),
    (25.909, 33.60, 1.0, 'grade', 'tri', 1),
    (26.617, 'GRID'),
    (28.660, 19.15, 1.0, 'grade', 'tri', 1),
    (29.543, 38.40, 1.0, 'grade', 'tri', 1),
    (30.400, 41.22, 0.75, 'grade', 'tri', 1),
    (31.307, 15.40, 1.0, 'copy', 'tri', 2),
    (31.586, 28.70, 1.0, 'grade', 'tri', 1),
    (31.865, 34.45, 0.7, 'grade', 'full', 1),
    (33.316, 'END'), (DUR, None),
]
VID = [i for i, s in enumerate(SH[:-1]) if not isinstance(s[1], str)]

TEXT = [
    (3.000, 3.600, ['THIS', 'DECEMBER'], 'block'),
    (3.600, 4.200, ['ARE'], 'huge'),
    (4.200, 4.800, ['YOU'], 'huge'),
    (4.800, 5.700, ['READY?'], 'red'),
    (9.597, 10.619, ['OKPU AGU', 'ON.'], 'block'),
    (10.897, 11.800, ['ABUJA'], 'huge'),
    (11.800, 12.662, ['LOUDER'], 'red'),
    (13.219, 14.252, ['20.12'], 'out'),
    (14.670, 15.541, ['SING', 'IT BACK'], 'block'),
    (15.541, 16.598, ['HANDS', 'UP'], 'huge'),
    (16.598, 17.317, ['NO SEATS.'], 'red'),
    (17.317, 17.886, ['ONLY', 'NOISE.'], 'block'),
    (17.886, 18.920, ['THE MACHINE', 'RUNS ON YOU'], 'block'),
    (22.542, 23.575, ['ONE NIGHT'], 'huge'),
    (23.575, 24.597, ['ONE CITY'], 'red'),
    (24.597, 24.864, ['LOUD'], 'huge'),
    (24.864, 25.166, ['LOUDER'], 'huge'),
    (25.166, 25.456, ['LOUDEST'], 'red'),
    (25.456, 26.617, ['ABUJA', 'STAND UP'], 'block'),
    (28.660, 29.543, ['ODUMODU', 'BLVCK'], 'huge'),
    (29.543, 31.307, ['LIVE IN', 'ABUJA'], 'block'),
    (31.865, 33.316, ['DEC.', '20TH'], 'red'),
]

def shot_at(t):
    for i in range(len(SH) - 1):
        if SH[i][0] <= t < SH[i + 1][0]:
            return i
    return len(SH) - 2

def clip_time(i, t, loop=False):
    t0 = SH[i][0]; t1 = SH[i + 1][0]
    src, speed, step = SH[i][1], SH[i][2], SH[i][5]
    lt = t - t0
    if loop:
        lt = lt % (t1 - t0)
    if step > 1:
        lt = math.floor(lt * FPS / step) * step / FPS
    return src + lt * speed, lt

def draw_clip(cv, rect, i, t, treat_override=None, loop=False, zoom=1.0, f=0):
    x, y, w, h = rect
    st, lt = clip_time(i, t, loop)
    s = SH[i]
    dx = dy = rot = 0.0
    if s[5] > 1:  # stop-motion boil
        r = R(i * 977 + int(lt * FPS / s[5]))
        dx, dy, rot = r.uniform(-.015, .015), r.uniform(-.015, .015), r.uniform(-1.2, 1.2)
    img = cover(src_frame(st), w, h, zoom=zoom, dx=dx, dy=dy, rot=rot)
    img = treat(img, treat_override or s[3], f)
    cv[y:y + h, x:x + w] = img

def punch(t, t0):
    k = (t - t0) / 0.22
    return 1.0 + 0.12 * max(0, 1 - k) ** 2

def tri_rects():
    g = int(8 * u)
    pw = (W - 2 * g) // 3
    return [(0, 0, pw, H), (pw + g, 0, pw, H), (2 * (pw + g), 0, W - 2 * (pw + g), H)]

def render_video_shot(cv, i, t, f):
    s = SH[i]
    z = punch(t, s[0])
    if LAY == 'wide' and s[4] == 'tri':
        cv[:] = BLK
        rs = tri_rects()
        vi = VID.index(i)
        pi = VID[vi - 1] if vi > 0 else VID[vi + 1]
        ni = VID[vi + 1] if vi + 1 < len(VID) else VID[vi - 1]
        draw_clip(cv, rs[0], pi, t - SH[i][0] + SH[pi][0] + (SH[pi + 1][0] - SH[pi][0]) * 0.5, 'bw', loop=True, f=f)
        draw_clip(cv, rs[1], i, t, zoom=z, f=f)
        draw_clip(cv, rs[2], ni, t - SH[i][0] + SH[ni][0], 'bw', loop=True, f=f)
        # red index tags on panels
        for k, (rx, ry, rw, rh) in enumerate(rs):
            tag = mono(f'{["L", "C", "R"][k]}/{vi + 1:02d}', int(16 * u), WHT if k != 1 else WHT, RED if k == 1 else BLK)
            blit(cv, tag, rx + 14 * u, rh - tag.shape[0] - 70 * u)
    else:
        draw_clip(cv, (0, 0, W, H), i, t, zoom=z, f=f)

# ---------------------------------------------------------------- custom segments
def seg_KAL(cv, t, f):
    cv[:] = BLK
    on = (0.12 < t < 0.17) or (0.24 < t < 0.27) or t > 0.32
    kw = {'tall': 0.42, 'mid': 0.36, 'sq': 0.32, 'wide': 0.2}[LAY] * W
    if on:
        im = asset_w('kal', KAL, kw)
        blitc(cv, im, W / 2, H * 0.46)
    if t > 0.45:
        txt = 'PRESENTS'[:int((t - 0.45) * 22)]
        if txt:
            im = mono(txt, int(26 * u), WHT, None, 0.6)
            blit(cv, im, W / 2 - mono('PRESENTS', int(26 * u), WHT, None, 0.6).shape[1] / 2, H * 0.46 + kw * 0.42)
    if int(t * 4) % 2 == 0:
        glow(cv, 60 * u, 60 * u, 14 * u, 1.2)
    blit(cv, mono('REC  SYS.BOOT//001', int(16 * u), WHT), 90 * u, 52 * u)

def seg_EYE(cv, t, f):
    cv[:] = BLK
    lt = t - 1.1
    k = math.floor(lt * FPS / 3) * 3 / FPS  # stop-motion steps
    p = min(1, k / 1.2)
    e = 1 - (1 - p) ** 3
    base = 0.9 * min(W / HEAD.shape[1], H / HEAD.shape[0])
    z = 7.0 * (1 - e) + 1.0 * e
    s = base * z
    fx = EYE[0] * (1 - e) + HEAD.shape[1] / 2 * e
    fy = EYE[1] * (1 - e) + HEAD.shape[0] * 0.5 * e
    r = R(int(k * 100))
    jx, jy, rot = r.uniform(-6, 6) * u, r.uniform(-6, 6) * u, r.uniform(-1.5, 1.5)
    Mx = np.array([[s, 0, W / 2 - fx * s + jx], [0, s, H * 0.48 - fy * s + jy]], np.float32)
    Rm = cv2.getRotationMatrix2D((W / 2, H * 0.48), rot, 1.0)
    Mx = (np.vstack([Rm, [0, 0, 1]]) @ np.vstack([Mx, [0, 0, 1]]))[:2].astype(np.float32)
    lay = cv2.warpAffine(HEAD, Mx, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    a = lay[:, :, 3:4].astype(np.float32) / 255
    cv[:] = (cv * (1 - a) + lay[:, :, :3] * a).astype(np.uint8)
    ex = Mx[0, 0] * EYE[0] + Mx[0, 1] * EYE[1] + Mx[0, 2]
    ey = Mx[1, 0] * EYE[0] + Mx[1, 1] * EYE[1] + Mx[1, 2]
    fl = 0.6 + 0.4 * (int(t * FPS) % 4 < 2)
    glow(cv, ex, ey, 60 * u * z ** 0.5, 1.0 * fl)
    # scanlines
    cv[::max(2, int(4 * u))] = (cv[::max(2, int(4 * u))] * 0.6).astype(np.uint8)
    l1 = '> MACHINE DETECTED'[:int(max(0, lt - 0.1) * 30)]
    l2 = '> TARGET: ABUJA_'[:int(max(0, lt - 0.6) * 30)]
    py = H * (0.8 if LAY != 'wide' else 0.82)
    if l1:
        blit(cv, mono(l1, int(28 * u), WHT, RED), W * 0.08, py)
    if l2:
        blit(cv, mono(l2, int(28 * u), WHT, BLK), W * 0.08, py + 58 * u)

def seg_KNOCK(cv, t, f):
    cv[:] = BLK
    lt = t - 2.4
    tw = int(W * {'tall': 0.94, 'mid': 0.92, 'sq': 0.92, 'wide': 0.86}[LAY])
    px = fit_px('ABUJA', 'anton', tw, int(H * 0.8))
    m = glyph_mask('ABUJA', 'anton', px)
    sc = slam_scale(t, 2.4)
    m = rscale(m, sc)
    st = 0.0 + math.floor(lt * FPS / 2) * 2 / FPS
    vid = treat(cover(src_frame(st), W, H, zoom=1.0), 'grade')
    mm = np.zeros((H, W), np.float32)
    x0 = int(W / 2 - m.shape[1] / 2); y0 = int(H / 2 - m.shape[0] / 2)
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(W, x0 + m.shape[1]), min(H, y0 + m.shape[0])
    mm[ya:yb, xa:xb] = m[ya - y0:yb - y0, xa - x0:xb - x0] / 255.0
    cv[:] = (cv * (1 - mm[:, :, None]) + vid * mm[:, :, None]).astype(np.uint8)
    blit(cv, mono('LOCATION_LOCKED', int(18 * u), WHT, RED), W / 2 - 150 * u, y0 + m.shape[0] + 30 * u)

COLL_SRC = [0.45, 11.10, 14.90, 15.70, 28.30, 29.10, 33.70, 23.20, 4.20, 10.30, 34.95, 18.70, 24.40, 15.10]
_coll = {}
def still(k, w, h):
    key = (k, w, h)
    if key in _coll:
        return _coll[key]
    img = cover(src_frame(COLL_SRC[k % len(COLL_SRC)]), w, h)
    img = treat(img, ['grade', 'copy', 'grade', 'bw', 'grade', 'duo'][k % 6], k)
    b = int(14 * u)
    card = np.zeros((h + 2 * b, w + 2 * b, 4), np.uint8)
    card[:, :, :3] = WHT; card[:, :, 3] = 255
    card[b:b + h, b:b + w, :3] = img
    r = R(k * 13)
    ang = r.uniform(-9, 9)
    hh, ww = card.shape[:2]
    Mr = cv2.getRotationMatrix2D((ww / 2, hh / 2), ang, 1.0)
    cos, sin = abs(Mr[0, 0]), abs(Mr[0, 1])
    nw, nh = int(hh * sin + ww * cos), int(hh * cos + ww * sin)
    Mr[0, 2] += nw / 2 - ww / 2; Mr[1, 2] += nh / 2 - hh / 2
    card = cv2.warpAffine(card, Mr, (nw, nh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    _coll[key] = card
    return card

def coll_times():
    ts = []; tt = 5.70; dt = 0.24
    while tt < 7.78:
        ts.append(tt); tt += dt; dt = max(0.1, dt * 0.88)
    return ts
COLL_T = coll_times()

def seg_COLLAGE(cv, t, f):
    cv[:] = tex(t)
    sw = int({'tall': 0.62, 'mid': 0.48, 'sq': 0.4, 'wide': 0.22}[LAY] * W)
    sh = int(sw * 1.3)
    for k, ts in enumerate(COLL_T):
        if ts > t:
            break
        r = R(k * 71 + 5)
        cx = W * r.uniform(0.25, 0.75) if LAY != 'wide' else W * r.uniform(0.14, 0.86); cy = H * r.uniform(0.28, 0.72)
        im = still(k, sw, sh)
        sc = 1.18 if t - ts < 1 / FPS * 1.5 else 1.0
        blitc(cv, rscale(im, sc), cx, cy)
    lines = [(5.95, ['THE CROWD']), (6.55, ['IS THE']), (7.15, ['MACHINE'])]
    vis = [l for (tt, l) in lines if t >= tt]
    if vis:
        im = styled([v[0] for v in vis], 'block', int(W * TXT_W * 0.9), int(H * TXT_H * 0.8))
        blitc(cv, im, W / 2, H * TXT_Y)

def seg_FLICKER(cv, t, f):
    lt = t - 7.8
    per = 3 if lt < 0.5 else 2 if lt < 0.8 else 1
    k = int(lt * FPS) // per
    if t > 8.81:
        cv[:] = BLK
        return
    mode = k % 3
    if mode == 0:
        cv[:] = RED
        hw = {'tall': 0.95, 'mid': 0.75, 'sq': 0.62, 'wide': 0.52}[LAY] * W
        r = R(k)
        ex, ey = place_head(cv, W / 2 + r.uniform(-10, 10) * u, H * 0.48, hw, r.uniform(-3, 3))
    elif mode == 1:
        img = cover(src_frame(COLL_SRC[k % len(COLL_SRC)]), W, H)
        cv[:] = treat(img, 'copy', f)
    else:
        cv[:] = BLK
        hw = {'tall': 0.95, 'mid': 0.75, 'sq': 0.62, 'wide': 0.52}[LAY] * W
        ex, ey = place_head(cv, W / 2, H * 0.48, hw * 1.15)
        glow(cv, ex, ey, 120 * u, 1.3)
    # loading bar
    p = min(1, lt / 1.0)
    bw = int(W * (0.7 if LAY != 'wide' else 0.4)); bh = int(22 * u)
    bx = int(W / 2 - bw / 2); by = int(H * 0.86)
    cv[by - 2:by + bh + 2, bx - 2:bx + bw + 2] = WHT
    cv[by:by + bh, bx:bx + bw] = BLK
    cv[by:by + bh, bx:bx + int(bw * p)] = RED
    blit(cv, mono(f'LOADING MACHINE {int(p * 100):3d}%', int(20 * u), WHT, BLK), bx, by - 52 * u)

def seg_NAME(cv, t, f):
    lt = t - 8.877
    k = int(lt * FPS)
    if k < 1:
        cv[:] = WHT
        return
    swap = t >= 9.156 - 1e-6
    hw = {'tall': 1.05, 'mid': 0.85, 'sq': 0.72, 'wide': 0.6}[LAY] * W
    if not swap:
        cv[:] = RED
        r = R(k // 2)
        place_head(cv, W / 2 + r.uniform(-12, 12) * u, H * 0.5 + r.uniform(-12, 12) * u, hw * (1.0 + 0.04 * (k % 2)))
        im = styled(['ODUMODUBLVCK'], 'huge', int(W * 0.94), int(H * 0.4))
    else:
        cv[:] = BLK
        cv[:] = (tex(t) * 0.6).astype(np.uint8)
        ex, ey = place_head(cv, W / 2, H * 0.5, hw * 1.12)
        glow(cv, ex, ey, 160 * u, 1.4)
        im = styled(['ODUMODUBLVCK'], 'redtxt', int(W * 0.94), int(H * 0.4))
    im = rscale(im, slam_scale(t, 8.877 if not swap else 9.156))
    bx, by = boil(t, 8.877, 5 * u)
    blitc(cv, im, W / 2 + bx, H * (0.5 if LAY in ('wide', 'sq') else 0.5) + by)

def seg_HEADSTOP(cv, t, f):
    lt = t - 19.941
    k = int(lt * FPS)
    cv[:] = BLK if k % 2 else RED
    hw = {'tall': 0.9, 'mid': 0.72, 'sq': 0.6, 'wide': 0.5}[LAY] * W
    r = R(k // 2 + 400)
    ex, ey = place_head(cv, W / 2 + r.uniform(-30, 30) * u, H / 2 + r.uniform(-30, 30) * u,
                        hw * [0.7, 0.85, 1.0, 1.15][min(3, k // 2)], r.uniform(-6, 6))
    glow(cv, ex, ey, 100 * u, 1.3)

TICK_TXT = '  RISE OF THE MACHINE  ★  ODUMODUBLVCK  ★  ABUJA  ★  DEC. 20TH  ★  LIVE  ★'
def ticker(cv, y, t, fg, bg, speed=1.0, px=None):
    px = px or int(30 * u)
    im = mono(TICK_TXT.replace('★', '*'), px, fg, bg, 0.12)
    bh = im.shape[0]
    tw = im.shape[1]
    off = int((t * 260 * u * speed) % tw)
    x = -off
    while x < W:
        blit(cv, im, x, y)
        x += tw

def seg_TITLE(cv, t, f):
    lt = t - 20.22
    st = 23.88 + math.floor(lt * FPS / 2) * 2 / FPS * 1.0
    img = cover(src_frame(min(st, 25.8)), W, H, zoom=1.05)
    cv[:] = treat(img, 'duo')
    cv[:] = (cv * 0.55).astype(np.uint8)
    tw = W * {'tall': 0.94, 'mid': 0.92, 'sq': 0.9, 'wide': 0.82}[LAY]
    im = asset_w('title', TITLE, tw)
    k = int(lt * FPS)
    sc = [1.7, 1.25, 1.06][k] if k < 3 else 1.0 + 0.012 * math.sin(lt * 3)
    bx, by = boil(t, 20.22, 4 * u)
    if LAY in ('tall', 'mid'):
        # stack: chrome title broken into lines for portrait drama
        Ht = TITLE.shape[0]
        parts = [(0, 1197), (1197, 1706), (1706, 4229)]  # RISE | OF THE | MACHINE
        ys = [0.335, 0.47, 0.6] if LAY == 'tall' else [0.29, 0.465, 0.64]
        widths = [0.62, 0.24, 0.94] if LAY == 'tall' else [0.54, 0.22, 0.9]
        times = [20.22, 20.596, 20.886]
        for (a, b), yy, ww, tt in zip(parts, ys, widths, times):
            if t < tt:
                continue
            seg = TITLE[:, a:b]
            sim = asset_w(f'tp{a}', seg, W * ww)
            kk = int((t - tt) * FPS)
            s2 = [1.6, 1.2, 1.05][kk] if kk < 3 else 1.0
            ox, oy = boil(t, tt, 4 * u)
            blitc(cv, rscale(sim, s2), W / 2 + ox, H * yy + oy)
    else:
        blitc(cv, rscale(im, sc), W / 2 + bx, H / 2 + by)
    band = int(56 * u)
    ticker(cv, int(H * 0.06), t, WHT, RED, 1.0)
    ticker(cv, int(H * 0.94) - band, t + 7.3, BLK, WHT, -1.0)

GRID_SRC = [14.70, 28.20, 11.05, 33.50, 23.30, 15.50, 4.15, 29.00, 34.60, 10.20, 18.60, 16.20]
def seg_GRID(cv, t, f):
    cv[:] = BLK
    lt = t - 26.617
    cols, rows = {'tall': (2, 3), 'mid': (2, 2), 'sq': (2, 2), 'wide': (4, 2)}[LAY]
    g = int(8 * u)
    cw = (W - (cols - 1) * g) // cols
    ch = (H - (rows - 1) * g) // rows
    n = cols * rows
    order = R(9).sample(range(n), n)
    for idx in range(n):
        rev = order.index(idx) * 2 / FPS
        if lt < rev:
            continue
        c, r_ = idx % cols, idx // cols
        x = c * (cw + g); y = r_ * (ch + g)
        llt = math.floor((lt - rev) * FPS / 2) * 2 / FPS
        src = GRID_SRC[idx % len(GRID_SRC)] + llt * 0.9
        img = cover(src_frame(src), cw, ch, zoom=1.0 + 0.1 * max(0, 1 - (lt - rev) / 0.2))
        tr = ['grade', 'bw', 'grade', 'duo', 'grade', 'copy', 'grade', 'bw'][idx % 8]
        cv[y:y + ch, x:x + cw] = treat(img, tr, f)
        blit(cv, mono(f'CAM_{idx + 1:02d}', int(14 * u), WHT, RED if idx % 3 == 0 else BLK), x + 10 * u, y + 10 * u)
    if lt > 0.3:
        lines = ['THE CROWD', 'IS THE', 'MACHINE']
        nv = 1 + int((lt - 0.3) / 0.35)
        im = styled(lines[:min(3, nv)], 'block' if int(lt * FPS / 6) % 2 else 'red', int(W * TXT_W * 0.9), int(H * TXT_H * 0.75))
        blitc(cv, im, W / 2, H / 2)

def seg_END(cv, t, f):
    lt = t - 33.316
    cv[:] = tex(t)
    # ghost crowd
    st = 34.40 + (lt * 0.7) % 1.0
    ghost = treat(cover(src_frame(st), W, H), 'duo')
    cv[:] = cv * 0.78 + ghost * 0.22
    L = {
        'tall': dict(kal=(0.5, 0.042, 0.14), name=(0.5, 0.12, 0.88), head=(0.5, 0.375, 0.86), title=(0.5, 0.625, 0.92),
                     date=(0.5, 0.69, 0.8), lab=(0.5, 0.735), url=(0.5, 0.765, 0.86), sp=(0.5, 0.86, 0.86), al='c'),
        'mid': dict(kal=(0.5, 0.045, 0.12), name=(0.5, 0.13, 0.78), head=(0.5, 0.405, 0.6), title=(0.5, 0.665, 0.86),
                    date=(0.5, 0.745, 0.72), lab=(0.5, 0.795), url=(0.5, 0.83, 0.8), sp=(0.5, 0.925, 0.78), al='c'),
        'sq': dict(kal=(0.5, 0.05, 0.1), name=(0.5, 0.15, 0.66), head=(0.5, 0.43, 0.46), title=(0.5, 0.675, 0.78),
                   date=(0.5, 0.765, 0.6), lab=(0.5, 0.815), url=(0.5, 0.85, 0.7), sp=(0.5, 0.94, 0.6), al='c'),
        'wide': dict(kal=(0.06, 0.1, 0.09), name=(0.06, 0.24, 0.44), head=(0.735, 0.5, 0.55), title=(0.06, 0.42, 0.44),
                     date=(0.06, 0.55, 0.36), lab=(0.06, 0.635), url=(0.06, 0.675, 0.42), sp=(0.06, 0.87, 0.42), al='l'),
    }[LAY]
    def put(im, spec, tt=None, x_override=None):
        x, y = spec[0], spec[1]
        sc = slam_scale(t, tt) if tt else 1.0
        im2 = rscale(im, sc)
        ox, oy = boil(t, tt or 33.316, 2.5 * u)
        if L['al'] == 'c':
            blitc(cv, im2, W * x + ox, H * y + oy)
        else:
            blit(cv, im2, W * x + ox - (im2.shape[1] - im.shape[1]) / 2, H * y - im2.shape[0] / 2 + oy)
    # head: 3 stop-motion steps in
    k = int(lt * FPS)
    hx, hy, hwf = L['head']
    hs = [0.55, 0.8, 1.06, 1.0][min(3, k // 2)]
    r = R(k // 3 + 99)
    jx, jy = (r.uniform(-4, 4) * u, r.uniform(-4, 4) * u)
    hw = hwf * W if LAY != 'wide' else hwf * W
    ex, ey = place_head(cv, W * hx + jx, H * hy + jy, hw * hs, r.uniform(-0.8, 0.8) if k > 6 else 0)
    pulse = 0.9 + 0.5 * max(0, 1 - min([abs(t - kk) for kk in KICKS + [34.779, 35.232, 36.242]]) / 0.12)
    glow(cv, ex, ey, 110 * u * (hw / (0.86 * 1080)) ** 0.5 * (1 if LAY != 'wide' else 1.4), pulse)
    name = styled(['ODUMODUBLVCK'], 'huge', int(W * L['name'][2]), int(H * 0.3))
    put(name, L['name'], 33.316)
    if t >= 34.779:
        tim = asset_w('title', TITLE, W * L['title'][2])
        put(tim, L['title'], 34.779)
    if t >= 35.232:
        dt_ = date_img(int(W * L['date'][2]))
        # red stars: overlay by drawing red box behind
        put(dt_, L['date'], 35.232)
    if t >= 36.242:
        lab = mono('GET TICKETS AT', int(20 * u), WHT, None, 0.35)
        put(lab, L['lab'] + (0,), 36.242)
        url = archivo('ODUMODUBLVCK.MYFLEXTICKETS.COM', int(W * L['url'][2] * 0.9), WHT)
        pad = int(18 * u)
        box = np.zeros((url.shape[0] + 2 * pad, url.shape[1] + 2 * pad, 4), np.uint8)
        box[:, :, :3] = RED; box[:, :, 3] = 255
        a = url[:, :, 3:4].astype(np.float32) / 255
        box[pad:-pad, pad:-pad, :3] = (box[pad:-pad, pad:-pad, :3] * (1 - a) + url[:, :, :3] * a).astype(np.uint8)
        put(box, L['url'], 36.242)
    if t >= 37.0:
        kal = asset_w('kal', KAL, W * L['kal'][2])
        put(kal, L['kal'], 37.0)
        sp = asset_w('sp', SPONS, W * L['sp'][2])
        put(sp, L['sp'], 37.0)

SEGS = {'KAL': seg_KAL, 'EYE': seg_EYE, 'KNOCK': seg_KNOCK, 'COLLAGE': seg_COLLAGE, 'FLICKER': seg_FLICKER,
        'NAME': seg_NAME, 'HEADSTOP': seg_HEADSTOP, 'TITLE': seg_TITLE, 'GRID': seg_GRID, 'END': seg_END}

# ---------------------------------------------------------------- HUD & post
def hud(cv, t, f):
    if not (8.95 < t < 33.316) or SH[shot_at(t)][1] in ('TITLE',):
        return
    px = int(17 * u)
    m = 34 * u
    L_ = int(36 * u); th = max(2, int(3 * u))
    for (x, y, sx, sy) in [(m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)]:
        x, y = int(x), int(y)
        xa, xb = sorted([x, x + sx * L_]); ya, yb = sorted([y, y + sy * L_])
        cv[min(ya, yb):min(ya, yb) + th if sy > 0 else y, :] if False else None
        cv[y - (th if sy < 0 else 0):y + (th if sy > 0 else 0), xa:xb] = WHT
        cv[ya:yb, x - (th if sx < 0 else 0):x + (th if sx > 0 else 0)] = WHT
    top = H * (0.045 if LAY != 'tall' else 0.07)
    blit(cv, mono('ODUMODUBLVCK // RISE OF THE MACHINE', px, WHT), m + 50 * u, top)
    tc = f'TC {int(t // 60):02d}:{int(t % 60):02d}:{f % FPS:02d}'
    im = mono(tc, px, WHT)
    blit(cv, im, W - m - 50 * u - im.shape[1], top)
    bot = H * (0.955 if LAY != 'tall' else 0.80) - px
    blit(cv, mono('ABJ * 20.12', px, WHT, RED), m + 50 * u, bot)
    if int(t * 2) % 2 == 0:
        glow(cv, W - m - 70 * u, bot + px * 0.6, 12 * u, 1.3)
    im = mono('LIVE', px, WHT)
    blit(cv, im, W - m - 50 * u - im.shape[1] - 30 * u, bot)

FLASH = {8.877: WHT, 20.22: WHT, 33.316: RED, 19.941: WHT}

def kick_amt(t):
    a = 0.0
    for k in KICKS + EXTRA_HITS:
        d = t - k
        if 0 <= d < 0.16:
            a = max(a, 1 - d / 0.16)
    return a

def post(cv, t, f):
    a = kick_amt(t)
    if 8.877 <= t and a > 0:
        r = R(f)
        sh = a * 14 * u
        z = 1 + 0.035 * a
        Mx = cv2.getRotationMatrix2D((W / 2, H / 2), r.uniform(-0.6, 0.6) * a, z)
        Mx[0, 2] += r.uniform(-sh, sh); Mx[1, 2] += r.uniform(-sh, sh)
        cv[:] = cv2.warpAffine(cv, Mx, (W, H), borderMode=cv2.BORDER_REFLECT)
        d = int(a * 10 * u)
        if d > 0:
            out = cv.copy()
            out[:, d:, 0] = cv[:, :-d, 0]
            out[:, :-d, 2] = cv[:, d:, 2]
            cv[:] = out
    elif t < 8.877 and a > 0:
        d = int(a * 8 * u)
        if d > 0:
            out = cv.copy(); out[:, d:, 0] = cv[:, :-d, 0]; out[:, :-d, 2] = cv[:, d:, 2]; cv[:] = out
    hud(cv, t, f)
    g = GRAIN[f % 6]
    o = cv.astype(np.float32) * VIG + g[:, :, None] * 9.0
    cv[:] = np.clip(o, 0, 255).astype(np.uint8)
    for ft, col in FLASH.items():
        if 0 <= t - ft < 1 / FPS - 1e-6:
            cv[:] = (cv * 0.15 + col * 0.85).astype(np.uint8)

def render(f):
    t = f / FPS
    cv = np.zeros((H, W, 3), np.uint8)
    i = shot_at(t)
    s = SH[i]
    if isinstance(s[1], str):
        SEGS[s[1]](cv, t, f)
    else:
        render_video_shot(cv, i, t, f)
    for (a, b, lines, style) in TEXT:
        if a <= t < b:
            draw_words(cv, t, a, lines, style)
    post(cv, t, f)
    return cv

if __name__ == '__main__':
    if OUT == 'stills':
        ts = [float(x) for x in sys.argv[4].split(',')]
        for t in ts:
            f = int(round(t * FPS))
            im = render(f)
            cv2.imwrite(f'{D}/../out/prev_{LAY}_{t:06.2f}.jpg', im[:, :, ::-1], [cv2.IMWRITE_JPEG_QUALITY, 85])
        sys.exit()
    f0, f1 = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (0, N)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-threads', '2', OUT],
                         stdin=subprocess.PIPE)
    import time
    t0 = time.time()
    for f in range(f0, f1):
        p.stdin.write(render(f).tobytes())
        if f % 100 == 0:
            print(f'{W}x{H} frame {f} {time.time() - t0:.0f}s', flush=True)
    p.stdin.close(); p.wait()
    print('done', OUT, time.time() - t0)
