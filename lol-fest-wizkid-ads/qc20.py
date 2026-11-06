"""Technical QC of the v2 sponsor overhaul: python3 qc20.py  ->  out/V2-QC-REPORT.md
Videos: exactly 20.00 s, size per format, 25 fps CFR, H.264 High yuv420p, AAC 48 kHz, -14 LUFS (+/-1), true peak <= -1.0 dBTP,
plus the content audit (out/v2-video-content-audit.json). Flyers: pixel size per format + content audit (out/v2-flyer-content-audit.json)."""
import json, re, subprocess, sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).parent; OUT = ROOT / 'out'; V = OUT / '_work' / 'v2'; F = OUT / '_work' / 'v2flyers'
SIZE = {'9x16': (1080, 1920), '4x5': (1080, 1350), '1x1': (1080, 1080)}
def probe(f):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(f)], capture_output=True, text=True).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video'); a = next(s for s in j['streams'] if s['codec_type'] == 'audio')
    return v, a, float(j['format']['duration'])
def loud(f):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = e[e.rfind('Summary'):]; return float(re.search(r'I:\s+(-?[\d.]+)', s).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+)', s).group(1))
va = {r['id']: r for r in json.loads((OUT / 'v2-video-content-audit.json').read_text())}
fa = {r['id']: r for r in json.loads((OUT / 'v2-flyer-content-audit.json').read_text())}
rows, bad = [], 0
for f in sorted(V.glob('*/*.mp4')):
    v, a, d = probe(f); fmt = re.search(r'_(9x16|4x5|1x1)_', f.name).group(1); I, tp = loud(f)
    fid = {'9x16': 'reels', '4x5': 'feed', '1x1': 'square'}[fmt]
    checks = {'dur': abs(d - 20) < .021, 'size': (v['width'], v['height']) == SIZE[fmt], 'fps': v['r_frame_rate'] == '25/1', 'h264': v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p',
              'aac48': a['codec_name'] == 'aac' and a['sample_rate'] == '48000', 'lufs': abs(I + 14) <= 1, 'tp': tp <= -1.0}
    ok = all(checks.values()); bad += not ok
    rows.append((f.parent.name, f.name, f'{d:.3f}', f"{v['width']}x{v['height']}", I, tp, ok, [k for k, x in checks.items() if not x]))
fl, fbad = [], 0
for p in sorted(F.glob('[0-9]*/*/*.png')):
    w, h = Image.open(p).size; fmt = re.search(r'_(9x16|4x5|1x1)_', p.name).group(1); ok = (w, h) == SIZE[fmt]; fbad += not ok; fl.append((p.name, f'{w}x{h}', ok))
vpass = sum(r['pass'] for r in va.values()); fpass = sum(r['pass'] for r in fa.values())
md = ['# LOL FEST × WIZKID: sponsor campaign overhaul, QC report', '',
      f'**Videos:** {len(rows)} files. Technical QC passed: {len(rows) - bad}/{len(rows)}. Content audit passed: {vpass}/{len(va)}.',
      f'**Flyers:** {len(fl)} PNG (plus matching JPG and 2× masters). Size check passed: {len(fl) - fbad}/{len(fl)}. Content audit passed: {fpass}/{len(fa)}.', '',
      'Content audit (every 2nd frame of every spot):',
      '- approved copy only;',
      "- only the spot's own sponsor logo;",
      '- the sponsor logo in 0–5 s;',
      '- footage, LOL FEST logo, WIZKID, date and venue in 5–15 s;',
      '- WIZKID.TIX.AFRICA held at least 3 s inside 0–15 s;',
      '- 15–20 s shows only the sponsor logo, with no text and no other element.', '',
      '| Sponsor | File | Duration (s) | Size | LUFS | dBTP | Result |', '|---|---|---|---|---|---|---|']
md += [f'| {a} | {b} | {c} | {d} | {i:.1f} | {t:.1f} | {"PASS" if ok else "FAIL " + ",".join(x)} |' for a, b, c, d, i, t, ok, x in rows]
md += ['', '| Spot | CTA first shown (s) | CTA held (s) | Audit |', '|---|---|---|---|'] + [f"| {k} | {r['cta']['first']:.2f} | {r['cta']['heldSeconds']:.2f} | {'PASS' if r['pass'] else 'FAIL'} |" for k, r in sorted(va.items())]
md += ['', '| Flyer | URL px | Venue px | Date cap px | Logo px | Audit |', '|---|---|---|---|---|---|'] + [f"| {k} | {r['sizes']['url']:.0f} | {r['sizes']['venue']:.0f} | {r['sizes']['date']:.0f} | {r['sizes']['logoH']:.0f} | {'PASS' if r['pass'] else 'FAIL'} |" for k, r in sorted(fa.items())]
(OUT / 'V2-QC-REPORT.md').write_text('\n'.join(md) + '\n')
print(f'videos {len(rows) - bad}/{len(rows)} tech, {vpass}/{len(va)} content; flyers {len(fl) - fbad}/{len(fl)} size, {fpass}/{len(fa)} content')
sys.exit(1 if bad or fbad or vpass < len(va) or fpass < len(fa) else 0)
