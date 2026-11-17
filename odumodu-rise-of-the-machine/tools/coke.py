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
DUR = 20.0
N = int(DUR * FPS)
SRC_FPS = 5969 / 200
NSRC = 1298
OFF = 7.877  # ad t=0 == source audio 7.877s (drop lands at 4.0)

W, H = int(sys.argv[1]), int(sys.argv[2])
OUT = sys.argv[3]
asp = W / H
LAY = 'tall' if asp < 0.7 else 'mid' if asp < 0.9 else 'sq' if asp < 1.2 else 'wide'
M = min(W, H)
u = M / 1080.0
RED = np.array([234, 31, 37], np.uint8)  # Coca-Cola red (sampled from logo)
BLK = np.array([10, 9, 9], np.uint8)
WHT = np.array([255, 255, 255], np.uint8)

KICKS = [k - OFF for k in [10.995, 11.877, 12.156, 12.597, 13.015, 13.619, 13.897, 15.662, 15.94, 16.219,
        17.252, 17.67, 18.541, 19.133, 19.598, 20.317, 20.596, 20.886, 21.92, 22.338, 22.941, 23.22,
        25.263, 25.542, 26.575, 26.993, 27.597, 27.864, 28.166, 28.456, 28.909, 29.617, 31.66, 32.543,
        34.307, 34.586, 34.865, 36.316, 37.779, 38.232, 39.242, 39.52, 40.972, 41.866]]
EXTRA_HITS = [2.6, 3.118, 3.55, 4.0, 12.44, 15.343]
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

LUT_DUO = grad_lut([(0, (40, 2, 6)), (0.4, (180, 18, 26)), (0.62, (234, 31, 37)), (0.82, (250, 160, 160)), (1, (255, 255, 255))])
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
        elif style == 'white':
            im = boxed(m, RED, WHT, int(px * 0.12), int(px * 0.09))
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

def date_img(tw, tcol=WHT, scol=WHT):
    key = ('date', tw, tuple(tcol), tuple(scol))
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
    put(a, 0, tcol); put(st, a.shape[1] + gap, scol); put(b, a.shape[1] + st.shape[1] + 2 * gap, tcol)
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
    lo = np.array([178, 16, 24], np.float32); hi = np.array([244, 36, 42], np.float32)
    img = lo + (hi - lo) * base
    n = r.random((H // 2 + 1, W // 2 + 1)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_NEAREST)
    img = img * (0.95 + 0.07 * n[:, :, None])
    return np.clip(img, 0, 255).astype(np.uint8)
TEX = [make_tex(s) for s in (1, 2, 3)]
def tex(t):
    return TEX[int(t * FPS / 3) % 3].copy()

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - 0.38 * np.clip((((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) - 0.25, 0, 1.2))[:, :, None].astype(np.float32)
del yy, xx

COLL_SRC = [0.45, 11.10, 14.90, 15.70, 28.30, 29.10, 33.70, 23.20, 4.20, 10.30, 34.95, 18.70, 24.40, 15.10]
# ================================================================ COCA-COLA x RISE OF THE MACHINE
COKE_LOGO = np.array(Image.open(A + 'coke_logo.jpg').convert('RGB'))  # the logo exactly as supplied
OUTDIR = os.environ.get('COKE_OUT', D + '/../out')

def lockup(side, lcol=WHT, boxed=False):
    """'POWERED BY' set above the supplied Coca-Cola logo (square, used as-is)."""
    key = ('lock', int(side), tuple(lcol), boxed)
    if key in _sc:
        return _sc[key]
    lg = asset_w('cokelogo', COKE_LOGO, side)
    lg = np.dstack([lg, np.full(lg.shape[:2], 255, np.uint8)])
    lab = archivo('POWERED BY', int(side * 0.86), lcol, track=0.32)
    if boxed:
        p = int(side * 0.05)
        b = np.zeros((lab.shape[0] + 2 * p, int(side), 4), np.uint8); b[:, :, :3] = RED; b[:, :, 3] = 255
        a = lab[:, :, 3:4].astype(np.float32) / 255
        x = (b.shape[1] - lab.shape[1]) // 2
        b[p:p + lab.shape[0], x:x + lab.shape[1], :3] = (b[p:p + lab.shape[0], x:x + lab.shape[1], :3] * (1 - a) + lab[:, :, :3] * a).astype(np.uint8)
        lab = b
    gap = int(side * (0.0 if boxed else 0.07))
    out = np.zeros((lab.shape[0] + gap + lg.shape[0], int(side), 4), np.uint8)
    x = (out.shape[1] - lab.shape[1]) // 2
    out[:lab.shape[0], x:x + lab.shape[1]] = lab
    out[lab.shape[0] + gap:, :lg.shape[1]] = lg
    _sc[key] = out
    return out

def ribbon(cv, yc, amp, th, ph, col=(255, 255, 255), tilt=0.0, kx=1.3):
    """Dynamic ribbon: a tapered wave band in the Coca-Cola manner."""
    xs = np.linspace(-0.08 * W, 1.08 * W, 160)
    k = 2 * np.pi / (W * kx)
    top = yc + amp * np.sin(k * xs + ph) + tilt * (xs - W / 2)
    thick = th * (0.12 + 0.88 * (0.5 + 0.5 * np.sin(k * 0.75 * xs + ph * 1.25 + 1.4)))
    bot = top + thick
    pts = np.concatenate([np.stack([xs, top], 1), np.stack([xs[::-1], bot[::-1]], 1)])
    pts = (pts * 16).astype(np.int32)
    cv2.fillPoly(cv, [pts], tuple(int(c) for c in col), lineType=cv2.LINE_AA, shift=4)

BUB = None
def bubbles(cv, t, n=46, seed=11, scale=1.0, col=(255, 255, 255), fill=False):
    r = np.random.default_rng(seed)
    xs = r.random(n) * W; sp = (0.12 + 0.4 * r.random(n)) * H
    rad = (3 + 14 * r.random(n) ** 2.2) * u * scale; off = r.random(n) * H * 2; wob = r.random(n) * 6
    th = max(1, int(2.2 * u))
    for i in range(n):
        y = H + 2 * rad[i] - ((t * sp[i] + off[i]) % (H + 4 * rad[i]))
        x = xs[i] + 9 * u * math.sin(t * 3.2 + wob[i])
        cv2.circle(cv, (int(x * 16), int(y * 16)), max(16, int(rad[i] * 16)), col, -1 if (fill or rad[i] < 5 * u) else th, cv2.LINE_AA, 4)

# ---------------------------------------------------------------- shot list
SH = [
    (0.000, 'OPEN'), (1.600, 'WIPE'), (2.600, 'BUILD'), (4.000, 'NAME'),
    (4.720, 11.03, 0.8, 'duo', 'tri', 1),
    (5.138, 14.60, 1.0, 'grade', 'tri', 1),
    (5.742, 15.39, 0.8, 'grade', 'tri', 1),
    (6.020, 4.13, 0.25, 'duo', 'full', 2),
    (6.900, 29.00, 1.0, 'grade', 'tri', 1),
    (7.785, 28.00, 1.0, 'grade', 'tri', 1),
    (8.063, 22.97, 1.0, 'duo', 'tri', 2),
    (8.342, 23.88, 1.0, 'grade', 'full', 1),
    (9.375, 28.50, 1.0, 'grade', 'tri', 1),
    (9.793, 33.30, 1.0, 'duo', 'tri', 1),
    (10.664, 34.40, 1.0, 'grade', 'full', 1),
    (11.256, 16.09, 1.0, 'grade', 'tri', 1),
    (11.721, 1.15, 1.0, 'grade', 'tri', 1),
    (12.440, 'TITLE'), (15.343, 'END'), (DUR, None),
]
VID = [i for i, s in enumerate(SH[:-1]) if not isinstance(s[1], str)]
TEXT = [
    (2.600, 3.118, ['REFRESH'], 'white'),
    (3.118, 3.550, ['THE'], 'white'),
    (3.550, 3.950, ['MACHINE'], 'white'),
    (4.720, 5.742, ['ABUJA'], 'huge'),
    (5.742, 6.900, ['ICE COLD.'], 'white'),
    (6.900, 7.785, ['TURN IT', 'UP'], 'red'),
    (7.785, 8.342, ['LOUDER'], 'red'),
    (8.342, 9.375, ['20.12'], 'out'),
    (9.375, 10.664, ['BIG KALA'], 'white'),
    (10.664, 12.440, ['REFRESH', 'THE MACHINE'], 'white'),
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
    if s[5] > 1:
        r = R(i * 977 + int(lt * FPS / s[5]))
        dx, dy, rot = r.uniform(-.015, .015), r.uniform(-.015, .015), r.uniform(-1.2, 1.2)
    img = cover(src_frame(st), w, h, zoom=zoom, dx=dx, dy=dy, rot=rot)
    cv[y:y + h, x:x + w] = treat(img, treat_override or s[3], f)

def punch(t, t0):
    return 1.0 + 0.12 * max(0, 1 - (t - t0) / 0.22) ** 2

def tri_rects():
    g = int(10 * u)
    pw = (W - 2 * g) // 3
    return [(0, 0, pw, H), (pw + g, 0, pw, H), (2 * (pw + g), 0, W - 2 * (pw + g), H)]

def render_video_shot(cv, i, t, f):
    s = SH[i]
    z = punch(t, s[0])
    if LAY == 'wide' and s[4] == 'tri':
        cv[:] = RED  # Coke-red gutters
        rs = tri_rects()
        vi = VID.index(i)
        pi = VID[vi - 1] if vi > 0 else VID[vi + 1]
        ni = VID[vi + 1] if vi + 1 < len(VID) else VID[vi - 1]
        draw_clip(cv, rs[0], pi, t - SH[i][0] + SH[pi][0] + (SH[pi + 1][0] - SH[pi][0]) * 0.5, 'duo', loop=True, f=f)
        draw_clip(cv, rs[1], i, t, zoom=z, f=f)
        draw_clip(cv, rs[2], ni, t - SH[i][0] + SH[ni][0], 'duo', loop=True, f=f)
    else:
        draw_clip(cv, (0, 0, W, H), i, t, zoom=z, f=f)
    bubbles(cv, t, n=26, seed=5, scale=0.9)

LOCK_W = {'tall': 0.5, 'mid': 0.42, 'sq': 0.38, 'wide': 0.24}[LAY]

def seg_OPEN(cv, t, f):
    cv[:] = tex(t)
    bubbles(cv, t, n=60, seed=3)
    # ribbon flows in from below
    p = min(1, t / 0.6); e = 1 - (1 - p) ** 3
    ribbon(cv, H * (1.15 - 0.37 * e), H * 0.05, H * 0.13, t * 2.2)
    lw = W * LOCK_W
    if t >= 0.18:
        lab = archivo('POWERED BY', int(lw * 0.86), WHT, track=0.32)
        k = int((t - 0.18) * FPS)
        op = min(1, (k + 1) / 4)
        blitc(cv, lab, W / 2, H * 0.44 - lw * 0.5 - lw * 0.07 - lab.shape[0] / 2, op)
    if t >= 0.42:
        lg = asset_w('cokelogo', COKE_LOGO, lw)
        blitc(cv, rscale(lg, slam_scale(t, 0.42)), W / 2, H * 0.44)
    blit(cv, mono('ODUMODUBLVCK // RISE OF THE MACHINE', int(16 * u), WHT), 40 * u, 40 * u)

def seg_WIPE(cv, t, f):
    lt = t - 1.6
    if lt < 0.35:
        cv[:] = tex(t)
        bubbles(cv, t, n=60, seed=3)
        e = (lt / 0.35) ** 2
        ribbon(cv, H * (0.78 - 1.4 * e), H * 0.05, H * (0.13 + 2.6 * e), t * 2.2)
        lw = W * LOCK_W
        blitc(cv, asset_w('cokelogo', COKE_LOGO, lw), W / 2, H * 0.44, max(0, 1 - lt / 0.2))
        return
    cv[:] = WHT
    k = int((lt - 0.35) * FPS)
    hw = {'tall': 0.92, 'mid': 0.72, 'sq': 0.6, 'wide': 0.5}[LAY] * W
    r = R(k // 3 + 7)
    ex, ey = place_head(cv, W / 2 + r.uniform(-6, 6) * u, H * 0.47, hw * [0.7, 0.86, 1.0][min(2, k // 3)], r.uniform(-1.5, 1.5))
    glow(cv, ex, ey, 70 * u, 1.0 + 0.4 * (k % 4 < 2))
    l1 = '> MACHINE DETECTED'[:int(max(0, lt - 0.4) * 34)]
    if l1:
        blit(cv, mono(l1, int(26 * u), WHT, RED), W * 0.08, H * 0.84)
    bubbles(cv, t, n=30, seed=9, col=tuple(int(c) for c in RED))

def seg_BUILD(cv, t, f):
    lt = t - 2.6
    if t >= 3.95:
        cv[:] = WHT
        return
    per = 4 if lt < 0.6 else 3 if lt < 1.0 else 2
    k = int(lt * FPS) // per
    img = cover(src_frame(COLL_SRC[k % len(COLL_SRC)]), W, H, zoom=1.05)
    cv[:] = treat(img, 'duo')
    r = R(k)
    ribbon(cv, H * r.uniform(0.15, 0.85), H * 0.06, H * 0.05, k * 1.7, tilt=r.uniform(-0.15, 0.15))
    bubbles(cv, t, n=40, seed=4)

def seg_NAME(cv, t, f):
    lt = t - 4.0
    k = int(lt * FPS)
    if k < 1:
        cv[:] = WHT
        return
    swap = t >= 4.279 - 1e-6
    hw = {'tall': 1.05, 'mid': 0.85, 'sq': 0.72, 'wide': 0.6}[LAY] * W
    if not swap:
        cv[:] = tex(t)
        r = R(k // 2)
        place_head(cv, W / 2 + r.uniform(-12, 12) * u, H * 0.5 + r.uniform(-12, 12) * u, hw)
        im = styled(['ODUMODUBLVCK'], 'huge', int(W * 0.94), int(H * 0.4))
    else:
        cv[:] = WHT
        ribbon(cv, H * 0.72, H * 0.05, H * 0.16, t * 2.0, col=tuple(int(c) for c in RED))
        ex, ey = place_head(cv, W / 2, H * 0.5, hw * 1.1)
        glow(cv, ex, ey, 150 * u, 1.3)
        im = styled(['ODUMODUBLVCK'], 'redtxt', int(W * 0.94), int(H * 0.4))
    im = rscale(im, slam_scale(t, 4.0 if not swap else 4.279))
    bx, by = boil(t, 4.0, 5 * u)
    blitc(cv, im, W / 2 + bx, H * 0.5 + by)
    bubbles(cv, t, n=40, seed=6, col=(255, 255, 255) if not swap else tuple(int(c) for c in RED))

TICK = '  RISE OF THE MACHINE  *  ODUMODUBLVCK  *  ABUJA  *  DEC. 20TH  *  POWERED BY COCA-COLA  *'
def ticker(cv, y, t, fg, bg, speed=1.0):
    im = mono(TICK, int(28 * u), fg, bg, 0.12)
    tw = im.shape[1]
    x = -int((t * 240 * u * speed) % tw)
    while x < W:
        blit(cv, im, x, y)
        x += tw

def seg_TITLE(cv, t, f):
    lt = t - 12.44
    st = 23.88 + math.floor(lt * FPS / 2) * 2 / FPS
    img = cover(src_frame(min(st, 25.8)), W, H, zoom=1.05)
    cv[:] = (treat(img, 'duo') * 0.62).astype(np.uint8)
    bubbles(cv, t, n=50, seed=8)
    ribbon(cv, H * 0.76, H * 0.045, H * 0.11, t * 1.8)
    if LAY in ('tall', 'mid'):
        parts = [(0, 1197), (1197, 1706), (1706, 4229)]
        ys = [0.335, 0.47, 0.6] if LAY == 'tall' else [0.29, 0.465, 0.64]
        widths = [0.62, 0.24, 0.94] if LAY == 'tall' else [0.54, 0.22, 0.9]
        for (a, b), yy, ww, tt in zip(parts, ys, widths, [12.44, 12.719, 13.009]):
            if t < tt:
                continue
            sim = asset_w(f'tp{a}', TITLE[:, a:b], W * ww)
            kk = int((t - tt) * FPS)
            ox, oy = boil(t, tt, 4 * u)
            blitc(cv, rscale(sim, [1.6, 1.2, 1.05][kk] if kk < 3 else 1.0), W / 2 + ox, H * yy + oy)
    else:
        im = asset_w('title', TITLE, W * {'sq': 0.9, 'wide': 0.8}[LAY])
        k = int(lt * FPS)
        bx, by = boil(t, 12.44, 4 * u)
        blitc(cv, rscale(im, [1.7, 1.25, 1.06][k] if k < 3 else 1.0), W / 2 + bx, H * 0.47 + by)
    ticker(cv, int(H * 0.05), t, WHT, RED, 1.0)

END_L = {
    'tall': dict(kal=(0.5, 0.04, 0.12), name=(0.5, 0.105, 0.86), head=(0.5, 0.335, 0.8), title=(0.5, 0.565, 0.9),
                 date=(0.5, 0.625, 0.72), lab=(0.5, 0.665), url=(0.5, 0.695, 0.8), lock=(0.5, 0.79, 0.22), rib=0.885, al='c'),
    'mid': dict(kal=(0.5, 0.04, 0.1), name=(0.5, 0.115, 0.74), head=(0.5, 0.365, 0.54), title=(0.5, 0.605, 0.82),
                date=(0.5, 0.675, 0.62), lab=(0.5, 0.718), url=(0.5, 0.75, 0.7), lock=(0.5, 0.855, 0.17), rib=0.93, al='c'),
    'sq': dict(kal=(0.5, 0.045, 0.085), name=(0.5, 0.125, 0.6), head=(0.5, 0.365, 0.4), title=(0.5, 0.6, 0.72),
               date=(0.5, 0.675, 0.54), lab=(0.5, 0.717), url=(0.5, 0.75, 0.62), lock=(0.5, 0.86, 0.14), rib=0.94, al='c'),
    'wide': dict(kal=(0.06, 0.1, 0.075), name=(0.06, 0.22, 0.42), head=(0.74, 0.46, 0.5), title=(0.06, 0.36, 0.42),
                 date=(0.06, 0.465, 0.32), lab=(0.06, 0.535), url=(0.06, 0.585, 0.4), lock=(0.06, 0.77, 0.11), rib=0.9, al='l'),
}[LAY]

def seg_END(cv, t, f, static=False):
    lt = t - 15.343
    L = END_L
    cv[:] = tex(t)
    bubbles(cv, t, n=44, seed=12)
    ribbon(cv, H * L['rib'], H * 0.035, H * 0.09, t * 1.4)

    def put(im, spec, tt=None):
        x, y = spec[0], spec[1]
        sc = 1.0 if (static or tt is None) else slam_scale(t, tt)
        im2 = rscale(im, sc)
        ox, oy = (0, 0) if static else boil(t, tt or 15.343, 2.0 * u)
        if L['al'] == 'c':
            blitc(cv, im2, W * x + ox, H * y + oy)
        else:
            blit(cv, im2, W * x + ox - (im2.shape[1] - im.shape[1]) / 2, H * y - im2.shape[0] / 2 + oy)
    k = int(lt * FPS)
    hx, hy, hwf = L['head']
    hs = 1.0 if static else [0.55, 0.8, 1.06, 1.0][min(3, k // 2)]
    r = R(k // 3 + 99)
    jx, jy = (0, 0) if static else (r.uniform(-3, 3) * u, r.uniform(-3, 3) * u)
    ex, ey = place_head(cv, W * hx + jx, H * hy + jy, hwf * W * hs)
    pulse = 1.0 if static else 0.9 + 0.5 * max(0, 1 - min([abs(t - kk) for kk in KICKS + [16.0, 16.5]]) / 0.12)
    glow(cv, ex, ey, 90 * u * (hwf / 0.8) ** 0.5 * (1.5 if LAY == 'wide' else 1), pulse)
    put(styled(['ODUMODUBLVCK'], 'huge', int(W * L['name'][2]), int(H * 0.3)), L['name'], 15.343)
    if t >= 15.9 or static:
        put(asset_w('title', TITLE, W * L['title'][2]), L['title'], 15.9)
    if t >= 16.5 or static:
        put(date_img(int(W * L['date'][2])), L['date'], 16.5)
    if t >= 17.386 or static:
        put(mono('GET TICKETS AT', int(19 * u), WHT, None, 0.35), L['lab'] + (0,), 17.386)
        url = archivo('ODUMODUBLVCK.MYFLEXTICKETS.COM', int(W * L['url'][2] * 0.9), RED)
        pad = int(16 * u)
        box = np.zeros((url.shape[0] + 2 * pad, url.shape[1] + 2 * pad, 4), np.uint8)
        box[:, :, :3] = WHT; box[:, :, 3] = 255
        a = url[:, :, 3:4].astype(np.float32) / 255
        box[pad:-pad, pad:-pad, :3] = (box[pad:-pad, pad:-pad, :3] * (1 - a) + url[:, :, :3] * a).astype(np.uint8)
        put(box, L['url'], 17.386)
    if t >= 17.665 or static:
        put(lockup(W * L['lock'][2]), L['lock'], 17.665)
        put(asset_w('kal', KAL, W * L['kal'][2]), L['kal'], 17.665)

SEGS = {'OPEN': seg_OPEN, 'WIPE': seg_WIPE, 'BUILD': seg_BUILD, 'NAME': seg_NAME, 'TITLE': seg_TITLE, 'END': seg_END}

def hud(cv, t, f):
    if not (4.72 <= t < 12.44):
        return
    m = 34 * u
    blit(cv, mono('ODUMODUBLVCK // RISE OF THE MACHINE', int(16 * u), WHT), m, m)
    lw = W * {'tall': 0.17, 'mid': 0.14, 'sq': 0.12, 'wide': 0.075}[LAY]
    lk = lockup(lw, boxed=True)
    bx = W - m - lk.shape[1]; by = m * (2.2 if LAY == 'tall' else 1)
    blit(cv, lk, bx, by)
    blit(cv, mono('ABJ * 20.12', int(16 * u), RED, WHT), m, H * (0.955 if LAY != 'tall' else 0.8) - 16 * u)

FLASH = {4.0: WHT, 12.44: WHT, 15.343: WHT}

def kick_amt(t):
    a = 0.0
    for k in KICKS + EXTRA_HITS:
        d = t - k
        if 0 <= d < 0.15:
            a = max(a, 1 - d / 0.15)
    return a

def post(cv, t, f, static=False):
    a = 0 if static else kick_amt(t)
    if a > 0 and t >= 4.0:
        r = R(f)
        sh = a * 10 * u
        Mx = cv2.getRotationMatrix2D((W / 2, H / 2), r.uniform(-0.5, 0.5) * a, 1 + 0.03 * a)
        Mx[0, 2] += r.uniform(-sh, sh); Mx[1, 2] += r.uniform(-sh, sh)
        cv[:] = cv2.warpAffine(cv, Mx, (W, H), borderMode=cv2.BORDER_REFLECT)
        d = int(a * 7 * u)
        if d > 0:
            out = cv.copy(); out[:, d:, 0] = cv[:, :-d, 0]; out[:, :-d, 2] = cv[:, d:, 2]; cv[:] = out
    hud(cv, t, f)
    o = cv.astype(np.float32) * (1 - (1 - VIG) * 0.5) + GRAIN[f % 6][:, :, None] * 5.0
    cv[:] = np.clip(o, 0, 255).astype(np.uint8)
    if not static:
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

# ---------------------------------------------------------------- flyers
FLY_SRC = {'refresh': 28.40, 'cards': [15.65, 11.15, 29.05, 14.85, 33.75]}

def flyer_main(cv):
    seg_END(cv, 19.5, 0, static=True)

def flyer_refresh(cv):
    img = cover(src_frame(FLY_SRC['refresh']), W, H, zoom=1.0, fy=0.4)
    cv[:] = treat(img, 'duo')
    shade = np.linspace(0.35, 1.0, H)[::-1][:, None, None] ** 0.8
    cv[:] = (cv * (0.55 + 0.45 * (1 - shade))).astype(np.uint8)
    bubbles(cv, 3.3, n=70, seed=21)
    ribbon(cv, H * 0.74, H * 0.04, H * 0.1, 1.1, tilt=-0.06)
    tw = int(W * {'tall': 0.8, 'mid': 0.7, 'sq': 0.6}[LAY])
    im = styled(['REFRESH', 'THE', 'MACHINE'], 'white', tw, int(H * {'tall': 0.13, 'mid': 0.12, 'sq': 0.115}[LAY]))
    blitc(cv, im, W / 2, H * {'tall': 0.34, 'mid': 0.35, 'sq': 0.37}[LAY])
    kal = asset_w('kal', KAL, W * {'tall': 0.13, 'mid': 0.11, 'sq': 0.09}[LAY])
    blitc(cv, kal, W / 2, H * 0.06)
    nm = styled(['ODUMODUBLVCK'], 'huge', int(W * {'tall': 0.7, 'mid': 0.6, 'sq': 0.52}[LAY]), int(H * 0.07))
    blitc(cv, nm, W / 2, H * {'tall': 0.615, 'mid': 0.655, 'sq': 0.68}[LAY])
    dt = date_img(int(W * {'tall': 0.6, 'mid': 0.5, 'sq': 0.44}[LAY]), RED, RED)
    pad = int(16 * u)
    pill = np.zeros((dt.shape[0] + 2 * pad, dt.shape[1] + 3 * pad, 4), np.uint8); pill[:, :, :3] = WHT; pill[:, :, 3] = 255
    a = dt[:, :, 3:4].astype(np.float32) / 255
    reg = pill[pad:pad + dt.shape[0], int(1.5 * pad):int(1.5 * pad) + dt.shape[1], :3]
    reg[:] = (reg * (1 - a) + dt[:, :, :3] * a).astype(np.uint8)
    blitc(cv, pill, W / 2, H * {'tall': 0.8, 'mid': 0.81, 'sq': 0.8}[LAY])
    lk = lockup(W * {'tall': 0.2, 'mid': 0.15, 'sq': 0.13}[LAY])
    blitc(cv, lk, W / 2, H * {'tall': 0.9, 'mid': 0.912, 'sq': 0.925}[LAY])

def flyer_white(cv):
    cv[:] = WHT
    redc = tuple(int(c) for c in RED)
    bubbles(cv, 1.7, n=50, seed=31, col=redc)
    TY = {'tall': 0.545, 'mid': 0.555, 'sq': 0.56}[LAY]
    ribbon(cv, H * TY - H * 0.085, H * 0.012, H * 0.17, -0.24, col=redc, kx=5)
    nm = styled(['ODUMODUBLVCK'], 'redtxt', int(W * 0.88), int(H * 0.1))
    blitc(cv, nm, W / 2, H * {'tall': 0.075, 'mid': 0.085, 'sq': 0.09}[LAY])
    # stop-motion style photo cards
    cw = int(W * {'tall': 0.34, 'mid': 0.27, 'sq': 0.22}[LAY]); chh = int(cw * 1.25)
    pos = [(0.27, 0.29, -7), (0.73, 0.275, 6), (0.5, 0.325, -2)] if LAY == 'tall' else \
          [(0.22, 0.32, -7), (0.78, 0.31, 6), (0.5, 0.34, -2)]
    for k, (px_, py_, ang) in enumerate(pos):
        img = treat(cover(src_frame(FLY_SRC['cards'][k]), cw, chh), 'grade')
        b = int(12 * u)
        card = np.zeros((chh + 2 * b, cw + 2 * b, 4), np.uint8)
        card[:, :, :3] = RED; card[:, :, 3] = 255
        card[b:b + chh, b:b + cw, :3] = img
        hh, ww = card.shape[:2]
        Mr = cv2.getRotationMatrix2D((ww / 2, hh / 2), ang, 1.0)
        cs, sn = abs(Mr[0, 0]), abs(Mr[0, 1])
        nw, nh = int(hh * sn + ww * cs), int(hh * cs + ww * sn)
        Mr[0, 2] += nw / 2 - ww / 2; Mr[1, 2] += nh / 2 - hh / 2
        card = cv2.warpAffine(card, Mr, (nw, nh), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
        blitc(cv, card, W * px_, H * py_)
    ti = asset_w('title', TITLE, W * {'tall': 0.9, 'mid': 0.8, 'sq': 0.72}[LAY])
    blitc(cv, ti, W / 2, H * TY)
    big = styled(['DEC. 20TH'], 'redtxt', int(W * {'tall': 0.8, 'mid': 0.6, 'sq': 0.5}[LAY]), int(H * 0.085))
    blitc(cv, big, W / 2, H * {'tall': 0.68, 'mid': 0.7, 'sq': 0.72}[LAY])
    ab = archivo('ABUJA', int(W * {'tall': 0.4, 'mid': 0.3, 'sq': 0.24}[LAY]), BLK, track=0.3)
    blitc(cv, ab, W / 2, H * {'tall': 0.75, 'mid': 0.785, 'sq': 0.805}[LAY])
    url = archivo('ODUMODUBLVCK.MYFLEXTICKETS.COM', int(W * 0.62), WHT)
    pad = int(14 * u)
    box = np.zeros((url.shape[0] + 2 * pad, url.shape[1] + 2 * pad, 4), np.uint8); box[:, :, :3] = RED; box[:, :, 3] = 255
    a = url[:, :, 3:4].astype(np.float32) / 255
    box[pad:-pad, pad:-pad, :3] = (box[pad:-pad, pad:-pad, :3] * (1 - a) + url[:, :, :3] * a).astype(np.uint8)
    blitc(cv, box, W / 2, H * {'tall': 0.805, 'mid': 0.85, 'sq': 0.86}[LAY])
    tl = lockup(W * {'tall': 0.16, 'mid': 0.12, 'sq': 0.1}[LAY], lcol=RED)
    blitc(cv, tl, W / 2, H * {'tall': 0.905, 'mid': 0.935, 'sq': 0.94}[LAY])
    kal = asset_w('kalr', np.dstack([np.full(KAL.shape[:2] + (3,), RED, np.uint8), KAL[:, :, 3]]), W * 0.08)
    blit(cv, kal, W * 0.04, H * 0.965 - kal.shape[0])

if __name__ == '__main__':
    if OUT == 'flyers':
        names = {'tall': 'story_1080x1920', 'mid': 'feed_1080x1350', 'sq': 'square_1080x1080'}[LAY]
        for nm, fn in [('01-main', flyer_main), ('02-refresh', flyer_refresh), ('03-white', flyer_white)]:
            cv = np.zeros((H, W, 3), np.uint8)
            fn(cv)
            post(cv, 0.0, 0, static=True)
            out = cv2.resize(cv, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
            cv2.imwrite(f'{OUTDIR}/COKE_ROTM_flyer_{nm}_{names}.png', out[:, :, ::-1])
            print('saved', nm, names)
        sys.exit()
    if OUT == 'stills':
        for t in [float(x) for x in sys.argv[4].split(',')]:
            cv2.imwrite(f'{D}/../out/prev_coke_{LAY}_{t:06.2f}.jpg', render(int(round(t * FPS)))[:, :, ::-1], [cv2.IMWRITE_JPEG_QUALITY, 85])
        sys.exit()
    aud = sys.argv[4]
    mx = sys.argv[5] if len(sys.argv) > 5 else '20'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-i', aud, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-maxrate', f'{mx}M', '-bufsize', f'{int(mx) * 2}M', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                          '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
    import time
    t0 = time.time()
    for f in range(N):
        p.stdin.write(render(f).tobytes())
        if f % 150 == 0:
            print(f'{W}x{H} frame {f} {time.time() - t0:.0f}s', flush=True)
    p.stdin.close(); p.wait()
    print('done', OUT, time.time() - t0)
