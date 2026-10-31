"""Technical QC of every delivered file -> out/QC-REPORT.md
   resolution / fps / duration / frame count / codec, loudness + true peak, unexpected black frames."""
import json, subprocess, re, sys
from pathlib import Path
rows = []; bad = 0
EXPECT = {'1920x1080', '3840x2160', '1080x1920', '1080x1350', '1080x1080'}
for f in sorted(Path('out').glob('0[1-6]*/*.mp4')):
    pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(f)], capture_output=True, text=True).stdout)
    v = next(s for s in pr['streams'] if s['codec_type'] == 'video'); a = next((s for s in pr['streams'] if s['codec_type'] == 'audio'), None)
    res = f"{v['width']}x{v['height']}"; fps = eval(v['r_frame_rate']); dur = float(pr['format']['duration']); nf = int(v.get('nb_frames', 0))
    m = re.search(r'_(\d+)x(\d+)_', f.name); want = f"{m.group(1)}x{m.group(2)}"
    want_d = int(re.search(r'_(\d+)s_', f.name).group(1))
    lo = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', lo)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', lo)[-1])
    bl = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-vf', 'blackdetect=d=0.5:pix_th=0.06', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
    blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bl)
    issues = []
    if res != want: issues.append(f'res {res}!={want}')
    if abs(dur - want_d) > .05: issues.append(f'dur {dur:.2f}')
    if nf and nf != round(want_d * fps): issues.append(f'frames {nf}')
    if v['codec_name'] != 'h264' or v.get('pix_fmt') != 'yuv420p': issues.append('codec')
    if not a or a['codec_name'] != 'aac': issues.append('audio codec')
    if not (-15 <= I <= -13): issues.append(f'loudness {I}')
    if TP > -1.0: issues.append(f'true peak {TP}')
    if blacks: issues.append('black ' + ','.join(f'{s}-{e}' for s, e in blacks))
    bad += bool(issues)
    rows.append(f"| {f.parent.name[:2]} | `{f.name}` | {res} | {fps:g} | {dur:.2f}s | {nf} | {I:.1f} | {TP:.1f} | {f.stat().st_size/1e6:.1f} MB | {'PASS' if not issues else 'CHECK: ' + '; '.join(issues)} |")
hdr = "| dir | file | res | fps | dur | frames | LUFS | dBTP | size | QC |\n|---|---|---|---|---|---|---|---|---|---|\n"
Path('out/QC-REPORT.md').write_text('# Technical QC\n\n' + hdr + '\n'.join(rows) + '\n')
print(hdr + '\n'.join(rows)); print('ISSUES' if bad else 'ALL FILES PASS', bad)
