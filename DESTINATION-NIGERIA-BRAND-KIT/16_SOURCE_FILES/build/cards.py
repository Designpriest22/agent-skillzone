"""Business cards + email signature (09_DOCUMENT_TEMPLATES/BUSINESS_CARDS, EMAIL_SIGNATURE).

Card spec: 85 × 55 mm trim, 3 mm bleed (91 × 61 mm artboard), 4 mm safe area. SVG sources keep live text
(Newsreader Display / Public Sans) for editing in Illustrator, Inkscape or Figma; print PDFs are vector with bleed.
Batch: edit staff.json and run this script to produce one print PDF per person.
"""
import json
import shutil
import zipfile
from brand import *

BC = "09_DOCUMENT_TEMPLATES/BUSINESS_CARDS"
TW, TH, BL = 85, 55, 3
W, H = TW + 2 * BL, TH + 2 * BL
jobs = []
PT = 0.3528  # mm per point


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;")


def _plate_inner(slug, ink_col):
    import re
    pl = plate(slug, "forest", True).read_text()
    vb = re.search(r'viewBox="([^"]+)"', pl).group(1)
    inner = re.search(r'<g id="engraving">(.*?)</g>', pl, re.S).group(1).replace(C["forest"], ink_col)
    return vb, inner


def front():
    """Forest card; Zuma Rock engraved tone-on-tone in Ridge along the foot; reversed logo above it."""
    lw = 46
    vb, inner = _plate_inner("zuma-rock-quiet", C["ridge"])
    pw = W + 10
    phh = pw * 1000 / 1600
    body = f'<rect width="{W}" height="{H}" fill="{C["forest"]}"/>'
    body += f'<svg x="-5" y="{H - phh * 0.78}" width="{pw}" height="{phh}" viewBox="{vb}">{inner}</svg>'
    body += logo_inline("reversed", (W - lw) / 2, BL + 9, lw)
    return body


def back(p):
    x0 = BL + 7
    body = f'<rect width="{W}" height="{H}" fill="{C["ivory"]}"/>'
    body += logo_inline("fullcolour", x0, BL + 6.5, 25)
    y = BL + 30
    body += f'<text x="{x0}" y="{y}" font-family="Newsreader Display, Georgia, serif" font-weight="400" font-size="{12 * PT:.2f}" fill="{C["forest"]}">{esc(p["name"])}</text>'
    if p.get("role"):
        body += f'<text x="{x0}" y="{y + 4.3}" font-family="Public Sans, Arial, sans-serif" font-size="{7 * PT:.2f}" fill="{C["stone"]}">{esc(p["role"])}</text>'
    body += f'<path d="M{x0},{BL + 38.2} H{W - BL - 7}" stroke="{C["haze"]}" stroke-width=".25"/>'
    for i, txt in enumerate([p["email"], p["phone"], p["web"]]):
        body += (f'<text x="{x0}" y="{BL + 42.6 + i * 3.6}" font-family="Public Sans, Arial, sans-serif" font-size="{7 * PT:.2f}" '
                 f'fill="{C["charcoal"]}" style="font-feature-settings:\'tnum\'">{esc(txt)}</text>')
    return body


def crop_marks(body, w, h):
    """Place an artboard with bleed on a larger sheet with crop marks (5 mm slug)."""
    S = 8
    sw, sh = w + 2 * S, h + 2 * S
    m = ""
    for x in (S + BL, S + w - BL):
        m += f'<path d="M{x},0 V{S - 1}M{x},{sh} V{sh - S + 1}" stroke="#000" stroke-width=".15"/>'
    for y in (S + BL, S + h - BL):
        m += f'<path d="M0,{y} H{S - 1}M{sw},{y} H{sw - S + 1}" stroke="#000" stroke-width=".15"/>'
    return sw, sh, f'<rect width="{sw}" height="{sh}" fill="#fff"/><g transform="translate({S},{S})">{body}</g>{m}'


def guides(body):
    return body + (f'<rect x="{BL}" y="{BL}" width="{TW}" height="{TH}" fill="none" stroke="#E0306B" stroke-width=".2"/>'
                   f'<rect x="{BL + 4}" y="{BL + 4}" width="{TW - 8}" height="{TH - 8}" fill="none" stroke="#2E9BE0" stroke-width=".2" stroke-dasharray="1 1"/>')


def emit(stem, body, title):
    rel = f"{BC}/SOURCE_SVG/{stem}.svg"
    write(rel, svg_doc(W, H, body, title, "85 × 55 mm trim + 3 mm bleed. Units: mm.", px=(f"{W}mm" if False else W * 4, H * 4)).replace(
        f'width="{W * 4:g}" height="{H * 4:g}"', f'width="{W}mm" height="{H}mm"'))
    sw, sh, sheet = crop_marks(body, W, H)
    write(f"{BC}/_sheets/{stem}_print.svg", svg_doc(sw, sh, sheet, title + " — print sheet"))
    jobs.append(dict(src=str(KIT / f"{BC}/_sheets/{stem}_print.svg"), out=str(KIT / f"{BC}/PRINT_PDF/{stem}_print-crop-marks.pdf"),
                     w=sw * 96 / 25.4, h=sh * 96 / 25.4, format="pdf", pdfW=f"{sw}mm", pdfH=f"{sh}mm"))
    jobs.append(dict(src=str(KIT / rel), out=str(KIT / f"{BC}/PRINT_PDF/{stem}_bleed.pdf"), w=W * 96 / 25.4, h=H * 96 / 25.4,
                     format="pdf", pdfW=f"{W}mm", pdfH=f"{H}mm"))
    jobs.append(dict(src=str(KIT / rel), out=str(KIT / f"{BC}/PNG_300dpi/{stem}_300dpi.png"), w=W * 300 / 25.4 / 2, h=H * 300 / 25.4 / 2, scale=2))
    write(f"{BC}/_guides/{stem}_with-guides.svg", svg_doc(W, H, guides(body), title + " — trim (magenta) and safe area (blue)"))


GENERAL = {"name": "Destination Nigeria", "role": "", "phone": CONTACT["phone"], "email": CONTACT["email"], "web": CONTACT["web"]}
STAFF = [{"name": p["name"], "role": "", "phone": CONTACT["phone"], "email": p["email"], "web": CONTACT["web"]} for p in CONTACT["people"]]


def sig_html(p):
    role = (f'<div style="font-size:12px;line-height:17px;color:{C["stone"]};">{esc(p["role"])}</div>' if p.get("role") else "")
    return f"""<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:{C['charcoal']};">
  <tr><td style="padding:0 0 10px 0;"><img src="LOGO_URL/DN_email-logo_500px.png" width="132" height="52" alt="Destination Nigeria" style="display:block;border:0;width:132px;height:auto;"></td></tr>
  <tr><td style="padding:10px 0 0 0;border-top:1px solid {C['haze']};">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:22px;color:{C['forest']};">{esc(p['name'])}</div>{role}
      <div style="font-size:12px;line-height:18px;padding-top:4px;"><a href="mailto:{p['email']}" style="color:{C['forest']};text-decoration:none;">{p['email']}</a></div>
      <div style="font-size:12px;line-height:18px;"><a href="tel:{CONTACT['tel']}" style="color:{C['charcoal']};text-decoration:none;">{p['phone']}</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://{p['web']}" style="color:{C['charcoal']};text-decoration:none;">{p['web']}</a></div>
  </td></tr>
</table>"""


def signature():
    E = "09_DOCUMENT_TEMPLATES/EMAIL_SIGNATURE"
    shutil.copy(KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_fullcolour_500px.png", KIT / E / "DN_email-logo_500px.png")
    for stem, p in [("general", GENERAL)] + [(q["name"].split()[0].lower(), q) for q in STAFF]:
        html = ("<!-- Destination Nigeria email signature v2. Table layout, inline styles, system fonts (email clients ignore web fonts).\n"
                "     Host DN_email-logo_500px.png on the official domain and replace LOGO_URL. Add a role line only when confirmed. -->\n" + sig_html(p))
        write(f"{E}/DN_email-signature_{stem}.html", html)
        preview = ("<!doctype html><html><head><meta charset='utf-8'><title>Email signature preview</title></head>"
                   "<body style='margin:0;padding:36px;background:#fff'>" + html.replace("LOGO_URL/", "") + "</body></html>")
        write(f"{E}/DN_email-signature_{stem}_preview.html", preview)
        jobs.append(dict(src=str(KIT / E / f"DN_email-signature_{stem}_preview.html"), out=str(KIT / E / f"DN_email-signature_{stem}_preview.png"), w=520, h=200, scale=2))
    write(f"{E}/README.md", """# Email signatures

- One signature per person: `general` (info@), `eddie` and `lulu`. Each HTML file is the master: a table layout with inline styles.
- `DN_email-logo_500px.png` is shown at 132 px wide for sharp display on high-DPI screens. Host it on destinationnigeria.org and replace `LOGO_URL`.
- The signatures use system fonts (Georgia, Arial) because email clients don't load web fonts.
- No roles are shown, because none were supplied. Add a role line to the person's entry in `16_SOURCE_FILES/build/cards.py` once confirmed, then rebuild.
- **Gmail:** Settings → Signature → paste the rendered preview (open it in a browser, select all, copy).
- **Outlook:** File → Options → Mail → Signatures → paste.
- **Apple Mail:** Settings → Signatures → paste, and untick "Always match my default message font".
""")


if __name__ == "__main__":
    emit("DN_business-card_front", front(), "Business card — front")
    emit("DN_business-card_back_general", back(GENERAL), "Business card — back, general enquiries")
    for p in STAFF:
        slug = p["name"].lower().replace(" ", "-")
        emit(f"DN_business-card_back_{slug}", back(p), f"Business card — back, {p['name']}")
    (KIT / BC / "staff.json").write_text(json.dumps([GENERAL] + STAFF, indent=2))
    signature()
    # DOTX copies of the core Word templates
    for rel in ["LETTERHEAD/DN_Letterhead_Standard_A4.docx", "LETTERHEAD/DN_Letterhead_Ceremonial_A4.docx", "MEMO/DN_Memo_A4.docx",
                "REPORTS/DN_Report_Template_A4.docx", "PROPOSALS/DN_Proposal-Concept-Note_Template_A4.docx"]:
        src = KIT / "09_DOCUMENT_TEMPLATES" / rel
        dst = src.with_suffix(".dotx")
        with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zo:
            for item in zi.infolist():
                data = zi.read(item.filename)
                if item.filename == "[Content_Types].xml":
                    data = data.replace(b"wordprocessingml.document.main+xml", b"wordprocessingml.template.main+xml")
                zo.writestr(item, data)
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_cards.json", "w"), indent=1)
    print(len(jobs), "jobs")
