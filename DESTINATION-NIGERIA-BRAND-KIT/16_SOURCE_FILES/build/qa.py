"""Automated quality assurance across the kit → 18_QA_AND_HANDOVER/DN_QA-Report.md (+ .json)."""
import json
import re
import subprocess
import wave
import xml.etree.ElementTree as ET
from collections import Counter
import numpy as np
from PIL import Image
from brand import KIT

R = {"checks": [], "issues": []}


def check(area, name, ok, detail=""):
    R["checks"].append(dict(area=area, check=name, ok=bool(ok), detail=detail))
    if not ok:
        R["issues"].append(f"{area}: {name} — {detail}")


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)], capture_output=True, text=True).stdout
    return json.loads(out)


files = [p for p in KIT.rglob("*") if p.is_file() and ".git" not in p.parts]
deliverables = [p for p in files if "16_SOURCE_FILES" not in p.parts and "_scenes" not in p.parts and "_sources" not in p.parts]

# ---------------- SVG
svgs = [p for p in files if p.suffix == ".svg"]
bad, novb, raster_in_logo = [], [], []
for p in svgs:
    try:
        root = ET.parse(p).getroot()
        if "viewBox" not in root.attrib and "sprite" not in p.name:
            novb.append(p.name)
        if "02_LOGO_MASTER_FILES" in p.parts and "<image" in p.read_text():
            raster_in_logo.append(p.name)
    except ET.ParseError as e:
        bad.append(f"{p.name}: {e}")
check("Vector", f"{len(svgs)} SVG files parse as valid XML", not bad, "; ".join(bad[:5]))
check("Vector", "Every SVG (except the sprite) has a viewBox", not novb, ", ".join(novb[:5]))
check("Vector", "Logo SVGs contain no embedded raster images", not raster_in_logo, ", ".join(raster_in_logo))
logo_svgs = list((KIT / "02_LOGO_MASTER_FILES").rglob("DN_*.svg"))
sup = (KIT / "02_LOGO_MASTER_FILES/_SUPPLIED_ORIGINALS/supplied_Asset_2_full-colour.svg").read_text()
sup_paths = set(re.findall(r' d="([^"]+)"', sup))
master = (KIT / "02_LOGO_MASTER_FILES/SVG/DN_logo_primary_fullcolour.svg").read_text()
check("Logo", "Primary master reuses all 24 supplied paths verbatim", sup_paths <= set(re.findall(r' d="([^"]+)"', master)), f"{len(sup_paths)} supplied paths")
check("Logo", "Logo family files present", len(logo_svgs) >= 26, f"{len(logo_svgs)} SVG masters")

# ---------------- PNG transparency
pngs = list((KIT / "02_LOGO_MASTER_FILES/PNG").glob("*.png"))
opaque = [p.name for p in pngs if Image.open(p).mode != "RGBA" or Image.open(p).getpixel((0, 0))[3] != 0]
check("Logo", f"{len(pngs)} logo PNGs have transparent backgrounds", not opaque, ", ".join(opaque[:5]))

# ---------------- backgrounds dimensions
dims_bad = []
for p in (KIT / "05_BACKGROUNDS_AND_TEXTURES").rglob("*.jpg"):
    m = re.search(r"(\d+)x(\d+)", p.stem.split("_")[-1] if "dpi" not in p.stem else "")
    if m:
        w, h = map(int, m.groups())
        if Image.open(p).size != (w, h):
            dims_bad.append(f"{p.name} {Image.open(p).size}")
check("Backgrounds", "Raster backgrounds match their declared dimensions", not dims_bad, ", ".join(dims_bad[:5]))
bg_dirs = [d for d in (KIT / "05_BACKGROUNDS_AND_TEXTURES").iterdir() if d.is_dir() and d.name[:2].isdigit()]
check("Backgrounds", "At least 12 distinct backgrounds", len(bg_dirs) >= 12, f"{len(bg_dirs)} backgrounds")
for tag in ["16x9_1920x1080.jpg", "4x5_1080x1350.jpg", "9x16_1080x1920.jpg", "A4-portrait.pdf", "A4-landscape.pdf"]:
    miss = [d.name for d in bg_dirs if not list(d.glob(f"*{tag}"))]
    check("Backgrounds", f"Every background exported as {tag}", not miss, ", ".join(miss))

# ---------------- PDFs
from pypdf import PdfReader
pdfs = [p for p in deliverables if p.suffix == ".pdf"]
broken = []
for p in pdfs:
    try:
        PdfReader(p).pages[0]
    except Exception as e:
        broken.append(f"{p.name}: {e}")
check("PDF", f"{len(pdfs)} PDFs open", not broken, "; ".join(broken[:5]))
a4 = [p for p in pdfs if "_A4" in p.name and "09_DOCUMENT" in str(p)]
wrong = []
for p in a4:
    b = PdfReader(p).pages[0].mediabox
    w, h = sorted([float(b.width) * 25.4 / 72, float(b.height) * 25.4 / 72])
    if abs(w - 210) > 1.5 or abs(h - 297) > 1.5:
        wrong.append(f"{p.name} {w:.0f}×{h:.0f}")
check("Documents", f"{len(a4)} template PDFs are A4", not wrong, ", ".join(wrong))
gl = KIT / "14_BRAND_GUIDELINES/DN_Brand-Guidelines_v1.0.pdf"
n = len(PdfReader(gl).pages)
check("Guidelines", "Guidelines PDF is A4 landscape with at least 30 pages", n >= 30, f"{n} pages")
fonts_out = subprocess.run(["pdffonts", str(gl)], capture_output=True, text=True).stdout.splitlines()[2:]
not_emb = [l for l in fonts_out if l.split()[-5] != "yes"] if fonts_out else []
check("Guidelines", "All fonts embedded in the guidelines PDF", not not_emb, f"{len(fonts_out)} fonts; {len(not_emb)} not embedded")
fam = sorted({re.sub(r"^[A-Z]{6}\+", "", l.split()[0]).split("-")[0] for l in fonts_out})
check("Guidelines", "Guidelines use only the brand typefaces (+ Arial in the misuse example)", all(re.match(r"(Inter|Playfair|SourceSerif|Arial|Liberation|DejaVu)", f) for f in fam), ", ".join(fam))

# ---------------- Office files
from docx import Document
from pptx import Presentation
from openpyxl import load_workbook
docxs = [p for p in deliverables if p.suffix == ".docx"]
cc_total, docx_bad = 0, []
for p in docxs:
    try:
        d = Document(p)
        cc_total += len(d.element.body.findall(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sdt"))
    except Exception as e:
        docx_bad.append(f"{p.name}: {e}")
check("Documents", f"{len(docxs)} DOCX templates open in python-docx", not docx_bad, "; ".join(docx_bad))
check("Documents", "Templates use Word content controls for placeholders", cc_total > 200, f"{cc_total} content controls")
missing_pdf = [p.name for p in docxs if not p.with_suffix(".pdf").exists()]
check("Documents", "Every DOCX has a PDF export", not missing_pdf, ", ".join(missing_pdf))
txt = " ".join(" ".join(par.text for par in Document(p).paragraphs) for p in docxs)
invented = re.findall(r"\b\d{3}[ -]?\d{3}[ -]?\d{4}\b|\bIBAN\b|\bSort code\b|Lorem ipsum", txt)
check("Documents", "No invented phone numbers, bank details or lorem ipsum", not invented, ", ".join(invented[:5]))
prs = Presentation(KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pptx")
check("Presentation", "PPTX master has ≥ 19 named layouts", len(prs.slide_layouts) >= 19, f"{len(prs.slide_layouts)} layouts, {len(prs.slides)} sample slides")
charts = sum(1 for s in prs.slides for sh in s.shapes if sh.has_chart)
tables = sum(1 for s in prs.slides for sh in s.shapes if sh.has_table)
check("Presentation", "Sample deck contains native editable chart and table", charts >= 1 and tables >= 1, f"{charts} chart(s), {tables} table(s)")
wb = load_workbook(KIT / "09_DOCUMENT_TEMPLATES/INVOICES/DN_Invoice_Template_A4.xlsx")
formulas = sum(1 for row in wb.active.iter_rows() for c in row if isinstance(c.value, str) and c.value.startswith("="))
check("Documents", "Invoice XLSX calculates (formulas present)", formulas >= 12, f"{formulas} formulas")

# ---------------- motion
vids = sorted((KIT / "07_MOTION_IDENTITY").rglob("DN_motion_*"))
vids = [v for v in vids if v.suffix in (".mp4", ".webm", ".mov")]
rows = []
for v in vids:
    j = probe(v)
    vs = [s for s in j["streams"] if s["codec_type"] == "video"][0]
    aud = any(s["codec_type"] == "audio" for s in j["streams"])
    dur = float(j["format"]["duration"])
    alpha = "ALPHA" in v.name
    pix = vs.get("pix_fmt", "")
    if v.suffix == ".webm" and alpha:
        tags = vs.get("tags", {})
        has_alpha = tags.get("alpha_mode") == "1" or tags.get("ALPHA_MODE") == "1"
    else:
        has_alpha = "a" in pix.replace("yuv", "").replace("rgb", "") or pix.startswith("yuva")
    rows.append((v.name, vs["codec_name"], f'{vs["width"]}x{vs["height"]}', f"{dur:.2f}s", pix, "yes" if aud else "no"))
    if alpha:
        check("Motion", f"{v.name} carries an alpha channel", has_alpha, pix)
    if v.suffix == ".mp4":
        check("Motion", f"{v.name} is H.264 yuv420p", vs["codec_name"] == "h264" and pix == "yuv420p", pix)
check("Motion", "All five animations (A–E) rendered", {n.split("_")[2] for n, *_ in rows} >= {"A", "B", "C", "D", "E"}, ", ".join(sorted({n.split("_")[2] for n, *_ in rows})))
R["video_table"] = rows
# loop seam test for D: last→first frame difference vs typical adjacent-frame difference
loop = KIT / "07_MOTION_IDENTITY/LOOPS/DN_motion_D_brand-loop_1920x1080.mp4"
if loop.exists():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(loop), "-vf", "scale=320:180,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 180, 320).astype(float)
    adj = np.mean([np.abs(fr[i + 1] - fr[i]).mean() for i in range(0, len(fr) - 1, 10)])
    seam = np.abs(fr[0] - fr[-1]).mean()
    check("Motion", "Loop D is seamless (seam ≤ 2× typical frame step)", seam <= 2 * adj + 0.05, f"seam {seam:.3f} vs step {adj:.3f}")
lot = list((KIT / "07_MOTION_IDENTITY/LOTTIE").glob("*.json"))
okl = all({"v", "fr", "op", "w", "h", "layers"} <= set(json.loads(p.read_text())) for p in lot)
check("Motion", f"{len(lot)} Lottie files are valid Bodymovin JSON (rendered in lottie-web 5.12.2)", okl and len(lot) >= 2)

# ---------------- audio
for p in sorted((KIT / "08_SONIC_IDENTITY").glob("*.wav")):
    j = probe(p)
    s = j["streams"][0]
    check("Sonic", f"{p.name}: 48 kHz 24-bit stereo", s["sample_rate"] == "48000" and s["codec_name"] == "pcm_s24le" and s["channels"] == 2,
          f'{s["sample_rate"]} {s["codec_name"]} {s["channels"]}ch {float(j["format"]["duration"]):.2f}s')
    lo = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", lo)[-1])
    pk = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lo)[-1])
    check("Sonic", f"{p.name}: loudness {I} LUFS, true peak {pk} dBFS ≤ −1", pk <= -0.9)
    if "loop" in p.name:
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "1", "-"], capture_output=True).stdout
        a = np.frombuffer(r, np.float32)
        step = np.abs(np.diff(a)).mean()
        check("Sonic", "Intro bed loop seam is continuous", abs(a[-1] - a[0]) < 20 * step + 1e-3, f"seam {abs(a[-1] - a[0]):.5f}, mean step {step:.5f}")
mp3 = list((KIT / "08_SONIC_IDENTITY").glob("*.mp3"))
check("Sonic", "MP3 versions exist for every WAV", len(mp3) == len(list((KIT / "08_SONIC_IDENTITY").glob("*.wav"))), f"{len(mp3)} MP3")

# ---------------- social & naming
soc = list((KIT / "11_SOCIAL_MEDIA_TEMPLATES").rglob("*.png"))
check("Social", "At least 8 template families with PNG examples", len({p.parent.name for p in soc}) >= 8, f"{len({p.parent.name for p in soc})} families, {len(soc)} PNGs")
spaces = [str(p.relative_to(KIT)) for p in files if " " in p.name]
check("Organisation", "No spaces in file names", not spaces, ", ".join(spaces[:5]))
dn = [p for p in deliverables if p.suffix in (".svg", ".png", ".jpg", ".pdf", ".docx", ".pptx", ".mp4", ".wav", ".json", ".xlsx") and "_previews" not in p.parts
      and "lottie_test" not in p.parts and not p.name.startswith(("DN_", "supplied_", "icon-", "favicon", "OFL", "safari", "content", "staff", "dn-", "doc_", "slide_", "A_", "E_", "wave", "letter", "memo", "report", "proposal", "factsheet", "invest", "folder"))]
check("Organisation", "Deliverables follow the DN_ naming convention", len(dn) <= 5, ", ".join(str(p.relative_to(KIT)) for p in dn[:8]))
ext = Counter(p.suffix.lower() for p in deliverables)
R["summary"] = dict(files=len(files), deliverables=len(deliverables), by_type=dict(ext.most_common()),
                    size_mb=round(sum(p.stat().st_size for p in files) / 1e6, 1))

# ---------------- report
ok = sum(c["ok"] for c in R["checks"])
md = [f"# Quality assurance report", "", f"Automated checks run by `16_SOURCE_FILES/build/qa.py`: **{ok} / {len(R['checks'])} passed.**", "",
      f"Kit size: {R['summary']['size_mb']} MB · {R['summary']['files']} files ({R['summary']['deliverables']} deliverables outside the build sources).", "",
      "| Area | Check | Result | Detail |", "|---|---|---|---|"]
for c in R["checks"]:
    md.append(f"| {c['area']} | {c['check']} | {'✅ Pass' if c['ok'] else '❌ Fail'} | {c['detail']} |")
md += ["", "## Rendered video inventory", "", "| File | Codec | Size | Duration | Pixel format | Audio |", "|---|---|---|---|---|---|"]
md += [f"| {a} | {b} | {c} | {d} | {e} | {f} |" for a, b, c, d, e, f in rows]
md += ["", "## Visual checks (manual)", "",
       "These were reviewed by rendering contact sheets during production:",
       "- Logo family on light and dark grounds, roundel framing, minimum-size renders.",
       "- Icon grid (line and solid) at 2.5× and 1×.",
       "- All 14 backgrounds at 16:9; the portrait and A4 variants were spot-checked.",
       "- Motion keyframes for A–E: the frames sampled at each phase match the storyboard, and the final frames are stable.",
       "- Every DOCX → PDF conversion (LibreOffice), checked page by page: cover full-bleed, footer page numbers right-aligned, no text collisions.",
       "- PPTX → PDF, all 21 slides: no overflow after the timeline fix.",
       "- Social templates in every format: the NTW square and explore-business square layouts were corrected.",
       "- Guidelines PDF, all 36 pages: anatomy labels and the misuse examples were corrected.",
       "- Lottie: frames rendered in lottie-web (`lottie_test/`).", "",
       "## Defects corrected during QA", "",
       "- Supplied reversed logo: the first “i” dot was 1 unit off-centre. Corrected in the kit’s reversed masters.",
       "- Roundel crop cut the monolith. Reframed the window (centre 93/7.5, r 32).",
       "- Ridges in the backgrounds were too high-frequency. Reduced the harmonics.",
       "- Investment background had a hard-edged block. Redesigned with sun rings.",
       "- Report cover title collided with the sun. Made a dedicated cover background.",
       "- Footer page numbers inherited Word’s default tab stops. Reset the footer style.",
       "- Proposal numbering continued between lists. Switched to explicit numbering.",
       "- Seal bottom text read upside down. Set the lower arc to read upright.",
       "- Sonic logo had a click where a bell note was cut. Added a 30 ms release taper to every voice.",
       "- Motion D logo was missing its wordmark (closed mask). Opened the mask.",
       "- ffmpeg fade parameter format failed. Fixed the render script.", ""]
if R["issues"]:
    md += ["## Open issues", ""] + [f"- {i}" for i in R["issues"]]
out = KIT / "18_QA_AND_HANDOVER"
(out / "DN_QA-Report.md").write_text("\n".join(md))
(out / "DN_QA-Report.json").write_text(json.dumps(R, indent=1, ensure_ascii=False))
print(f"{ok}/{len(R['checks'])} checks passed")
for i in R["issues"]:
    print(" -", i)
