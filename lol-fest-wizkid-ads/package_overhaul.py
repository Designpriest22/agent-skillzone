"""Assemble "LOL FEST — SPONSOR CAMPAIGN OVERHAUL" (folders 01-05) and split zips (< 500 MiB each).
   python3 package_overhaul.py <storyboard-dir>"""
import shutil, subprocess, sys, tarfile, zipfile
from pathlib import Path
ROOT = Path(__file__).parent; OUT = ROOT / 'out'; V = OUT / '_work' / 'v2'; F = OUT / '_work' / 'v2flyers'; SB = Path(sys.argv[1])
NAME = 'LOL FEST — SPONSOR CAMPAIGN OVERHAUL'; D = OUT / 'OVERHAUL' / NAME
if D.exists(): shutil.rmtree(D)
R1, R2, R3, R4, R5 = [D / n for n in ['01 — BRAND RESEARCH', '02 — SPONSOR VIDEO ADVERTISEMENTS', '03 — STATIC SOCIAL MEDIA FLYERS', '04 — MASTER FILES', '05 — FINAL EXPORTS']]
for r in (R1, R2, R3, R4, R5): r.mkdir(parents=True)
# 01 research
for f in sorted((ROOT / 'overhaul' / '01-BRAND-RESEARCH').glob('*.md')): shutil.copy(f, R1 / f.name)
shutil.copy(ROOT / 'SPONSOR-INVENTORY.md', R1 / '03_SPONSOR-INVENTORY.md')
shutil.copy(OUT / 'V2-QC-REPORT.md', R1 / '04_QC-REPORT.md')
(R1 / 'audits').mkdir(); [shutil.copy(OUT / n, R1 / 'audits' / n) for n in ['v2-video-content-audit.json', 'v2-flyer-content-audit.json']]
(R1 / 'reference').mkdir(); shutil.copy(ROOT / 'assets/flyer/reference-flyer-with-sponsors.jpg', R1 / 'reference' / 'client-reference-flyer.jpg')
(R1 / 'storyboards').mkdir(); [shutil.copy(f, R1 / 'storyboards' / f.name) for f in sorted(SB.glob('*.jpg'))]
# 02 videos
FMT = {'9x16': 'Vertical 9x16', '4x5': 'Portrait 4x5', '1x1': 'Square 1x1'}
(R5 / 'All Videos').mkdir(); (R5 / 'All Flyers').mkdir()
for sp in sorted(p for p in V.iterdir() if p.is_dir()):
    for f in sorted(sp.glob('*.mp4')):
        k = next(k for k in FMT if f'_{k}_' in f.name); d = R2 / sp.name / FMT[k]; d.mkdir(parents=True, exist_ok=True)
        shutil.copy(f, d / f.name); shutil.copy(f, R5 / 'All Videos' / f.name)
    sb = next(SB.glob(f'{sp.name}_*.jpg'), None)
    if sb: shutil.copy(sb, R2 / sp.name / sb.name)
# 03 flyers (PNG + JPG); 05 flat copies
for sp in sorted(p for p in F.iterdir() if p.is_dir() and p.name[:2].isdigit()):
    for var in sorted(sp.iterdir()):
        d = R3 / sp.name / var.name; d.mkdir(parents=True)
        for f in sorted(var.iterdir()): shutil.copy(f, d / f.name); shutil.copy(f, R5 / 'All Flyers' / f.name)
# 04 masters
m = R4 / 'Video Masters'; m.mkdir(); (m / 'README.txt').write_text('The delivered MP4s are the masters: H.264 High, CRF 17, 1080 px, 25 fps, AAC 192 kbps 48 kHz, -14 LUFS, <= -1 dBTP.\nThey are in 02 and 05; each was rendered once directly from the source frames (no re-encode generation).\nAudio per sponsor: <sponsor>.wav = the supplied "Final (Baba Nla)" 20 s edit with the sponsor SFX layer, loudness-normalised.\n')
(m / 'Audio Mixes').mkdir(); [shutil.copy(f, m / 'Audio Mixes' / f.name) for f in sorted(V.glob('*.wav')) if f.name.count('.') == 1]
[shutil.copy(f, m / 'Audio Mixes' / f.name) for f in sorted(V.glob('*.cues.json'))]
shutil.copytree(F / '_masters', R4 / 'Design Masters (2x PNG)')
e = R4 / 'Editable Project Files'; e.mkdir()
SRC = ['ad20.html', 'flyer2.html', 'lib.js', 'audio.py', 'render20.mjs', 'flyer2_render.mjs', 'audit20.mjs', 'audit_flyer2.mjs', 'qc20.py', 'package_overhaul.py', 'serve.mjs', 'snap.mjs', 'package.json', 'package-lock.json']
with tarfile.open(e / 'LOLFEST_sponsor-overhaul_project-source.tar.gz', 'w:gz') as t:
    for s in SRC: t.add(ROOT / s, arcname=f'project/{s}')
    t.add(ROOT / 'assets', arcname='project/assets')
(e / 'README.txt').write_text("""Editable project: every video and flyer is generated from code, so every layout, colour, timing and sponsor system is editable as text.
  ad20.html      20 s video engine: one visual system per sponsor (SPONS table), ?s=<sponsor>&f=reels|feed|square
  flyer2.html    flyer engine: TH table (palettes), P1 (Signature layout), P2 (Brand Edition layout), DEVICE (backdrops); ?s=&v=1|2&f=feed|story|square&dpr=
  render20.mjs   renders the 39 videos (needs Node 18+, ffmpeg, Playwright Chromium; SONG=<path to Final-Baba-Nla_edit_20s.wav>)
  flyer2_render.mjs, audit20.mjs, audit_flyer2.mjs, qc20.py, package_overhaul.py
The Wizkid footage frames (footage/) are not bundled. They are extracted from the supplied video by prep.py in the original repository.
Open any page in a browser through `node serve.mjs` to preview a sponsor live.
""")
a = R4 / 'Extracted Logos and Assets'; a.mkdir()
shutil.copytree(ROOT / 'assets/logos', a / 'Sponsor Logos (as supplied, transparent PNG)')
shutil.copytree(ROOT / 'assets/flyer/lol-layers', a / 'LOL FEST logo layers')
for n in ['lol-logo@3x.png', 'wizkid-wordmark.png', 'wizkid-portrait-color.png']: shutil.copy(ROOT / 'assets/flyer' / n, a / n)
shutil.copytree(ROOT / 'assets/fonts', a / 'Fonts (OFL)')
(D / 'README.txt').write_text(f"""{NAME}
LIVE OUT LOUD MUSIC FESTIVAL x WIZKID: DECEMBER 13, 2026, EAGLE SQUARE, ABUJA. Tickets: WIZKID.TIX.AFRICA

13 sponsors, each with:
  - one 20 s video in 3 formats (1080x1920, 1080x1350, 1080x1080):
      00:00-00:05  brand-led opening
      00:05-00:15  festival section with the Wizkid footage, the LOL FEST logo, WIZKID, the date and venue, and the ticket CTA (held 3.6 s, from about 11.4 s)
      00:15-00:20  the sponsor logo only
  - 2 flyer concepts in 3 formats (PNG + JPG, plus 2x PNG masters): Creative Variation 01 "Signature" and 02 "Brand Edition".
    Both use the supplied colour portrait, unclipped.

01 BRAND RESEARCH       creative audit, sponsor creative directions, sponsor inventory, QC report, audits, storyboards, client reference
02 VIDEO ADVERTISEMENTS per sponsor: Vertical 9x16 / Portrait 4x5 / Square 1x1, plus a storyboard
03 STATIC FLYERS        per sponsor: Creative Variation 01 / 02
04 MASTER FILES         video masters note and audio mixes, 2x design masters, editable project source, extracted logos and assets
05 FINAL EXPORTS        every video and every flyer in two flat folders

Notes
  - Copy is limited to the approved event information. Only each sponsor's own supplied logo appears, never altered.
  - No QR code: WIZKID.TIX.AFRICA could not be reached from the production environment, so the QR destination could not be verified.
  - Music: "Final (Baba Nla)" as supplied by the client. Confirm sync / usage rights for paid media before trafficking.
""")
# zips (< 500 MiB each)
Z = OUT / 'OVERHAUL'; [z.unlink() for z in Z.glob('*.zip')]
def files(p): return sorted(x for x in p.rglob('*') if x.is_file())
groups = [('Part1_Research-Flyers-Masters', [D / 'README.txt'] + files(R1) + files(R3) + files(R4)), ('Part2_Sponsor-Videos', files(R2)), ('Part3_Final-Exports-Videos', files(R5 / 'All Videos')), ('Part4_Final-Exports-Flyers', files(R5 / 'All Flyers'))]
LIM = 480 * 2**20; parts = []
for name, fl in groups:
    chunk, size, n = [], 0, 1
    for f in fl:
        s = f.stat().st_size
        if chunk and size + s > LIM: parts.append((f'{name}-{n}', chunk)); chunk, size, n = [], 0, n + 1
        chunk.append(f); size += s
    parts.append((f'{name}-{n}' if n > 1 else name, chunk))
for i, (name, fl) in enumerate(parts, 1):
    zp = Z / f'LOLFEST_SPONSOR-OVERHAUL_{i:02d}-of-{len(parts):02d}_{name}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
        for f in fl: z.write(f, f.relative_to(D.parent))
    print(zp.name, f'{zp.stat().st_size / 2**20:.0f} MiB', len(fl), 'files')
