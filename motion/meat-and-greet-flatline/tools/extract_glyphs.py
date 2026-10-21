import json, itertools
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
import uharfbuzz as hb

LAT = 'fonts/archivo-latin.ttf'; EXT = 'fonts/archivo-latinext.ttf'
charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.:|-/+#%°&'" + "₦"
masters = [(w, g) for w in (-1.0, 0.0, 1.0) for g in (-1.0, 0.0, 1.0)]  # (wdth, wght) normalized

fonts = {LAT: TTFont(LAT), EXT: TTFont(EXT)}
def font_for(ch):
    f = fonts[LAT]
    if ord(ch) in f.getBestCmap(): return LAT
    return EXT

def decompose(rec):
    ops = []; pts = []
    for op, args in rec.value:
        if op == 'moveTo':
            ops.append('M'); pts += list(args[0])
        elif op == 'lineTo':
            ops.append('L'); pts += list(args[0])
        elif op == 'qCurveTo':
            a = list(args)
            if a[-1] is None:
                raise Exception('closed off-curve contour')
            offs = a[:-1]; end = a[-1]
            for i, c in enumerate(offs):
                if i < len(offs) - 1:
                    n = offs[i + 1]
                    e = ((c[0] + n[0]) / 2, (c[1] + n[1]) / 2)
                else:
                    e = end
                ops.append('Q'); pts += [c[0], c[1], e[0], e[1]]
        elif op == 'curveTo':
            ops.append('C'); pts += [v for p in args for v in p]
        elif op in ('closePath', 'endPath'):
            ops.append('Z')
    return ''.join(ops), pts

out = {'upm': 1000, 'chars': {}, 'kern': {}}
avar = fonts[LAT]['avar'].segments
out['avar'] = {k: sorted([[a, b] for a, b in v.items()]) for k, v in avar.items()}
for ch in charset:
    fp = font_for(ch); f = fonts[fp]
    gname = f.getBestCmap()[ord(ch)]
    ms = []; ops0 = None
    for (w, g) in masters:
        gs = f.getGlyphSet(location={'wdth': w, 'wght': g}, normalized=True)
        rp = RecordingPen(); gs[gname].draw(rp)
        ops, pts = decompose(rp)
        if ops0 is None: ops0 = ops
        assert ops == ops0, (ch, 'structure mismatch')
        ms.append([round(gs[gname].width, 2)] + [round(p, 2) for p in pts])
    out['chars'][ch] = {'ops': ops0, 'm': ms}

# kerning via harfbuzz at each master
blob = hb.Blob.from_file_path(LAT); face = hb.Face(blob); hf = hb.Font(face)
def user_loc(w, g):
    wd = 100 + (w * 38 if w < 0 else w * 25)
    wt = 600 + (g * 500 if g < 0 else g * 300)
    return wd, wt
letters = [c for c in charset if c not in ' ' and ord(c) < 0x2000]
for (w, g) in masters:
    pass
kern = {}
for mi, (w, g) in enumerate(masters):
    wd, wt = user_loc(w, g)
    hf.set_variations({'wdth': wd, 'wght': wt})
    adv = {}
    for c in letters:
        buf = hb.Buffer(); buf.add_str(c); buf.guess_segment_properties(); hb.shape(hf, buf, {'kern': True})
        adv[c] = buf.glyph_positions[0].x_advance
    for a, b in itertools.product(letters, letters):
        buf = hb.Buffer(); buf.add_str(a + b); buf.guess_segment_properties(); hb.shape(hf, buf, {'kern': True})
        pos = buf.glyph_positions
        if len(pos) != 2: continue
        k = pos[0].x_advance - adv[a]
        if k != 0:
            kern.setdefault(a + b, [0] * 9)[mi] = k
out['kern'] = kern
json.dump(out, open('glyphs.json', 'w'), separators=(',', ':'))
print(len(out['chars']), 'chars', len(kern), 'kern pairs')
import os; print(os.path.getsize('glyphs.json') // 1024, 'KB')
print(out['avar'])
