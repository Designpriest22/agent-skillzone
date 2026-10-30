"""Engraved plates: real photographs of real Nigerian places → vector line engravings.

The technique borrows from intaglio engraving (banknotes, stamps, survey plates): parallel
lines that swell in shadow and thin to a hairline in light, bending gently with the form.
Every plate is traced from a verified photograph, so the illustration always depicts a real
place; it is never decoration. Output is pure vector (filled paths), one colour per layer.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def _rdp(pts, eps):
    """Ramer–Douglas–Peucker simplification for an (n,2) array."""
    if len(pts) < 3:
        return pts
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        p, q = pts[a], pts[b]
        seg = q - p
        L = np.hypot(*seg) or 1e-9
        r = pts[a + 1:b] - p
        d = np.abs(seg[0] * r[:, 1] - seg[1] * r[:, 0]) / L
        i = int(np.argmax(d))
        if d[i] > eps:
            m = a + 1 + i
            keep[m] = True
            stack += [(a, m), (m, b)]
    return pts[keep]


def _fmt(v):
    return f"{v:.1f}".rstrip("0").rstrip(".") if abs(v) < 1e5 else f"{v:.0f}"


def _poly_d(upper, lower):
    pts = np.vstack([upper, lower[::-1]])
    return "M" + " ".join(f"{_fmt(x)} {_fmt(y)}" for x, y in pts) + "Z"


def kuwahara(L, r):
    """Edge-preserving smoothing: each pixel takes the mean of its least-varied quadrant.
    Turns photographic noise (foliage, gravel) into calm, drawable tone regions."""
    k = r + 1
    m = ndimage.uniform_filter(L, k, mode="reflect")
    m2 = ndimage.uniform_filter(L * L, k, mode="reflect")
    v = m2 - m * m
    h = r // 2 + (r % 2)
    shifts = [(-h, -h), (-h, h), (h, -h), (h, h)]
    ms = np.stack([np.roll(m, s, (0, 1)) for s in shifts])
    vs = np.stack([np.roll(v, s, (0, 1)) for s in shifts])
    i = np.argmin(vs, 0)
    return np.take_along_axis(ms, i[None], 0)[0]


def fit_crop(W, H, crop, size):
    """Adjust a normalised crop box about its centre so it has the plate's aspect ratio.
    Plates must never stretch the place they depict."""
    x0, y0, x1, y1 = crop
    cw, ch = (x1 - x0) * W, (y1 - y0) * H
    r = size[0] / size[1]
    if cw / ch > r:      # too wide: narrow it
        ncw = ch * r
        cx = (x0 + x1) / 2 * W
        x0, x1 = (cx - ncw / 2) / W, (cx + ncw / 2) / W
    else:                # too tall: shorten it (or widen if it fits)
        nch = cw / r
        if nch <= H:
            cy = (y0 + y1) / 2 * H
            y0, y1 = (cy - nch / 2) / H, (cy + nch / 2) / H
    if y0 < 0:
        y1, y0 = y1 - y0, 0.0
    if y1 > 1:
        y0, y1 = y0 - (y1 - 1), 1.0
    if x0 < 0:
        x1, x0 = x1 - x0, 0.0
    if x1 > 1:
        x0, x1 = x0 - (x1 - 1), 1.0
    return max(x0, 0.0), max(y0, 0.0), min(x1, 1.0), min(y1, 1.0)


def load_tone(path, crop=(0, 0, 1, 1), size=(1600, 1000), clarity=1.2, lo=0.08, hi=0.92, gamma=1.0,
              sky_lift=0.0, mask=None, smooth=0, passes=2):
    """Return darkness field D in [0,1] at `size` (w,h) for the crop box (normalised x0,y0,x1,y1)."""
    im = Image.open(path).convert("RGB")
    W, H = im.size
    x0, y0, x1, y1 = fit_crop(W, H, crop, size)
    im = im.crop((int(round(x0 * W)), int(round(y0 * H)), int(round(x1 * W)), int(round(y1 * H)))).resize(size, Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    for _ in range(passes if smooth else 0):
        L = kuwahara(L, smooth)
    # clarity: large-radius unsharp mask separates forms (rock from bush, water from cliff)
    blur = ndimage.gaussian_filter(L, size[0] * 0.02)
    L = np.clip(L + clarity * (L - blur), 0, 1)
    if sky_lift:  # brighten the upper, low-saturation region so skies engrave as clean hairlines
        sat = a.max(2) - a.min(2)
        yy = np.linspace(1, 0, size[1])[:, None]
        L = np.clip(L + sky_lift * (L > 0.55) * (sat < 0.25) * yy, 0, 1)
    D = 1 - L
    D = np.clip((D - lo) / (hi - lo), 0, 1) ** gamma
    if mask is not None:
        D = D * mask
    return D


def engrave_layer(D, spacing=6.0, angle=0.0, wmax=0.5, wmin=0.06, gate=0.0, bend=0.0, bend_sigma=0.04,
                  step=2.0, eps=0.12, thresh=None, power=1.0, wave=0.0, wave_len=90.0, seed=0):
    """Lines at `angle` degrees across darkness field D (h,w). Returns SVG path data.

    Line half-width = spacing * (wmin + (wmax - wmin) * f(d)), where f rises from 0 at `gate`.
    Where width falls below a hairline and `thresh` is set, the line breaks (open highlights).
    `bend` displaces lines along their normal by the smoothed tone, so they follow the form.
    """
    h, w = D.shape
    th = np.deg2rad(angle)
    u = np.array([np.cos(th), np.sin(th)])        # along the line
    n = np.array([-np.sin(th), np.cos(th)])       # normal
    Ds = ndimage.gaussian_filter(D, spacing * 0.35)
    G = ndimage.gaussian_filter(D, w * bend_sigma) if bend else None
    corners = np.array([[0, 0], [w, 0], [0, h], [w, h]], float)
    c = np.array([w / 2, h / 2])
    pu = (corners - c) @ u
    pn = (corners - c) @ n
    rng = np.random.default_rng(seed)
    out = []
    t = np.arange(pu.min() - step, pu.max() + step, step)
    k = pn.min() - spacing
    while k <= pn.max() + spacing:
        P = c + np.outer(t, u) + k * n
        inside = (P[:, 0] >= -1) & (P[:, 0] <= w + 1) & (P[:, 1] >= -1) & (P[:, 1] <= h + 1)
        if inside.sum() > 2:
            P = P[inside]
            if bend:
                g = ndimage.map_coordinates(G, [P[:, 1], P[:, 0]], order=1, mode="nearest")
                P = P + np.outer((g - 0.5) * bend * spacing, n)
            if wave:
                ph = rng.uniform(0, 6.283)
                s = (P - c) @ u
                P = P + np.outer(np.sin(s / wave_len * 6.283 + ph) * wave * spacing, n)
            d = ndimage.map_coordinates(Ds, [P[:, 1], P[:, 0]], order=1, mode="nearest")
            f = np.clip((d - gate) / (1 - gate), 0, 1) ** power
            hw = spacing * (wmin + (wmax - wmin) * f)
            on = hw > (thresh * spacing if thresh is not None else -1)
            # split into runs where the line is drawn
            idx = np.flatnonzero(np.diff(np.concatenate([[0], on.astype(int), [0]])))
            for a0, b0 in zip(idx[::2], idx[1::2]):
                if b0 - a0 < 3:
                    continue
                seg, hws = P[a0:b0], hw[a0:b0]
                # taper the ends of broken runs like a burin lifting out of the plate
                tl = min(6, (b0 - a0) // 3)
                if thresh is not None and tl > 1:
                    ramp = np.linspace(0.25, 1, tl)
                    hws = hws.copy()
                    if a0 > 0:
                        hws[:tl] *= ramp
                    if b0 < len(on):
                        hws[-tl:] *= ramp[::-1]
                up = _rdp(seg + np.outer(hws, n), eps)
                lo = _rdp(seg - np.outer(hws, n), eps)
                out.append(_poly_d(up, lo))
        k += spacing
    return "".join(out)


def plate(path, w, h, layers, crop=(0, 0, 1, 1), tone=None):
    """Build a plate: returns list of (path_d, layer_name). `layers` = list of dicts for engrave_layer
    plus optional 'tone' overrides; all layers share one darkness field unless they pass their own."""
    tone = tone or {}
    D = load_tone(path, crop=crop, size=(int(w), int(h)), **tone)
    res = []
    for L in layers:
        L = dict(L)
        name = L.pop("name", "lines")
        sub = L.pop("subtract", 0.0)
        Dl = np.clip((D - sub) / (1 - sub), 0, 1) if sub else D
        res.append((engrave_layer(Dl, **L), name))
    return res, D


# --------------------------------------------------------------------------- flow engraving
# Lines follow the form: they run along the local edge direction (the structure tensor of the
# photograph), so a rock face is cut with strokes that describe its streaks and curvature,
# water falls in vertical strokes, and a calm sky becomes level hairlines. Streamlines are
# spaced evenly (Jobard & Lefer 1997) so the plate reads as one engraved surface.
import cv2


def tangent_field(L, sigma_grad=2.0, sigma_tensor=10.0, base_angle=0.0, coherence_gain=2.5, base_weight=0.15):
    g = ndimage.gaussian_filter(L, sigma_grad, mode="nearest")
    gx = ndimage.sobel(g, 1, mode="nearest")
    gy = ndimage.sobel(g, 0, mode="nearest")
    Txx = ndimage.gaussian_filter(gx * gx, sigma_tensor, mode="nearest")
    Txy = ndimage.gaussian_filter(gx * gy, sigma_tensor, mode="nearest")
    Tyy = ndimage.gaussian_filter(gy * gy, sigma_tensor, mode="nearest")
    tr = Txx + Tyy + 1e-9
    det = np.sqrt((Txx - Tyy) ** 2 + 4 * Txy ** 2)
    coh = np.clip((det / tr) * coherence_gain, 0, 1)
    # gradient orientation (doubled angle) → tangent is perpendicular: add pi in doubled space
    c2, s2 = (Txx - Tyy) / (det + 1e-9), 2 * Txy / (det + 1e-9)
    c2, s2 = -c2, -s2
    b = np.deg2rad(base_angle) * 2
    wb = base_weight + (1 - base_weight) * (1 - coh)
    cx = (1 - wb) * c2 + wb * np.cos(b)
    sy = (1 - wb) * s2 + wb * np.sin(b)
    cx = ndimage.gaussian_filter(cx, sigma_tensor * 0.5, mode="nearest")
    sy = ndimage.gaussian_filter(sy, sigma_tensor * 0.5, mode="nearest")
    return cx.astype(np.float32), sy.astype(np.float32)


def _sample(A, x, y):
    h, w = A.shape
    x = min(max(x, 0), w - 1.001)
    y = min(max(y, 0), h - 1.001)
    i, j = int(y), int(x)
    fy, fx = y - i, x - j
    return (A[i, j] * (1 - fx) * (1 - fy) + A[i, j + 1] * fx * (1 - fy)
            + A[i + 1, j] * (1 - fx) * fy + A[i + 1, j + 1] * fx * fy)


def flow_lines(field, shape, dsep=8.0, dtest_ratio=0.55, step=1.6, minlen=12, maxlen=4000,
               region=None, region_stop=None, rotate=0.0, seed_step=None):
    """Evenly spaced streamlines. `region` (bool array) limits where seeds may start; integration
    stops where `region_stop` is False. `rotate` (deg) turns the field (for cross-hatching)."""
    cx, sy = field
    h, w = shape
    mtest = np.zeros((h, w), np.uint8)
    msep = np.zeros((h, w), np.uint8)
    rt = np.deg2rad(rotate)
    lines = []

    def direction(x, y, prev):
        a = 0.5 * np.arctan2(_sample(sy, x, y), _sample(cx, x, y)) + rt
        dx, dy = np.cos(a), np.sin(a)
        if prev is not None and dx * prev[0] + dy * prev[1] < 0:
            dx, dy = -dx, -dy
        return dx, dy

    def trace(x0, y0, sign):
        pts = []
        x, y = x0, y0
        prev = None
        d0 = direction(x, y, None)
        prev = (d0[0] * sign, d0[1] * sign)
        n = 0
        turn = 0.0
        while n < maxlen:
            dx, dy = direction(x, y, prev)
            turn += abs(np.arctan2(prev[0] * dy - prev[1] * dx, prev[0] * dx + prev[1] * dy))
            if turn > 4.2:   # ~240°: stop before a stroke curls into a ring around a blob
                break
            mx, my = x + dx * step * 0.5, y + dy * step * 0.5
            dx2, dy2 = direction(mx, my, (dx, dy))
            x, y = x + dx2 * step, y + dy2 * step
            if not (0 <= x < w and 0 <= y < h):
                break
            if mtest[int(y), int(x)]:
                break
            if region_stop is not None and not region_stop[int(y), int(x)]:
                break
            pts.append((x, y))
            prev = (dx2, dy2)
            n += 1
        return pts

    def stamp(arr):
        t = max(1, int(round(2 * dsep * dtest_ratio)))
        cv2.polylines(mtest, [np.round(arr).astype(np.int32)], False, 1, thickness=t)
        cv2.polylines(msep, [np.round(arr).astype(np.int32)], False, 1, thickness=max(1, int(round(2 * dsep * 0.97))))

    def try_seed(x, y):
        if not (0 <= x < w and 0 <= y < h) or msep[int(y), int(x)]:
            return None
        if region is not None and not region[int(y), int(x)]:
            return None
        a = trace(x, y, 1)
        b = trace(x, y, -1)
        pts = b[::-1] + [(x, y)] + a
        if len(pts) * step < minlen:
            return None
        arr = np.array(pts)
        stamp(arr)
        lines.append(arr)
        return arr

    queue = []
    ss = seed_step or dsep
    grid = [(x, y) for y in np.arange(ss / 2, h, ss * 6) for x in np.arange(ss / 2, w, ss * 6)]
    gi = 0
    while True:
        if not queue:
            found = None
            while gi < len(grid) and found is None:
                found = try_seed(*grid[gi])
                gi += 1
            if found is None:
                # final fine sweep to fill gaps
                if gi >= len(grid) and ss > 0:
                    grid = [(x, y) for y in np.arange(ss / 3, h, ss) for x in np.arange(ss / 3, w, ss)]
                    gi = 0
                    ss = -1
                    continue
                break
            queue.append(found)
        arr = queue.pop()
        # candidate seeds either side, every ~dsep along the line
        d = np.gradient(arr, axis=0)
        nrm = np.stack([-d[:, 1], d[:, 0]], 1)
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
        k = max(1, int(dsep / step))
        for i in range(0, len(arr), k):
            for s in (1, -1):
                p = arr[i] + s * nrm[i] * dsep
                r = try_seed(p[0], p[1])
                if r is not None:
                    queue.append(r)
    return lines


def lines_to_polys(lines, D, dsep, wmax=0.46, wmin=0.03, gate=0.0, power=1.0, thresh=0.05, eps=0.12,
                   taper=8):
    out = []
    Ds = ndimage.gaussian_filter(D, dsep * 0.3)
    for arr in lines:
        if len(arr) < 3:
            continue
        d = ndimage.map_coordinates(Ds, [arr[:, 1], arr[:, 0]], order=1, mode="nearest")
        f = np.clip((d - gate) / (1 - gate), 0, 1) ** power
        hw = dsep * (wmin + (wmax - wmin) * f)
        # burin taper at the very ends of each stroke
        tl = min(taper, len(arr) // 3)
        if tl > 1:
            ramp = np.linspace(0.15, 1, tl)
            hw[:tl] *= ramp
            hw[-tl:] *= ramp[::-1]
        on = hw > thresh * dsep
        tg = np.gradient(arr, axis=0)
        nrm = np.stack([-tg[:, 1], tg[:, 0]], 1)
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
        idx = np.flatnonzero(np.diff(np.concatenate([[0], on.astype(int), [0]])))
        for a0, b0 in zip(idx[::2], idx[1::2]):
            if b0 - a0 < 3:
                continue
            seg, hws, nn = arr[a0:b0], hw[a0:b0].copy(), nrm[a0:b0]
            t2 = min(4, (b0 - a0) // 3)
            if t2 > 1:
                r2 = np.linspace(0.3, 1, t2)
                if a0 > 0:
                    hws[:t2] *= r2
                if b0 < len(arr):
                    hws[-t2:] *= r2[::-1]
            up = _rdp(seg + nn * hws[:, None], eps)
            lo = _rdp(seg - nn * hws[:, None], eps)
            out.append(_poly_d(up, lo))
    return "".join(out)


def edge_fade(h, w, top=0.0, bottom=0.0, left=0.0, right=0.0, noise=0.0, seed=1):
    """Soft vignette mask (1 inside, 0 at faded edges) with an optional irregular, hand-cut edge."""
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]
    m = np.ones((h, w), np.float32)
    rng = np.random.default_rng(seed)
    if noise:
        nz = ndimage.gaussian_filter(rng.standard_normal((h, w)), min(h, w) * 0.03)
        nz = nz / (np.abs(nz).max() + 1e-9) * noise
    else:
        nz = 0
    for v, e in ((y, top), (1 - y, bottom), (x, left), (1 - x, right)):
        if e:
            m = m * np.clip((v + nz) / e, 0, 1) ** 1.5
    return m


def flow_plate(path, w, h, crop=(0, 0, 1, 1), tone=None, field=None, main=None, cross=None, fade=None,
               sky=0.0, holes=(), seed=0):
    """Flow-engraved plate. Returns dict(layer -> path d) and the darkness field.
    `sky` adds a faint even tone to the upper part so the sky is engraved with level hairlines."""
    tone = tone or {}
    D = load_tone(path, crop=crop, size=(int(w), int(h)), **tone)
    L = 1 - D
    if sky:
        y = np.linspace(1, 0, D.shape[0])[:, None]
        D = np.clip(D + sky * y ** 1.5 * (D < 0.25), 0, 1)
    if fade:
        D = D * edge_fade(D.shape[0], D.shape[1], **fade)
    yy, xx = np.mgrid[0:D.shape[0], 0:D.shape[1]]
    for (hx, hy, hr) in holes:   # clear paper around a disc (the sun) so strokes stop short of it
        D = D * np.clip((np.hypot(xx - hx, yy - hy) - hr) / (hr * 0.25), 0, 1)
    fld = tangent_field(L, **(field or {}))
    m = dict(dsep=8.0, wmax=0.46, wmin=0.03, power=1.1, thresh=0.05)
    m.update(main or {})
    lines = flow_lines(fld, D.shape, dsep=m["dsep"])
    res = {"main": lines_to_polys(lines, D, m["dsep"], wmax=m["wmax"], wmin=m["wmin"], power=m["power"],
                                  thresh=m["thresh"])}
    if cross:
        c = dict(dsep=m["dsep"], gate=0.6, rotate=70, wmax=0.32, wmin=0.0, power=1.0, thresh=0.06, minlen=24)
        c.update(cross)
        Dsm = ndimage.gaussian_filter(D, c["dsep"])
        reg = Dsm > c["gate"]
        stop = Dsm > c["gate"] - 0.06
        cl = flow_lines(fld, D.shape, dsep=c["dsep"], region=reg, region_stop=stop, rotate=c["rotate"],
                        minlen=c.get("minlen", 24))
        res["cross"] = lines_to_polys(cl, D, c["dsep"], wmax=c["wmax"], wmin=c["wmin"], gate=c["gate"],
                                      power=c["power"], thresh=c["thresh"])
    return res, D
