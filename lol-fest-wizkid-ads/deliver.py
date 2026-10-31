"""Build the final delivery: every rendered spot re-muxed with the supplied music edit, organised in folders, zipped.
    python3 deliver.py <dir-with-music-edits>
Music edits (Final-Baba-Nla_edit_{10,15,20}s.wav) are cut from 0:29.45 of the supplied track on a downbeat,
normalised to -14 LUFS / -1.5 dBTP. Video streams are copied untouched."""
import json, re, shutil, subprocess, sys, zipfile
from pathlib import Path
MUS = Path(sys.argv[1]); ROOT = Path(__file__).parent; OUT = ROOT / 'out'
NAME = 'LOLFEST_WIZKID_CAMPAIGN'; D = OUT / 'DELIVERY' / NAME
if D.exists(): shutil.rmtree(D)
D.mkdir(parents=True)
def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout)
videos = sorted(list(OUT.glob('0[1-6]*/*.mp4')) + list(OUT.glob('08*/*/*.mp4')))
for f in videos:
    rel = f.relative_to(OUT); dst = D / rel; dst.parent.mkdir(parents=True, exist_ok=True)
    d = round(dur(f)); wav = MUS / f'Final-Baba-Nla_edit_{d}s.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(f), '-i', str(wav), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-t', f'{dur(f):.3f}', '-movflags', '+faststart', str(dst)], check=True)
print('videos', len(videos))
# 07 project files & assets
P7 = D / '07-PROJECT-FILES-ASSETS'; P7.mkdir(exist_ok=True)
src7 = OUT / '07-PROJECT-FILES-ASSETS'
for sub in ['storyboards']: shutil.copytree(src7 / sub, P7 / sub)
shutil.copy(src7 / 'LOLFEST_WIZKID_editable-project.tar.gz', P7)
(P7 / 'music').mkdir(); [shutil.copy(w, P7 / 'music') for w in sorted(MUS.glob('Final-Baba-Nla_edit_*s.wav'))]
(P7 / 'reports').mkdir()
for r in ['content-audit.json', 'sponsor-content-audit.json', 'QC-REPORT.md']: shutil.copy(OUT / r, P7 / 'reports')
shutil.copy(OUT / '08-SPONSOR-CO-BRANDED-ADS' / 'QC-REPORT-SPONSORS.md', P7 / 'reports')
shutil.copy(ROOT / 'SPONSOR-INVENTORY.md', D / '08-SPONSOR-CO-BRANDED-ADS')
for sb in (OUT / '08-SPONSOR-CO-BRANDED-ADS').glob('*/*_storyboard_9x16.jpg'): shutil.copy(sb, D / '08-SPONSOR-CO-BRANDED-ADS' / sb.parent.name)
print('assembled', D)
