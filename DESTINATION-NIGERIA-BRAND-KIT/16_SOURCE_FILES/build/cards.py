"""Business cards + email signature (09_DOCUMENT_TEMPLATES/BUSINESS_CARDS, EMAIL_SIGNATURE).

Card spec: 85 × 55 mm trim, 3 mm bleed (91 × 61 mm artboard), 4 mm safe area. SVG sources keep live text
(Playfair Display / Inter) for editing in Illustrator, Inkscape or Figma; print PDFs are vector with bleed.
Batch: edit staff.json and run this script to produce one print PDF per person.
"""
import json
import shutil
import zipfile
from brand import *
from graphics import horizon_set, pattern_contour
from icons import icon_body

BC = "09_DOCUMENT_TEMPLATES/BUSINESS_CARDS"
TW, TH, BL = 85, 55, 3
W, H = TW + 2 * BL, TH + 2 * BL
jobs = []
PT = 0.3528  # mm per point


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;")


def front(premium=False):
    bg = C["forest"]
    lw = 50
    body = f'<rect width="{W}" height="{H}" fill="{bg}"/>'
    if premium:
        body += f'<g opacity=".14" transform="translate(0,0) scale({W / 480})">{pattern_contour(C["sage"], None, op=1, tile=480, seed=11)}</g>'
    body += f'<g transform="translate(-4,{H - 13}) scale({(W + 8) / 1200})" opacity=".9">{horizon_set(C["ridge"], "#24473A")}</g>'
    body += logo_inline("reversed", (W - lw) / 2, H / 2 - LOGO_H * lw / LOGO_W / 2 - 3, lw)
    if premium:
        body += f'<!-- SPOT: gold foil on sun disc only (separate foil plate) -->'
    return body


def back(p, premium=False):
    x0, y0 = BL + 6, BL + 6
    body = f'<rect width="{W}" height="{H}" fill="{C["ivory"] if not premium else "#FFFFFF"}"/>'
    body += logo_inline("fullcolour", x0, y0, 27)
    body += (f'<text x="{x0}" y="{BL + 27}" font-family="Playfair Display, Georgia, serif" font-weight="500" font-size="{11 * PT:.2f}" fill="{C["forest"]}">{esc(p["name"])}</text>'
             f'<text x="{x0}" y="{BL + 31.2}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="{6 * PT:.2f}" letter-spacing=".32" fill="{C["golddeep"]}">{esc(p["role"].upper())}</text>')
    lines = [("phone", p["phone"]), ("mail", p["email"]), ("globe", p["web"])]
    for i, (ic, txt) in enumerate(lines):
        y = BL + 37.5 + i * 4.3
        body += f'<g transform="translate({x0},{y - 2.45}) scale({2.9 / 24})">{icon_body(ic, "line", C["forest"])}</g>'
        body += f'<text x="{x0 + 4.4}" y="{y}" font-family="Inter, Arial, sans-serif" font-size="{7 * PT:.2f}" fill="{C["charcoal"]}">{esc(txt)}</text>'
    # right edge: horizon line + sun
    body += f'<path d="M{W - BL - 6},{BL + 6} V{H - BL - 6}" stroke="{C["sage"]}" stroke-width=".25"/>'
    body += f'<circle cx="{W - BL - 6}" cy="{BL + 6}" r="1.4" fill="{C["gold"]}"/>'
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


SAMPLE = {"name": "[Full Name]", "role": "[Role / Title]", "phone": "[+234 000 000 0000]", "email": "[name@domain]", "web": "[website]"}


def signature():
    E = "09_DOCUMENT_TEMPLATES/EMAIL_SIGNATURE"
    shutil.copy(KIT / "02_LOGO_MASTER_FILES/PNG/DN_logo_primary_fullcolour_500px.png", KIT / E / "DN_email-logo_500px.png")
    html = f"""<!-- Destination Nigeria email signature v1.0 — table-based, inline styles, no web fonts (email clients ignore them).
     1) Upload DN_email-logo_500px.png to the official website and replace LOGO_URL below.
     2) Replace bracketed fields. Delete any row you do not use. Add social links only for verified official accounts. -->
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:{C['charcoal']};">
  <tr>
    <td style="padding:0 16px 0 0;border-right:2px solid {C['gold']};vertical-align:top;">
      <img src="LOGO_URL/DN_email-logo_500px.png" width="150" height="59" alt="Destination Nigeria" style="display:block;border:0;width:150px;height:auto;">
    </td>
    <td style="padding:0 0 0 16px;vertical-align:top;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:22px;color:{C['forest']};">[Full Name]</div>
      <div style="font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:{C['golddeep']};font-weight:bold;padding-bottom:6px;">[Role / Title]</div>
      <div style="font-size:12px;line-height:18px;">T&nbsp;&nbsp;<a href="tel:[+2340000000000]" style="color:{C['charcoal']};text-decoration:none;">[+234 000 000 0000]</a></div>
      <div style="font-size:12px;line-height:18px;">E&nbsp;&nbsp;<a href="mailto:[name@domain]" style="color:{C['charcoal']};text-decoration:none;">[name@domain]</a></div>
      <div style="font-size:12px;line-height:18px;">W&nbsp;&nbsp;<a href="https://[website]" style="color:{C['confluence']};text-decoration:none;">[website]</a></div>
      <div style="font-size:10px;line-height:16px;letter-spacing:2px;color:{C['forest']};font-weight:bold;padding-top:8px;">EXPERIENCE<span style="color:{C['gold']};">.</span> INVEST<span style="color:{C['gold']};">.</span> EXPLORE<span style="color:{C['gold']};">.</span></div>
      <!-- Optional verified social links:
      <div style="font-size:11px;line-height:16px;padding-top:4px;"><a href="[URL]" style="color:{C['confluence']};">[Platform]</a> · <a href="[URL]" style="color:{C['confluence']};">[Platform]</a></div> -->
    </td>
  </tr>
</table>
"""
    write(f"{E}/DN_email-signature.html", html)
    preview = ("<!doctype html><html><head><meta charset='utf-8'><title>Email signature preview</title></head>"
               "<body style='margin:0;padding:40px;background:#fff'>" + html.replace("LOGO_URL/", "") + "</body></html>")
    write(f"{E}/DN_email-signature_preview.html", preview)
    jobs.append(dict(src=str(KIT / E / "DN_email-signature_preview.html"), out=str(KIT / E / "DN_email-signature_preview.png"), w=620, h=210, scale=2))
    write(f"{E}/README.md", """# Email signature

- `DN_email-signature.html` is the master: a table layout with inline styles. It has been checked to render in browsers. Gmail, Outlook (desktop and web) and Apple Mail all accept this pattern, but test it in your own clients before rolling it out.
- `DN_email-logo_500px.png` is the logo, served at 150 px wide for sharp display on high-DPI screens. Host it on the official domain and replace `LOGO_URL`.
- The signature uses system fonts (Georgia, Arial) because email clients don't load brand web fonts.
- **Gmail:** Settings → Signature → paste the rendered signature (open the preview HTML in a browser, select all, copy).
- **Outlook:** File → Options → Mail → Signatures → paste the rendered signature.
- **Apple Mail:** Settings → Signatures → paste. Untick "Always match my default message font".
- Add only verified official social accounts. Never add a personal phone number without consent.
""")


if __name__ == "__main__":
    emit("DN_business-card_standard_front", front(), "Business card — standard front")
    emit("DN_business-card_standard_back", back(SAMPLE), "Business card — standard back")
    emit("DN_business-card_premium_front", front(True), "Business card — premium front (contour + gold foil sun)")
    emit("DN_business-card_premium_back", back(SAMPLE, True), "Business card — premium back")
    staff = KIT / BC / "staff.json"
    if not staff.exists():
        staff.write_text(json.dumps([SAMPLE], indent=2))
    for p in json.loads(staff.read_text()):
        if p == SAMPLE:
            continue
        slug = p["name"].lower().replace(" ", "-")
        emit(f"staff/DN_card_{slug}_back", back(p), f"Business card — {p['name']}")
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
