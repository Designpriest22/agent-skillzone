#!/usr/bin/env python3
"""Five 5x3 ft flags for ODUMODUBLVCK: Rise of the Machine.
usage: flags.py <dpi> <outdir>   (150 dpi -> 9000x5400 px print files; low dpi for previews)
"""
import sys, os, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = None
DPI = int(sys.argv[1]); OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
D = os.path.dirname(os.path.abspath(__file__))
A = os.environ.get('ASSETS', D + '/../assets/')
FONTS = {'anton': A + 'fonts/Anton.ttf', 'archivo': A + 'fonts/ArchivoBlack.ttf',
         'mono': '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf'}
W, H = 60 * DPI, 36 * DPI
u = H / 1080.0
HOIST = 3 * DPI          # pole-sleeve side (left): keep clear
SAFE = int(1.5 * DPI)    # other edges
RED = (227, 0, 15); BLK = (10, 9, 9); WHT = (242, 239, 234)

HEAD = Image.open(A + 'head.png').convert('RGBA')
TITLE = Image.open(A + 'title-chrome.png').convert('RGBA')
KAL = Image.open(A + 'kal.png').convert('RGBA')
SP = Image.open(A + 'spons.jpg').convert('RGB')
EYE = (678, 696)

# ------------------------------------------------------------------ helpers
_fc = {}
def font(name, px):
    k = (name, px)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FONTS[name], px)
    return _fc[k]

def mask(txt, name, px, track=0.0):
    f = font(name, px)
    if track == 0:
        bb = f.getbbox(txt)
        im = Image.new('L', (bb[2] - bb[0] + 4, bb[3] - bb[1] + 4), 0)
        ImageDraw.Draw(im).text((2 - bb[0], 2 - bb[1]), txt, font=f, fill=255)
    else:
        ws = [f.getlength(c) for c in txt]
        tw = int(sum(ws) + track * px * (len(txt) - 1)) + 8
        im = Image.new('L', (tw, int(px * 1.6)), 0)
        d = ImageDraw.Draw(im); x = 4
        for c, w_ in zip(txt, ws):
            d.text((x, 4), c, font=f, fill=255); x += w_ + track * px
    bb = im.getbbox()
    return im.crop(bb) if bb else im

def fit(txt, name, tw, th=None, track=0.0):
    m = mask(txt, name, 200, track)
    px = 200 * tw / m.width
    if th:
        px = min(px, 200 * th / m.height)
    return mask(txt, name, max(8, int(px)), track)

def solid(m, col):
    im = Image.new('RGBA', m.size, col + (255,)); im.putalpha(m); return im

def boxed(m, fg, bg, padx, pady):
    im = Image.new('RGBA', (m.width + 2 * padx, m.height + 2 * pady), bg + (255,))
    im.paste(Image.new('RGBA', m.size, fg + (255,)), (padx, pady), m)
    return im

def shadowed(m, fg, sh, off):
    im = Image.new('RGBA', (m.width + off, m.height + off), (0, 0, 0, 0))
    im.paste(Image.new('RGBA', m.size, sh + (255,)), (off, off), m)
    im.paste(Image.new('RGBA', m.size, fg + (255,)), (0, 0), m)
    return im

def outline(m, col, th):
    a = np.array(m)
    a = np.pad(a, th + 2)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * th + 1, 2 * th + 1))
    e = cv2.subtract(cv2.dilate(a, k), a)
    return solid(Image.fromarray(e), col)

def put(cv, im, cx, cy, anchor='c'):
    x = int(cx - im.width / 2) if anchor in ('c', 'top') else int(cx)
    y = int(cy - im.height / 2) if anchor in ('c', 'l') else int(cy)
    cv.alpha_composite(im, (x, y))
    return im

def scaled(im, w=None, h=None):
    if w and not h: h = int(im.height * w / im.width)
    if h and not w: w = int(im.width * h / im.height)
    out = im.resize((int(w), int(h)), Image.LANCZOS)
    if w > im.width:   # print upscale: gentle unsharp to keep edges crisp
        arr = np.array(out).astype(np.float32)
        bl = cv2.GaussianBlur(arr, (0, 0), 1.2 * max(1, w / im.width) ** 0.5)
        sh = np.clip(arr + (arr - bl) * 0.6, 0, 255)
        sh[:, :, 3] = arr[:, :, 3]
        out = Image.fromarray(sh.astype(np.uint8), 'RGBA')
    return out

def star(px, col):
    im = Image.new('RGBA', (px, px), (0, 0, 0, 0)); c = px / 2; pts = []
    for k in range(10):
        r = c * (1 if k % 2 == 0 else 0.42); a = -math.pi / 2 + k * math.pi / 5
        pts.append((c + r * math.cos(a), c + r * math.sin(a) + px * 0.04))
    ImageDraw.Draw(im).polygon(pts, fill=col + (255,)); return im

def date_line(tw, a='DEC. 18TH', b='ABUJA', tcol=WHT, scol=RED):
    ma, mb = mask(a, 'archivo', 400, 0.02), mask(b, 'archivo', 400, 0.02)
    st = star(int(ma.height * 0.95), scol); gap = 90
    hh = max(ma.height, st.height); w_ = ma.width + mb.width + st.width + 2 * gap
    im = Image.new('RGBA', (w_, hh), (0, 0, 0, 0))
    im.alpha_composite(solid(ma, tcol), (0, (hh - ma.height) // 2))
    im.alpha_composite(st, (ma.width + gap, (hh - st.height) // 2))
    im.alpha_composite(solid(mb, tcol), (ma.width + st.width + 2 * gap, (hh - mb.height) // 2))
    return scaled(im, w=tw)

def texture(lo, hi, seed, cy=0.45, cx=0.5, spread=1.5, speckle=0.9):
    r = np.random.default_rng(seed)
    s = 4
    h, w = H // s, W // s
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w * cx) / w) ** 2 + ((yy - h * cy) / h) ** 2)
    base = np.clip(1 - d * spread, 0, 1)[:, :, None]
    img = np.array(lo, np.float32) + (np.array(hi, np.float32) - np.array(lo, np.float32)) * base
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LINEAR)
    n = r.random((H // 2 + 1, W // 2 + 1), dtype=np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_NEAREST)
    img *= (1 - speckle / 2 + speckle * n)[:, :, None]
    return np.clip(img, 0, 255).astype(np.uint8)

def to_canvas(arr):
    return Image.fromarray(arr, 'RGB').convert('RGBA')

def glow(cv, x, y, r, inten, col=(255, 25, 25)):
    arr = np.array(cv).astype(np.float32)
    r = int(r); x0, y0 = int(x - r), int(y - r)
    yy, xx = np.mgrid[-r:r, -r:r].astype(np.float32)
    g = np.exp(-(xx ** 2 + yy ** 2) / (2 * (r / 3) ** 2)) * inten
    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W, x0 + 2 * r), min(H, y0 + 2 * r)
    gg = g[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0, None]
    arr[cy0:cy1, cx0:cx1, :3] = np.clip(arr[cy0:cy1, cx0:cx1, :3] + gg * np.array(col), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def grain(cv, amt=7):
    arr = np.array(cv.convert('RGB')).astype(np.int16)
    n = np.random.default_rng(3).normal(0, amt, (H // 2 + 1, W // 2 + 1)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_NEAREST).astype(np.int16)
    return Image.fromarray(np.clip(arr + n[:, :, None], 0, 255).astype(np.uint8), 'RGB')

def mono(txt, px, fg=WHT, bg=None, track=0.1):
    m = mask(txt, 'mono', int(px), track)
    return boxed(m, fg, bg, int(px * 0.5), int(px * 0.35)) if bg else solid(m, fg)

def reticle(cv, x0, y0, x1, y1, col=RED, th=None):
    d = ImageDraw.Draw(cv); th = th or max(3, int(5 * u)); L = int(min(x1 - x0, y1 - y0) * 0.22)
    for (cx, cy, sx, sy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
        d.line([(cx, cy), (cx + sx * L, cy)], fill=col, width=th); d.line([(cx, cy), (cx, cy + sy * L)], fill=col, width=th)

def hud_corners(cv, col=WHT):
    d = ImageDraw.Draw(cv); L = int(70 * u); th = max(3, int(5 * u))
    for (x, y, sx, sy) in [(HOIST, SAFE, 1, 1), (W - SAFE, SAFE, -1, 1), (HOIST, H - SAFE, 1, -1), (W - SAFE, H - SAFE, -1, -1)]:
        d.line([(x, y), (x + sx * L, y)], fill=col, width=th); d.line([(x, y), (x, y + sy * L)], fill=col, width=th)

def ticker(cv, y, txt, fg, bg, h):
    band = Image.new('RGBA', (W, h), bg + (255,))
    m = solid(mask(txt, 'mono', int(h * 0.55), 0.12), fg)
    x = -int(h * 2)
    while x < W:
        band.alpha_composite(m, (x, (h - m.height) // 2)); x += m.width
    cv.alpha_composite(band, (0, int(y)))

def save(cv, name):
    rgb = grain(cv)
    rgb.save(f'{OUT}/{name}.jpg', quality=95, dpi=(DPI, DPI), subsampling=0)
    import img2pdf   # embeds the JPEG losslessly on an exact 60 x 36 in page
    lay = img2pdf.get_layout_fun((img2pdf.in_to_pt(60), img2pdf.in_to_pt(36)))
    open(f'{OUT}/{name}.pdf', 'wb').write(img2pdf.convert(f'{OUT}/{name}.jpg', layout_fun=lay))
    print('saved', name, rgb.size)

TXT_L = HOIST + int(0.5 * DPI)  # left text edge (clear of pole sleeve)

# ------------------------------------------------------------------ 1. THE MACHINE WILL SPEAK (1 Dec)
def flag_speak():
    cv = to_canvas(texture((4, 2, 3), (70, 6, 10), 1, cx=0.7, cy=0.5, spread=1.3, speckle=0.7))
    # the eye: large crop of the key art on the right, scanlined
    hw = int(W * 0.78)
    hd = scaled(HEAD, w=hw)
    s = hw / HEAD.width
    ex, ey = int(W * 0.72), int(H * 0.46)
    put(cv, hd, ex - (EYE[0] - HEAD.width / 2) * s, ey - (EYE[1] - HEAD.height / 2) * s)
    # darken left for type
    arr = np.array(cv).astype(np.float32)
    ramp = np.clip((np.linspace(0, 1, W) - 0.25) / 0.35, 0, 1) ** 1.2
    arr[:, :, :3] *= (0.12 + 0.88 * ramp)[None, :, None]
    arr[::max(2, int(6 * u)), :, :3] *= 0.55     # scanlines
    cv = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    cv = glow(cv, ex, ey, 170 * u, 0.85)
    d = ImageDraw.Draw(cv); th = max(2, int(3 * u))
    d.line([(int(W * 0.45), ey), (W, ey)], fill=RED, width=th); d.line([(ex, 0), (ex, H)], fill=RED, width=th)
    r_ = int(260 * u); reticle(cv, ex - r_, ey - r_, ex + r_, ey + r_)
    put(cv, mono('OPTIC_01 // SIGNAL LOCKED', 26 * u, WHT, RED), ex - r_, ey - r_ - 50 * u, 'tl')
    hud_corners(cv)
    put(cv, mono('> INCOMING TRANSMISSION_', 34 * u, WHT, RED), TXT_L, SAFE + 40 * u, 'tl')
    tw = int(W * 0.42)
    y = int(H * 0.2)
    for ln, st in [('THE MACHINE', 'w'), ('WILL SPEAK', 'r')]:
        m = fit(ln, 'anton', tw, int(H * 0.2))
        im = shadowed(m, WHT, BLK, int(m.height * 0.04)) if st == 'w' else boxed(m, WHT, RED, int(m.height * 0.1), int(m.height * 0.07))
        put(cv, im, TXT_L, y, 'tl'); y += im.height + int(25 * u)
    sub = fit('ON THE FIRST DAY OF DECEMBER', 'archivo', tw, int(H * 0.07), 0.04)
    put(cv, solid(sub, WHT), TXT_L, y + int(30 * u), 'tl'); y += sub.height + int(80 * u)
    big = fit('01.12', 'anton', int(tw * 0.62), int(H * 0.26))
    put(cv, outline(big, WHT, max(4, int(big.height * 0.018))), TXT_L, y, 'tl')
    tt = scaled(TITLE, w=int(W * 0.3))
    put(cv, tt, TXT_L, H - SAFE - tt.height - 40 * u, 'tl')
    nm = solid(fit('ODUMODUBLVCK', 'anton', int(W * 0.17)), WHT)
    put(cv, nm, W - SAFE - nm.width, H - SAFE - nm.height - 40 * u, 'tl')
    save(cv, 'ROTM_FLAG_01_Machine-Will-Speak_5x3ft')

# ------------------------------------------------------------------ 2. THE MACHINE WILL RISE (18 Dec)
def flag_rise():
    cv = to_canvas(texture((150, 0, 10), (240, 20, 30), 2, cx=0.62, spread=1.2, speckle=0.35))
    hd = scaled(HEAD, h=int(H * 0.92))
    arr = np.array(hd); arr[:, :, 3] = (arr[:, :, 3] * 0.28).astype(np.uint8)  # ghosted key art behind numerals
    put(cv, Image.fromarray(arr, 'RGBA'), W * 0.7, H * 0.5)
    tw = int(W * 0.4)
    y = int(H * 0.17)
    put(cv, mono('> SYSTEM STATUS: RISING', 34 * u, WHT, BLK), TXT_L, SAFE + 40 * u, 'tl')
    for ln, st in [('THE MACHINE', 'b'), ('WILL RISE', 'w')]:
        m = fit(ln, 'anton', tw, int(H * 0.2))
        im = boxed(m, WHT, BLK, int(m.height * 0.1), int(m.height * 0.07)) if st == 'b' else boxed(m, RED, WHT, int(m.height * 0.1), int(m.height * 0.07))
        put(cv, im, TXT_L, y, 'tl'); y += im.height
    y += int(60 * u)
    sub = fit('ON THE 18TH DAY OF DECEMBER', 'archivo', tw, int(H * 0.07), 0.04)
    put(cv, solid(sub, WHT), TXT_L, y, 'tl')
    # giant date numerals on the right
    big = fit('18', 'anton', int(W * 0.34), int(H * 0.56))
    put(cv, shadowed(big, WHT, BLK, int(big.height * 0.03)), W * 0.73, H * 0.39)
    dec = fit('DECEMBER', 'anton', int(W * 0.32), int(H * 0.12))
    put(cv, boxed(dec, WHT, BLK, int(dec.height * 0.12), int(dec.height * 0.08)), W * 0.73, H * 0.39 + big.height / 2 + dec.height * 0.95)
    ticker(cv, H - SAFE - int(70 * u), '  RISE OF THE MACHINE  *  ODUMODUBLVCK  *  ABUJA  *  18.12  *', WHT, BLK, int(70 * u))
    hud_corners(cv)
    save(cv, 'ROTM_FLAG_02_Machine-Will-Rise_5x3ft')

# ------------------------------------------------------------------ 3. THE RISE OF THE MACHINE
def flag_title():
    cv = to_canvas(texture((20, 2, 4), (150, 8, 16), 3, cy=0.5, spread=1.25, speckle=0.8))
    # machine light rays behind the title
    arr = np.array(cv).astype(np.float32)
    yy, xx = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
    ang = np.arctan2(yy - H / 8, xx - W / 8)
    rays = (0.5 + 0.5 * np.cos(ang * 18)) ** 6 * 70
    rays = cv2.resize(rays, (W, H))
    arr[:, :, 0] += rays; arr[:, :, 1] += rays * 0.08; arr[:, :, 2] += rays * 0.1
    cv = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')
    th_ = int(100 * u)
    ticker(cv, SAFE, '  ODUMODUBLVCK  *  ABUJA  *  DEC. 18TH  *  KALACIOUS ENTERTAINMENT  *', WHT, RED, th_)
    ticker(cv, H - SAFE - th_, '  THE MACHINE WILL RISE  *  18.12  *  THE MACHINE WILL RISE  *  18.12  *', BLK, WHT, th_)
    the = solid(fit('THE', 'archivo', int(W * 0.12), track=0.3), WHT)
    tt = scaled(TITLE, w=int((W - HOIST - SAFE) * 0.9))
    cxm = HOIST + (W - HOIST - SAFE) / 2
    ty = H * 0.53
    put(cv, the, cxm - tt.width / 2 + the.width / 2, ty - tt.height / 2 - the.height - 50 * u, 'top')
    put(cv, tt, cxm, ty)
    put(cv, mono('ODUMODUBLVCK // RISE OF THE MACHINE // LIVE IN ABUJA', 32 * u, WHT, None), cxm, ty + tt.height / 2 + 90 * u)
    hud_corners(cv)
    save(cv, 'ROTM_FLAG_03_Rise-Of-The-Machine_5x3ft')

# ------------------------------------------------------------------ 4. ODUMODU HEAD
def flag_head():
    cv = to_canvas(texture((110, 4, 10), (235, 24, 32), 4, cy=0.48, spread=1.0, speckle=0.45))
    hd = scaled(HEAD, h=int(H * 0.94))
    cxm = HOIST + (W - HOIST - SAFE) / 2
    put(cv, hd, cxm, H * 0.5)
    s = hd.height / HEAD.height
    cv = glow(cv, cxm + (EYE[0] - HEAD.width / 2) * s, H * 0.5 + (EYE[1] - HEAD.height / 2) * s, 150 * u, 0.7)
    # vertical type on both sides of the head
    L_ = solid(fit('ODUMODUBLVCK', 'anton', int(H * 0.84), int(W * 0.12)), WHT).rotate(90, expand=True)
    R_ = solid(fit('THE MACHINE', 'anton', int(H * 0.84), int(W * 0.12)), WHT).rotate(-90, expand=True)
    put(cv, L_, TXT_L + L_.width / 2, H / 2)
    put(cv, R_, W - SAFE - R_.width / 2, H / 2)
    hud_corners(cv)
    save(cv, 'ROTM_FLAG_04_Odumodu-Head_5x3ft')

# ------------------------------------------------------------------ 5. EVENT BANNER
def flag_event():
    cv = to_canvas(texture((20, 2, 4), (130, 8, 14), 5, cx=0.72, cy=0.45, spread=1.2, speckle=0.85))
    hd = scaled(HEAD, h=int(H * 0.86))
    put(cv, hd, W * 0.73, H * 0.44)
    s = hd.height / HEAD.height
    cv = glow(cv, W * 0.73 + (EYE[0] - HEAD.width / 2) * s, H * 0.44 + (EYE[1] - HEAD.height / 2) * s, 140 * u, 0.7)
    colw = int(W * 0.44)
    y = SAFE + int(30 * u)
    kal = scaled(KAL, h=int(H * 0.11)); put(cv, kal, TXT_L, y, 'tl'); y += kal.height + int(40 * u)
    nm = fit('ODUMODUBLVCK', 'anton', colw, int(H * 0.22))
    nmi = shadowed(nm, WHT, BLK, int(nm.height * 0.035)); put(cv, nmi, TXT_L, y, 'tl'); y += nmi.height + int(40 * u)
    tt = scaled(TITLE, w=colw); put(cv, tt, TXT_L, y, 'tl'); y += tt.height + int(55 * u)
    dl = date_line(int(colw * 0.82)); put(cv, dl, TXT_L, y, 'tl'); y += dl.height + int(55 * u)
    lab = mono('GET TICKETS AT', 30 * u, WHT, None, 0.35); put(cv, lab, TXT_L, y, 'tl'); y += lab.height + int(18 * u)
    url = fit('ODUMODUBLVCK.MYFLEXTICKETS.COM', 'archivo', int(colw * 0.92))
    pad = int(url.height * 0.35)
    put(cv, boxed(url, WHT, RED, pad, pad), TXT_L, y, 'tl')
    # partner strip along the bottom, feathered
    sw = int((W - HOIST - SAFE) * 0.62)
    sp = SP.resize((sw, int(SP.height * sw / SP.width)), Image.LANCZOS).convert('RGBA')
    a = np.ones((sp.height, sp.width), np.float32)
    fe = int(sp.width * 0.04); r = np.linspace(0, 1, fe); a[:, :fe] *= r; a[:, -fe:] *= r[::-1]
    fe2 = int(sp.height * 0.12); r2 = np.linspace(0, 1, fe2); a[:fe2] *= r2[:, None]; a[-fe2:] *= r2[::-1, None]
    sp.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    put(cv, sp, TXT_L, H - SAFE - sp.height, 'tl')
    save(cv, 'ROTM_FLAG_05_Event-Banner_5x3ft')

for fn in [flag_speak, flag_rise, flag_title, flag_head, flag_event]:
    fn()
