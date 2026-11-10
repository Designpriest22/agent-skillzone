#!/usr/bin/env python3
"""
Turn a generated fighter sprite sheet (4 rows on flat magenta) into a game atlas.

Rows follow the Odumodu template: run (10), special/shoot (5), jump (7), combo (10).
Steps: key out magenta + despill -> find row bands -> split frames by column gaps ->
align feet to the row baseline -> downsample to the game's ~90px pixel scale -> pack.

Usage: python3 pack-sheet.py <sheet.png> <atlas-name> <out-dir> [--height 90] [--counts 10,5,7,10]
Prints the atlas-meta.json entry as JSON on stdout.
"""
import json
import sys
import numpy as np
from PIL import Image


def _shift_and(m, op):
    p = np.pad(m, 1, constant_values=op == "or" and False)
    acc = p[1:-1, 1:-1].copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            v = p[1 + dy: p.shape[0] - 1 + dy, 1 + dx: p.shape[1] - 1 + dx]
            acc = acc & v if op == "and" else acc | v
    return acc


def erode(m, it=1):
    for _ in range(it):
        m = _shift_and(m, "and")
    return m


def dilate(m, it=1):
    for _ in range(it):
        m = _shift_and(m, "or")
    return m

ANIMS = ["run", "shoot", "jump", "combo"]


def key_magenta(img: Image.Image) -> np.ndarray:
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # Magenta-ish: red and blue both high, green much lower.
    mag = (r - g > 70) & (b - g > 70) & (np.abs(r - b) < 110)
    alpha = np.where(mag, 0, 255).astype(np.uint8)
    # Remove isolated specks and fill pin-holes.
    solid = dilate(erode(alpha > 0, 1), 1) & (alpha > 0)
    alpha = np.where(solid, 255, 0).astype(np.uint8)
    # Despill: pull pink fringe toward neutral on edge pixels.
    edge = solid & ~erode(solid, 2)
    spill = edge & (r > g + 40) & (b > g + 40)
    out = a.copy()
    m = np.minimum(r, b)
    out[..., 0] = np.where(spill, np.minimum(r, g + (m - g) // 3 + 20), r)
    out[..., 2] = np.where(spill, np.minimum(b, g + (m - g) // 3), b)
    rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), alpha])
    return rgba


def bands(alpha: np.ndarray, n: int):
    rows = (alpha > 0).sum(axis=1)
    on = rows > 2
    segs, start = [], None
    for y, v in enumerate(on):
        if v and start is None:
            start = y
        if not v and start is not None:
            segs.append([start, y]); start = None
    if start is not None:
        segs.append([start, len(on)])
    segs = [s for s in segs if s[1] - s[0] > 8]
    while len(segs) > n:  # merge the closest pair (effects floating above a row)
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        i = int(np.argmin(gaps))
        segs[i] = [segs[i][0], segs[i + 1][1]]; del segs[i + 1]
    if len(segs) != n:
        raise SystemExit(f"expected {n} row bands, found {len(segs)}")
    return segs


def frames_in_band(alpha_band: np.ndarray, n: int):
    cols = (alpha_band > 0).sum(axis=0) > 0
    segs, start = [], None
    for x, v in enumerate(cols):
        if v and start is None:
            start = x
        if not v and start is not None:
            segs.append([start, x]); start = None
    if start is not None:
        segs.append([start, len(cols)])
    # Merge tiny fragments (rope tips, spark bits, hats) into their nearest neighbour.
    def merge_closest():
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        widths = [s[1] - s[0] for s in segs]
        # prefer merging the narrowest fragment with its closer side
        k = int(np.argmin(widths))
        if k == 0:
            j = 0
        elif k == len(segs) - 1:
            j = k - 1
        else:
            j = k - 1 if gaps[k - 1] <= gaps[k] else k
        segs[j] = [segs[j][0], segs[j + 1][1]]; del segs[j + 1]
    while len(segs) > n:
        merge_closest()
    while len(segs) < n:  # split the widest at its emptiest column
        w = [s[1] - s[0] for s in segs]
        i = int(np.argmax(w)); s0, s1 = segs[i]
        prof = (alpha_band[:, s0:s1] > 0).sum(axis=0)
        mid = s0 + (s1 - s0) // 4 + int(np.argmin(prof[(s1 - s0) // 4: 3 * (s1 - s0) // 4]))
        segs[i:i + 1] = [[s0, mid], [mid, s1]]
    return segs


def main():
    args = sys.argv[1:]
    src, name, outdir = args[0], args[1], args[2]
    target_h = int(args[args.index("--height") + 1]) if "--height" in args else 90
    counts = [int(c) for c in args[args.index("--counts") + 1].split(",")] if "--counts" in args else [10, 5, 7, 10]

    rgba = key_magenta(Image.open(src))
    alpha = rgba[..., 3]
    rows = bands(alpha, len(counts))

    frames = []  # (row, crop RGBA, baseline offset, anchor x)
    stand_heights = []
    for ri, (y0, y1) in enumerate(rows):
        band = rgba[y0:y1]
        segs = frames_in_band(band[..., 3], counts[ri])
        base = y1  # feet baseline of this row (bottom of band)
        row_frames = []
        for (x0, x1) in segs:
            sub = band[:, x0:x1]
            ys, xs = np.nonzero(sub[..., 3])
            top, bot = ys.min(), ys.max() + 1
            crop = sub[top:bot]
            # anchor x: centre of the lower 35% (feet/legs) for grounded rows, bbox centre for the roll row
            h = bot - top
            if ANIMS[ri] == "jump":
                ax = (xs.min() + xs.max()) / 2
            else:
                low = ys >= bot - max(4, int(h * 0.35))
                ax = (xs[low].min() + xs[low].max()) / 2
            row_frames.append({"crop": crop, "x0": x0, "top": y0 + top, "bot": y0 + bot, "ax": ax, "base": base})
            if ri == 0:
                stand_heights.append(h)
        frames.append(row_frames)

    scale = target_h / float(np.median(stand_heights))
    # Downsample each frame (box filter gives clean pixel clusters), then harden alpha.
    packed = []
    for ri, row in enumerate(frames):
        out = []
        for f in row:
            c = Image.fromarray(f["crop"], "RGBA")
            w = max(1, round(c.width * scale)); h = max(1, round(c.height * scale))
            # premultiply to avoid dark/pink halos, then resize
            arr = np.asarray(c).astype(np.float32) / 255
            arr[..., :3] *= arr[..., 3:4]
            small = Image.fromarray((arr * 255).astype(np.uint8), "RGBA").resize((w, h), Image.BOX)
            s = np.asarray(small).astype(np.float32)
            a = s[..., 3:4] / 255
            rgb = np.where(a > 0, s[..., :3] / np.maximum(a, 1e-3), 0)
            hard = (s[..., 3] > 110).astype(np.uint8) * 255
            frame = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), hard])
            # lift off the baseline (in source px) -> game px
            lift = (f["base"] - f["bot"]) * scale
            ax = f["ax"] * scale
            out.append({"img": frame, "lift": lift, "ax": ax})
        packed.append(out)

    # Quantise colours across the whole atlas for a coherent pixel palette.
    cell_w = int(max(max(fr["ax"], fr["img"].shape[1] - fr["ax"]) for row in packed for fr in row) * 2 + 4)
    cell_h = int(max(fr["img"].shape[0] + fr["lift"] for row in packed for fr in row) + 3)
    ncol = max(counts)
    atlas = np.zeros((cell_h * len(counts), cell_w * ncol, 4), np.uint8)
    ax0 = cell_w // 2
    for ri, row in enumerate(packed):
        for fi, fr in enumerate(row):
            img = fr["img"]; h, w = img.shape[:2]
            x = int(round(ax0 - fr["ax"])); y = int(round(cell_h - fr["lift"] - h))
            x = max(0, min(cell_w - w, x)); y = max(0, y)
            dst = atlas[ri * cell_h + y: ri * cell_h + y + h, fi * cell_w + x: fi * cell_w + x + w]
            m = img[..., 3:4] > 0
            dst[:] = np.where(m, img, dst)
    im = Image.fromarray(atlas, "RGBA")
    rgb = im.convert("RGB").quantize(colors=96, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    out = Image.merge("RGBA", (*rgb.split(), im.getchannel("A")))
    out.save(f"{outdir}/{name}.png", optimize=True)
    meta = {"cell": [cell_w, cell_h], "anchor": [ax0, cell_h], "height": target_h,
            "anims": {a: {"row": i, "n": counts[i]} for i, a in enumerate(ANIMS[: len(counts)])}}
    print(json.dumps({name: meta}))


if __name__ == "__main__":
    main()
