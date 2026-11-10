"""One folder per brand (animation + flyers together), zipped in parts < 380 MiB.   python3 package_final.py"""
import shutil, tarfile, zipfile
from pathlib import Path
ROOT = Path(__file__).parent; OUT = ROOT / 'out'; V = OUT / '_work' / 'v3'; F = OUT / '_work' / 'v2flyers'
NAME = 'LOL FEST x WIZKID — SPONSOR ASSETS (FINAL)'; D = OUT / 'FINAL' / NAME
if D.exists(): shutil.rmtree(D)
D.mkdir(parents=True)
FMT = {'9x16': 'Vertical 9x16', '4x5': 'Portrait 4x5', '1x1': 'Square 1x1'}
brands = sorted(p.name for p in V.iterdir() if p.is_dir())
for b in brands:
    bd = D / b; (bd / 'Animation').mkdir(parents=True)
    for f in sorted((V / b).glob('*.mp4')): shutil.copy(f, bd / 'Animation' / f.name)
    for var in sorted((F / b).iterdir()):
        name = {'Creative Variation 01': 'Flyers - Variation 01 (Signature)', 'Creative Variation 02': 'Flyers - Variation 02 (Brand Edition)'}[var.name]
        (bd / name).mkdir()
        for f in sorted(var.iterdir()): shutil.copy(f, bd / name / f.name)
R = D / '_REPORTS & SOURCE'; R.mkdir()
for n in ['FINAL-QC-REPORT.md', 'v3-video-content-audit.json', 'v2-flyer-content-audit.json']: shutil.copy(OUT / n, R / n)
shutil.copy(OUT / 'DELIVERY/LOLFEST_WIZKID_CAMPAIGN/07-PROJECT-FILES-ASSETS/music/Final-Baba-Nla_edit_15s.wav', R / 'Final-Baba-Nla_edit_15s.wav')
with tarfile.open(R / 'LOLFEST_sponsor-assets_project-source.tar.gz', 'w:gz') as t:
    for s in ['sponsors_v3.html', 'flyer2.html', 'lib.js', 'serve.mjs', 'snap.mjs', 'render_v3.mjs', 'render20.mjs', 'flyer2_render.mjs', 'audit_v3.mjs', 'audit_flyer2.mjs', 'qc_v3.py', 'package_final.py', 'audio.py', 'package.json']: t.add(ROOT / s, arcname=f'project/{s}')
    t.add(ROOT / 'assets', arcname='project/assets')
(D / '00_README.txt').write_text(f"""{NAME}
LIVE OUT LOUD MUSIC FESTIVAL · WIZKID · DECEMBER 13, 2026 · EAGLE SQUARE, ABUJA · Tickets: WIZKID.TIX.AFRICA

One folder per sponsor brand. Each folder contains:
  Animation/                                    15 s ad in Vertical 9x16 (1080x1920), Portrait 4x5 (1080x1350) and Square 1x1 (1080x1080), MP4 H.264 + AAC
  Flyers - Variation 01 (Signature)/            flyer in 4x5, 1x1 and 9x16, PNG + JPG
  Flyers - Variation 02 (Brand Edition)/        flyer in 4x5, 1x1 and 9x16, PNG + JPG

Ad structure: 00:00-00:04 sponsor intro · 00:04-00:11 Wizkid footage with the LOL FEST logo, WIZKID, date and venue
              00:11-00:15 end frame (4 s): sponsor logo, LOL FEST logo, WIZKID, DECEMBER 13, 2026, EAGLE SQUARE, ABUJA, GET TICKETS AT WIZKID.TIX.AFRICA
Brand colours: Hennessy red · Desperados red · BEST cream (black BEST logo) · Coca-Cola red and white, with POWERED BY above the Coca-Cola logo
              Blue Poppy teal #07808B and cream #F2F2E9 · every other sponsor in its own palette, no background patterns.
Music: "Final (Baba Nla)" as supplied. Confirm sync / usage rights before paid placement.

_REPORTS & SOURCE: QC report, content audits, the music edit and the editable project source.
""")
Z = OUT / 'FINAL'; [z.unlink() for z in Z.glob('*.zip')]
items = [D / '00_README.txt'] + [D / b for b in brands] + [R]
def size(p): return p.stat().st_size if p.is_file() else sum(f.stat().st_size for f in p.rglob('*') if f.is_file())
LIM = 380 * 2**20; parts, cur, cs = [], [], 0
for it in items:
    s = size(it)
    if cur and cs + s > LIM: parts.append(cur); cur, cs = [], 0
    cur.append(it); cs += s
parts.append(cur)
for i, grp in enumerate(parts, 1):
    names = [g.name.split('-', 1)[-1] if g.name[:2].isdigit() and g.is_dir() else None for g in grp]; label = '_'.join(n for n in names if n)[:80] or 'Reports'
    zp = Z / f'LOLFEST_Sponsor-Assets_FINAL_Part{i:02d}-of-{len(parts):02d}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
        for g in grp:
            for f in ([g] if g.is_file() else sorted(x for x in g.rglob('*') if x.is_file())): z.write(f, f.relative_to(D.parent))
    print(zp.name, f'{zp.stat().st_size / 2**20:.0f} MiB', [g.name for g in grp])
