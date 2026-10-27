"""Procedural print textures (grunge, wood, chalk, aged paper, smoke).

Everything is generated from a fixed seed so rebuilds are reproducible.
Textures are applied as separate image layers over vector type, so the
type stays vector in the PDF and the distress is a controlled raster layer.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PALETTE = {
    'black': (11, 9, 9),
    'char': (42, 37, 36),
    'red': (179, 18, 28),
    'ember': (224, 89, 42),
    'bone': (239, 230, 214),
}


def _value_noise(h, w, cell, rng):
    gh, gw = max(2, h // cell + 2), max(2, w // cell + 2)
    g = Image.fromarray((rng.random((gh, gw)) * 255).astype(np.uint8))
    g = g.resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.asarray(g, dtype=np.float32)[:h, :w] / 255.0


def fbm(h, w, rng, base=256, octaves=6, gain=0.55):
    out = np.zeros((h, w), np.float32)
    amp, tot, cell = 1.0, 0.0, base
    for _ in range(octaves):
        out += amp * _value_noise(h, w, max(2, cell), rng)
        tot += amp
        amp *= gain
        cell //= 2
    return out / tot


def _rgba(alpha, color):
    h, w = alpha.shape
    arr = np.zeros((h, w, 4), np.uint8)
    arr[..., 0], arr[..., 1], arr[..., 2] = PALETTE.get(color, color) if isinstance(color, str) else color
    arr[..., 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


def grunge(size=2400, seed=7, strength=1.0):
    """Alpha map: worn-print specks, blotches and scratches."""
    rng = np.random.default_rng(seed)
    h = w = size
    n = fbm(h, w, rng, base=size // 6)
    blot = np.clip((n - 0.62) * 9, 0, 1)               # big worn patches
    fine = fbm(h, w, rng, base=24, octaves=3)
    speck = (rng.random((h, w)) > 0.985).astype(np.float32)
    speck = np.asarray(Image.fromarray((speck * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)), np.float32) / 255
    grain = np.clip((fine - 0.58) * 6, 0, 1) * np.clip((n - 0.35) * 3, 0, 1)
    a = ((blot > 0.5) | (grain > 0.55) | ((speck > 0.5) & (n > 0.42))).astype(np.float32)
    img = Image.fromarray((a * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for _ in range(int(160 * strength)):                # scratches
        x, y = rng.random() * w, rng.random() * h
        ang = rng.normal(0.25, 0.5)
        ln = rng.random() * size * 0.18 + 20
        d.line([(x, y), (x + np.cos(ang) * ln, y + np.sin(ang) * ln)], fill=255,
               width=int(1 + rng.random() * 3))
    a = np.asarray(img, np.float32) * strength
    return a


def wear(size=2400, seed=17):
    """Lighter, crisper wear for type: small chips, sparse specks, fine scratches."""
    rng = np.random.default_rng(seed)
    h = w = size
    n = fbm(h, w, rng, base=size // 5)
    chips = np.clip((fbm(h, w, rng, base=18, octaves=3) - 0.7) * 10, 0, 1) * (n > 0.52)
    grain = (fbm(h, w, rng, base=6, octaves=2) > 0.74) & (n > 0.6)
    speck = rng.random((h, w)) > 0.9965
    a = ((chips > 0.5) | grain | speck).astype(np.float32)
    img = Image.fromarray((a * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for _ in range(90):
        x, y = rng.random() * w, rng.random() * h
        ang = rng.normal(0.3, 0.6)
        ln = rng.random() * size * 0.12 + 20
        d.line([(x, y), (x + np.cos(ang) * ln, y + np.sin(ang) * ln)], fill=255, width=int(1 + rng.random() * 2))
    return np.asarray(img, np.float32)


def drybrush(size=2400, seed=11):
    """Horizontal dry-brush streak gaps for painted lettering."""
    rng = np.random.default_rng(seed)
    h = w = size
    rows = fbm(h, 1, rng, base=6, octaves=4)[:, 0]
    rows = np.repeat(rows[:, None], w, axis=1)
    along = fbm(h, w, rng, base=size // 4, octaves=3)
    streak = np.clip((rows - 0.68) * 8, 0, 1) * np.clip((along - 0.42) * 4, 0, 1)
    speck = np.clip((fbm(h, w, rng, base=12, octaves=2) - 0.66) * 8, 0, 1)
    edge = np.clip((fbm(h, w, rng, base=size // 3, octaves=4) - 0.64) * 7, 0, 1)
    return ((streak > 0.45) | ((speck > 0.6) & (rows > 0.5)) | (edge > 2)).astype(np.float32) * 255


def wood(w=3600, h=1100, seed=3, base=(58, 44, 36), dark=(22, 16, 14), planks=4, stain=0.0):
    rng = np.random.default_rng(seed)
    y = np.arange(h)[:, None].astype(np.float32)
    x = np.arange(w)[None, :].astype(np.float32)
    warp = fbm(h, w, rng, base=400, octaves=4) * 60
    grain = np.sin((y + warp) * 0.35 + fbm(h, w, rng, base=900, octaves=2) * 30) * 0.5 + 0.5
    grain = grain ** 3 * 0.6
    fine = fbm(h, w, rng, base=6, octaves=2)
    knots = np.clip((fbm(h, w, rng, base=300, octaves=3) - 0.7) * 6, 0, 1)
    streaks = fbm(h, w, rng, base=3, octaves=1)
    streaks = np.asarray(Image.fromarray((streaks * 255).astype(np.uint8)).resize((w // 40 + 1, h), Image.BILINEAR).resize((w, h), Image.BICUBIC), np.float32) / 255
    t = np.clip(0.55 * grain + 0.6 * (streaks - 0.5) + 0.25 * fine + 0.5 * knots + 0.15, 0, 1)
    img = np.zeros((h, w, 3), np.float32)
    for c in range(3):
        img[..., c] = base[c] * (1 - t) + dark[c] * t
    ph = h / planks
    for i in range(1, planks):                          # plank seams
        yy = int(i * ph + rng.normal(0, 4))
        img[max(0, yy - 4):yy + 4] *= 0.35
        img[yy + 4:yy + 9] *= 1.12
    wear = fbm(h, w, rng, base=500, octaves=5)
    img *= (0.75 + 0.45 * wear)[..., None]
    if stain:
        st = np.clip((fbm(h, w, rng, base=260, octaves=4) - 0.55) * 4, 0, 1)[..., None] * stain
        img = img * (1 - st) + np.array(PALETTE['red'], np.float32) * 0.55 * st
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')


def chalkboard(w=3000, h=2120, seed=5):
    rng = np.random.default_rng(seed)
    base = np.array([30, 29, 28], np.float32)
    n = fbm(h, w, rng, base=500, octaves=6)
    smear = np.clip((fbm(h, w, rng, base=220, octaves=4) - 0.5) * 2.2, 0, 1)
    fine = rng.random((h, w)).astype(np.float32)
    v = base[None, None, :] * (0.8 + 0.4 * n[..., None]) + (smear * 26)[..., None] + (fine * 8)[..., None]
    return Image.fromarray(np.clip(v, 0, 255).astype(np.uint8), 'RGB')


def chalk_mask(size=1800, seed=9):
    """Alpha for chalk-texture holes in chalk lettering (applied in board colour)."""
    rng = np.random.default_rng(seed)
    a = np.clip((fbm(size, size, rng, base=8, octaves=2) - 0.52) * 5, 0, 1) * 200
    a += (rng.random((size, size)) > 0.93) * 120
    return np.clip(a, 0, 255)


def paper(w=2970, h=4200, seed=4, base=(232, 220, 196)):
    rng = np.random.default_rng(seed)
    n = fbm(h, w, rng, base=700, octaves=6)
    fib = fbm(h, w, rng, base=5, octaves=2)
    stains = np.clip((fbm(h, w, rng, base=600, octaves=4) - 0.6) * 3, 0, 1)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    vig = ((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2
    vig = np.clip(vig - 0.55, 0, 1) ** 1.4
    img = np.array(base, np.float32)[None, None, :] * (0.93 + 0.1 * n[..., None] - 0.05 * fib[..., None])
    burn = np.array([120, 74, 40], np.float32)
    k = np.clip(stains * 0.35 + vig * 0.75, 0, 0.85)[..., None]
    img = img * (1 - k) + burn * k
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')


def smoke(w=3000, h=1800, seed=21, color='bone', density=1.0):
    rng = np.random.default_rng(seed)
    n = fbm(h, w, rng, base=w // 3, octaves=7, gain=0.6)
    n2 = fbm(h, w, rng, base=w // 8, octaves=5)
    yy = np.linspace(0, 1, h)[:, None]
    fall = np.clip(yy * 1.3 - 0.1, 0, 1)                # denser at bottom
    a = np.clip((n * 0.7 + n2 * 0.5 - 0.48) * 2.4, 0, 1) * fall * 170 * density
    return _rgba(a, color)


def board(w=3000, h=2000, seed=31, base=(16, 13, 13)):
    """Subtle dark board / drape texture for black backgrounds."""
    rng = np.random.default_rng(seed)
    n = fbm(h, w, rng, base=w // 4, octaves=6)
    fine = rng.random((h, w)).astype(np.float32)
    v = np.array(base, np.float32)[None, None, :] * (0.7 + 0.6 * n[..., None]) + (fine * 5)[..., None]
    return Image.fromarray(np.clip(v, 0, 255).astype(np.uint8), 'RGB')


def build_all(outdir):
    os.makedirs(outdir, exist_ok=True)

    def save(name, img_fn, **kw):
        p = os.path.join(outdir, name)
        if not os.path.exists(p):
            img = img_fn()
            img.save(p, optimize=True, **kw)
        return p

    g = None
    for color in ('black', 'char', 'red', 'bone', 'ember'):
        def mk(color=color):
            nonlocal g
            if g is None:
                g = grunge()
            return _rgba(g, color)
        save(f'grunge_{color}.png', mk)
    wr = None
    for color in ('black', 'red', 'bone', 'char'):
        def mk3(color=color):
            nonlocal wr
            if wr is None:
                wr = wear()
            return _rgba(wr, color)
        save(f'wear_{color}.png', mk3)
    db = None
    for color in ('black', 'red', 'bone', 'char'):
        def mk2(color=color):
            nonlocal db
            if db is None:
                db = drybrush()
            return _rgba(db, color)
        save(f'drybrush_{color}.png', mk2)
    save('wood_dark.jpg', lambda: wood(), quality=88)
    save('wood_weathered.jpg', lambda: wood(seed=8, base=(92, 80, 70), dark=(40, 33, 30), stain=0.5), quality=88)
    save('wood_tall.jpg', lambda: wood(w=1600, h=3200, seed=12, planks=1, base=(40, 32, 28), dark=(14, 11, 10)).transpose(Image.ROTATE_90) if False else wood(w=3200, h=1600, seed=12, planks=1, base=(40, 32, 28), dark=(14, 11, 10)), quality=88)
    save('chalkboard.jpg', chalkboard, quality=86)
    save('chalk_holes.png', lambda: _rgba(chalk_mask(), (33, 31, 30)))
    save('paper.jpg', paper, quality=86)
    save('smoke_bone.png', lambda: smoke(color='bone'))
    save('smoke_red.png', lambda: smoke(seed=22, color='red', density=1.2))
    save('board_black.jpg', board, quality=86)
    save('board_char.jpg', lambda: board(seed=32, base=(42, 37, 36)), quality=86)
    save('board_red.jpg', lambda: board(seed=33, base=(179, 18, 28)), quality=88)


if __name__ == '__main__':
    import sys
    build_all(sys.argv[1])
