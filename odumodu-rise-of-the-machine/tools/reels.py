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
DUR = float(os.environ.get('DUR', '20'))
N = int(DUR * FPS)
SRC_FPS = 5969 / 200
NSRC = 1298
OFF = float(os.environ.get('OFF', '1.88'))

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
EXTRA_HITS = []
KICKS = [k for k in KICKS if 0 <= k <= DUR]

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
    a = glyph_mask('DEC. 18TH', 'archivo', px, 0.02); b = glyph_mask('ABUJA', 'archivo', px, 0.02)
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

COLL_SRC = [0.45, 11.10, 14.90, 15.70, 28.30, 29.10, 33.70, 23.20, 4.20, 10.30, 34.95, 18.70, 24.40, 15.10]
# ================================================================ MACHINE VFX REELS
import json
REEL = os.environ.get('REEL', 'A')
FACES = json.load(open(D + '/faces.json'))
WHT_ = tuple(int(c) for c in WHT); RED_ = tuple(int(c) for c in RED)

def faces_at(sec):
    i = int(round(sec * SRC_FPS)); i -= i % 2
    return FACES.get(str(i), [])

# ---------------------------------------------------------------- machine vision modes
LUT_THERM = grad_lut([(0, (0, 0, 0)), (0.28, (55, 0, 85)), (0.5, (205, 0, 35)), (0.7, (255, 95, 0)),
                      (0.88, (255, 220, 70)), (1, (255, 255, 255))])

def m_edge(img):
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    e = cv2.Canny(cv2.GaussianBlur(g, (5, 5), 0), 50, 130)
    e = cv2.dilate(e, np.ones((max(1, int(2 * u)), max(1, int(2 * u))), np.uint8))
    glow_ = cv2.GaussianBlur(e, (0, 0), 4 * u)
    out = (img.astype(np.float32) * np.array([0.16, 0.02, 0.03]))
    out += glow_[:, :, None].astype(np.float32) / 255 * np.array([190, 10, 20]) * 0.9
    out += e[:, :, None].astype(np.float32) / 255 * np.array([255, 40, 45])
    return np.clip(out, 0, 255).astype(np.uint8)

def m_therm(img):
    return LUT_THERM[cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)]

RAMP = ' .:-=+*#%@'
_atl = {}
def atlas(cw, chars):
    key = (cw, chars)
    if key in _atl:
        return _atl[key]
    ch = int(cw * 1.7)
    f = ImageFont.truetype(FONTS['mono'], int(cw * 1.55))
    tiles = []
    for c in chars:
        im = Image.new('L', (cw, ch), 0)
        ImageDraw.Draw(im).text((cw / 2, ch / 2), c, font=f, fill=255, anchor='mm')
        tiles.append(np.array(im))
    _atl[key] = (np.stack(tiles), ch)
    return _atl[key]

def m_ascii(img, cw=None, binary=False, seed=0):
    cw = cw or max(8, int(15 * u))
    h, w = img.shape[:2]
    chars = '01' if binary else RAMP
    tiles, ch = atlas(cw, chars)
    cols, rows = w // cw, h // ch
    g = cv2.resize(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY), (cols, rows), interpolation=cv2.INTER_AREA)
    g = cv2.equalizeHist(g)
    if binary:
        idx = np.random.default_rng(seed).integers(0, 2, (rows, cols))
    else:
        idx = (g.astype(np.int32) * len(chars)) // 256
    m = tiles[idx].transpose(0, 2, 1, 3).reshape(rows * ch, cols * cw).astype(np.float32) / 255
    if binary:
        m *= np.repeat(np.repeat(g.astype(np.float32) / 255, ch, 0), cw, 1)
    col = np.where((g > 205)[:, :, None], np.array(WHT, np.float32), np.array(RED, np.float32))
    col = np.repeat(np.repeat(col, ch, 0), cw, 1)
    out = np.zeros((h, w, 3), np.uint8)
    out[:rows * ch, :cols * cw] = (m[:, :, None] * col).astype(np.uint8)
    return out

def glitch(img, amt, seed):
    if amt <= 0.01:
        return img
    r = np.random.default_rng(seed)
    out = img.copy(); h, w = img.shape[:2]
    for _ in range(int(3 + 14 * amt)):
        y = int(r.integers(0, h)); bh = int(r.integers(int(3 * u) + 1, int(70 * u * amt) + int(6 * u) + 2))
        dx = int(r.normal(0, 0.09 * w * amt))
        out[y:y + bh] = np.roll(img[y:y + bh], dx, axis=1)
    for _ in range(int(8 * amt)):   # datamosh-style block displacement
        bw = int(r.integers(int(40 * u), int(240 * u))); bh = int(r.integers(int(20 * u), int(160 * u)))
        x0 = int(r.integers(0, max(1, w - bw))); y0 = int(r.integers(0, max(1, h - bh)))
        sx = int(np.clip(x0 + r.normal(0, 80 * u), 0, w - bw)); sy = int(np.clip(y0 + r.normal(0, 80 * u), 0, h - bh))
        out[y0:y0 + bh, x0:x0 + bw] = img[sy:sy + bh, sx:sx + bw]
    d = int(14 * u * amt)
    if d > 0:
        o2 = out.copy(); o2[:, d:, 0] = out[:, :-d, 0]; o2[:, :-d, 2] = out[:, d:, 2]; out = o2
    return out

def apply_mode(img, mode, f):
    if mode == 'edge': return m_edge(img)
    if mode == 'therm': return m_therm(img)
    if mode == 'ascii': return m_ascii(img)
    if mode == 'bin': return m_ascii(img, binary=True, seed=f // 3)
    return treat(img, mode, f)

# ---------------------------------------------------------------- reticles / HUD
def reticle(cv, x0, y0, x1, y1, label, sub=None, col=RED_, t=0.0):
    w, h = x1 - x0, y1 - y0
    L = max(8, int(min(w, h) * 0.28)); th = max(2, int(3 * u))
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    for (cx, cy, sx, sy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
        cv2.line(cv, (cx, cy), (cx + sx * L, cy), col, th, cv2.LINE_AA)
        cv2.line(cv, (cx, cy), (cx, cy + sy * L), col, th, cv2.LINE_AA)
    mx, my = (x0 + x1) // 2, (y0 + y1) // 2
    cv2.line(cv, (mx - L // 3, my), (mx + L // 3, my), col, max(1, th - 1), cv2.LINE_AA)
    cv2.line(cv, (mx, my - L // 3), (mx, my + L // 3), col, max(1, th - 1), cv2.LINE_AA)
    lab = mono(label, int(15 * u), WHT, RED)
    blit(cv, lab, x0, y0 - lab.shape[0] - 4 * u)
    if sub:
        sb = mono(sub, int(13 * u), WHT, BLK)
        blit(cv, sb, x0, y1 + 4 * u)

LABELS = ['VOL: MAX', 'ENERGY 99%', 'STATUS: LIT', 'SYNC 100%', 'HYPE: CRIT', 'LOCKED']
def face_locks(cv, src, Mx, ox=0, oy=0, ymax=None, seed=0):
    for k, (x, y, bw, bh) in enumerate(faces_at(src)):
        p = Mx @ np.array([[x, x + bw], [y, y + bh], [1, 1]], np.float32)
        x0, x1 = float(p[0, 0] + ox), float(p[0, 1] + ox)
        y0, y1 = float(p[1, 0] + oy), float(p[1, 1] + oy)
        pad = (x1 - x0) * 0.15
        if ymax is not None and (y0 + y1) / 2 > ymax:
            continue
        if x1 < 0 or x0 > W or y1 < 0 or y0 > H:
            continue
        hid = (x * 7 + y * 13 + k * 31) % 4096
        reticle(cv, x0 - pad, y0 - pad, x1 + pad, y1 + pad, f'HUMAN_{hid:03X}', LABELS[(hid + seed) % len(LABELS)])

def clip(cv, src, mode, f, zoom=1.0, faces=True, gl=0.0, fy=0.45, ret_base=False):
    Mx = affine_cover(720, 1080, W, H, zoom=zoom, fy=fy)
    base = cv2.warpAffine(src_frame(src), Mx, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    img = apply_mode(base, mode, f)
    if gl > 0:
        img = glitch(img, gl, f)
    cv[:] = img
    if faces:
        face_locks(cv, src, Mx, seed=f // 15)
    return (base, Mx) if ret_base else None

def hexcol(cv, x, t, f, op=0.45, n=34):
    r = np.random.default_rng(int(x) * 7 + f // 2)
    px = int(14 * u)
    y = int((t * 160 * u) % (px * 2)) - px * 2
    while y < H:
        s = ''.join(r.choice(list('0123456789ABCDEF'), 4))
        blit(cv, mono(s, px, RED, None), x, y, op)
        y += int(px * 1.9)

def machine_hud(cv, t, f, title='MACHINE VISION v2.0'):
    m = int(34 * u); L = int(44 * u); th = max(2, int(3 * u))
    for (x, y, sx, sy) in [(m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)]:
        cv2.line(cv, (x, y), (x + sx * L, y), WHT_, th); cv2.line(cv, (x, y), (x, y + sy * L), WHT_, th)
    top = int(H * 0.07)
    blit(cv, mono(title, int(17 * u), WHT, None), m + 50 * u, top)
    tc = mono(f'REC  {int(t // 60):02d}:{int(t % 60):02d}:{f % FPS:02d}', int(17 * u), WHT, None)
    blit(cv, tc, W - m - 50 * u - tc.shape[1], top)
    if int(t * 2) % 2 == 0:
        glow(cv, W - m - 70 * u - tc.shape[1], top + 10 * u, 12 * u, 1.3)
    # centre crosshair
    cx, cy = W // 2, int(H * 0.5); c = int(16 * u)
    cv2.line(cv, (cx - c, cy), (cx + c, cy), WHT_, 1, cv2.LINE_AA); cv2.line(cv, (cx, cy - c), (cx, cy + c), WHT_, 1, cv2.LINE_AA)
    hexcol(cv, int(m + 6 * u), t, f, 0.35)
    blit(cv, mono('ABJ * 18.12', int(16 * u), WHT, RED), m + 50 * u, H * 0.8)

def scanline(cv, y, col=RED_):
    y = int(y)
    for k, (a, w_) in enumerate([(0.25, int(26 * u)), (0.5, int(10 * u)), (1.0, max(2, int(3 * u)))]):
        y0, y1 = max(0, y - w_ // 2), min(H, y + w_ // 2 + 1)
        if y1 > y0:
            cv[y0:y1] = (cv[y0:y1] * (1 - a) + np.array(col if k < 2 else (255, 255, 255)) * a).astype(np.uint8)

def type_lines(cv, t, lines, t0, rate, x, y, px, bg=BLK):
    yy = y
    for k, ln in enumerate(lines):
        st = t0 + k * rate
        if t < st:
            break
        n = int((t - st) * 40)
        if n <= 0:
            continue
        im = mono(ln[:n] + ('_' if n < len(ln) and int(t * 8) % 2 else ''), px, WHT if k % 2 == 0 else WHT, bg if k % 2 == 0 else RED)
        blit(cv, im, x, yy)
        yy += im.shape[0] + 8 * u

def bar(cv, x, y, w, h, p, label):
    x, y, w, h = int(x), int(y), int(w), int(h)
    cv[y - 2:y + h + 2, x - 2:x + w + 2] = WHT; cv[y:y + h, x:x + w] = BLK; cv[y:y + h, x:x + int(w * p)] = RED
    blit(cv, mono(label, int(18 * u), WHT, BLK), x, y - 46 * u)

HEADG = cv2.cvtColor(HEAD[:, :, :3], cv2.COLOR_RGB2GRAY)
_he = cv2.dilate(cv2.Canny(cv2.GaussianBlur(HEADG, (3, 3), 0), 60, 150), np.ones((3, 3), np.uint8))
HEAD_EDGE = np.dstack([np.full(HEADG.shape + (3,), RED, np.uint8), np.minimum(_he, HEAD[:, :, 3])])

def place_edge_head(cv, cx, cy, w):
    blitc(cv, asset_w('headedge', HEAD_EDGE, w), cx, cy)

# ---------------------------------------------------------------- shared end card (event, DEC. 18TH)
def end_card(cv, t, t0, f, gl=0.0):
    lt = t - t0
    cv[:] = tex(t)
    ghost = treat(cover(src_frame(34.40 + (lt * 0.7) % 1.0), W, H), 'duo')
    cv[:] = cv * 0.8 + ghost * 0.2
    L = dict(kal=(0.5, 0.042, 0.14), name=(0.5, 0.12, 0.88), head=(0.5, 0.375, 0.86), title=(0.5, 0.625, 0.92),
             date=(0.5, 0.69, 0.8), lab=(0.5, 0.735), url=(0.5, 0.765, 0.86), sp=(0.5, 0.86, 0.86))
    def put(im, spec, tt):
        im2 = rscale(im, slam_scale(t, t0 + tt))
        ox, oy = boil(t, t0 + tt, 2.5 * u)
        blitc(cv, im2, W * spec[0] + ox, H * spec[1] + oy)
    k = int(lt * FPS)
    hs = [0.55, 0.8, 1.06, 1.0][min(3, k // 2)]
    ex, ey = place_head(cv, W * 0.5, H * 0.375, 0.86 * W * hs)
    glow(cv, ex, ey, 110 * u, 0.9 + 0.5 * max(0, 1 - min([abs(t - kk) for kk in KICKS] + [9]) / 0.12))
    if k > 6:
        r_ = int(120 * u)
        reticle(cv, ex - r_, ey - r_, ex + r_, ey + r_, 'TARGET LOCKED', 'RISE OF THE MACHINE')
    put(styled(['ODUMODUBLVCK'], 'huge', int(W * 0.88), int(H * 0.3)), L['name'], 0)
    if lt >= 0.45: put(asset_w('title', TITLE, W * 0.92), L['title'], 0.45)
    if lt >= 0.9: put(date_img(int(W * 0.8)), L['date'], 0.9)
    if lt >= 1.3:
        put(mono('GET TICKETS AT', int(20 * u), WHT, None, 0.35), L['lab'], 1.3)
        url = archivo('ODUMODUBLVCK.MYFLEXTICKETS.COM', int(W * 0.86 * 0.9), WHT)
        pad = int(18 * u)
        box = np.zeros((url.shape[0] + 2 * pad, url.shape[1] + 2 * pad, 4), np.uint8); box[:, :, :3] = RED; box[:, :, 3] = 255
        a = url[:, :, 3:4].astype(np.float32) / 255
        box[pad:-pad, pad:-pad, :3] = (box[pad:-pad, pad:-pad, :3] * (1 - a) + url[:, :, :3] * a).astype(np.uint8)
        put(box, L['url'], 1.3)
    if lt >= 1.7:
        put(asset_w('kal', KAL, W * 0.14), L['kal'], 1.7)
        put(asset_w('sp', SPONS, W * 0.86), L['sp'], 1.7)
    # machine scan sweep across the card, once per 2.4s
    sy = ((lt * 0.42) % 1.0) * H * 1.2 - H * 0.1
    scanline(cv, sy)
    if gl > 0:
        cv[:] = glitch(cv, gl, f)

def kick_env(t, dur=0.16):
    a = 0.0
    for k in KICKS:
        d = t - k
        if 0 <= d < dur:
            a = max(a, 1 - d / dur)
    return a

def last_kick_index(t):
    return sum(1 for k in KICKS if k <= t)

# ================================================================ REEL A: MACHINE VISION (20 s)
A_SCAN = [(1.4, 14.60, 0.9), (2.3, 28.00, 1.0), (3.2, 15.39, 0.7)]
A_THERM = [(4.2, 11.03, 0.35), (5.1, 33.30, 1.0), (6.0, 29.00, 1.0)]
A_MONT = [(11.135, 16.09), (11.739, 22.97), (12.017, 23.88), (13.782, 28.50), (14.060, 11.38),
          (14.339, 34.40), (15.372, 33.60), (15.790, 1.15)]
A_TEXT = [(11.135, 12.017, ['TARGET', 'ABUJA'], 'block'), (12.017, 13.782, ['THE MACHINE', 'IS COMING'], 'red'),
          (13.782, 14.339, ['18.12'], 'out'), (14.339, 15.372, ['BIG KALA'], 'red'), (15.372, 16.661, ['ODUMODU', 'BLVCK'], 'huge')]

def sub_at(lst, t):
    cur = lst[0]
    for s in lst:
        if s[0] <= t:
            cur = s
    return cur

def humans(t):
    p = min(1, max(0, (t - 1.4) / 5.4))
    return int(4812 * p ** 1.6)

def reel_A(cv, t, f):
    if t < 1.4:                      # boot: optic opens
        cv[:] = BLK
        lt = t; k = math.floor(lt * FPS / 3) * 3 / FPS; p = min(1, k / 1.2); e = 1 - (1 - p) ** 3
        base = 0.9 * min(W / HEAD.shape[1], H / HEAD.shape[0]); z = 7.0 * (1 - e) + 1.4 * e; s = base * z
        fx = EYE[0] * (1 - e) + HEAD.shape[1] / 2 * e; fy = EYE[1]
        Mx = np.array([[s, 0, W / 2 - fx * s], [0, s, H * 0.48 - fy * s]], np.float32)
        lay = cv2.warpAffine(HEAD, Mx, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        a = lay[:, :, 3:4].astype(np.float32) / 255
        cv[:] = (cv * (1 - a) + lay[:, :, :3] * a).astype(np.uint8)
        ex = Mx[0, 0] * EYE[0] + Mx[0, 2]; ey = Mx[1, 1] * EYE[1] + Mx[1, 2]
        glow(cv, ex, ey, 70 * u * z ** 0.5, 1.2)
        cv2.line(cv, (0, int(ey)), (W, int(ey)), RED_, max(1, int(2 * u)), cv2.LINE_AA)
        cv2.line(cv, (int(ex), 0), (int(ex), H), RED_, max(1, int(2 * u)), cv2.LINE_AA)
        r_ = int(90 * u * z ** 0.4)
        reticle(cv, ex - r_, ey - r_, ex + r_, ey + r_, 'OPTIC_01', 'CALIBRATING')
        cv[::max(2, int(4 * u))] = (cv[::max(2, int(4 * u))] * 0.6).astype(np.uint8)
        type_lines(cv, t, ['MACHINE VISION v2.0', '> booting optics...', '> target: ABUJA'], 0.05, 0.4, W * 0.08, H * 0.74, int(26 * u))
        return
    if t < 4.2:                      # scan: edge-vision below the sweep, real colour + locks above
        t0, src, spd = sub_at(A_SCAN, t)
        nxt = [s[0] for s in A_SCAN if s[0] > t0] + [4.2]
        dur = nxt[0] - t0; lt = t - t0
        base, Mx = clip(cv, src + lt * spd, 'grade', f, zoom=1.0 + 0.04 * lt, faces=False, ret_base=True)
        ly = H * min(1.0, lt / (dur * 0.85))
        edge = m_edge(base)
        y = int(ly); cv[y:] = edge[y:]
        face_locks(cv, src + lt * spd, Mx, ymax=ly)
        scanline(cv, ly)
        machine_hud(cv, t, f)
        blit(cv, mono('SCANNING CROWD...', int(26 * u), WHT, RED), W * 0.08, H * 0.62)
        blit(cv, mono(f'HUMANS DETECTED: {humans(t):,}', int(26 * u), WHT, BLK), W * 0.08, H * 0.62 + 58 * u)
        return
    if t < 7.0:                      # heat vision
        t0, src, spd = sub_at(A_THERM, t)
        lt = t - t0
        clip(cv, src + lt * spd, 'therm', f, zoom=1.03 + 0.03 * lt)
        machine_hud(cv, t, f, 'MACHINE VISION // THERMAL')
        p = min(1, (t - 4.2) / 2.8)
        bar(cv, W * 0.08, H * 0.7, W * 0.84, 24 * u, 0.37 + 0.62 * p, f'CROWD ENERGY {int(37 + 62 * p)}%')
        blit(cv, mono(f'HUMANS DETECTED: {humans(t):,}', int(26 * u), WHT, BLK), W * 0.08, H * 0.62)
        return
    if t < 10.0:                     # overload build
        if t >= 9.85:
            cv[:] = WHT; return
        lt = t - 7.0
        per = 3 if lt < 1.2 else 2 if lt < 2.2 else 1
        k = int(lt * FPS) // per
        src = COLL_SRC[k % len(COLL_SRC)]
        mode = ['edge', 'therm', 'ascii', 'grade', 'bin'][k % 5]
        clip(cv, src, mode, f, zoom=1.05, faces=(mode == 'grade'), gl=min(1, 0.15 + lt / 2.6))
        machine_hud(cv, t, f, 'WARNING // SYSTEM OVERLOAD')
        if t < 8.4:
            if int(t * 6) % 2 == 0:
                draw_words(cv, t, 7.0, ['ENERGY:', 'CRITICAL'], 'red')
        else:
            n = '3' if t < 8.85 else '2' if t < 9.3 else '1'
            tt = 8.4 if n == '3' else 8.85 if n == '2' else 9.3
            draw_words(cv, t, tt, [n], 'red', wmul=0.5)
        return
    if t < 11.135:                   # drop: name slam, real / edge head alternating on kicks
        lt = t - 10.0
        if int(lt * FPS) < 1:
            cv[:] = WHT; return
        edge_mode = last_kick_index(t) % 2 == 1
        cv[:] = RED if not edge_mode else BLK
        hw = 1.05 * W
        if edge_mode:
            place_edge_head(cv, W / 2, H * 0.5, hw)
        else:
            ex, ey = place_head(cv, W / 2, H * 0.5, hw)
        im = styled(['ODUMODUBLVCK'], 'huge' if not edge_mode else 'redtxt', int(W * 0.94), int(H * 0.4))
        tk = max([k for k in KICKS if k <= t] + [10.0])
        blitc(cv, rscale(im, slam_scale(t, tk)), W / 2, H * 0.5)
        machine_hud(cv, t, f)
        return
    if t < 16.661:                   # montage, edge-flash on every kick
        t0, src = sub_at(A_MONT, t)
        lt = t - t0
        a = kick_env(t, 0.1)
        mode = 'edge' if a > 0.45 else 'grade'
        clip(cv, src + lt, mode, f, zoom=1.0 + 0.1 * max(0, 1 - lt / 0.22) ** 2, gl=0.35 * a)
        for (a0, b0, lines, st) in A_TEXT:
            if a0 <= t < b0:
                draw_words(cv, t, a0, lines, st)
        machine_hud(cv, t, f)
        return
    end_card(cv, t, 16.661, f, gl=0.5 * kick_env(t, 0.12))

# ================================================================ REEL B: SYSTEM OVERRIDE (15 s)
TERM = ['> sys.override --force', '> target: ABUJA // 18.12', '> load odumodublvck.exe', '> crowd.sync ...... 100%',
        '> optics: RED EYE ONLINE', '> RISE OF THE MACHINE']
B_MOSH = [(5.26, 14.60), (6.143, 28.50), (7.0, 33.50)]

def reel_B(cv, t, f):
    if t < 2.509:                    # override: modes flip on every kick
        k = last_kick_index(t)
        mode = k % 3
        a = kick_env(t, 0.2)
        if mode == 0:
            cv[:] = RED
            r = R(f // 2)
            place_head(cv, W / 2 + r.uniform(-14, 14) * u, H * 0.47, 1.0 * W)
            cv[:] = glitch(cv, 0.35 + 0.6 * a, f)
        elif mode == 1:
            clip(cv, COLL_SRC[k % len(COLL_SRC)], 'ascii', f, faces=False)
        else:
            cv[:] = BLK
            place_edge_head(cv, W / 2, H * 0.47, 1.0 * W)
            cv[:] = glitch(cv, 0.2 + 0.6 * a, f)
        cv[::max(2, int(4 * u))] = (cv[::max(2, int(4 * u))] * 0.65).astype(np.uint8)
        type_lines(cv, t, TERM, 0.0, 0.36, W * 0.07, H * 0.62, int(25 * u))
        machine_hud(cv, t, f, 'SYS://OVERRIDE')
        return
    if t < 5.26:                     # ascii -> real install wipe
        lt = t - 2.509; dur = 5.26 - 2.509
        src = 23.88 + math.floor(lt * FPS / 2) * 2 / FPS * 0.7
        base, Mx = clip(cv, src, 'grade', f, faces=False, ret_base=True)
        asc = m_ascii(base)
        p = min(1, lt / (dur * 0.9))
        y = int(H * p)
        cv[y:] = asc[y:]
        face_locks(cv, src, Mx, ymax=y)
        scanline(cv, y)
        bar(cv, W * 0.08, H * 0.7, W * 0.84, 24 * u, p, f'INSTALLING THE MACHINE {int(p * 100)}%')
        machine_hud(cv, t, f, 'SYS://INSTALL')
        return
    if t < 7.907:                    # datamosh montage + binary rain
        t0, src = sub_at(B_MOSH, t)
        lt = t - t0
        a = kick_env(t, 0.25)
        clip(cv, src + lt, 'grade', f, zoom=1.0 + 0.1 * max(0, 1 - lt / 0.22) ** 2, gl=0.18 + 0.8 * a)
        rain = m_ascii(cv, binary=True, seed=f // 2)
        cv[:] = np.maximum(cv, (rain * 0.55).astype(np.uint8))
        if t < 6.143:
            draw_words(cv, t, 5.26, ['ABUJA'], 'huge')
        elif t < 7.0:
            draw_words(cv, t, 6.143, ['18.12'], 'red')
        else:
            draw_words(cv, t, 7.0, ['BIG KALA'], 'block')
        machine_hud(cv, t, f, 'SYS://DATAMOSH')
        return
    if t < 11.379:                   # title assembles from glitch slices
        lt = t - 7.907
        src = 34.40 + math.floor(lt * FPS / 2) * 2 / FPS * 0.3
        clip(cv, src, 'duo', f, faces=False)
        cv[:] = (cv * 0.5).astype(np.uint8)
        snap = 8.465
        spread = max(0.0, 1 - (t - 7.907) / (snap - 7.907)) if t < snap else 0.0
        spread += 0.25 * kick_env(t, 0.15)
        parts = [(0, 1197), (1197, 1706), (1706, 4229)]
        for (a0, b0), yy, ww in zip(parts, [0.33, 0.465, 0.6], [0.62, 0.24, 0.94]):
            sim = asset_w(f'tp{a0}', TITLE[:, a0:b0], W * ww)
            hh = sim.shape[0]; ns = 10
            for s_ in range(ns):
                ya, yb = s_ * hh // ns, (s_ + 1) * hh // ns
                r = R(s_ * 31 + a0 + int(t * FPS) // 2)
                dx = r.uniform(-1, 1) * W * 0.6 * spread
                blit(cv, sim[ya:yb], W / 2 - sim.shape[1] / 2 + dx, H * yy - hh / 2 + ya)
        if t >= snap:
            blit(cv, mono('ODUMODUBLVCK.EXE // LOADED', int(24 * u), WHT, RED), W * 0.5 - 250 * u, H * 0.72)
        machine_hud(cv, t, f, 'SYS://COMPILE')
        return
    lt = t - 11.379
    end_card(cv, t, 11.379, f, gl=max(0, 0.9 - lt * 3) + 0.45 * kick_env(t, 0.12))

def render(f):
    t = f / FPS
    cv = np.zeros((H, W, 3), np.uint8)
    (reel_A if REEL == 'A' else reel_B)(cv, t, f)
    g = GRAIN[f % 6]
    o = cv.astype(np.float32) * VIG + g[:, :, None] * 8.0
    return np.clip(o, 0, 255).astype(np.uint8)

if __name__ == '__main__':
    if OUT == 'stills':
        for t in [float(x) for x in sys.argv[4].split(',')]:
            cv2.imwrite(f'{D}/../out/prev_reel{REEL}_{t:06.2f}.jpg', render(int(round(t * FPS)))[:, :, ::-1], [cv2.IMWRITE_JPEG_QUALITY, 85])
        sys.exit()
    aud = sys.argv[4]
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-i', aud, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-maxrate', '20M', '-bufsize', '40M', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                          '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
    import time
    t0 = time.time()
    for f in range(N):
        p.stdin.write(render(f).tobytes())
    p.stdin.close(); p.wait()
    print('done', OUT, time.time() - t0)
