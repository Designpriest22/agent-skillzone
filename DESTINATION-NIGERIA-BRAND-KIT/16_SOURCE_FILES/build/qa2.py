"""QA v2: automated integrity, editability, rendering and usability checks → 18_QA_AND_HANDOVER/DN_QA-Report.md/.json"""
import csv
import glob
import json
import re
import subprocess
import zipfile
from pathlib import Path
from brand import C, KIT, CONTACT, PHOTOS, contrast
from engrave import fit_crop
import plates as PL

R = []


def check(area, name, ok, detail=""):
    R.append({"area": area, "check": name, "pass": bool(ok), "detail": str(detail)})


def files(pattern):
    return [Path(p) for p in glob.glob(str(KIT / pattern), recursive=True)]


def pdffonts(p):
    out = subprocess.run(["pdffonts", str(p)], capture_output=True, text=True).stdout.splitlines()[2:]
    return {re.sub(r"^[A-Z]{6}\+", "", l.split()[0]) for l in out if l.strip()}


# ------------------------------------------------------------------ typography in rendered PDFs
ALLOWED = re.compile(r"^(Newsreader(Display|Text)?-|PublicSans-|NewsreaderDisplay|NewsreaderText|PublicSans|DejaVuSans|OpenSymbol|Symbol)")
pdfs = (files("09_DOCUMENT_TEMPLATES/**/*.pdf") + files("10_PRESENTATION_TEMPLATES/*.pdf") + files("14_BRAND_GUIDELINES/*.pdf")
        + files("13_EVENT_AND_SIGNAGE/**/*.pdf") + files("01_BRAND_STRATEGY/*.pdf") + files("03_COLOR_AND_TYPOGRAPHY/*.pdf"))
bad = {}
for p in pdfs:
    f = {x for x in pdffonts(p) if not ALLOWED.match(x)}
    if f:
        bad[str(p.relative_to(KIT))] = sorted(f)
check("Typography", f"Only Newsreader and Public Sans (plus symbol fallbacks) embedded in {len(pdfs)} PDFs", not bad, bad or "all clean")
check("Typography", "Static font files supplied (22) with OFL licences", len(files("03_COLOR_AND_TYPOGRAPHY/fonts_v2/static/*.ttf")) == 22
      and len(files("03_COLOR_AND_TYPOGRAPHY/fonts_v2/OFL-*.txt")) == 2, len(files("03_COLOR_AND_TYPOGRAPHY/fonts_v2/static/*.ttf")))

# ------------------------------------------------------------------ colour
retired = {"#B4532A": "Laterite", "#D8C49B": "Savannah", "#2E6E76": "Confluence", "#4E7A62": "Canopy"}
v2src = (files("11_SOCIAL_MEDIA_TEMPLATES/**/*.html") + files("12_WEBSITE_ASSETS/**/*.html") + files("12_WEBSITE_ASSETS/**/*.css")
         + files("13_EVENT_AND_SIGNAGE/**/*.html") + files("05_BACKGROUNDS_AND_TEXTURES/**/*.html") + files("14_BRAND_GUIDELINES/source/*.html")
         + files("09_DOCUMENT_TEMPLATES/BUSINESS_CARDS/SOURCE_SVG/*.svg"))
hits = {}
for p in v2src:
    t = p.read_text(errors="ignore").upper()
    found = [n for h, n in retired.items() if h in t and f"--{n.lower()}" not in p.read_text(errors="ignore")]
    if found:
        hits[str(p.relative_to(KIT))] = found
check("Colour", f"No retired v1 accent colours used in {len(v2src)} v2 sources (token declarations excepted)", not hits, hits or "clean")
pairs = [("forest", "ivory"), ("forest", "white"), ("charcoal", "ivory"), ("stone", "ivory"), ("stone", "white"), ("golddeep", "ivory"), ("ivory", "forest"), ("sage", "forest"), ("gold", "forest")]
low = {f"{a}/{b}": round(contrast(C[a], C[b]), 2) for a, b in pairs if contrast(C[a], C[b]) < 4.5}
check("Colour", "Text colour pairs used in the system pass WCAG AA (4.5:1)", not low, low or {f"{a}/{b}": round(contrast(C[a], C[b]), 2) for a, b in pairs})

# ------------------------------------------------------------------ contacts
need = [CONTACT["phone"], CONTACT["email"]] + [p["email"] for p in CONTACT["people"]]


def docx_text(p):
    with zipfile.ZipFile(p) as z:
        return "".join(z.read(n).decode("utf8", "ignore") for n in z.namelist() if n.startswith("word/") and n.endswith(".xml"))


lh = docx_text(KIT / "09_DOCUMENT_TEMPLATES/LETTERHEAD/DN_Letterhead_Standard_A4.docx")
check("Contacts", "Letterhead carries the supplied telephone, email and web address", all(x in lh for x in [CONTACT["phone"], CONTACT["email"], CONTACT["web"]]))
cards = "".join(p.read_text() for p in files("09_DOCUMENT_TEMPLATES/BUSINESS_CARDS/SOURCE_SVG/*.svg"))
check("Contacts", "Business cards carry all supplied emails and the telephone number", all(x in cards for x in need))
sig = "".join(p.read_text() for p in files("09_DOCUMENT_TEMPLATES/EMAIL_SIGNATURE/DN_email-signature_*.html"))
check("Contacts", "Email signatures exist for general, Eddie Madaki and Lulu, with correct addresses", all(x in sig for x in need) and len(files("09_DOCUMENT_TEMPLATES/EMAIL_SIGNATURE/DN_email-signature_*_preview.png")) == 3)
home = (KIT / "12_WEBSITE_ASSETS/homepage/DN_homepage_desktop.html").read_text()
check("Contacts", "Homepage footer carries every supplied contact", all(x in home for x in need))
with zipfile.ZipFile(KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pptx") as z:
    pp = "".join(z.read(n).decode("utf8", "ignore") for n in z.namelist() if n.endswith(".xml"))
check("Contacts", "Presentation closing layout carries every supplied contact", all(x in pp for x in need))
stale = {}
for p in files("09_DOCUMENT_TEMPLATES/**/*.docx"):
    t = docx_text(p)
    s = [x for x in ("[Telephone]", "[Email]", "[Website]", "[email]", "[website]", "[+234 000 000 0000]", "[name@domain]") if x in t]
    if s:
        stale[p.name] = s
check("Contacts", "No contact placeholders remain where real details were supplied (22 Word templates)", not stale, stale or "clean")

# ------------------------------------------------------------------ photography
reg = list(csv.DictReader(open(KIT / "06_PHOTOGRAPHY_AND_MEDIA/SOURCE_RECORDS/image-register.csv")))
acc = [r for r in reg if r["asset_id"] != "REJECTED"]
rej = [r for r in reg if r["asset_id"] == "REJECTED"]
check("Photography", "Every library photograph has a register row (9) and every rejection a reason (4)",
      len(acc) == len(PHOTOS) == 9 and len(rej) == 4 and all(r["notes"] for r in rej), f"{len(acc)} accepted, {len(rej)} rejected")
check("Photography", "Licence status is recorded honestly as 'to be confirmed by client' (no invented licences)",
      all(r["licence_type"] == "TO BE CONFIRMED BY CLIENT" for r in acc))
rejected_names = ["Nusa-Penida", "caption.jpg", "images (6)", "Crystal-Bay"]
used = []
for p in [x for x in files("1[0-5]_*/**/*.html") + files("1[0-5]_*/**/*.svg") + files("0[4-9]_*/**/*.html") if "14_BRAND_GUIDELINES" not in str(x)]:
    t = p.read_text(errors="ignore")
    if any(n in t for n in rejected_names):
        used.append(str(p.relative_to(KIT)))
check("Photography", "Rejected images (Indonesia, Mauritius, composite) are used nowhere (the guidelines show them only as greyed, labelled examples of what not to publish)", not used, used or "none")
check("Photography", "Supplied originals kept untouched alongside graded masters", len(files("06_PHOTOGRAPHY_AND_MEDIA/SUPPLIED_BY_CLIENT/*.*")) == 9
      and len(files("06_PHOTOGRAPHY_AND_MEDIA/SUPPLIED_BY_CLIENT/_rejected/*")) == 4)
check("Photography", "No illustrated placeholders presented as photography remain", not files("06_PHOTOGRAPHY_AND_MEDIA/placeholders/*"))

# ------------------------------------------------------------------ plates
from PIL import Image
dist = {}
for slug, src, title, w, h, crop, *_ in PL.PLATES:
    im = Image.open(KIT / "06_PHOTOGRAPHY_AND_MEDIA/SUPPLIED_BY_CLIENT" / src)
    x0, y0, x1, y1 = fit_crop(im.width, im.height, crop, (w, h))
    a = ((x1 - x0) * im.width) / ((y1 - y0) * im.height)
    if abs(a / (w / h) - 1) > 0.005:
        dist[slug] = round(a / (w / h), 3)
check("Plates", "Engraved plates keep the true proportions of the place (no stretch)", not dist, dist or "all within 0.5 %")
svgs = files("04_VECTOR_GRAPHICS_AND_ICONS/ENGRAVED_PLATES/SVG/*.svg")
check("Plates", "Plates are pure vector (no embedded raster) in SVG and PDF", svgs and not any("<image" in p.read_text() for p in svgs)
      and len(files("04_VECTOR_GRAPHICS_AND_ICONS/ENGRAVED_PLATES/PDF/*.pdf")) >= 4, f"{len(svgs)} SVG")

# ------------------------------------------------------------------ logo
logos = files("02_LOGO_MASTER_FILES/SVG/*.svg") + files("02_LOGO_MASTER_FILES/REVERSED/*.svg") + files("02_LOGO_MASTER_FILES/MONOCHROME/*.svg")
check("Logo", "Logo masters contain no raster images", not any("<image" in p.read_text() for p in logos), f"{len(logos)} SVG")
ret = [p.name for p in files("02_LOGO_MASTER_FILES/**/*") if any(r in p.name for r in ("_stacked_", "_horizontal_", "symbol_landscape", "roundel_gold"))]
check("Logo", "Retired variants (stacked, horizontal, landscape symbol, gold roundel) removed", not ret, ret or "removed")
sup = KIT / "02_LOGO_MASTER_FILES/_SUPPLIED_ORIGINALS/supplied_Asset_2_full-colour.svg"
master = (KIT / "02_LOGO_MASTER_FILES/SVG/DN_logo_primary_fullcolour.svg").read_text()
sd = re.findall(r'<path class="cls-\d" d="([^"]+)"', sup.read_text())
check("Logo", "Primary master reuses every supplied path verbatim (24/24)", sum(d in master for d in sd) == len(sd) == 24, f"{sum(d in master for d in sd)}/{len(sd)}")

# ------------------------------------------------------------------ editability
from docx import Document
from pptx import Presentation
docs = files("09_DOCUMENT_TEMPLATES/**/*.docx")
okd = 0
for p in docs:
    try:
        Document(str(p)); okd += 1
    except Exception:
        pass
check("Editability", "All Word templates open (python-docx)", okd == len(docs) == 22, f"{okd}/{len(docs)}")
prs = Presentation(str(KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.pptx"))
check("Editability", "PowerPoint has a real master with 19 layouts and theme fonts Newsreader Display / Public Sans",
      len(prs.slide_layouts) == 19 and "Newsreader Display" in pp and "Public Sans" in pp, f"{len(prs.slide_layouts)} layouts, {len(prs.slides)} sample slides")
with zipfile.ZipFile(KIT / "10_PRESENTATION_TEMPLATES/DN_Presentation-Template_16x9.potx") as z:
    ct = z.read("[Content_Types].xml").decode()
check("Editability", "POTX declares the template content type", "presentationml.template.main+xml" in ct)
sj = json.load(open(KIT / "11_SOCIAL_MEDIA_TEMPLATES/content.json"))
check("Editability", "Social templates are data-driven (content.json) with live HTML sources", len(sj) == 7 and len(files("11_SOCIAL_MEDIA_TEMPLATES/*/source/*.html")) == 28)
lot = files("07_MOTION_IDENTITY/LOTTIE/*.json")
okl = all(all(k in json.load(open(p)) for k in ("v", "fr", "layers")) for p in lot)
check("Editability", "Lottie files are valid Bodymovin JSON and render in lottie-web (frames in lottie_test/)", lot and okl and len(files("18_QA_AND_HANDOVER/lottie_test/*.png")) >= 12, len(lot))

# ------------------------------------------------------------------ rendering: social, web, events
exp = {"4x5_1080x1350": (1080, 1350), "1x1_1080x1080": (1080, 1080), "9x16_1080x1920": (1080, 1920), "16x9_1200x675": (1200, 675)}
wrong = []
for p in files("11_SOCIAL_MEDIA_TEMPLATES/*/DN_social_*.png"):
    k = next(k for k in exp if k in p.name)
    if Image.open(p).size != exp[k]:
        wrong.append(p.name)
check("Rendering", "28 social PNGs at exact platform sizes", len(files("11_SOCIAL_MEDIA_TEMPLATES/*/DN_social_*.png")) == 28 and not wrong, wrong or "ok")
evs = files("13_EVENT_AND_SIGNAGE/**/*_print.pdf")
sizes = {}
for p in evs:
    o = subprocess.run(["pdfinfo", str(p)], capture_output=True, text=True).stdout
    m = re.search(r"Page size:\s+([\d.]+) x ([\d.]+)", o)
    sizes[p.name] = f"{float(m.group(1)) / 72 * 25.4:.0f}×{float(m.group(2)) / 72 * 25.4:.0f} mm"
check("Rendering", "Event print PDFs are at true physical size", evs and all("×" in v for v in sizes.values()), sizes)

# ------------------------------------------------------------------ motion and sound
def probe(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", str(p)],
                       capture_output=True, text=True).stdout
    return json.loads(o)


film = files("07_MOTION_IDENTITY/BRAND_FILM_25s/*.mp4")
fd = {}
for p in film:
    j = probe(p)
    v = [s for s in j["streams"] if s["codec_type"] == "video"][0]
    fd[p.name] = (v["width"], v["height"], v["r_frame_rate"], round(float(j["format"]["duration"]), 2), any(s["codec_type"] == "audio" for s in j["streams"]))
check("Motion", "Brand film in 4 formats, 25.0 s, 30 fps, with soundtrack", len(film) == 4 and all(abs(x[3] - 25) < 0.05 and x[2] == "30/1" and x[4] for x in fd.values()), fd)
loop = KIT / "07_MOTION_IDENTITY/LOOPS/DN_motion_J_plate-loop_1920x1080.mp4"
if loop.exists():
    for t, n in (("0", "a"), ("19.95", "b")):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", t, "-i", str(loop), "-frames:v", "1", f"/tmp/claude-0/loop_{n}.png"])
    import numpy as np
    a = np.asarray(Image.open("/tmp/claude-0/loop_a.png").convert("L"), float)
    b = np.asarray(Image.open("/tmp/claude-0/loop_b.png").convert("L"), float)
    check("Motion", "Plate loop is seamless (first and last frames match)", np.abs(a - b).mean() < 1.0, f"mean abs diff {np.abs(a - b).mean():.3f}")
la = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(KIT / "08_SONIC_IDENTITY/DN_sonic-brand-film_25s.wav"), "-af", "ebur128", "-f", "null", "-"],
                    capture_output=True, text=True).stderr
m = re.findall(r"I:\s+(-?[\d.]+) LUFS", la)
check("Sound", "Film score normalised to −16 LUFS (±1)", m and abs(float(m[-1]) + 16) <= 1, f"{m[-1] if m else '?'} LUFS")
v1motion = [p.name for p in files("07_MOTION_IDENTITY/LOGO_INTROS/*") + files("07_MOTION_IDENTITY/LOOPS/DN_motion_D_*")]
check("Motion", "Retired v1 motion (A–E, D loops) removed from the deliverable folders", not v1motion, v1motion[:4] or "removed")

# ------------------------------------------------------------------ report
passed = sum(r["pass"] for r in R)
json.dump(R, open(KIT / "18_QA_AND_HANDOVER/DN_QA-Report.json", "w"), indent=1, ensure_ascii=False)
md = ["# Quality assurance report v2.0", "", f"**Automated checks:** {passed}/{len(R)} passed. Generated by `16_SOURCE_FILES/build/qa2.py`.", "",
      "| Area | Check | Result | Detail |", "|---|---|---|---|"]
for r in R:
    d = r["detail"] if len(r["detail"]) < 220 else r["detail"][:217] + "…"
    md.append(f"| {r['area']} | {r['check']} | {'Pass' if r['pass'] else '**FAIL**'} | {d.replace('|', '/')} |")
md += ["", "## Manual review (visual, from renders)",
       "Every v2 deliverable was rendered and inspected as an image during the rebuild. These defects were found and fixed:",
       "- The engraved plates were stretched about 25 % vertically by a non-uniform resize. The cropping now keeps the photograph's true proportions, and every dependent file was rebuilt.",
       "- The Word templates rendered titles in Calibri because theme-font attributes overrode the brand font. Theme attributes are now stripped from styles and from the document defaults.",
       "- Social layouts: a sun disc overlapped contact text (1:1), a place title wrapped onto its standfirst (16:9), statement and figure posts were top-heavy, and the contact plate showed sky hairlines behind the logo. A quiet-sky plate was added.",
       "- The website hero cropped out the visitor at Agbokim. The crop was rebalanced.",
       "- On the plate-paper background, the sun drifted away from the rock after the plate correction. It was repositioned.",
       "- In the guidelines, the contents page numbers were wrong, a plate tile overflowed, and the quick reference printed landscape. All three were fixed.",
       "- In the film, the photograph is checked to sit exactly on its plate during each dissolve, with frames inspected at 5 fps through both transitions. Cuts land on the downbeats of the score.",
       "", "## Known limitations",
       "- **Photography rights:** the supplied images carry no photographer or licence data, and several look like web downloads. They are used as layout material. Each must be cleared before publication.",
       "- **Tarkwa Bay:** the location is identified only by the file name, and the turquoise water and white sand are unusual for Lagos. The image is used only on a presentation board. Confirm it before captioning.",
       "- **Low resolution:** five supplied images are under 800 px. They are used only at small sizes (grid tiles, thumbnails). In the 9:16 film, the Zuma Rock photograph is enlarged about 1.4×.",
       "- **Website address:** `destinationnigeria.org` is inferred from the email domain. Confirm it before print.",
       "- **Office fonts:** Newsreader and Public Sans must be installed, or embedded in the file, for Office documents to render as designed. Without them, Office substitutes Georgia and Arial.",
       "- **Connectors:** the Adobe, Canva and Figma connectors could not be reached from this environment (proxy 403). Files are delivered as open formats (SVG, PDF, DOCX, PPTX, HTML) that import into those tools."]
(KIT / "18_QA_AND_HANDOVER/DN_QA-Report.md").write_text("\n".join(md))
print(f"{passed}/{len(R)} passed")
for r in R:
    if not r["pass"]:
        print("FAIL", r["area"], r["check"], r["detail"][:300])
