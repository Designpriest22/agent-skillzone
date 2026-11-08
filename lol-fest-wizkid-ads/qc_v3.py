"""Technical QC of the final sponsor ads + flyers -> out/FINAL-QC-REPORT.md"""
import json, re, subprocess, sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).parent; OUT = ROOT / 'out'; V = OUT / '_work' / 'v3'; F = OUT / '_work' / 'v2flyers'
SIZE = {'9x16': (1080, 1920), '4x5': (1080, 1350), '1x1': (1080, 1080)}
def probe(f):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(f)], capture_output=True, text=True).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video'); a = next(s for s in j['streams'] if s['codec_type'] == 'audio'); return v, a, float(j['format']['duration'])
def loud(f):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr; s = e[e.rfind('Summary'):]
    return float(re.search(r'I:\s+(-?[\d.]+)', s).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+)', s).group(1))
va = {r['id']: r for r in json.loads((OUT / 'v3-video-content-audit.json').read_text())}
fa = {r['id']: r for r in json.loads((OUT / 'v2-flyer-content-audit.json').read_text())}
rows, bad = [], 0
for f in sorted(V.glob('*/*.mp4')):
    v, a, d = probe(f); fmt = re.search(r'_(9x16|4x5|1x1)_', f.name).group(1); I, tp = loud(f)
    ok = abs(d - 15) < .021 and (v['width'], v['height']) == SIZE[fmt] and v['r_frame_rate'] == '25/1' and v['codec_name'] == 'h264' and a['codec_name'] == 'aac' and abs(I + 14) <= 1.5 and tp <= -.9
    bad += not ok; rows.append(f"| {f.parent.name} | {f.name} | {d:.3f} | {v['width']}x{v['height']} | {I:.1f} | {tp:.1f} | {'PASS' if ok else 'FAIL'} |")
fl = sorted(F.glob('[0-9]*/*/*.png')); fbad = sum((Image.open(p).size != SIZE[re.search(r'_(9x16|4x5|1x1)_', p.name).group(1)]) for p in fl)
vp, fp = sum(r['pass'] for r in va.values()), sum(r['pass'] for r in fa.values())
md = ['# LOL FEST × WIZKID: final sponsor assets, QC report', '',
      f'**Ads:** {len(rows)} files. Technical QC passed: {len(rows) - bad}/{len(rows)}. Content audit passed: {vp}/{len(va)}.',
      f'**Flyers:** {len(fl)} PNG (plus matching JPG). Size check passed: {len(fl) - fbad}/{len(fl)}. Content audit passed: {fp}/{len(fa)}.', '',
      'The content audit checks every 2nd frame of every ad and every flyer for:',
      '- approved copy only;',
      "- only the sponsor's own logo;",
      '- the sponsor intro in 0–4 s;',
      '- footage, LOL FEST logo, WIZKID, date and venue in 4–11 s;',
      '- a 4 s end frame (11–15 s) with the sponsor logo, LOL FEST logo, WIZKID, date, venue and WIZKID.TIX.AFRICA.', '',
      'Audio: the supplied "Final (Baba Nla)" 15 s edit (cut on a downbeat, -14 LUFS).', '',
      '| Brand | File | Duration (s) | Size | LUFS | dBTP | Result |', '|---|---|---|---|---|---|---|'] + rows
(OUT / 'FINAL-QC-REPORT.md').write_text('\n'.join(md) + '\n'); print(f'ads {len(rows) - bad}/{len(rows)} tech, {vp}/{len(va)} content; flyers {len(fl) - fbad}/{len(fl)} size, {fp}/{len(fa)} content')
sys.exit(1 if bad or fbad or vp < len(va) or fp < len(fa) else 0)
